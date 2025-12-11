// Скрипт для ініціалізації displayOrder для всіх товарів
// Запускати: node scripts/init-product-order.js

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

if (!fs.existsSync(dbPath)) {
  console.error('База даних не знайдена:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

try {
  // Перевіряємо чи є колонка displayOrder
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const hasDisplayOrder = tableInfo.some(col => col.name === 'displayOrder');
  
  if (!hasDisplayOrder) {
    console.log('Додаємо колонку displayOrder...');
    db.exec('ALTER TABLE products ADD COLUMN displayOrder INTEGER DEFAULT 0');
  }

  // Отримуємо всі товари
  const allProducts = db.prepare('SELECT id FROM products ORDER BY createdAt ASC').all();
  
  console.log(`Знайдено ${allProducts.length} товарів`);
  
  // Знаходимо максимальний displayOrder
  const maxOrderResult = db.prepare('SELECT MAX(displayOrder) as maxOrder FROM products WHERE displayOrder IS NOT NULL').get();
  const maxOrder = maxOrderResult?.maxOrder ?? -1;
  
  console.log(`Максимальний displayOrder: ${maxOrder}`);
  
  // Ініціалізуємо displayOrder для товарів, які мають null або 0
  let updated = 0;
  allProducts.forEach((product, index) => {
    const current = db.prepare('SELECT displayOrder FROM products WHERE id = ?').get(product.id);
    
    if (current.displayOrder === null || current.displayOrder === undefined || current.displayOrder === 0) {
      const newOrder = maxOrder + 1 + index;
      db.prepare('UPDATE products SET displayOrder = ? WHERE id = ?').run(newOrder, product.id);
      updated++;
      console.log(`Оновлено товар ${product.id}: displayOrder = ${newOrder}`);
    }
  });
  
  console.log(`\nГотово! Оновлено ${updated} товарів.`);
  
} catch (error) {
  console.error('Помилка:', error);
  process.exit(1);
} finally {
  db.close();
}

