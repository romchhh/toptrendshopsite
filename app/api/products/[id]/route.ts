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
    const { name, url, telegramUrl, description, accent, backgroundImage, price, oldPrice, discountPercent, category, isNew, displayOrder } = body;

    console.log('Updating product:', id, 'Background image:', backgroundImage, 'isNew:', isNew, 'displayOrder:', displayOrder);

    // Завжди зберігаємо displayOrder - якщо передано, використовуємо його, інакше залишаємо поточне значення
    // Спочатку отримуємо поточний displayOrder
    const currentProduct = db.prepare('SELECT displayOrder FROM products WHERE id = ?').get(id) as { displayOrder: number | null } | undefined;
    const finalDisplayOrder = displayOrder !== undefined && displayOrder !== null ? displayOrder : (currentProduct?.displayOrder ?? 0);

    db.prepare(`
      UPDATE products
      SET name = ?, url = ?, telegramUrl = ?, emoji = ?, description = ?, accent = ?, backgroundImage = ?, price = ?, oldPrice = ?, discountPercent = ?, category = ?, isNew = ?, displayOrder = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, url, telegramUrl || null, '📦', description, accent || null, backgroundImage || null, price || null, oldPrice || null, discountPercent || null, category || null, isNew ? 1 : 0, finalDisplayOrder, id);

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

