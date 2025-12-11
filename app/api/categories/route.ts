import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';

// GET - отримати всі категорії
export async function GET() {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY displayOrder ASC, name ASC').all();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: 'Помилка отримання категорій' },
      { status: 500 }
    );
  }
}

// POST - створити нову категорію
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, image } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID та назва є обов\'язковими полями' },
        { status: 400 }
      );
    }

    // Отримуємо мінімальний displayOrder і віднімаємо 1, щоб нова категорія була зверху
    const minOrderResult = db.prepare('SELECT MIN(displayOrder) as minOrder FROM categories').get() as { minOrder: number | null };
    const newDisplayOrder = (minOrderResult.minOrder ?? 0) - 1;

    db.prepare(`
      INSERT INTO categories (id, name, description, image, displayOrder)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, description || null, image || null, newDisplayOrder);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return NextResponse.json(
        { error: 'Категорія з таким ID вже існує' },
        { status: 400 }
      );
    }
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'Категорія з такою назвою вже існує' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Помилка створення категорії', details: error.message },
      { status: 500 }
    );
  }
}

