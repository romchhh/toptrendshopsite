import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';

// PUT - оновити продукт
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
    const { name, url, telegramUrl, description, accent, backgroundImage } = body;

    console.log('Updating product:', id, 'Background image:', backgroundImage);

    db.prepare(`
      UPDATE products 
      SET name = ?, url = ?, telegramUrl = ?, emoji = ?, description = ?, accent = ?, backgroundImage = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, url, telegramUrl || null, '📦', description, accent || null, backgroundImage || null, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Помилка оновлення продукту', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - видалити продукт
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
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Помилка видалення продукту' },
      { status: 500 }
    );
  }
}

