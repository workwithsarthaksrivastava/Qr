import localforage from 'localforage';
import { SpreadData, AlbumSettings, LocalAlbum } from '../types';

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

export const loadLocalAlbumsFromDB = async (): Promise<LocalAlbum[]> => {
  let albums = await db.getItem<LocalAlbum[]>('local_albums');
  if (!albums) {
    // Attempt migration of legacy single album if it exists
    const legacySpreads = await loadSpreadsFromDB();
    const legacySettings = await loadSettingsFromDB();
    if (legacySpreads.length > 0 || legacySettings.audioFile || legacySettings.coverPhoto || legacySettings.marking) {
      const migratedAlbum: LocalAlbum = {
        id: 'legacy-default',
        name: legacySettings.marking || 'My First Album',
        spreads: legacySpreads,
        settings: legacySettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      albums = [migratedAlbum];
      await db.setItem('local_albums', albums);
    } else {
      albums = [];
    }
  }
  return albums;
};

export const saveLocalAlbumsToDB = async (albums: LocalAlbum[]): Promise<void> => {
  await db.setItem('local_albums', albums);
};

const blobUrlMap = new Map<Blob, string>();
export function getBlobUrl(blob: Blob | string | null | undefined): string | null {
  if (!blob) return null;
  if (typeof blob === 'string') return blob;
  if (!blobUrlMap.has(blob)) {
    blobUrlMap.set(blob, URL.createObjectURL(blob));
  }
  return blobUrlMap.get(blob)!;
}

