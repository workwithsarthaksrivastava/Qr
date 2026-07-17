import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Plus, Trash2, Share2, ExternalLink, Clock, Settings, 
  Sparkles, Music, Heart, Palette, Copy, Check, QrCode, X, BookMarked,
  ArrowLeft, Sliders
} from 'lucide-react';
import { LocalAlbum, ThemeType } from '../types';
import { getBlobUrl } from '../lib/db';
import { QRCodeSVG } from 'qrcode.react';

interface DashboardProps {
  albums: LocalAlbum[];
  onCreateAlbum: (name: string, theme: ThemeType, orientation: 'landscape' | 'portrait') => void;
  onSelectAlbum: (album: LocalAlbum, view: 'book' | 'admin') => void;
  onDeleteAlbum: (id: string) => void;
  onAccessAlbum: (album: LocalAlbum) => void;
}

const themeNames: Record<ThemeType, string> = {
  royal: 'Royal Crimson',
  minimalist: 'Minimalist White',
  floral: 'Emerald Floral',
  vintage: 'Vintage Papyrus',
  modern: 'Slate Modern',
  midnight: 'Midnight Black',
  sunset: 'Sunset Orange',
  ocean: 'Ocean Cyan',
  forest: 'Deep Forest',
  pastel: 'Soft Pastel',
  neon: 'Cyber Neon',
  cyber: 'Cyberpunk',
  autumn: 'Golden Autumn',
  winter: 'Icy Winter',
  spring: 'Fresh Spring',
  elegant: 'Elegant Gold',
  rustic: 'Rustic Wood',
  cosmic: 'Cosmic Violet'
};

const themeBgClasses: Record<ThemeType, string> = {
  royal: 'bg-rose-950 text-amber-100',
  minimalist: 'bg-neutral-100 text-neutral-800',
  floral: 'bg-emerald-950 text-rose-100',
  vintage: 'bg-stone-900 text-stone-100',
  modern: 'bg-slate-900 text-blue-100',
  midnight: 'bg-black text-gray-200',
  sunset: 'bg-orange-950 text-orange-100',
  ocean: 'bg-cyan-950 text-cyan-100',
  forest: 'bg-green-950 text-lime-100',
  pastel: 'bg-pink-100 text-pink-900',
  neon: 'bg-zinc-950 text-fuchsia-400',
  cyber: 'bg-indigo-950 text-cyan-300',
  autumn: 'bg-amber-950 text-yellow-100',
  winter: 'bg-sky-950 text-sky-100',
  spring: 'bg-emerald-950 text-emerald-100',
  elegant: 'bg-zinc-900 text-amber-100',
  rustic: 'bg-orange-950 text-orange-200',
  cosmic: 'bg-violet-950 text-violet-100'
};

