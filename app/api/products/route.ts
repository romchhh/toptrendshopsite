import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';

// GET - отримати всі продукти
export async function GET() {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY createdAt DESC').all();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'Помилка отримання продуктів' },
      { status: 500 }
    );
  }
}

// POST - створити новий продукт
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, url, telegramUrl, emoji, description, accent, backgroundImage } = body;

    db.prepare(`
      INSERT INTO products (id, name, url, telegramUrl, emoji, description, accent, backgroundImage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, url, telegramUrl || null, emoji, description, accent, backgroundImage || null);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return NextResponse.json(
        { error: 'Продукт з таким ID вже існує' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Помилка створення продукту' },
      { status: 500 }
    );
  }
}

