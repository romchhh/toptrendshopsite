import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';
import { normalizePixelId } from '@/lib/meta-pixels';

// PUT - оновити піксель
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, pixelId, enabled } = body;
    const normalizedPixelId = normalizePixelId(pixelId || '');

    if (!normalizedPixelId) {
      return NextResponse.json(
        { error: 'Вкажіть коректний Pixel ID' },
        { status: 400 }
      );
    }

    db.prepare(`
      UPDATE meta_pixels
      SET name = ?, pixelId = ?, enabled = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name?.trim() || null,
      normalizedPixelId,
      enabled === false ? 0 : 1,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'Піксель з таким ID вже існує' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Помилка оновлення пікселя', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - видалити піксель
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    const { id } = await params;
    db.prepare('DELETE FROM meta_pixels WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Помилка видалення пікселя' },
      { status: 500 }
    );
  }
}
