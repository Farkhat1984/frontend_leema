# Frontend LEEMA - Fashion AI Platform

Фронтенд приложение для AI-платформы модной индустрии LEEMA.

## 📋 Описание

LEEMA - это платформа для управления модным бизнесом с интеграцией искусственного интеллекта. Фронтенд приложение предоставляет интерфейсы для трёх типов пользователей:
- **Users** - покупатели/клиенты
- **Shops** - владельцы магазинов
- **Admins** - администраторы платформы

## 🚀 Технологии

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 с CSS-переменными
- **Auth**: Google OAuth 2.0
- **WebSocket**: Real-time коммуникация
- **Server**: Nginx (production)
- **API**: RESTful API (FastAPI backend)

## 📁 Структура проекта

```
frontend_leema/
├── public/              # Публичные страницы
│   ├── index.html      # Главная страница (логин)
│   ├── auth/           # OAuth callback
│   └── payment/        # Страницы оплаты
├── user/               # Интерфейс пользователя
│   └── dashboard.html
├── shop/               # Интерфейс магазина
│   ├── index.html      # Dashboard магазина
│   ├── products/       # Управление товарами
│   ├── billing/        # Биллинг и пополнение
│   └── profile/        # Профиль магазина
├── admin/              # Административная панель
│   ├── index.html      # Admin dashboard
│   ├── users/          # Управление пользователями
│   ├── shops/          # Управление магазинами
│   ├── products/       # Управление товарами
│   └── settings/       # Настройки системы
├── assets/
│   ├── js/
│   │   ├── core/       # Основные модули
│   │   │   ├── config.js       # Конфигурация API
│   │   │   ├── websocket.js    # WebSocket клиент
│   │   │   ├── notifications.js # Уведомления
│   │   │   └── cache.js        # API кэширование
│   │   ├── shared/     # Общие утилиты
│   │   │   ├── common-utils.js # Утилиты и API
│   │   │   └── lazy-loader.js  # Lazy loading
│   │   └── pages/      # Страничные скрипты
│   └── css/
│       ├── layouts/    # Общие стили
│       └── pages/      # Страничные стили
├── docs/               # Документация
├── nginx.conf          # Конфигурация Nginx
└── package.json
```

## 🔧 Установка и запуск

### Локальная разработка

```bash
# Клонировать репозиторий
git clone https://github.com/Farkhat1984/frontend_leema.git
cd frontend_leema

# Запустить локальный сервер (любой HTTP сервер)
# Вариант 1: Python
python3 -m http.server 8080

# Вариант 2: Node.js
npx http-server -p 8080

# Открыть браузер
http://localhost:8080/public/index.html
```

### Production (Nginx)

```bash
# Скопировать файлы в директорию Nginx
sudo cp -r * /var/www/frontend_leema/

# Настроить Nginx (используйте nginx.conf из репозитория)
sudo cp nginx.conf /etc/nginx/sites-available/leema
sudo ln -s /etc/nginx/sites-available/leema /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 Конфигурация

### API Endpoints

Конфигурация в `assets/js/core/config.js`:

```javascript
// Локальная разработка
local: 'http://localhost:8000'

// Production
production: 'https://www.api.leema.kz'
```

### WebSocket

```javascript
// Локальная разработка
local: 'ws://localhost:8000/ws'

