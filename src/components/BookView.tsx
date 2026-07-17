import React, { useState, useEffect, useRef } from 'react';
import { SpreadData, AlbumSettings, ThemeType } from '../types';
import { getBlobUrl } from '../lib/db';
import { ChevronLeft, ChevronRight, Settings, Volume2, VolumeX } from 'lucide-react';

interface BookViewProps {
  spreads: SpreadData[];
  settings: AlbumSettings;
  onOpenAdmin: () => void;
  isSharedView?: boolean;
  onCustomize?: () => void;
}

const themeStyles = {
  royal: {
    bg: 'bg-rose-950',
    gradient: 'from-amber-900/40 to-rose-950',
    coverBg: 'bg-[#78101a]',
    coverBorder: 'border-amber-500/30',
    pageBg: 'bg-[#fffbf0]',
    pageBorder: 'border-amber-900/10',
    pageInnerBorder: 'border-amber-500/20',
    pageInnerBorderLight: 'border-amber-500/10',
    cornerAccents: 'border-amber-500/50',
    buttonBase: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-100 border border-amber-500/20',
    buttonIcon: 'text-amber-100/50 hover:text-amber-200',
    fontTitle: 'font-serif text-amber-100',
    fontSubtitle: 'text-amber-200/70',
    emptyPage: 'border-amber-200 text-amber-700/40 bg-amber-50/30',
    accentColor: 'accent-amber-500',
    primaryButton: 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-400/50 hover:opacity-90',
  },
  minimalist: {
    bg: 'bg-neutral-100',
    gradient: 'from-white to-neutral-200',
    coverBg: 'bg-white',
    coverBorder: 'border-neutral-200',
    pageBg: 'bg-white',
    pageBorder: 'border-neutral-200',
    pageInnerBorder: 'border-transparent',
    pageInnerBorderLight: 'border-transparent',
    cornerAccents: 'border-transparent',
    buttonBase: 'bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 shadow-sm',
    buttonIcon: 'text-neutral-400 hover:text-neutral-700',
    fontTitle: 'font-sans text-neutral-800 font-light',
    fontSubtitle: 'text-neutral-500',
    emptyPage: 'border-neutral-200 text-neutral-400 bg-neutral-50',
    accentColor: 'accent-neutral-800',
    primaryButton: 'bg-neutral-900 text-white shadow-lg border border-transparent hover:bg-neutral-800',
  },
  floral: {
    bg: 'bg-emerald-950',
    gradient: 'from-emerald-900 to-teal-950',
    coverBg: 'bg-[#0f2e1f]',
    coverBorder: 'border-rose-300/40',
    pageBg: 'bg-[#fcfaf5]',
    pageBorder: 'border-emerald-900/10',
    pageInnerBorder: 'border-rose-300/20',
    pageInnerBorderLight: 'border-rose-300/10',
    cornerAccents: 'border-rose-300/60',
    buttonBase: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-100 border border-rose-500/20',
    buttonIcon: 'text-rose-200/50 hover:text-rose-200',
    fontTitle: 'font-serif text-rose-100',
    fontSubtitle: 'text-rose-200/70',
    emptyPage: 'border-rose-200 text-rose-700/40 bg-rose-50/30',
    accentColor: 'accent-rose-400',
    primaryButton: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 hover:opacity-90',
  },
  vintage: {
    bg: 'bg-stone-900',
    gradient: 'from-stone-800 to-stone-950',
    coverBg: 'bg-[#3e352b]',
    coverBorder: 'border-stone-500/40',
    pageBg: 'bg-[#f5ebd9]',
    pageBorder: 'border-stone-900/10',
    pageInnerBorder: 'border-stone-500/20',
    pageInnerBorderLight: 'border-stone-500/10',
    cornerAccents: 'border-stone-500/60',
    buttonBase: 'bg-stone-500/10 hover:bg-stone-500/20 text-stone-100 border border-stone-500/20',
    buttonIcon: 'text-stone-200/50 hover:text-stone-200',
    fontTitle: 'font-serif text-stone-100',
    fontSubtitle: 'text-stone-300/70',
    emptyPage: 'border-stone-300 text-stone-700/40 bg-stone-100/30',
    accentColor: 'accent-stone-500',
    primaryButton: 'bg-stone-700 text-white shadow-[0_0_20px_rgba(120,113,108,0.3)] border border-stone-500/50 hover:opacity-90',
  },
  modern: {
    bg: 'bg-slate-900',
    gradient: 'from-slate-800 to-slate-950',
    coverBg: 'bg-slate-800',
    coverBorder: 'border-blue-500/40',
    pageBg: 'bg-slate-50',
    pageBorder: 'border-slate-900/10',
    pageInnerBorder: 'border-blue-200/50',
    pageInnerBorderLight: 'border-blue-100/30',
    cornerAccents: 'border-blue-500/60',
    buttonBase: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-100 border border-blue-500/20',
    buttonIcon: 'text-blue-200/50 hover:text-blue-200',
    fontTitle: 'font-sans text-blue-100',
    fontSubtitle: 'text-blue-300/70',
    emptyPage: 'border-blue-200 text-blue-700/40 bg-blue-50/30',
    accentColor: 'accent-blue-500',
    primaryButton: 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400/50 hover:opacity-90',
  },
  midnight: {
    bg: 'bg-black',
    gradient: 'from-gray-900 to-black',
    coverBg: 'bg-gray-900',
    coverBorder: 'border-gray-500/40',
    pageBg: 'bg-white',
    pageBorder: 'border-gray-200',
    pageInnerBorder: 'border-gray-200',
    pageInnerBorderLight: 'border-gray-100',
    cornerAccents: 'border-gray-800',
    buttonBase: 'bg-gray-800 text-white border border-gray-700',
    buttonIcon: 'text-gray-400 hover:text-white',
    fontTitle: 'font-sans text-white',
    fontSubtitle: 'text-gray-400',
    emptyPage: 'border-gray-200 text-gray-400 bg-gray-50',
    accentColor: 'accent-white',
    primaryButton: 'bg-white text-black hover:bg-gray-200',
  },
  sunset: {
    bg: 'bg-orange-950',
    gradient: 'from-purple-900 to-orange-900',
    coverBg: 'bg-purple-950',
    coverBorder: 'border-orange-500/40',
    pageBg: 'bg-[#fff5eb]',
    pageBorder: 'border-orange-900/10',
    pageInnerBorder: 'border-orange-300/40',
    pageInnerBorderLight: 'border-orange-200/30',
    cornerAccents: 'border-orange-500/60',
    buttonBase: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-100 border border-orange-500/20',
    buttonIcon: 'text-orange-200/50 hover:text-orange-200',
    fontTitle: 'font-serif text-orange-100',
    fontSubtitle: 'text-orange-300/70',
    emptyPage: 'border-orange-200 text-orange-700/40 bg-orange-50/30',
    accentColor: 'accent-orange-500',
    primaryButton: 'bg-gradient-to-r from-purple-600 to-orange-500 text-white shadow-lg border border-orange-400/50 hover:opacity-90',
  },
  ocean: {
    bg: 'bg-cyan-950',
    gradient: 'from-cyan-900 to-teal-950',
    coverBg: 'bg-teal-900',
    coverBorder: 'border-cyan-300/40',
    pageBg: 'bg-[#f0fdfa]',
    pageBorder: 'border-cyan-900/10',
    pageInnerBorder: 'border-cyan-300/40',
    pageInnerBorderLight: 'border-cyan-200/30',
    cornerAccents: 'border-cyan-500/60',
    buttonBase: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-100 border border-cyan-500/20',
    buttonIcon: 'text-cyan-200/50 hover:text-cyan-200',
    fontTitle: 'font-sans text-cyan-100',
    fontSubtitle: 'text-cyan-300/70',
    emptyPage: 'border-cyan-200 text-cyan-700/40 bg-cyan-50/30',
    accentColor: 'accent-cyan-500',
    primaryButton: 'bg-cyan-600 text-white shadow-lg border border-cyan-400/50 hover:opacity-90',
  },
  forest: {
    bg: 'bg-green-950',
    gradient: 'from-green-900 to-emerald-950',
    coverBg: 'bg-[#0a2e12]',
    coverBorder: 'border-lime-500/40',
    pageBg: 'bg-[#f7fdf5]',
    pageBorder: 'border-green-900/10',
    pageInnerBorder: 'border-lime-300/40',
    pageInnerBorderLight: 'border-lime-200/30',
    cornerAccents: 'border-lime-500/60',
    buttonBase: 'bg-lime-500/10 hover:bg-lime-500/20 text-lime-100 border border-lime-500/20',
    buttonIcon: 'text-lime-200/50 hover:text-lime-200',
    fontTitle: 'font-serif text-lime-100',
    fontSubtitle: 'text-lime-300/70',
    emptyPage: 'border-lime-200 text-lime-700/40 bg-lime-50/30',
    accentColor: 'accent-lime-500',
    primaryButton: 'bg-lime-600 text-white shadow-lg border border-lime-400/50 hover:opacity-90',
  },
  pastel: {
    bg: 'bg-pink-100',
    gradient: 'from-pink-100 to-purple-100',
    coverBg: 'bg-white',
    coverBorder: 'border-pink-300',
    pageBg: 'bg-white',
    pageBorder: 'border-pink-100',
    pageInnerBorder: 'border-pink-200',
    pageInnerBorderLight: 'border-pink-100',
    cornerAccents: 'border-pink-400',
    buttonBase: 'bg-pink-200 hover:bg-pink-300 text-pink-800 border border-pink-300',
    buttonIcon: 'text-pink-600 hover:text-pink-800',
    fontTitle: 'font-sans text-pink-900',
    fontSubtitle: 'text-pink-600',
    emptyPage: 'border-pink-200 text-pink-400 bg-pink-50',
    accentColor: 'accent-pink-500',
    primaryButton: 'bg-pink-400 text-white hover:bg-pink-500 shadow-sm',
  },
  neon: {
    bg: 'bg-zinc-950',
    gradient: 'from-zinc-900 to-black',
    coverBg: 'bg-fuchsia-950',
    coverBorder: 'border-fuchsia-500',
    pageBg: 'bg-zinc-900',
    pageBorder: 'border-fuchsia-500/30',
    pageInnerBorder: 'border-fuchsia-500/50',
    pageInnerBorderLight: 'border-fuchsia-500/20',
    cornerAccents: 'border-fuchsia-500',
    buttonBase: 'bg-fuchsia-900/50 hover:bg-fuchsia-800/50 text-fuchsia-300 border border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]',
    buttonIcon: 'text-fuchsia-400 hover:text-fuchsia-200',
    fontTitle: 'font-sans text-fuchsia-400 font-bold tracking-widest',
    fontSubtitle: 'text-fuchsia-300/70',
    emptyPage: 'border-fuchsia-900 text-fuchsia-500/40 bg-zinc-950/50',
    accentColor: 'accent-fuchsia-500',
    primaryButton: 'bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.8)] border border-fuchsia-400 hover:opacity-90',
  },
  cyber: {
    bg: 'bg-indigo-950',
    gradient: 'from-blue-900 to-indigo-950',
    coverBg: 'bg-purple-900',
    coverBorder: 'border-cyan-400',
    pageBg: 'bg-slate-900',
    pageBorder: 'border-cyan-500/30',
    pageInnerBorder: 'border-cyan-500/50',
    pageInnerBorderLight: 'border-cyan-500/20',
    cornerAccents: 'border-cyan-400',
    buttonBase: 'bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
    buttonIcon: 'text-cyan-400 hover:text-cyan-200',
    fontTitle: 'font-mono text-cyan-400 font-bold',
    fontSubtitle: 'text-cyan-300/70',
    emptyPage: 'border-cyan-900 text-cyan-500/40 bg-slate-950/50',
    accentColor: 'accent-cyan-400',
    primaryButton: 'bg-cyan-500 text-black font-bold shadow-[0_0_20px_rgba(34,211,238,0.8)] border border-cyan-300 hover:opacity-90',
  },
  autumn: {
    bg: 'bg-amber-950',
    gradient: 'from-amber-900 to-orange-950',
    coverBg: 'bg-[#5c2e0e]',
    coverBorder: 'border-yellow-500/40',
    pageBg: 'bg-[#fffdf5]',
    pageBorder: 'border-orange-900/10',
    pageInnerBorder: 'border-orange-300/40',
    pageInnerBorderLight: 'border-orange-200/30',
    cornerAccents: 'border-orange-500/60',
    buttonBase: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-100 border border-orange-500/20',
    buttonIcon: 'text-orange-200/50 hover:text-orange-200',
    fontTitle: 'font-serif text-orange-100',
    fontSubtitle: 'text-orange-300/70',
    emptyPage: 'border-orange-200 text-orange-700/40 bg-orange-50/30',
    accentColor: 'accent-orange-500',
    primaryButton: 'bg-orange-600 text-white shadow-lg border border-orange-400/50 hover:opacity-90',
  },
  winter: {
    bg: 'bg-sky-950',
    gradient: 'from-sky-900 to-blue-950',
    coverBg: 'bg-[#0c4a6e]',
    coverBorder: 'border-blue-300/40',
    pageBg: 'bg-[#f0f9ff]',
    pageBorder: 'border-blue-900/10',
    pageInnerBorder: 'border-blue-300/40',
    pageInnerBorderLight: 'border-blue-200/30',
    cornerAccents: 'border-blue-500/60',
    buttonBase: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-100 border border-blue-500/20',
    buttonIcon: 'text-blue-200/50 hover:text-blue-200',
    fontTitle: 'font-sans text-blue-100',
    fontSubtitle: 'text-blue-300/70',
    emptyPage: 'border-blue-200 text-blue-700/40 bg-blue-50/30',
    accentColor: 'accent-blue-500',
    primaryButton: 'bg-blue-500 text-white shadow-lg border border-blue-400/50 hover:opacity-90',
  },
  spring: {
    bg: 'bg-emerald-950',
    gradient: 'from-emerald-900 to-green-950',
    coverBg: 'bg-[#064e3b]',
    coverBorder: 'border-emerald-400/40',
    pageBg: 'bg-[#f0fdf4]',
    pageBorder: 'border-emerald-900/10',
    pageInnerBorder: 'border-emerald-300/40',
    pageInnerBorderLight: 'border-emerald-200/30',
    cornerAccents: 'border-emerald-500/60',
    buttonBase: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-100 border border-emerald-500/20',
    buttonIcon: 'text-emerald-200/50 hover:text-emerald-200',
    fontTitle: 'font-serif text-emerald-100',
    fontSubtitle: 'text-emerald-300/70',
    emptyPage: 'border-emerald-200 text-emerald-700/40 bg-emerald-50/30',
    accentColor: 'accent-emerald-500',
    primaryButton: 'bg-emerald-500 text-white shadow-lg border border-emerald-400/50 hover:opacity-90',
  },
  elegant: {
    bg: 'bg-zinc-900',
    gradient: 'from-zinc-800 to-black',
    coverBg: 'bg-[#18181b]',
    coverBorder: 'border-amber-200/30',
    pageBg: 'bg-[#fafafa]',
    pageBorder: 'border-zinc-200',
    pageInnerBorder: 'border-amber-200/50',
    pageInnerBorderLight: 'border-amber-100/30',
    cornerAccents: 'border-amber-300',
    buttonBase: 'bg-amber-900/20 hover:bg-amber-900/40 text-amber-100 border border-amber-500/30',
    buttonIcon: 'text-amber-200/50 hover:text-amber-200',
    fontTitle: 'font-serif text-amber-100 font-light tracking-wide',
    fontSubtitle: 'text-amber-200/60',
    emptyPage: 'border-zinc-200 text-zinc-400 bg-zinc-50',
    accentColor: 'accent-amber-500',
    primaryButton: 'bg-zinc-800 text-amber-200 shadow-md border border-amber-900/50 hover:bg-zinc-700',
  },
  rustic: {
    bg: 'bg-orange-950',
    gradient: 'from-stone-900 to-orange-950',
    coverBg: 'bg-[#432c1a]',
    coverBorder: 'border-orange-900',
    pageBg: 'bg-[#fcf8f2]',
    pageBorder: 'border-orange-900/20',
    pageInnerBorder: 'border-orange-800/20',
    pageInnerBorderLight: 'border-orange-800/10',
    cornerAccents: 'border-orange-900/40',
    buttonBase: 'bg-orange-900/20 hover:bg-orange-900/40 text-orange-100 border border-orange-900/50',
    buttonIcon: 'text-orange-200/60 hover:text-orange-200',
    fontTitle: 'font-serif text-orange-200',
    fontSubtitle: 'text-orange-300/60',
    emptyPage: 'border-orange-200 text-orange-800/30 bg-orange-50/50',
    accentColor: 'accent-orange-700',
    primaryButton: 'bg-orange-900 text-orange-100 shadow-sm border border-orange-800 hover:bg-orange-800',
  },
  cosmic: {
    bg: 'bg-violet-950',
    gradient: 'from-indigo-950 to-violet-950',
    coverBg: 'bg-[#1e1b4b]',
    coverBorder: 'border-violet-400/30',
    pageBg: 'bg-[#0f172a]',
    pageBorder: 'border-violet-500/20',
    pageInnerBorder: 'border-violet-400/30',
    pageInnerBorderLight: 'border-violet-400/10',
    cornerAccents: 'border-violet-300/50',
    buttonBase: 'bg-violet-500/20 hover:bg-violet-500/40 text-violet-100 border border-violet-400/30',
    buttonIcon: 'text-violet-300/60 hover:text-violet-200',
    fontTitle: 'font-sans text-violet-100 font-light tracking-widest',
    fontSubtitle: 'text-violet-300/60',
    emptyPage: 'border-violet-900/50 text-violet-400/30 bg-slate-900',
    accentColor: 'accent-violet-400',
    primaryButton: 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-500 hover:bg-violet-500',
  }
};

