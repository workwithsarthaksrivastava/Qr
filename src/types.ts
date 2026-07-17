export type PageLayout = '1' | '2-h' | '2-v' | '3' | '4' | 'free';

export interface ImageTransform {
  scale: number;
  rotate: number;
  translateX: number;
  translateY: number;
  flipH: boolean;
  flipV: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  canvasRotate?: number;
}

export interface PageData {
  images: (Blob | null)[];
  layout: PageLayout;
  transforms?: ImageTransform[];
}

export interface SpreadData {
  id: string;
  leftPage: PageData;
  rightPage: PageData;
  // deprecated but kept for backwards compatibility during migration
  leftImage?: Blob | null;
  rightImage?: Blob | null;
}

export type ThemeType = 'royal' | 'minimalist' | 'floral' | 'vintage' | 'modern' | 'midnight' | 'sunset' | 'ocean' | 'forest' | 'pastel' | 'neon' | 'cyber' | 'autumn' | 'winter' | 'spring' | 'elegant' | 'rustic' | 'cosmic';

export interface AlbumSettings {
  audioFile: Blob | null;
  audioName: string | null;
  theme?: ThemeType;
  coverPhoto?: Blob | null;
  coverPhotoTransform?: ImageTransform;
  orientation?: 'landscape' | 'portrait';
  marking?: string;
}
