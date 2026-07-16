import localforage from 'localforage';
import { SpreadData, AlbumSettings } from '../types';

const db = localforage.createInstance({
  name: 'PhotoAlbumDB'
});

export const saveSpreadsToDB = async (spreads: SpreadData[]) => {
  await db.setItem('spreads', spreads);
};

export const loadSpreadsFromDB = async (): Promise<SpreadData[]> => {
  const spreads = await db.getItem<SpreadData[]>('spreads');
  if (!spreads) return [];
  
  // Data migration for backwards compatibility
  return spreads.map(spread => {
    const leftPage = spread.leftPage || {
      layout: '1',
      images: [spread.leftImage || null]
    };
    const rightPage = spread.rightPage || {
      layout: '1',
      images: [spread.rightImage || null]
    };
    return { ...spread, leftPage, rightPage };
  });
};

export const saveSettingsToDB = async (settings: AlbumSettings) => {
  await db.setItem('settings', settings);
};

export const loadSettingsFromDB = async (): Promise<AlbumSettings> => {
  const settings = await db.getItem<AlbumSettings>('settings');
  return settings || { audioFile: null, audioName: null, theme: 'royal' };
};

const blobUrlMap = new Map<Blob, string>();
export function getBlobUrl(blob: Blob | null | undefined): string | null {
  if (!blob) return null;
  if (!blobUrlMap.has(blob)) {
    blobUrlMap.set(blob, URL.createObjectURL(blob));
  }
  return blobUrlMap.get(blob)!;
}
