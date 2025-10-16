# URL Mapping - Новые пути проекта

## 📋 Активные URL после очистки

### Публичные страницы (Public)

| URL | Описание |
|-----|----------|
| `/` | Автоматический редирект на `/public/index.html` |
| `/public/index.html` | Страница входа |
| `/public/auth/callback.html` | OAuth callback |
| `/public/payment/success.html` | Успешный платеж |
| `/public/payment/cancel.html` | Отмененный платеж |

### Пользователь (User)

| URL | Описание |
|-----|----------|
| `/user/dashboard.html` | Дашборд пользователя |

### Магазин (Shop)

| URL | Описание |
|-----|----------|
| `/shop` | Автоматический редирект на `/shop/index.html` |
| `/shop/index.html` | Dashboard магазина |
| `/shop/products` | Автоматический редирект на `/shop/products/index.html` |
| `/shop/products/index.html` | Управление товарами |
| `/shop/billing` | Автоматический редирект на `/shop/billing/index.html` |
| `/shop/billing/index.html` | Биллинг и транзакции |
| `/shop/billing/topup.html` | Пополнение баланса |
| `/shop/profile` | Автоматический редирект на `/shop/profile/index.html` |
| `/shop/profile/index.html` | Профиль магазина |

### Администратор (Admin)

| URL | Описание |
|-----|----------|
| `/admin` | Автоматический редирект на `/admin/index.html` |
| `/admin/index.html` | Admin dashboard |
| `/admin/products` | Автоматический редирект на `/admin/products/index.html` |
| `/admin/products/index.html` | Управление товарами (модерация) |
| `/admin/shops` | Автоматический редирект на `/admin/shops/index.html` |
| `/admin/shops/index.html` | Управление магазинами |
| `/admin/users` | Автоматический редирект на `/admin/users/index.html` |
| `/admin/users/index.html` | Управление пользователями |
| `/admin/settings` | Автоматический редирект на `/admin/settings/index.html` |
| `/admin/settings/index.html` | Настройки системы |

---

## 🎯 Рекомендуемые пути для кода

### JavaScript константы:

```javascript
// Публичные страницы
const LOGIN_URL = '/public/index.html';
const CALLBACK_URL = '/public/auth/callback.html';
const SUCCESS_URL = '/public/payment/success.html';
const CANCEL_URL = '/public/payment/cancel.html';

// Пользователь
const USER_DASHBOARD = '/user/dashboard.html';

// Магазин
const SHOP_DASHBOARD = '/shop/index.html';
const SHOP_PRODUCTS = '/shop/products/index.html';
const SHOP_BILLING = '/shop/billing/index.html';
const SHOP_TOPUP = '/shop/billing/topup.html';
const SHOP_PROFILE = '/shop/profile/index.html';

// Админ
const ADMIN_DASHBOARD = '/admin/index.html';
const ADMIN_PRODUCTS = '/admin/products/index.html';
const ADMIN_SHOPS = '/admin/shops/index.html';
const ADMIN_USERS = '/admin/users/index.html';
const ADMIN_SETTINGS = '/admin/settings/index.html';
```

---

## 📁 Структура файлов

```
/var/www/frontend_leema/
│
├── public/
│   ├── index.html                    # Вход в систему
│   ├── auth/
│   │   └── callback.html             # OAuth callback
│   └── payment/
│       ├── success.html              # Успешный платеж
│       └── cancel.html               # Отмененный платеж
│
├── user/
│   └── dashboard.html                # Дашборд пользователя
│
├── shop/
│   ├── index.html                    # Dashboard магазина
│   ├── products/
│   │   └── index.html                # Управление товарами
│   ├── billing/
│   │   ├── index.html                # Биллинг
│   │   └── topup.html                # Пополнение баланса
│   └── profile/
│       └── index.html                # Профиль магазина
│
├── admin/
│   ├── index.html                    # Admin dashboard
│   ├── products/
│   │   └── index.html                # Модерация товаров
│   ├── shops/
│   │   └── index.html                # Управление магазинами
│   ├── users/
│   │   └── index.html                # Управление пользователями
│   └── settings/
│       └── index.html                # Настройки системы
│
└── assets/
    ├── css/
    │   ├── layouts/
    │   │   ├── style.css             # Главные стили
    │   │   └── auth.css              # Стили авторизации
    │   └── pages/
    │       ├── shop.css              # Стили магазина
    │       └── payment.css           # Стили платежей
    │
    └── js/
        ├── core/
        │   ├── config.js             # Конфигурация API
        │   ├── auth.js               # Авторизация
        │   ├── websocket.js          # WebSocket
        │   └── notifications.js      # Уведомления
        ├── pages/
        │   ├── public/
        │   │   └── login.js          # Логика входа
        │   ├── shop/
        │   │   ├── dashboard.js      # Shop dashboard
        │   │   └── topup.js          # Пополнение
        │   └── admin/
        │       ├── dashboard.js      # Admin dashboard
        │       ├── products.js       # Модерация товаров
        │       ├── shops.js          # Управление магазинами
        │       ├── users.js          # Управление пользователями
        │       └── settings.js       # Настройки
        └── shared/
            └── common.js             # Общий функционал
```

---

## 🔧 Конфигурация Nginx

### Основные правила:
- `/` → редирект на `/public/index.html`
- `/shop` → редирект на `/shop/index.html`
- `/admin` → редирект на `/admin/index.html`
- `/user` → редирект на `/user/dashboard.html`
- Все папки поддерживают автоматический `index.html`

### Кеширование:
- **Static assets** (js, css, images): 1 год
- **HTML файлы**: no-cache

---

## 🚀 Запуск проекта

### Development
```bash
cd /var/www/frontend_leema
npm run dev
# Откройте: http://localhost:3000
```

### Production (Docker)
```bash
cd /var/www/frontend_leema/docker
docker-compose up -d
# Откройте: http://localhost:80
```

---

## 📝 Навигация в приложении

### После авторизации:
- **User** → `/user/dashboard.html`
- **Shop** → `/shop/index.html`
- **Admin** → `/admin/index.html`

### Из shop dashboard:
- Товары → `/shop/products/index.html`
- Биллинг → `/shop/billing/index.html`
- Пополнить → `/shop/billing/topup.html`
- Профиль → `/shop/profile/index.html`

### Из admin dashboard:
- Товары → `/admin/products/index.html`
- Магазины → `/admin/shops/index.html`
- Пользователи → `/admin/users/index.html`
- Настройки → `/admin/settings/index.html`

---

## ✅ Статус

- ✅ Старые файлы удалены
- ✅ Работают только новые пути
- ✅ Nginx настроен для новой структуры
- ✅ Автоматические редиректы на index.html
- ✅ Кеширование настроено
- ✅ Структура чистая и организованная

---

**Обновлено:** 2025-10-16  
**Статус:** Активная структура, старые файлы удалены

