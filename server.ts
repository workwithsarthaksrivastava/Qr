import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Local albums database file path
const albumsFilePath = path.join(process.cwd(), "albums.json");

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(uploadsDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit for images/audio
});

// Lazy Supabase client initialization
let supabaseClient: any = null;
function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      supabaseClient = createClient(url, key);
      console.log("Supabase client initialized successfully.");
      return supabaseClient;
    } catch (err) {
      console.error("Failed to initialize Supabase client:", err);
    }
  }
  return null;
}

// Helper: Read local albums file
function loadLocalAlbums(): Record<string, any> {
  if (!fs.existsSync(albumsFilePath)) {
    return {};
  }
  try {
    const data = fs.readFileSync(albumsFilePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading local albums file:", err);
    return {};
  }
}

// Helper: Save local album
function saveLocalAlbum(id: string, album: any) {
  const albums = loadLocalAlbums();
  albums[id] = album;
  try {
    fs.writeFileSync(albumsFilePath, JSON.stringify(albums, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local albums file:", err);
  }
}

// Helper: Get local album
function getLocalAlbum(id: string) {
  const albums = loadLocalAlbums();
  return albums[id] || null;
}

// Helper: Dynamically resolve absolute base App URL based on request headers
function getAppUrl(req: express.Request): string {
  let appUrl = process.env.APP_URL;
  if (!appUrl || appUrl === "MY_APP_URL" || appUrl.includes("localhost") || appUrl === "") {
    const host = req.get("host") || "localhost:3000";
    const protocol = req.headers["x-forwarded-proto"] === "https" || req.secure ? "https" : "http";
    appUrl = `${protocol}://${host}`;
  }
  
  // Convert ais-dev- development domains to the publicly shareable ais-pre- environment
  if (appUrl.includes("ais-dev-")) {
    appUrl = appUrl.replace("ais-dev-", "ais-pre-");
  }
  
  return appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
}

// Helper: Recursively sanitize any occurrence of 'ais-dev-' to 'ais-pre-' in structures (for assets / links)
function sanitizeDevUrls(obj: any): any {
  if (typeof obj === "string") {
    return obj.replace(/ais-dev-/g, "ais-pre-");
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDevUrls);
  }
  if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = sanitizeDevUrls(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// --- API ROUTES ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", supabaseConfigured: !!getSupabase() });
});

// Single File Upload (images or audio)
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const cleanAppUrl = getAppUrl(req);
  const fileUrl = `${cleanAppUrl}/uploads/${req.file.filename}`;
  
  res.json({ url: fileUrl });
});

// Save Album Endpoint
app.post("/api/albums", async (req, res, next) => {
  try {
    const { id, spreads, settings } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing album id" });
    }

    const parsedSpreads = typeof spreads === "string" ? JSON.parse(spreads) : spreads;
    const parsedSettings = typeof settings === "string" ? JSON.parse(settings) : settings;
    const sanitizedSpreads = sanitizeDevUrls(parsedSpreads);
    const sanitizedSettings = sanitizeDevUrls(parsedSettings);

    const supabase = getSupabase();
    let savedToSupabase = false;

    if (supabase) {
      try {
        // Try saving to Supabase "albums" table
        const { error } = await supabase
          .from("albums")
          .upsert({
            id,
            spreads: sanitizedSpreads,
            settings: sanitizedSettings,
            created_at: new Date().toISOString(),
          });

        if (!error) {
          savedToSupabase = true;
          console.log(`Album ${id} successfully saved to Supabase.`);
        } else {
          console.warn("Supabase insert error, falling back to local file:", error.message);
        }
      } catch (err) {
        console.warn("Supabase write failed, falling back to local file:", err);
      }
    }

    // Always save to local fallback as a safety net or if Supabase is not present/failed
    saveLocalAlbum(id, { spreads: sanitizedSpreads, settings: sanitizedSettings });

    const cleanAppUrl = getAppUrl(req);

    res.json({
      success: true,
      id,
      savedToSupabase,
      url: `${cleanAppUrl}/?album=${id}`,
    });
  } catch (err) {
    next(err);
  }
});

// Get Album Endpoint
app.get("/api/albums/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("albums")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          const spreads = typeof data.spreads === "string" ? JSON.parse(data.spreads) : data.spreads;
          const settings = typeof data.settings === "string" ? JSON.parse(data.settings) : data.settings;
          return res.json({
            id: data.id,
            spreads: sanitizeDevUrls(spreads),
            settings: sanitizeDevUrls(settings),
            source: "supabase",
          });
        }
        if (error) {
          console.warn("Supabase query error, looking in local fallback:", error.message);
        }
      } catch (err) {
        console.warn("Supabase read failed, looking in local fallback:", err);
      }
    }

    // Local fallback
    const localAlbum = getLocalAlbum(id);
    if (localAlbum) {
      return res.json({
        id,
        spreads: sanitizeDevUrls(localAlbum.spreads),
        settings: sanitizeDevUrls(localAlbum.settings),
        source: "local",
      });
    }

    res.status(404).json({ error: "Album not found" });
  } catch (err) {
    next(err);
  }
});

// Fallback for unmatched API routes to prevent returning HTML index.html
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
});

// Global JSON error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled API error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// --- VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Wildcard route to serve index.html for SPA client-side routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
