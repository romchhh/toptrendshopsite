import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
const dbDir = path.dirname(dbPath);

// Створюємо директорію якщо не існує
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Ініціалізація БД
export function initDatabase() {
  // Таблиця продуктів
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      telegramUrl TEXT,
      emoji TEXT NOT NULL,
      description TEXT NOT NULL,
      accent TEXT NOT NULL,
      backgroundImage TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Перевірка чи є продукти, якщо ні - додаємо початкові дані
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  
  if (count.count === 0) {
    const products = [
      { id: '1', name: 'Trekil', url: 'https://trekil.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/trekillattechispace', emoji: '🎯', description: 'Преміум якість', accent: 'hover:bg-blue-50' },
      { id: '2', name: 'Emal', url: 'https://emal.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/emallattechispace', emoji: '✨', description: 'Топ продаж', accent: 'hover:bg-purple-50' },
      { id: '3', name: 'Rustof', url: 'https://rustof.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/rustoflattechispace', emoji: '🔥', description: 'Гаряча ціна', accent: 'hover:bg-orange-50' },
      { id: '4', name: 'Hold', url: 'https://hold.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/holdlattechispace', emoji: '💎', description: 'Преміум вибір', accent: 'hover:bg-cyan-50' },
      { id: '5', name: 'Pover', url: 'https://pover.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/poverlattechispace', emoji: '⚡', description: 'Швидка доставка', accent: 'hover:bg-yellow-50' },
      { id: '6', name: 'Valgus', url: 'https://valgus.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/valguslattechispace', emoji: '💫', description: 'Новинка', accent: 'hover:bg-pink-50' },
      { id: '7', name: 'LED', url: 'https://led.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/ledlattechispace', emoji: '💡', description: 'Освітлення', accent: 'hover:bg-amber-50' },
      { id: '8', name: 'LEDD', url: 'https://ledd.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/leddlattechispace', emoji: '🌟', description: 'Яскраве світло', accent: 'hover:bg-lime-50' },
      { id: '9', name: 'Pover50', url: 'https://pover50.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/pover50lattechispace', emoji: '⚡', description: 'Потужність 50W', accent: 'hover:bg-indigo-50' },
      { id: '10', name: 'Shav', url: 'https://shav.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/shavlattechispace', emoji: '✂️', description: 'Догляд', accent: 'hover:bg-teal-50' },
      { id: '11', name: 'Pod', url: 'https://pod.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/podlattechispace', emoji: '🎧', description: 'Аудіо преміум', accent: 'hover:bg-violet-50' },
      { id: '12', name: 'Podu', url: 'https://podu.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/podulattechispace', emoji: '🎵', description: 'Музика скрізь', accent: 'hover:bg-fuchsia-50' },
      { id: '13', name: '12V', url: 'https://12v.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/12vlattechispace', emoji: '🔋', description: 'Живлення 12V', accent: 'hover:bg-emerald-50' },
      { id: '14', name: 'Pet', url: 'https://t.me/TopTrendShopBot/petlattechispace', telegramUrl: 'https://t.me/TopTrendShopBot/petlattechispace', emoji: '🐾', description: 'Для улюбленців', accent: 'hover:bg-rose-50' },
      { id: '15', name: 'Fon', url: 'https://fon.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/fonlattechispace', emoji: '📱', description: 'Мобільні аксесуари', accent: 'hover:bg-sky-50' },
      { id: '16', name: 'LEDF', url: 'https://ledf.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/ledflattechispace', emoji: '💡', description: 'LED ліхтар', accent: 'hover:bg-orange-50' },
      { id: '17', name: 'Feya', url: 'https://feya.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/feyalattechispace', emoji: '🧚', description: 'Магічний вибір', accent: 'hover:bg-pink-50' },
      { id: '18', name: 'Fonar', url: 'https://fonar.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/fonarlattechispace', emoji: '🔦', description: 'Потужний ліхтар', accent: 'hover:bg-yellow-50' },
      { id: '19', name: 'Tap', url: 'https://tap.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/taplattechispace', emoji: '💧', description: 'Сантехніка', accent: 'hover:bg-blue-50' },
      { id: '20', name: 'Kul', url: 'https://kul.lattechi.space', telegramUrl: 't.me/TopTrendShopBot/kullattechispace', emoji: '🎁', description: 'Подарунки', accent: 'hover:bg-red-50' },
    ];

    const insert = db.prepare(`
      INSERT INTO products (id, name, url, telegramUrl, emoji, description, accent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((products) => {
      for (const product of products) {
        insert.run(
          product.id,
          product.name,
          product.url,
          product.telegramUrl,
          product.emoji,
          product.description,
          product.accent
        );
      }
    });

    insertMany(products);
  }
}

// Ініціалізуємо БД при імпорті
initDatabase();

export default db;

