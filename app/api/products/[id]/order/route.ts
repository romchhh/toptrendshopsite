import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';

// PUT - змінити порядок товару (вверх/вниз)
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
    const { direction } = body; // 'up' або 'down'

    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json(
        { error: 'Невірний напрямок. Використовуйте "up" або "down"' },
        { status: 400 }
      );
    }

    // Отримуємо поточний товар
    const currentProduct = db.prepare('SELECT displayOrder FROM products WHERE id = ?').get(id) as { displayOrder: number | null } | undefined;
    if (!currentProduct) {
      return NextResponse.json({ error: 'Товар не знайдено' }, { status: 404 });
    }

    // Якщо displayOrder null, спочатку ініціалізуємо для всіх товарів
    if (currentProduct.displayOrder === null || currentProduct.displayOrder === undefined) {
      const allProductsNull = db.prepare('SELECT COUNT(*) as count FROM products WHERE displayOrder IS NULL').get() as { count: number };
      if (allProductsNull.count > 0) {
        // Ініціалізуємо displayOrder для всіх товарів
        const allProducts = db.prepare('SELECT id FROM products ORDER BY createdAt ASC').all() as { id: string }[];
        const maxOrderResult = db.prepare('SELECT MAX(displayOrder) as maxOrder FROM products WHERE displayOrder IS NOT NULL').get() as { maxOrder: number | null };
        const startOrder = (maxOrderResult.maxOrder ?? -1) + 1;
        
        allProducts.forEach((p, index) => {
          const existingOrder = db.prepare('SELECT displayOrder FROM products WHERE id = ?').get(p.id) as { displayOrder: number | null };
          if (existingOrder.displayOrder === null || existingOrder.displayOrder === undefined) {
            db.prepare('UPDATE products SET displayOrder = ? WHERE id = ?').run(startOrder + index, p.id);
          }
        });
        
        // Оновлюємо currentProduct
        const updatedProduct = db.prepare('SELECT displayOrder FROM products WHERE id = ?').get(id) as { displayOrder: number };
        currentProduct.displayOrder = updatedProduct.displayOrder;
      }
    }

    // Отримуємо всі товари, відсортовані за displayOrder
    const allProducts = db.prepare(`
      SELECT id, displayOrder FROM products 
      ORDER BY COALESCE(displayOrder, 999999) ASC, createdAt DESC
    `).all() as { id: string; displayOrder: number | null }[];

    // Знаходимо поточний індекс товару
    const currentIndex = allProducts.findIndex(p => p.id === id);
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Товар не знайдено в списку' }, { status: 404 });
    }

    const currentOrder = currentProduct.displayOrder ?? currentIndex;

    if (direction === 'up') {
      if (currentIndex === 0) {
        // Вже перший, нічого не робимо
        return NextResponse.json({ success: true });
      }
      
      // Знаходимо попередній товар
      const prevProduct = allProducts[currentIndex - 1];
      const prevOrder = prevProduct.displayOrder ?? (currentIndex - 1);
      
      // Міняємо місцями порядок
      db.prepare('UPDATE products SET displayOrder = ? WHERE id = ?').run(prevOrder, id);
      db.prepare('UPDATE products SET displayOrder = ? WHERE id = ?').run(currentOrder, prevProduct.id);
    } else {
      // direction === 'down'
      if (currentIndex === allProducts.length - 1) {
        // Вже останній, нічого не робимо
        return NextResponse.json({ success: true });
      }
      
      // Знаходимо наступний товар
      const nextProduct = allProducts[currentIndex + 1];
      const nextOrder = nextProduct.displayOrder ?? (currentIndex + 1);
      
      // Міняємо місцями порядок
      db.prepare('UPDATE products SET displayOrder = ? WHERE id = ?').run(nextOrder, id);
      db.prepare('UPDATE products SET displayOrder = ? WHERE id = ?').run(currentOrder, nextProduct.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating product order:', error);
    return NextResponse.json(
      { error: 'Помилка зміни порядку товару', details: error.message },
      { status: 500 }
    );
  }
}