const getTransformStyle = (tf?: any) => {
  if (!tf) return {};
  const scale = tf.scale !== undefined ? tf.scale : 1;
  const scaleX = tf.flipH ? -scale : scale;
  const scaleY = tf.flipV ? -scale : scale;
  return {
    transform: `translate(${tf.translateX || 0}%, ${tf.translateY || 0}%) rotate(${tf.rotate || 0}deg) scale(${scaleX}, ${scaleY})`,
  };
};

const getThemeInnerBg = (themeName?: string) => {
  switch (themeName) {
    case 'royal':
      return 'bg-[#fffaf0]'; // warm cream to match pageBg
    case 'minimalist':
      return 'bg-white border-neutral-100'; // pure white
    case 'floral':
      return 'bg-[#faf8f3] border-rose-900/5'; // soft off-white
    case 'vintage':
      return 'bg-[#eedfb9] border-stone-800/10'; // vintage papyrus paper
    case 'modern':
      return 'bg-white border-slate-200/50'; // crisp white
    case 'midnight':
      return 'bg-neutral-50 border-neutral-200'; // light gray inner
    case 'sunset':
      return 'bg-[#fef3e6] border-orange-900/5'; // soft sunset cream
    case 'ocean':
      return 'bg-[#ebfcf9] border-teal-900/5'; // soft mint cream
    case 'forest':
      return 'bg-[#f2fcf0] border-green-900/5'; // pale forest mist
    case 'pastel':
      return 'bg-[#fffafd] border-pink-100'; // ultra pale pinkish-white
    case 'neon':
      return 'bg-zinc-950 border-fuchsia-500/20'; // dark neon theme slot (perfect dark style)
    case 'cyber':
      return 'bg-slate-950 border-cyan-500/20'; // dark cyber theme slot
    case 'autumn':
      return 'bg-[#fdfaf2] border-orange-900/5'; // warm golden-white
    case 'winter':
      return 'bg-[#f4faff] border-blue-900/5'; // icy cool blue-white
    case 'spring':
      return 'bg-[#f4fef8] border-emerald-900/5'; // soft fresh spring green-white
    case 'elegant':
      return 'bg-white border-zinc-100'; // refined crisp white
    case 'rustic':
      return 'bg-[#faf3e8] border-orange-950/10'; // warm beige
    case 'cosmic':
      return 'bg-[#1e293b] border-violet-500/20'; // deep dark space slate
    default:
      return 'bg-white';
  }
};

