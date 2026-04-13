/**
 * Pick the best image path from a device's images array.
 *
 * Priority for thumbnails: LIGHT → DARK → BOTH → first image overall.
 */
export interface ImageRef {
  path: string;
  isThumbnail?: boolean;
  thumbnailMode?: string | null;
}

export function pickThumbnail(images: ImageRef[]): string | null {
  if (!images || images.length === 0) return null;

  const thumbs = images.filter((i) => i.isThumbnail);

  if (thumbs.length > 0) {
    return (
      thumbs.find((i) => i.thumbnailMode === 'LIGHT')?.path ??
      thumbs.find((i) => i.thumbnailMode === 'DARK')?.path ??
      thumbs.find((i) => i.thumbnailMode === 'BOTH')?.path ??
      thumbs[0].path
    );
  }

  return images[0]?.path ?? null;
}
