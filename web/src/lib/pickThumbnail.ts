interface ImageLike {
  isThumbnail: boolean;
  thumbnailMode?: string | null;
}

export function pickThumbnail<T extends ImageLike>(images: T[], isDark: boolean): T | undefined {
  const targetMode = isDark ? 'DARK' : 'LIGHT';
  const modeSpecific = images.find(i => i.isThumbnail && i.thumbnailMode === targetMode);
  const both = images.find(i => i.isThumbnail && (i.thumbnailMode === 'BOTH' || !i.thumbnailMode));
  return modeSpecific || both || images.find(i => i.isThumbnail) || images[0];
}
