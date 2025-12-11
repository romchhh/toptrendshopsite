import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';

// POST - ініціалізувати displayOrder для всіх категорій
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    // Отримуємо всі категорії, сортуючи за createdAt (старі перші)
    // Ініціалізуємо displayOrder тільки для категорій, у яких він null або undefined
    const allCategories = db.prepare(`
      SELECT id FROM categories 
      WHERE displayOrder IS NULL 
      ORDER BY createdAt ASC
    `).all() as { id: string }[];
    
    if (allCategories.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'Всі категорії вже мають displayOrder' });
    }
    
    // Знаходимо максимальний displayOrder, щоб продовжити нумерацію
    const maxOrderResult = db.prepare('SELECT MAX(displayOrder) as maxOrder FROM categories WHERE displayOrder IS NOT NULL').get() as { maxOrder: number | null };
    const startOrder = (maxOrderResult.maxOrder ?? -1) + 1;
    
    // Призначаємо displayOrder починаючи з startOrder
    allCategories.forEach((category, index) => {
      db.prepare('UPDATE categories SET displayOrder = ? WHERE id = ?').run(startOrder + index, category.id);
    });

    return NextResponse.json({ success: true, count: allCategories.length });
  } catch (error: any) {
    console.error('Error initializing category order:', error);
    return NextResponse.json(
      { error: 'Помилка ініціалізації порядку категорій', details: error.message },
      { status: 500 }
    );
  }
}

