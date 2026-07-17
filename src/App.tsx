import React, { useState, useEffect } from 'react';
import { SpreadData, AlbumSettings } from './types';
import { loadSpreadsFromDB, saveSpreadsToDB, loadSettingsFromDB, saveSettingsToDB } from './lib/db';
import { BookView } from './components/BookView';
import { AdminView } from './components/AdminView';

function sanitizeDevUrls<T>(obj: T): T {
  if (typeof obj === 'string') {
    return obj.replace(/ais-dev-/g, 'ais-pre-') as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDevUrls) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = sanitizeDevUrls(obj[key]);
      }
    }
    return newObj as T;
  }
  return obj;
}

export default function App() {
  const [spreads, setSpreads] = useState<SpreadData[]>([]);
  const [settings, setSettings] = useState<AlbumSettings>({ audioFile: null, audioName: null });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'book' | 'admin'>('book');
  const [isSharedView, setIsSharedView] = useState(false);
  const [sharedAlbumId, setSharedAlbumId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const albumIdFromQuery = urlParams.get('album');
    const pathnameParts = window.location.pathname.split('/');
    const albumIdFromPath = pathnameParts[1] === 'album' ? pathnameParts[2] : null;
    const activeAlbumId = albumIdFromPath || albumIdFromQuery;

    if (activeAlbumId) {
      setLoading(true);
      fetch(`/api/albums/${activeAlbumId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Album not found');
          return res.json();
        })
        .then((data) => {
          const sanitizedData = sanitizeDevUrls(data);
          setSpreads(sanitizedData.spreads);
          setSettings(sanitizedData.settings);
          setIsSharedView(true);
          setSharedAlbumId(activeAlbumId);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error loading shared album:', err);
          // Fallback to local browser DB
          Promise.all([loadSpreadsFromDB(), loadSettingsFromDB()]).then(([spreadsData, settingsData]) => {
            setSpreads(spreadsData);
            setSettings(settingsData);
            setLoading(false);
          });
        });
    } else {
      Promise.all([loadSpreadsFromDB(), loadSettingsFromDB()]).then(([spreadsData, settingsData]) => {
        setSpreads(spreadsData);
        setSettings(settingsData);
        setLoading(false);
      });
    }
  }, []);

  const handleSpreadsChange = (newSpreads: SpreadData[]) => {
    if (isSharedView) return; // Prevent overwriting local storage when in shared view
    setSpreads(newSpreads);
    saveSpreadsToDB(newSpreads);
  };

  const handleSettingsChange = (newSettings: AlbumSettings) => {
    if (isSharedView) return; // Prevent overwriting local storage when in shared view
    setSettings(newSettings);
    saveSettingsToDB(newSettings);
  };

  const handleCustomizeSharedAlbum = async () => {
    try {
      // Save the current shared spreads and settings to local storage
      await saveSpreadsToDB(spreads);
      await saveSettingsToDB(settings);
      // Remove album ID from URL and refresh to go into local editable mode
      window.location.href = window.location.origin;
    } catch (err) {
      console.error('Failed to copy shared album:', err);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-rose-950 flex items-center justify-center text-amber-100/50">Loading Album...</div>;
  }

  return (
    <>
      {view === 'book' ? (
        <BookView 
          spreads={spreads} 
          settings={settings} 
          onOpenAdmin={() => setView('admin')} 
          isSharedView={isSharedView}
          onCustomize={handleCustomizeSharedAlbum}
        />
      ) : (
        <AdminView 
          spreads={spreads} 
          settings={settings} 
          onSpreadsChange={handleSpreadsChange} 
          onSettingsChange={handleSettingsChange} 
          onClose={() => setView('book')} 
        />
      )}
    </>
  );
}
