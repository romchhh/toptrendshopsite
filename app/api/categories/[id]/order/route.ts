import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthUser } from '@/lib/middleware-auth';

// PUT - змінити порядок категорії (вверх/вниз)
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

    // Отримуємо поточну категорію
    const currentCategory = db.prepare('SELECT displayOrder FROM categories WHERE id = ?').get(id) as { displayOrder: number } | undefined;
    if (!currentCategory) {
      return NextResponse.json({ error: 'Категорію не знайдено' }, { status: 404 });
    }

    const currentOrder = currentCategory.displayOrder || 0;

    if (direction === 'up') {
      // Знаходимо категорію з найближчим меншим displayOrder
      const prevCategory = db.prepare(`
        SELECT id, displayOrder FROM categories 
        WHERE displayOrder < ? 
        ORDER BY displayOrder DESC 
        LIMIT 1
      `).get(currentOrder) as { id: string; displayOrder: number } | undefined;

      if (prevCategory) {
        // Міняємо місцями порядок
        const tempOrder = prevCategory.displayOrder;
        db.prepare('UPDATE categories SET displayOrder = ? WHERE id = ?').run(tempOrder, id);
        db.prepare('UPDATE categories SET displayOrder = ? WHERE id = ?').run(currentOrder, prevCategory.id);
      }
    } else {
      // direction === 'down'
      // Знаходимо категорію з найближчим більшим displayOrder
      const nextCategory = db.prepare(`
        SELECT id, displayOrder FROM categories 
        WHERE displayOrder > ? 
        ORDER BY displayOrder ASC 
        LIMIT 1
      `).get(currentOrder) as { id: string; displayOrder: number } | undefined;

      if (nextCategory) {
        // Міняємо місцями порядок
        const tempOrder = nextCategory.displayOrder;
        db.prepare('UPDATE categories SET displayOrder = ? WHERE id = ?').run(tempOrder, id);
        db.prepare('UPDATE categories SET displayOrder = ? WHERE id = ?').run(currentOrder, nextCategory.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating category order:', error);
    return NextResponse.json(
      { error: 'Помилка зміни порядку категорії', details: error.message },
      { status: 500 }
    );
  }
}

