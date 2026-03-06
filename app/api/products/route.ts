import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';

// GET - отримати всі продукти
export async function GET() {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY displayOrder ASC, createdAt DESC').all();
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
    const { id, name, url, telegramUrl, description, accent, backgroundImage, price, oldPrice, discountPercent, category, isNew } = body;

    // Валідація обов'язкових полів
    if (!id || !name || !url) {
      return NextResponse.json(
        { error: 'Обов\'язкові поля: ID, Назва, URL' },
        { status: 400 }
      );
    }

    console.log('Creating product:', { id, name, url, accent: accent || 'hover:bg-blue-50', isNew });

    // Отримуємо мінімальний displayOrder і віднімаємо 1, щоб новий товар був зверху
    const minOrderResult = db.prepare('SELECT MIN(displayOrder) as minOrder FROM products').get() as { minOrder: number | null };
    const newDisplayOrder = (minOrderResult.minOrder ?? 0) - 1;

    db.prepare(`
      INSERT INTO products (id, name, url, telegramUrl, emoji, description, accent, backgroundImage, price, oldPrice, discountPercent, category, isNew, displayOrder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      url,
      telegramUrl || null,
      '📦', 
      description || '', 
      accent || 'hover:bg-blue-50', 
      backgroundImage || null,
      price || null,
      oldPrice || null,
      discountPercent || null,
      category || null,
      isNew ? 1 : 0,
      newDisplayOrder
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return NextResponse.json(
        { error: 'Продукт з таким ID вже існує' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Помилка створення продукту', details: error.message },
      { status: 500 }
    );
  }
}

