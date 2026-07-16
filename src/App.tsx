import React, { useState, useEffect } from 'react';
import { SpreadData, AlbumSettings } from './types';
import { loadSpreadsFromDB, saveSpreadsToDB, loadSettingsFromDB, saveSettingsToDB } from './lib/db';
import { BookView } from './components/BookView';
import { AdminView } from './components/AdminView';

export default function App() {
  const [spreads, setSpreads] = useState<SpreadData[]>([]);
  const [settings, setSettings] = useState<AlbumSettings>({ audioFile: null, audioName: null });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'book' | 'admin'>('book');

  useEffect(() => {
    Promise.all([loadSpreadsFromDB(), loadSettingsFromDB()]).then(([spreadsData, settingsData]) => {
      setSpreads(spreadsData);
      setSettings(settingsData);
      setLoading(false);
    });
  }, []);

  const handleSpreadsChange = (newSpreads: SpreadData[]) => {
    setSpreads(newSpreads);
    saveSpreadsToDB(newSpreads);
  };

  const handleSettingsChange = (newSettings: AlbumSettings) => {
    setSettings(newSettings);
    saveSettingsToDB(newSettings);
  };

  if (loading) {
    return <div className="min-h-screen bg-rose-950 flex items-center justify-center text-amber-100/50">Loading Album...</div>;
  }

  return (
    <>
      {view === 'book' ? (
        <BookView spreads={spreads} settings={settings} onOpenAdmin={() => setView('admin')} />
      ) : (
        <AdminView spreads={spreads} settings={settings} onSpreadsChange={handleSpreadsChange} onSettingsChange={handleSettingsChange} onClose={() => setView('book')} />
      )}
    </>
  );
}