const getThemeSlotBg = (themeName?: string) => {
  const isDark = themeName === 'cosmic' || themeName === 'neon' || themeName === 'cyber';
  if (isDark) {
    return 'bg-slate-900/50 border border-white/5 text-white/20';
  }
  return 'bg-black/[0.02] border border-black/[0.04] text-black/10';
};

const PageRenderer = ({ page, defaultImage, themeName }: { page?: any, defaultImage?: Blob | null, themeName?: string }) => {
  // Graceful fallback if migrating
  const layout = page?.layout || '1';
  const images = page?.images || [defaultImage || null];
  const transforms = page?.transforms || [];
  
  const hasAnyImage = images.some((img: any) => img !== null);
  
  if (!hasAnyImage) {
    return <div className="w-full h-full flex items-center justify-center relative z-10"></div>;
  }

  const innerBgClass = getThemeInnerBg(themeName);
  const slotBgClass = getThemeSlotBg(themeName);

  if (layout === 'free') {
    return (
      <div className={`w-full h-full shadow-[0_5px_15px_rgba(0,0,0,0.08)] ${innerBgClass} p-2 md:p-3 relative z-10 border border-black/5 overflow-hidden`}>
        {images.map((img: Blob | null, index: number) => {
          if (!img) return null;
          const tf = transforms[index] || {};
          const x = tf.x !== undefined ? tf.x : (index * 15) % 60 + 10;
          const y = tf.y !== undefined ? tf.y : (index * 15) % 50 + 15;
          const w = tf.width !== undefined ? tf.width : 35;
          const h = tf.height !== undefined ? tf.height : 35;
          const z = tf.zIndex !== undefined ? tf.zIndex : 1;
          
          return (
            <div 
              key={index} 
              className="absolute overflow-hidden shadow-sm hover:shadow-md transition-shadow rounded-sm animate-in fade-in duration-300" 
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${w}%`,
                height: `${h}%`,
                zIndex: z,
                transform: `rotate(${tf.canvasRotate || 0}deg)`
              }}
            >
              <img 
                src={getBlobUrl(img)!} 
                className="w-full h-full object-cover origin-center" 
                style={getTransformStyle(tf)}
                alt="" 
                draggable={false} 
              />
            </div>
          );
        })}
      </div>
    );
  }
  
  const displayStyle = layout === '1' ? 'flex' : 'grid';
  const gridTemplateColumns = layout === '2-h' ? '1fr 1fr' : layout === '4' ? '1fr 1fr' : layout === '3' ? '2fr 1fr' : '1fr';
  const gridTemplateRows = layout === '2-v' ? '1fr 1fr' : layout === '4' ? '1fr 1fr' : layout === '3' ? '1fr 1fr' : '1fr';
  
  return (
    <div className={`w-full h-full shadow-[0_5px_15px_rgba(0,0,0,0.08)] ${innerBgClass} p-2 md:p-3 relative z-10 border border-black/5`} style={{ display: displayStyle, gridTemplateColumns, gridTemplateRows, gap: '8px' }}>
      {images.map((img: Blob | null, index: number) => {
        const itemClass = `relative w-full h-full overflow-hidden ${
          layout === '1' ? 'row-span-1 col-span-1' :
          layout === '2-h' ? 'col-span-1 h-full' :
          layout === '2-v' ? 'row-span-1 w-full' :
          layout === '3' ? (index === 0 ? 'col-span-1 row-span-2' : 'col-span-1 row-span-1') :
          layout === '4' ? 'col-span-1 row-span-1' : ''
        }`;
        
        return (
          <div key={index} className={itemClass}>
            {img ? (
              <img 
                src={getBlobUrl(img)!} 
                className="absolute inset-0 w-full h-full object-cover transition-transform origin-center animate-in fade-in duration-300" 
                style={getTransformStyle(transforms[index])}
                alt="" 
                draggable={false} 
              />
            ) : (
              <div className={`absolute inset-0 w-full h-full flex items-center justify-center ${slotBgClass}`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const BookView: React.FC<BookViewProps> = ({ spreads, settings, onOpenAdmin, isSharedView = false, onCustomize }) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const currentTheme = themeStyles[settings?.theme || 'royal'];
  const isPortrait = settings?.orientation === 'portrait';

  useEffect(() => {
    if (audioRef.current && hasInteracted) {
      const audioUrl = getBlobUrl(settings?.audioFile);
      
      if (audioUrl) {
        if (audioRef.current.src !== audioUrl) {
           audioRef.current.src = audioUrl;
        }
        audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
      } else {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
  }, [settings, hasInteracted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setHasInteracted(true);
        setCurrentIndex(prev => prev < spreads.length + 1 ? prev + 1 : prev);
      } else if (e.key === 'ArrowLeft') {
        setHasInteracted(true);
        setCurrentIndex(prev => prev > -1 ? prev - 1 : prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spreads.length]);

  const handleNext = () => {
    setHasInteracted(true);
    setCurrentIndex(prev => prev < spreads.length + 1 ? prev + 1 : prev);
  };

  const handlePrev = () => {
    setHasInteracted(true);
    setCurrentIndex(prev => prev > -1 ? prev - 1 : prev);
  };

  const handleStartInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      if (audioRef.current && settings?.audioFile && audioRef.current.paused) {
          audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
      }
    }
  }

  const getMarkingColorClass = (themeName?: string) => {
    switch (themeName) {
      case 'neon':
        return 'text-fuchsia-300 font-semibold opacity-90';
      case 'cyber':
        return 'text-cyan-300 font-semibold opacity-90';
      case 'royal':
        return 'text-amber-800/90 font-semibold';
      case 'minimalist':
        return 'text-neutral-700 font-semibold';
      case 'floral':
        return 'text-rose-800/90 font-semibold';
      case 'vintage':
        return 'text-stone-700 font-semibold';
      case 'modern':
        return 'text-slate-700 font-semibold';
      case 'midnight':
        return 'text-gray-700 font-semibold';
      case 'sunset':
        return 'text-orange-950 font-semibold';
      case 'ocean':
        return 'text-teal-900 font-semibold';
      case 'forest':
        return 'text-green-900 font-semibold';
      case 'pastel':
        return 'text-pink-800 font-semibold';
      case 'autumn':
        return 'text-amber-950 font-semibold';
      case 'winter':
        return 'text-blue-900 font-semibold';
      case 'spring':
        return 'text-emerald-950 font-semibold';
      case 'elegant':
        return 'text-amber-950 font-semibold';
      default:
        return 'text-stone-700 font-semibold';
    }
  };

  // Build sheets
  const sheets = [];
  
  // Sheet 0: Front Cover
  sheets.push({
    id: 'cover',
    isCover: true,
    front: (
      <div className={`absolute inset-0 ${currentTheme.coverBg} border-y-2 md:border-y-4 border-r-2 md:border-r-4 ${currentTheme.coverBorder} rounded-r-sm shadow-[20px_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center before:content-[''] before:absolute before:inset-0 before:shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] overflow-hidden transition-colors duration-1000`}>
         <div className={`absolute ${isPortrait ? 'inset-2 md:inset-4' : 'inset-4 md:inset-8'} border-2 ${currentTheme.pageInnerBorder} pointer-events-none z-10`}></div>
         <div className={`absolute ${isPortrait ? 'inset-3 md:inset-6' : 'inset-6 md:inset-12'} border ${currentTheme.pageInnerBorderLight} pointer-events-none z-10`}></div>
         <div className={`relative z-20 text-center flex flex-col items-center justify-center w-full h-full ${isPortrait ? 'p-4 md:p-6' : 'p-8'}`}>
            {settings.coverPhoto ? (
               <div className={`w-full ${isPortrait ? 'h-[55%]' : 'h-[55%] md:h-[60%]'} mb-4 md:mb-6 shadow-xl overflow-hidden relative rounded-lg bg-zinc-950`}>
                  <img 
                    src={getBlobUrl(settings.coverPhoto)!} 
                    className="absolute inset-0 w-full h-full object-cover origin-center pointer-events-none" 
                    style={getTransformStyle(settings.coverPhotoTransform)} 
                    alt="Cover" 
                  />
               </div>
            ) : null}
            <h1 className={`${settings.coverPhoto ? (isPortrait ? 'text-lg md:text-2xl' : 'text-2xl md:text-4xl') : (isPortrait ? 'text-3xl md:text-5xl' : 'text-4xl md:text-6xl')} ${currentTheme.fontTitle} mb-3 drop-shadow-lg transition-all`}>Celebration</h1>
            <p className={`${currentTheme.fontSubtitle} ${isPortrait ? 'tracking-[0.15em] text-[10px] md:text-xs' : 'tracking-[0.3em] text-xs md:text-sm'} uppercase`}>A Collection of Memories</p>
         </div>
      </div>
    ),
    back: (
      <div className={`absolute inset-0 ${currentTheme.coverBg} border-y-2 md:border-y-4 border-l-2 md:border-l-4 ${currentTheme.coverBorder} rounded-l-sm shadow-[-20px_20px_50px_rgba(0,0,0,0.8)] before:content-[''] before:absolute before:inset-0 before:shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] transition-colors duration-1000`}>
         <div className={`absolute inset-y-[2px] md:inset-y-[4px] left-[2px] md:left-[4px] right-0 ${currentTheme.pageBg} shadow-[inset_-10px_0_40px_rgba(0,0,0,0.04)] border-y border-l border-black/5 overflow-hidden flex flex-col items-center justify-center ${isPortrait ? 'p-3 md:p-6' : 'p-4 md:p-6'} transition-colors duration-1000`}>
            <div className={`absolute ${isPortrait ? 'inset-1 md:inset-2' : 'inset-2 md:inset-4'} border ${currentTheme.pageInnerBorder} pointer-events-none z-10`}></div>
            <div className={`absolute ${isPortrait ? 'inset-1.5 md:inset-3' : 'inset-3 md:inset-5'} border ${currentTheme.pageInnerBorderLight} pointer-events-none z-10`}></div>
            {spreads[0] ? (
               <PageRenderer page={spreads[0].leftPage} defaultImage={spreads[0].leftImage} themeName={settings?.theme} />
            ) : (
               <div className="w-full h-full flex items-center justify-center relative z-10"></div>
            )}
            {settings.marking && (
               <div className={`absolute bottom-1.5 md:bottom-3 left-1/2 -translate-x-1/2 z-30 select-none text-[9px] md:text-[11px] tracking-[0.25em] md:tracking-[0.35em] uppercase text-center whitespace-nowrap drop-shadow-sm pointer-events-none ${getMarkingColorClass(settings?.theme)}`}>
                  {settings.marking}
               </div>
            )}
            <div className="absolute inset-0 left-auto right-0 bg-gradient-to-l from-black/10 to-transparent w-24 pointer-events-none z-20"></div>
         </div>
      </div>
    )
  });

  // Sheets 1 to N-1
  for (let i = 1; i < spreads.length; i++) {
    sheets.push({
      id: spreads[i].id,
      isCover: false,
      front: (
        <div className={`absolute inset-y-[2px] md:inset-y-[4px] right-[2px] md:right-[4px] left-0 ${currentTheme.pageBg} shadow-[inset_10px_0_40px_rgba(0,0,0,0.04)] border-y border-r border-black/5 overflow-hidden flex flex-col items-center justify-center ${isPortrait ? 'p-3 md:p-6' : 'p-4 md:p-6'} transition-colors duration-1000`}>
           <div className={`absolute ${isPortrait ? 'inset-1 md:inset-2' : 'inset-2 md:inset-4'} border ${currentTheme.pageInnerBorder} pointer-events-none`}></div>
           <div className={`absolute ${isPortrait ? 'inset-1.5 md:inset-3' : 'inset-3 md:inset-5'} border ${currentTheme.pageInnerBorderLight} pointer-events-none`}></div>
           {spreads[i-1] ? (
              <PageRenderer page={spreads[i-1].rightPage} defaultImage={spreads[i-1].rightImage} themeName={settings?.theme} />
           ) : (
              <div className="w-full h-full flex items-center justify-center relative z-10"></div>
           )}
           {settings.marking && (
              <div className={`absolute bottom-1.5 md:bottom-3 left-1/2 -translate-x-1/2 z-30 select-none text-[9px] md:text-[11px] tracking-[0.25em] md:tracking-[0.35em] uppercase text-center whitespace-nowrap drop-shadow-sm pointer-events-none ${getMarkingColorClass(settings?.theme)}`}>
                 {settings.marking}
              </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent w-24 pointer-events-none z-20"></div>
        </div>
      ),
      back: (
        <div className={`absolute inset-y-[2px] md:inset-y-[4px] left-[2px] md:left-[4px] right-0 ${currentTheme.pageBg} shadow-[inset_-10px_0_40px_rgba(0,0,0,0.04)] border-y border-l border-black/5 overflow-hidden flex flex-col items-center justify-center ${isPortrait ? 'p-3 md:p-6' : 'p-4 md:p-6'} transition-colors duration-1000`}>
           <div className={`absolute ${isPortrait ? 'inset-1 md:inset-2' : 'inset-2 md:inset-4'} border ${currentTheme.pageInnerBorder} pointer-events-none`}></div>
           <div className={`absolute ${isPortrait ? 'inset-1.5 md:inset-3' : 'inset-3 md:inset-5'} border ${currentTheme.pageInnerBorderLight} pointer-events-none`}></div>
           {spreads[i] ? (
              <PageRenderer page={spreads[i].leftPage} defaultImage={spreads[i].leftImage} themeName={settings?.theme} />
           ) : (
              <div className="w-full h-full flex items-center justify-center relative z-10"></div>
           )}
           {settings.marking && (
              <div className={`absolute bottom-1.5 md:bottom-3 left-1/2 -translate-x-1/2 z-30 select-none text-[9px] md:text-[11px] tracking-[0.25em] md:tracking-[0.35em] uppercase text-center whitespace-nowrap drop-shadow-sm pointer-events-none ${getMarkingColorClass(settings?.theme)}`}>
                 {settings.marking}
              </div>
           )}
           <div className="absolute inset-0 left-auto right-0 bg-gradient-to-l from-black/10 to-transparent w-24 pointer-events-none z-20"></div>
        </div>
      )
    });
  }

  // Sheet N: Back Cover
  sheets.push({
    id: 'back-cover',
    isCover: true,
    front: (
      <div className={`absolute inset-0 ${currentTheme.coverBg} border-y-2 md:border-y-4 border-r-2 md:border-r-4 ${currentTheme.coverBorder} rounded-r-sm shadow-[20px_20px_50px_rgba(0,0,0,0.8)] before:content-[''] before:absolute before:inset-0 before:shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] transition-colors duration-1000`}>
         <div className={`absolute inset-y-[2px] md:inset-y-[4px] right-[2px] md:right-[4px] left-0 ${currentTheme.pageBg} shadow-[inset_10px_0_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col items-center justify-center ${isPortrait ? 'p-3 md:p-6' : 'p-4 md:p-6'} transition-colors duration-1000`}>
           <div className={`absolute ${isPortrait ? 'inset-1 md:inset-2' : 'inset-2 md:inset-4'} border ${currentTheme.pageInnerBorder} pointer-events-none z-10`}></div>
           <div className={`absolute ${isPortrait ? 'inset-1.5 md:inset-3' : 'inset-3 md:inset-5'} border ${currentTheme.pageInnerBorderLight} pointer-events-none z-10`}></div>
           {spreads[spreads.length - 1] ? (
              <PageRenderer page={spreads[spreads.length - 1].rightPage} defaultImage={spreads[spreads.length - 1].rightImage} themeName={settings?.theme} />
           ) : (
              <div className="w-full h-full flex items-center justify-center relative z-10"></div>
           )}
           {settings.marking && (
              <div className={`absolute bottom-1.5 md:bottom-3 left-1/2 -translate-x-1/2 z-30 select-none text-[9px] md:text-[11px] tracking-[0.25em] md:tracking-[0.35em] uppercase text-center whitespace-nowrap drop-shadow-sm pointer-events-none ${getMarkingColorClass(settings?.theme)}`}>
                 {settings.marking}
              </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent w-24 pointer-events-none z-20"></div>
         </div>
      </div>
    ),
    back: (
      <div className={`absolute inset-0 ${currentTheme.coverBg} border-y-2 md:border-y-4 border-l-2 md:border-l-4 ${currentTheme.coverBorder} rounded-l-sm shadow-[-20px_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center before:content-[''] before:absolute before:inset-0 before:shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] overflow-hidden transition-colors duration-1000`}>
         <div className={`absolute ${isPortrait ? 'inset-2 md:inset-4' : 'inset-4 md:inset-8'} border-2 ${currentTheme.pageInnerBorder} pointer-events-none z-10`}></div>
         <div className={`absolute ${isPortrait ? 'inset-3 md:inset-6' : 'inset-6 md:inset-12'} border ${currentTheme.pageInnerBorderLight} pointer-events-none z-10`}></div>
         <div className={`relative z-20 text-center ${isPortrait ? 'px-4 md:px-6' : 'px-8 md:px-16'}`}>
            <p className={`font-cursive ${isPortrait ? 'text-sm md:text-xl' : 'text-xl md:text-3xl'} font-bold tracking-wide drop-shadow-sm leading-relaxed ${currentTheme.fontSubtitle}`}>"Memories are timeless treasures of the heart."</p>
         </div>
      </div>
    )
  });

  return (
    <div className={`relative min-h-screen ${currentTheme.bg} overflow-hidden flex flex-col items-center justify-center font-sans transition-colors duration-1000`} onClick={handleStartInteraction}>
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${currentTheme.gradient} pointer-events-none transition-colors duration-1000`}></div>
      
      {!isSharedView && (
        <button onClick={onOpenAdmin} className={`absolute top-6 right-6 p-3 ${currentTheme.buttonBase} rounded-full backdrop-blur-sm transition-all z-50`}>
          <Settings size={20} />
        </button>
      )}

      {isSharedView && (
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between gap-4 z-50 bg-black/40 backdrop-blur-md border border-white/10 p-3.5 px-6 rounded-2xl shadow-xl max-w-xl mx-auto sm:right-auto sm:min-w-[420px]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-white">Shared Celebration Album</div>
              <p className="text-[10px] text-white/60">Scanned via QR Code</p>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onCustomize?.(); }} 
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            Customize This Copy
          </button>
        </div>
      )}

      {settings.audioFile && (
        <div className={`absolute bottom-6 right-6 flex items-center gap-4 ${currentTheme.buttonBase} backdrop-blur-md p-3 px-5 rounded-full z-50 shadow-lg`}>
          <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="hover:opacity-75 transition-opacity">
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={isMuted ? 0 : volume} 
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className={`w-24 ${currentTheme.accentColor} cursor-pointer`}
          />
        </div>
      )}

      {settings.audioFile && <audio ref={audioRef} loop />}

      {spreads.length === 0 ? (
        <div className="z-10 text-center text-white/70">
          <p className="mb-6 text-lg tracking-wide font-light">Your celebration album is currently empty.</p>
          <button onClick={onOpenAdmin} className={`px-8 py-3 ${currentTheme.primaryButton} rounded-full font-medium transition-all hover:scale-105 active:scale-95`}>
            Create Album
          </button>
        </div>
      ) : (
        <div className={`relative z-10 w-full ${isPortrait ? 'max-w-4xl aspect-[3/2]' : 'max-w-6xl aspect-[8/3]'} max-h-[80vh] flex items-center justify-center px-4 md:px-16`}>
          
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }} 
            disabled={currentIndex === -1}
            className={`absolute left-4 md:left-8 z-50 p-4 ${currentTheme.buttonIcon} disabled:opacity-0 hover:scale-110 transition-all disabled:cursor-default`}
          >
            <ChevronLeft size={48} strokeWidth={1} />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }} 
            disabled={currentIndex === spreads.length + 1}
            className={`absolute right-4 md:right-8 z-50 p-4 ${currentTheme.buttonIcon} disabled:opacity-0 hover:scale-110 transition-all disabled:cursor-default`}
          >
            <ChevronRight size={48} strokeWidth={1} />
          </button>

          <div className="relative w-full h-full transition-transform duration-[1400ms] ease-[cubic-bezier(0.25,1,0.5,1)]" style={{ perspective: '2500px', transform: currentIndex === -1 ? 'translateX(-25%)' : currentIndex > sheets.length - 2 ? 'translateX(25%)' : 'translateX(0)' }}>
            
            <div className="absolute top-0 bottom-0 left-1/2 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/20 to-black/5 z-0 pointer-events-none transition-opacity duration-1000" style={{ opacity: currentIndex === -1 || currentIndex > sheets.length - 2 ? 0 : 1 }}></div>

            {sheets.map((sheet, i) => {
              const isFlipped = currentIndex > i - 1;
              const zIndex = isFlipped ? 100 + i : 100 - i;
              
              return (
                <div
                  key={sheet.id}
                  className={`absolute top-0 left-1/2 w-1/2 h-full transition-transform duration-[1400ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${i === 0 && !isFlipped ? 'cursor-pointer' : ''}`}
                  style={{
                    transformOrigin: 'left center',
                    transform: `rotateY(${isFlipped ? -180 : 0}deg)`,
                    transformStyle: 'preserve-3d',
                    zIndex
                  }}
                  onClick={i === 0 && !isFlipped ? (e) => { e.stopPropagation(); handleNext(); } : undefined}
                >
                  {/* Front of Sheet */}
                  <div 
                    className="absolute inset-0 transition-colors duration-1000" 
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {sheet.front}
                  </div>
                  
                  {/* Back of Sheet */}
                  <div 
                    className="absolute inset-0 transition-colors duration-1000"
                    style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                  >
                    {sheet.back}
                  </div>
                </div>
              );
            })}


            {/* Invisible Overlays for reliable click detection over the 3D elements */}
            <div 
              className={`absolute top-0 left-0 w-1/2 h-full z-[1000] ${currentIndex > -1 ? 'cursor-pointer' : 'hidden'}`} 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }} 
            />
            <div 
              className={`absolute top-0 right-0 w-1/2 h-full z-[1000] ${currentIndex < spreads.length + 1 ? 'cursor-pointer' : 'hidden'}`} 
              onClick={(e) => { e.stopPropagation(); handleNext(); }} 
            />
          </div>
        </div>
      )}
      
      {!hasInteracted && spreads.length > 0 && (
         <div className="absolute bottom-32 text-transparent text-sm pointer-events-none">
         </div>
      )}
    </div>
  );
};
