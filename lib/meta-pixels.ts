import db from '@/lib/db';

export interface MetaPixel {
  id: string;
  name: string | null;
  pixelId: string;
  enabled: number;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export function getEnabledMetaPixels(): MetaPixel[] {
  return db
    .prepare(
      'SELECT * FROM meta_pixels WHERE enabled = 1 ORDER BY displayOrder ASC, createdAt ASC'
    )
    .all() as MetaPixel[];
}

export function getAllMetaPixels(): MetaPixel[] {
  return db
    .prepare('SELECT * FROM meta_pixels ORDER BY displayOrder ASC, createdAt ASC')
    .all() as MetaPixel[];
}

export function normalizePixelId(value: string): string {
  return value.trim().replace(/\D/g, '');
}
