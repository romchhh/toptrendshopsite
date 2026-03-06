# Список ПО для встановлення на віртуалку

## Основний стек

### Node.js та менеджер пакетів
- **Node.js**: версія 18.x або 20.x (рекомендовано 20.x LTS)
- **npm**: йде в комплекті з Node.js (або можна використовувати yarn/pnpm)

### База даних
- **SQLite**: версія 3.x (встановлюється автоматично через better-sqlite3)
- **better-sqlite3**: версія 12.5.0 (встановлюється через npm)

### Веб-сервер та бекенд
- **Next.js**: версія 16.0.7 (встановлюється через npm)
- Вбудований веб-сервер Next.js (не потребує окремого Nginx/Apache для розробки)

## Залежності проекту (встановляються через npm install)

### Production залежності:
- next: 16.0.7
- react: 19.2.0
- react-dom: 19.2.0
- better-sqlite3: 12.5.0
- bcryptjs: 3.0.3
- jose: 6.1.3
- sharp: 0.34.5
- lucide-react: 0.556.0

### Dev залежності:
- typescript: ^5
- eslint: ^9
- eslint-config-next: 16.0.7
- tailwindcss: ^4
- @tailwindcss/postcss: ^4

## Системні залежності (для better-sqlite3 та sharp)

### Для Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install -y build-essential python3
```

### Для macOS:
```bash
xcode-select --install
```

## Команди для встановлення

1. Встановити Node.js (якщо ще не встановлено):
```bash
# Через nvm (рекомендовано)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Або через офіційний інсталятор з nodejs.org
```

2. Клонувати/завантажити проект та встановити залежності:
```bash
cd /path/to/toptrendshop
npm install
```

3. Запустити проект:
```bash
# Розробка
npm run dev

# Production
npm run build
npm start
```

## Порт
Додаток працює на порту **3001** (налаштовано в package.json)

## Додаткові зауваження
- SQLite - файлова БД, не потребує окремого сервера
- Next.js має вбудований веб-сервер для production
- Для production можна використовувати PM2 для процес-менеджменту
- Для production також можна налаштувати Nginx як reverse proxy перед Next.js

