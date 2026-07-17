import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SpreadData, AlbumSettings, LocalAlbum, ThemeType } from './types';
import { 
  loadLocalAlbumsFromDB, 
  saveLocalAlbumsToDB 
} from './lib/db';
import { BookView } from './components/BookView';
import { AdminView } from './components/AdminView';
import { Dashboard } from './components/Dashboard';

function sanitizeDevUrls<T>(obj: T): T {
  return obj;
}

export default function App() {
  const [albums, setAlbums] = useState<LocalAlbum[]>([]);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  
  const [spreads, setSpreads] = useState<SpreadData[]>([]);
  const [settings, setSettings] = useState<AlbumSettings>({ audioFile: null, audioName: null });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'book' | 'admin'>('home');
  const [isSharedView, setIsSharedView] = useState(false);
  const [sharedAlbumId, setSharedAlbumId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromQuery = urlParams.get('code');
    const albumIdFromQuery = urlParams.get('album');
    const pathnameParts = window.location.pathname.split('/');
    const albumIdFromPath = pathnameParts[1] === 'album' ? pathnameParts[2] : null;
    const activeSharedId = albumIdFromPath || albumIdFromQuery;

    if (codeFromQuery) {
      setLoading(true);
      fetch(`/api/albums/code/${codeFromQuery.toUpperCase()}`)
        .then((res) => {
          if (!res.ok) throw new Error('Album with this code not found');
          return res.json();
        })
        .then((data) => {
          const sanitizedData = sanitizeDevUrls(data);
          setSpreads(sanitizedData.spreads);
          setSettings(sanitizedData.settings);
          setIsSharedView(true);
          setSharedAlbumId(sanitizedData.id);
          setView('book');
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error loading album by code:', err);
          loadLocalAlbumsFromDB().then((loadedAlbums) => {
            setAlbums(loadedAlbums);
            setView('home');
            setLoading(false);
            window.history.replaceState({}, "", window.location.origin);
            alert("Album not found! Note: If you created this in the Dev environment, it will not be visible in the Shared environment unless a database is configured.");
          });
        });
    } else if (activeSharedId) {
      setLoading(true);
      fetch(`/api/albums/${activeSharedId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Album not found');
          return res.json();
        })
        .then((data) => {
          const sanitizedData = sanitizeDevUrls(data);
          setSpreads(sanitizedData.spreads);
          setSettings(sanitizedData.settings);
          setIsSharedView(true);
          setSharedAlbumId(activeSharedId);
          setView('book');
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error loading shared album:', err);
          // Fallback to Dashboard
          loadLocalAlbumsFromDB().then((loadedAlbums) => {
            setAlbums(loadedAlbums);
            setView('home');
            setLoading(false);
            window.history.replaceState({}, "", window.location.origin);
            alert("Album not found! Note: If you created this in the Dev environment, it will not be visible in the Shared environment unless a database is configured.");
          });
        });
    } else {
      loadLocalAlbumsFromDB().then((loadedAlbums) => {
        setAlbums(loadedAlbums);
        setView('home');
        setLoading(false);
      });
    }
  }, []);

  const handleCreateAlbum = async (name: string, theme: ThemeType, orientation: 'landscape' | 'portrait') => {
    const newAlbum: LocalAlbum = {
      id: uuidv4(),
      name,
      spreads: [],
      settings: {
        audioFile: null,
        audioName: null,
        theme,
        coverPhoto: null,
        orientation,
        marking: name
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedAlbums = [newAlbum, ...albums];
    setAlbums(updatedAlbums);
    await saveLocalAlbumsToDB(updatedAlbums);

    setActiveAlbumId(newAlbum.id);
    setSpreads(newAlbum.spreads);
    setSettings(newAlbum.settings);
    setIsSharedView(false);
    setView('admin'); // Direct to design!
  };

  const handleSelectAlbum = (album: LocalAlbum, targetView: 'book' | 'admin') => {
    setActiveAlbumId(album.id);
    setSpreads(album.spreads);
    setSettings(album.settings);
    setIsSharedView(false);
    setView(targetView);
  };

  const handleDeleteAlbum = async (id: string) => {
    const updatedAlbums = albums.filter(a => a.id !== id);
    setAlbums(updatedAlbums);
    await saveLocalAlbumsToDB(updatedAlbums);
    if (activeAlbumId === id) {
      setActiveAlbumId(null);
      setSpreads([]);
      setSettings({ audioFile: null, audioName: null });
      setView('home');
    }
  };

  const handleSpreadsChange = async (newSpreads: SpreadData[]) => {
    setSpreads(newSpreads);
    if (isSharedView || !activeAlbumId) return;

    const updatedAlbums = albums.map(album => {
      if (album.id === activeAlbumId) {
        return {
          ...album,
          spreads: newSpreads,
          updatedAt: new Date().toISOString()
        };
      }
      return album;
    });

    setAlbums(updatedAlbums);
    await saveLocalAlbumsToDB(updatedAlbums);
  };

  const handleSettingsChange = async (newSettings: AlbumSettings) => {
    setSettings(newSettings);
    if (isSharedView || !activeAlbumId) return;

    const updatedAlbums = albums.map(album => {
      if (album.id === activeAlbumId) {
        return {
          ...album,
          settings: newSettings,
          name: newSettings.marking || album.name, // sync marking as the album name if changed
          updatedAt: new Date().toISOString()
        };
      }
      return album;
    });

    setAlbums(updatedAlbums);
    await saveLocalAlbumsToDB(updatedAlbums);
  };

  const handleSaveSharedUrl = async (sharedUrl: string, accessCode?: string) => {
    if (isSharedView || !activeAlbumId) return;

    const updatedAlbums = albums.map(album => {
      if (album.id === activeAlbumId) {
        return {
          ...album,
          sharedUrl,
          accessCode,
          settings: {
            ...album.settings,
            accessCode
          },
          updatedAt: new Date().toISOString()
        };
      }
      return album;
    });

    setAlbums(updatedAlbums);
    await saveLocalAlbumsToDB(updatedAlbums);
  };

  const handleCustomizeSharedAlbum = async () => {
    try {
      // Import this shared album copy as a brand new local editable album!
      const newAlbum: LocalAlbum = {
        id: uuidv4(),
        name: settings.marking || 'Customized Copy',
        spreads: spreads,
        settings: settings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedAlbums = [newAlbum, ...albums];
      setAlbums(updatedAlbums);
      await saveLocalAlbumsToDB(updatedAlbums);

      setActiveAlbumId(newAlbum.id);
      setIsSharedView(false);
      setSharedAlbumId(null);
      setView('book');
      
      // Strip query parameters to be fully local
      window.history.replaceState({}, '', window.location.origin);
    } catch (err) {
      console.error('Failed to copy shared album:', err);
    }
  };

  const handleAccessAlbum = (album: LocalAlbum) => {
    // Open the accessed shared album
    setSpreads(album.spreads);
    setSettings(album.settings);
    setIsSharedView(true);
    setSharedAlbumId(album.id);
    setView('book');
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-100/50">Loading Hub...</div>;
  }

  return (
    <>
      {view === 'home' && (
        <Dashboard 
          albums={albums}
          onCreateAlbum={handleCreateAlbum}
          onSelectAlbum={handleSelectAlbum}
          onDeleteAlbum={handleDeleteAlbum}
          onAccessAlbum={handleAccessAlbum}
        />
      )}
      
      {view === 'book' && (
        <BookView 
          spreads={spreads} 
          settings={settings} 
          onOpenAdmin={() => setView('admin')} 
          isSharedView={isSharedView}
          onCustomize={handleCustomizeSharedAlbum}
          onGoHome={() => setView('home')}
        />
      )}

      {view === 'admin' && (
        <AdminView 
          albumId={activeAlbumId}
          spreads={spreads} 
          settings={settings} 
          onSpreadsChange={handleSpreadsChange} 
          onSettingsChange={handleSettingsChange} 
          onClose={() => setView('book')} 
          onSaveSharedUrl={handleSaveSharedUrl}
        />
      )}
    </>
  );
}