export const Dashboard: React.FC<DashboardProps> = ({ albums, onCreateAlbum, onSelectAlbum, onDeleteAlbum, onAccessAlbum }) => {
  // Toggle between Guest Access and Creator Hub to protect album listings
  const [isCreatorMode, setIsCreatorMode] = useState(() => {
    try {
      return localStorage.getItem('celebration_creator_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCreatorMode = (val: boolean) => {
    setIsCreatorMode(val);
    try {
      localStorage.setItem('celebration_creator_mode', String(val));
    } catch (e) {
      console.warn(e);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumTheme, setAlbumTheme] = useState<ThemeType>('royal');
  const [albumOrientation, setAlbumOrientation] = useState<'landscape' | 'portrait'>('landscape');
  
  const [showShareModal, setShowShareModal] = useState<LocalAlbum | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<LocalAlbum | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Access by unique code states
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [isAccessing, setIsAccessing] = useState(false);
  const [accessError, setAccessError] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumName.trim()) return;
    onCreateAlbum(albumName.trim(), albumTheme, albumOrientation);
    setAlbumName('');
    setShowCreateModal(false);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = accessCodeInput.trim().toUpperCase();
    if (!code) return;

    setIsAccessing(true);
    setAccessError('');
    try {
      const res = await fetch(`/api/albums/code/${code}`);
      if (!res.ok) {
        throw new Error('Invalid code or album not found');
      }
      const data = await res.json();
      onAccessAlbum(data);
    } catch (err: any) {
      setAccessError(err.message || 'Album not found. Please verify the code.');
    } finally {
      setIsAccessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950 font-sans pb-20 relative overflow-hidden">
      {/* Decorative gradient backdrops */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-amber-500 to-rose-600 p-2.5 rounded-xl shadow-lg shadow-rose-500/10">
              <BookMarked size={22} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-rose-400 bg-clip-text text-transparent">Celebration Album</span>
              <p className="text-[10px] text-white/40 tracking-wider uppercase font-medium">Digital Guestbook Hub</p>
            </div>
          </div>
          {isCreatorMode ? (
            <div className="flex items-center gap-3">
              <button 
                id="btn-goto-guest"
                onClick={() => handleToggleCreatorMode(false)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft size={13} />
                Guest Portal
              </button>
              <button 
                id="btn-create-header"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-rose-500/15 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={16} />
                Create Album
              </button>
            </div>
          ) : (
            <button 
              id="btn-goto-creator"
              onClick={() => handleToggleCreatorMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:border-amber-500/30"
            >
              <Sliders size={14} className="text-amber-400" />
              Creator Portal
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 mt-12 relative z-10">
        {/* Welcome Hero */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-amber-200 mb-6"
          >
            <Sparkles size={13} />
            Beautiful Interactive Guestbooks & Photo Albums
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
          >
            Preserve Your Special Celebrations
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base text-slate-400 font-light leading-relaxed mb-8"
          >
            Design gorgeous custom scrapbooks, upload beautiful high-resolution photos, add ambient background audio tracks, and share instantly with friends and family using QR codes or links.
          </motion.p>

          {/* Access Code Input Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="max-w-md mx-auto"
          >
            <form onSubmit={handleAccessSubmit} className="flex gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl focus-within:border-amber-500/40 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all shadow-xl">
              <input 
                type="text" 
                placeholder="Enter Access Code (e.g. ABC123)..."
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                className="flex-1 bg-transparent border-0 text-sm text-white px-4 py-2.5 outline-none placeholder-slate-500 font-medium tracking-widest uppercase"
                maxLength={8}
              />
              <button 
                type="submit"
                disabled={isAccessing}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 disabled:from-slate-700 disabled:to-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-rose-500/10 whitespace-nowrap active:scale-95"
              >
                {isAccessing ? 'Opening...' : 'View Album'}
              </button>
            </form>
            {accessError && (
              <p className="text-rose-400 text-xs mt-2.5 font-medium flex items-center justify-center gap-1.5 animate-bounce">
                <span>⚠️</span> {accessError}
              </p>
            )}
          </motion.div>
        </div>

        {/* Albums List */}
        {isCreatorMode && (
          <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-6 flex items-center gap-2">
            <span>My Saved Albums</span>
            <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-slate-400 font-normal">
              {albums.length}
            </span>
          </h2>

          {albums.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-white/5 bg-slate-900/40 backdrop-blur-sm rounded-2xl p-16 text-center max-w-xl mx-auto flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center text-amber-400/80 mb-6 border border-white/5 shadow-inner">
                <BookOpen size={30} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No albums created yet</h3>
              <p className="text-sm text-slate-400 mb-8 max-w-sm font-light">
                Start by creating your first celebration album. Customize the layout, upload images, and choose beautiful theme aesthetics.
              </p>
              <button 
                id="btn-create-empty-state"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95"
              >
                <Plus size={16} />
                Create My First Album
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {albums.map((album) => {
                  const pagesCount = album.spreads.reduce((sum, spread) => {
                    let c = 0;
                    if (spread.leftPage?.images?.some(img => img !== null)) c++;
                    if (spread.rightPage?.images?.some(img => img !== null)) c++;
                    return sum + c;
                  }, 0);

                  const coverPhotoUrl = album.settings.coverPhoto ? getBlobUrl(album.settings.coverPhoto) : null;
                  const formattedDate = new Date(album.updatedAt || album.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <motion.div 
                      key={album.id}
                      layoutId={`album-card-${album.id}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border border-white/5 bg-slate-900/40 hover:bg-slate-900/80 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all flex flex-col group"
                    >
                      {/* Card Cover Preview */}
                      <div className="h-44 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                        {coverPhotoUrl ? (
                          <img 
                            src={coverPhotoUrl} 
                            alt={album.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className={`w-full h-full flex flex-col items-center justify-center p-6 ${themeBgClasses[album.settings.theme || 'royal']} opacity-90 transition-all duration-300`}>
                            <BookOpen size={40} strokeWidth={1.2} />
                            <span className="text-[10px] uppercase tracking-wider mt-3 font-semibold opacity-70">
                              {themeNames[album.settings.theme || 'royal']}
                            </span>
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold text-slate-300 border border-white/10 tracking-wide uppercase">
                          {album.settings.orientation || 'landscape'}
                        </div>
                      </div>

                      {/* Info & Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1 mb-1">
                            {album.name}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-400 font-light mb-3 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Palette size={12} className="text-amber-500/80" />
                              {themeNames[album.settings.theme || 'royal']}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <span className="flex items-center gap-1">
                              <BookOpen size={12} className="text-rose-500/80" />
                              {pagesCount} Photos
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-500" />
                              {formattedDate}
                            </span>
                          </div>

                          {album.accessCode && (
                            <div className="mt-3 mb-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 text-amber-200/90 text-xs px-3 py-2 rounded-xl flex items-center justify-between font-mono transition-colors">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Code: <strong className="text-white tracking-widest uppercase font-semibold">{album.accessCode}</strong>
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(album.accessCode!);
                                  setCopiedCode(album.accessCode!);
                                  setTimeout(() => setCopiedCode(null), 2000);
                                }}
                                className="text-[10px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-100 px-2.5 py-1 rounded-lg transition-all border border-amber-500/20 active:scale-95 whitespace-nowrap min-w-[55px] text-center"
                              >
                                {copiedCode === album.accessCode ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => onSelectAlbum(album, 'book')}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                            >
                              <BookOpen size={13} />
                              Open Book
                            </button>
                            <button 
                              onClick={() => onSelectAlbum(album, 'admin')}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Settings size={13} />
                              Edit Settings
                            </button>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            <button 
                              onClick={() => setShowShareModal(album)}
                              className="col-span-5 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-rose-600/10 hover:from-amber-500/20 hover:to-rose-600/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                            >
                              <Share2 size={13} />
                              {album.sharedUrl ? 'Copy Share Link & QR' : 'Share Album'}
                            </button>
                            <button 
                              onClick={() => {
                                setAlbumToDelete(album);
                              }}
                              className="col-span-1 px-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
                              title="Delete Album"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
        )}

        {!isCreatorMode && (
          <div className="text-center mt-20 opacity-30 hover:opacity-100 transition-opacity">
            <button 
              onClick={() => handleToggleCreatorMode(true)}
              className="text-xs text-slate-500 hover:text-amber-400 font-medium tracking-wide flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <Sliders size={12} />
              Are you an album creator? Switch to Creator Portal
            </button>
          </div>
        )}
      </main>

      {/* CREATE NEW ALBUM MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative z-10 p-6 md:p-8"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>

              <h3 className="text-xl font-bold text-white mb-2">Create New Album</h3>
              <p className="text-xs text-slate-400 mb-6 font-light">Set up the initial metadata for your album. You can customize images, pages, layouts, and background songs in the next step.</p>

              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Album Name / Event Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rahul Weds Riya, Summer Wedding, Graduation 2026..."
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Initial Theme</label>
                    <select 
                      value={albumTheme}
                      onChange={(e) => setAlbumTheme(e.target.value as ThemeType)}
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                    >
                      {Object.entries(themeNames).map(([key, name]) => (
                        <option key={key} value={key} className="bg-slate-950 text-white">{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Orientation</label>
                    <select 
                      value={albumOrientation}
                      onChange={(e) => setAlbumOrientation(e.target.value as 'landscape' | 'portrait')}
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                    >
                      <option value="landscape" className="bg-slate-950">Landscape (Best for PC)</option>
                      <option value="portrait" className="bg-slate-950">Portrait (Best for Mobile)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-5 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg active:scale-95"
                  >
                    Create & Design
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE / QR CODE MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative z-10 p-6 md:p-8 text-center"
            >
              <button 
                onClick={() => setShowShareModal(null)}
                className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>

              <h3 className="text-xl font-bold text-white mb-2">Share Album</h3>
              <p className="text-xs text-slate-400 mb-6 font-light">Generate or copy the shareable link and QR code for guest access.</p>

              {showShareModal.sharedUrl ? (
                <div className="space-y-6">
                  {/* QR Code Container */}
                  <div className="bg-white p-6 rounded-2xl inline-block shadow-lg border border-slate-200">
                    <QRCodeSVG 
                      value={showShareModal.sharedUrl} 
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <p className="text-[10px] text-white/50 tracking-wider uppercase font-medium">Scan this QR code with a phone to view the album</p>

                  {/* Copy Link Input */}
                  <div className="flex gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/5">
                    <input 
                      type="text" 
                      readOnly 
                      value={showShareModal.sharedUrl}
                      className="w-full bg-transparent text-xs text-slate-300 select-all px-3 py-2 outline-none font-mono"
                    />
                    <button 
                      onClick={() => handleCopyLink(showShareModal.sharedUrl!)}
                      className="px-4 py-2 bg-white text-slate-950 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="pt-2">
                    <a 
                      href={showShareModal.sharedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
                    >
                      Open Shared View
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-4">
                  <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mx-auto border border-amber-500/20 mb-2 animate-pulse">
                    <Share2 size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Album is not yet shared</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto font-light leading-relaxed">
                    To make this album public and generate a QR code, open the editor, design your pages, and click the **"Save & Share"** button inside the editor settings.
                  </p>
                  <button 
                    onClick={() => {
                      setShowShareModal(null);
                      onSelectAlbum(showShareModal, 'admin');
                    }}
                    className="mt-4 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Open Editor to Share
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {albumToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAlbumToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative z-10 p-6 text-center"
            >
              <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4 border border-rose-500/20">
                <Trash2 size={20} />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Delete Album?</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-rose-200">"{albumToDelete.name}"</strong>? This will delete all custom layouts, uploads, and metadata. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setAlbumToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteAlbum(albumToDelete.id);
                    setAlbumToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-rose-600/10"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
