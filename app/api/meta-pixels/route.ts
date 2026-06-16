import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';
import { getAllMetaPixels, normalizePixelId } from '@/lib/meta-pixels';

// GET - отримати пікселі (для адмінки - всі, для публіки - тільки активні)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    const all = request.nextUrl.searchParams.get('all') === '1';

    if (all) {
      if (!user) {
        return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
      }
      return NextResponse.json(getAllMetaPixels());
    }

    const pixels = db
      .prepare(
        'SELECT id, name, pixelId, enabled, displayOrder FROM meta_pixels WHERE enabled = 1 ORDER BY displayOrder ASC, createdAt ASC'
      )
      .all();

    return NextResponse.json(pixels);
  } catch (error) {
    return NextResponse.json(
      { error: 'Помилка отримання пікселів' },
      { status: 500 }
    );
  }
}

// POST - додати піксель
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    const body = await request.json();
    const { name, pixelId, enabled } = body;
    const normalizedPixelId = normalizePixelId(pixelId || '');

    if (!normalizedPixelId) {
      return NextResponse.json(
        { error: 'Вкажіть коректний Pixel ID' },
        { status: 400 }
      );
    }

    const minOrderResult = db
      .prepare('SELECT MIN(displayOrder) as minOrder FROM meta_pixels')
      .get() as { minOrder: number | null };
    const newDisplayOrder = (minOrderResult.minOrder ?? 0) - 1;
    const id = `pixel_${Date.now()}`;

    db.prepare(`
      INSERT INTO meta_pixels (id, name, pixelId, enabled, displayOrder)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      name?.trim() || null,
      normalizedPixelId,
      enabled === false ? 0 : 1,
      newDisplayOrder
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'Піксель з таким ID вже існує' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Помилка створення пікселя', details: error.message },
      { status: 500 }
    );
  }
}
