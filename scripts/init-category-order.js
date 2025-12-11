// Скрипт для ініціалізації displayOrder для всіх категорій
// Запускати: node scripts/init-category-order.js

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
  const tableInfo = db.prepare("PRAGMA table_info(categories)").all();
  const hasDisplayOrder = tableInfo.some(col => col.name === 'displayOrder');
  
  if (!hasDisplayOrder) {
    console.log('Додаємо колонку displayOrder до таблиці categories...');
    db.exec('ALTER TABLE categories ADD COLUMN displayOrder INTEGER DEFAULT 0');
  }

  // Отримуємо всі категорії
  const allCategories = db.prepare('SELECT id FROM categories ORDER BY createdAt ASC').all();
  
  console.log(`Знайдено ${allCategories.length} категорій`);
  
  // Знаходимо максимальний displayOrder
  const maxOrderResult = db.prepare('SELECT MAX(displayOrder) as maxOrder FROM categories WHERE displayOrder IS NOT NULL').get();
  const maxOrder = maxOrderResult?.maxOrder ?? -1;
  
  console.log(`Максимальний displayOrder: ${maxOrder}`);
  
  // Ініціалізуємо displayOrder для категорій, які мають null або 0
  let updated = 0;
  allCategories.forEach((category, index) => {
    const current = db.prepare('SELECT displayOrder FROM categories WHERE id = ?').get(category.id);
    
    if (current.displayOrder === null || current.displayOrder === undefined || current.displayOrder === 0) {
      const newOrder = maxOrder + 1 + index;
      db.prepare('UPDATE categories SET displayOrder = ? WHERE id = ?').run(newOrder, category.id);
      updated++;
      console.log(`Оновлено категорію ${category.id}: displayOrder = ${newOrder}`);
    }
  });
  
  console.log(`\nГотово! Оновлено ${updated} категорій.`);
  
} catch (error) {
  console.error('Помилка:', error);
  process.exit(1);
} finally {
  db.close();
}

