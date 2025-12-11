import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';

// POST - ініціалізувати displayOrder для всіх товарів
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    // Отримуємо всі товари, сортуючи за createdAt (старі перші)
    // Ініціалізуємо displayOrder тільки для товарів, у яких він null або undefined
    const allProducts = db.prepare(`
      SELECT id FROM products 
      WHERE displayOrder IS NULL 
      ORDER BY createdAt ASC
    `).all() as { id: string }[];
    
    if (allProducts.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'Всі товари вже мають displayOrder' });
    }
    
    // Знаходимо максимальний displayOrder, щоб продовжити нумерацію
    const maxOrderResult = db.prepare('SELECT MAX(displayOrder) as maxOrder FROM products WHERE displayOrder IS NOT NULL').get() as { maxOrder: number | null };
    const startOrder = (maxOrderResult.maxOrder ?? -1) + 1;
    
    // Призначаємо displayOrder починаючи з startOrder
    allProducts.forEach((p, index) => {
      db.prepare('UPDATE products SET displayOrder = ? WHERE id = ?').run(startOrder + index, p.id);
    });

    return NextResponse.json({ success: true, count: allProducts.length });
  } catch (error: any) {
    console.error('Error initializing product order:', error);
    return NextResponse.json(
      { error: 'Помилка ініціалізації порядку товарів', details: error.message },
      { status: 500 }
    );
  }
}

