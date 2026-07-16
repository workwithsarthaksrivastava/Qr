import React from 'react';
import { ThemeType } from '../types';
import { Palette, CheckCircle2 } from 'lucide-react';

interface TemplateGalleryProps {
  currentTheme?: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
}

const templates: { id: ThemeType; name: string; description: string; colors: string[] }[] = [
  {
    id: 'royal',
    name: 'Classic Royal',
    description: 'Deep red and gold for traditional Indian celebrations.',
    colors: ['bg-rose-950', 'bg-[#78101a]', 'bg-amber-500'],
  },
  {
    id: 'floral',
    name: 'Vibrant Floral',
    description: 'Emerald and rose hues for lively ceremonies like Mehendi.',
    colors: ['bg-emerald-950', 'bg-[#0f2e1f]', 'bg-rose-400'],
  },
  {
    id: 'minimalist',
    name: 'Minimalist Elegance',
    description: 'Clean whites and subtle grays for modern receptions.',
    colors: ['bg-neutral-200', 'bg-[#e5e5e5]', 'bg-neutral-400'],
  },
  {
    id: 'vintage',
    name: 'Vintage Sepia',
    description: 'Warm sepia and brown tones for a nostalgic feel.',
    colors: ['bg-stone-800', 'bg-[#3e352b]', 'bg-stone-400'],
  },
  {
    id: 'modern',
    name: 'Modern Slate',
    description: 'Cool slate and muted blues for a sleek look.',
    colors: ['bg-slate-900', 'bg-slate-800', 'bg-blue-400'],
  },
  {
    id: 'midnight',
    name: 'Midnight Black',
    description: 'Deep blacks and bright whites for high contrast.',
    colors: ['bg-black', 'bg-gray-900', 'bg-white'],
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Vibrant oranges and purples inspired by the evening sky.',
    colors: ['bg-orange-900', 'bg-purple-900', 'bg-orange-400'],
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Calming teals and aquas for a beachy aesthetic.',
    colors: ['bg-cyan-950', 'bg-teal-900', 'bg-cyan-400'],
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    description: 'Rich greens and earthy browns for nature lovers.',
    colors: ['bg-green-950', 'bg-[#0a2e12]', 'bg-lime-500'],
  },
  {
    id: 'pastel',
    name: 'Soft Pastel',
    description: 'Light pinks and purples for a gentle touch.',
    colors: ['bg-pink-100', 'bg-purple-100', 'bg-pink-300'],
  },
  {
    id: 'neon',
    name: 'Neon Lights',
    description: 'Dark background with vibrant neon accents.',
    colors: ['bg-zinc-950', 'bg-fuchsia-950', 'bg-fuchsia-400'],
  },
  {
    id: 'cyber',
    name: 'Cyberpunk',
    description: 'High-tech blues and magentas for a futuristic vibe.',
    colors: ['bg-indigo-950', 'bg-purple-900', 'bg-cyan-400'],
  },
  {
    id: 'autumn',
    name: 'Autumn Leaves',
    description: 'Warm reds, oranges, and yellows of fall.',
    colors: ['bg-amber-900', 'bg-orange-800', 'bg-yellow-500'],
  },
  {
    id: 'winter',
    name: 'Winter Frost',
    description: 'Icy blues and whites for a crisp, clean look.',
    colors: ['bg-sky-100', 'bg-blue-100', 'bg-blue-300'],
  },
  {
    id: 'spring',
    name: 'Spring Blossom',
    description: 'Fresh greens and soft pinks of new blooms.',
    colors: ['bg-emerald-100', 'bg-rose-100', 'bg-emerald-400'],
  },
  {
    id: 'elegant',
    name: 'Timeless Elegance',
    description: 'Champagne and muted golds for sophisticated events.',
    colors: ['bg-yellow-950', 'bg-[#4a3f24]', 'bg-amber-300'],
  },
  {
    id: 'rustic',
    name: 'Rustic Charm',
    description: 'Woody browns and warm creams for countryside themes.',
    colors: ['bg-orange-950', 'bg-stone-900', 'bg-orange-300'],
  },
  {
    id: 'cosmic',
    name: 'Cosmic Sky',
    description: 'Deep space purples and starlight whites.',
    colors: ['bg-violet-950', 'bg-indigo-950', 'bg-violet-300'],
  }
];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ currentTheme = 'royal', onSelectTheme }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm mb-8">
      <h2 className="text-xl font-medium mb-4 text-gray-800 flex items-center gap-2">
        <Palette className="text-amber-500" size={24} /> Template Gallery
      </h2>
      <p className="text-gray-500 text-sm mb-6">Choose a design layout that perfectly matches your celebration's vibe.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((template) => {
          const isSelected = currentTheme === template.id;
          return (
            <div 
              key={template.id}
              onClick={() => onSelectTheme(template.id)}
              className={`relative rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md ${isSelected ? 'border-amber-500 bg-amber-50/30' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-amber-500 z-10 bg-white rounded-full">
                  <CheckCircle2 size={24} className="fill-amber-100" />
                </div>
              )}
              
              <div className="h-32 flex w-full">
                <div className={`w-1/3 h-full ${template.colors[0]}`}></div>
                <div className={`w-1/3 h-full ${template.colors[1]}`}></div>
                <div className={`w-1/3 h-full ${template.colors[2]}`}></div>
              </div>
              
              <div className="p-4 border-t border-gray-100/50">
                <h3 className="font-medium text-gray-800 mb-1">{template.name}</h3>
                <p className="text-xs text-gray-500">{template.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