// Production
production: 'wss://www.api.leema.kz/ws'
```

### Google OAuth

```javascript
CLIENT_ID: '222819809615-cb4p93ej04cr6ur9cf5o1jjk9n6dmvuj.apps.googleusercontent.com'
```

## 📡 API Endpoints

Полный список API endpoints в `/api/v1/`:

### Авторизация
- `GET /api/v1/auth/google/url` - Получить URL для Google OAuth
- `GET /api/v1/auth/google/callback` - OAuth callback

### Пользователь
- `GET /api/v1/user/profile` - Профиль пользователя
- `PUT /api/v1/user/profile` - Обновить профиль
- `GET /api/v1/user/orders` - Заказы пользователя

### Магазин
- `GET /api/v1/shop/products/` - Товары магазина
- `POST /api/v1/shop/products/` - Создать товар
- `PUT /api/v1/shop/products/{id}` - Обновить товар
- `DELETE /api/v1/shop/products/{id}` - Удалить товар
- `POST /api/v1/shop/products/upload-images` - Загрузить изображения
- `GET /api/v1/shop/dashboard/` - Dashboard магазина
- `GET /api/v1/shop/billing/` - Биллинг информация
- `POST /api/v1/shop/billing/topup` - Пополнить баланс

### Администратор
- `GET /api/v1/admin/dashboard/` - Admin dashboard
- `GET /api/v1/admin/users/` - Список пользователей
- `GET /api/v1/admin/shops/` - Список магазинов
- `PUT /api/v1/admin/shops/{id}` - Обновить магазин
- `GET /api/v1/admin/products/` - Все товары
- `GET /api/v1/admin/settings/` - Настройки системы

### Публичные
- `GET /api/v1/products/` - Список товаров
- `GET /api/v1/categories/` - Категории

Подробная документация: [docs/ROUTE_MAP.md](docs/ROUTE_MAP.md)

## 🔄 WebSocket События

### Клиент → Сервер
- `authenticate` - Аутентификация WebSocket
- `ping` - Heartbeat ping

### Сервер → Клиент
- `authenticated` - Подтверждение авторизации
- `pong` - Heartbeat pong
- `notification` - Уведомление
- `order_update` - Обновление заказа
- `product_update` - Обновление товара
- `balance_update` - Обновление баланса

## 🎨 Стилизация

Проект использует CSS-переменные для управления темой:

```css
:root {
    --primary-color: #4a90e2;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --warning-color: #ffc107;
    /* ... и ещё 22 переменные */
}
```

## ⚡ Оптимизация производительности

### Lazy Loading
Изображения загружаются по мере необходимости:
```javascript
LazyLoader.init('.product-image');
```

### API Кэширование
Запросы кэшируются на 5 минут:
```javascript
const data = await CommonUtils.apiRequest('/api/v1/products/');
```

### Defer Scripts
Все скрипты загружаются с атрибутом `defer` для оптимизации загрузки страницы.

## 📊 Производительность

После оптимизации (Этапы 1-8):

- **FCP** (First Contentful Paint): ↓ 20-30%
- **LCP** (Largest Contentful Paint): ↓ 40-50%
- **TTI** (Time to Interactive): ↓ 15-25%
- **Сетевой трафик**: ↓ 40-60%
- **API запросы**: ↓ 70% (благодаря кэшу)

## 🔒 Безопасность

- **OAuth 2.0** для авторизации
- **JWT токены** для API
- **HTTPS/WSS** в production
- **CORS** настройка на backend
- **XSS защита** через Content Security Policy

## 🧪 Тестирование

Для тестирования API:

```bash
# Health check
curl https://www.api.leema.kz/health

# Проверка production API
curl https://www.api.leema.kz/api/v1/products/
```

## 📝 История изменений

### Этапы рефакторинга (2025-10-17)

- **Этап 1**: Удаление console.log (204 → 0)
- **Этап 2**: Очистка комментариев
- **Этап 3**: Удаление временных файлов
- **Этап 4**: Оптимизация структуры кода (-150 строк дублирования)
- **Этап 5**: CSS оптимизация (-16.6% размера)
- **Этап 6**: HTML оптимизация (-3 файла, -17.7% строк)
- **Этап 7**: Проверка URL и редиректов
- **Этап 8**: Оптимизация производительности
- **Этап 9**: Финальное тестирование
- **Этап 10**: Документация

Детали: см. файлы `STAGE*_REPORT.md`

## 📞 Контакты

- **Репозиторий**: https://github.com/Farkhat1984/frontend_leema
- **API**: https://www.api.leema.kz
- **Frontend**: https://www.leema.kz

## 📄 Лицензия

Proprietary - All rights reserved
