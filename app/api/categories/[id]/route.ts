import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';

// PUT - оновити категорію
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
    const { name, description, image } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Назва є обов\'язковим полем' },
        { status: 400 }
      );
    }

    db.prepare(`
      UPDATE categories 
      SET name = ?, description = ?, image = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description || null, image || null, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'Категорія з такою назвою вже існує' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Помилка оновлення категорії', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - видалити категорію
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
    
    // Перевіряємо чи є товари з цією категорією
    const productsWithCategory = db.prepare('SELECT COUNT(*) as count FROM products WHERE category = (SELECT name FROM categories WHERE id = ?)').get(id) as { count: number };
    
    if (productsWithCategory.count > 0) {
      return NextResponse.json(
        { error: `Неможливо видалити категорію: є ${productsWithCategory.count} товарів з цією категорією` },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Помилка видалення категорії' },
      { status: 500 }
    );
  }
}

