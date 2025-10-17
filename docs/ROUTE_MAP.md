# Fashion AI Platform - Route Map

**Версия:** 1.0  
**Дата:** 2025-10-17

---

## 📍 Структура маршрутов

### Public Routes (Публичные страницы)

#### 1. Login Page
- **URL:** `/public/index.html`
- **Назначение:** Главная страница авторизации через Google OAuth
- **Функции:**
  - Выбор типа аккаунта (user/shop/admin)
  - Инициация OAuth flow
- **Редиректы:**
  - User → `/user/dashboard.html`
  - Shop → `/shop/index.html`
  - Admin → `/admin/index.html`
- **Скрипты:** config.js, auth.js, login.js

#### 2. OAuth Callback
- **URL:** `/public/auth/callback.html`
- **Назначение:** Обработка OAuth ответа от Google
- **Функции:**
  - Получение токена от бэкенда
  - Сохранение в localStorage
  - Редирект на соответствующий дашборд
- **Скрипты:** config.js, inline callback handler

#### 3. Payment Success
- **URL:** `/public/payment/success.html`
- **Назначение:** Обработка успешного PayPal платежа
- **Функции:**
  - Capture PayPal payment
  - Обновление баланса
  - Редирект обратно
- **API:** `POST /api/v1/payments/capture/{token}`

#### 4. Payment Cancel
- **URL:** `/public/payment/cancel.html`
- **Назначение:** Обработка отмены платежа
- **Функции:**
  - Информирование пользователя
  - Редирект обратно

---

### User Routes (Пользовательские страницы)

#### 1. User Index
- **URL:** `/user/index.html`
- **Назначение:** Автоматический редирект на dashboard
- **Редирект:** → `/user/dashboard.html`

#### 2. User Dashboard
- **URL:** `/user/dashboard.html`
- **Назначение:** Каталог продуктов с функцией примерки
- **Функции:**
  - Просмотр всех товаров
  - Поиск и фильтрация
  - Try-on функция (AI примерка)
  - Пагинация
- **API:**
  - `GET /api/v1/users/me` - информация о пользователе
  - `GET /api/v1/users/me/balance` - баланс пользователя
- **Скрипты:** config.js, auth.js

---

### Shop Routes (Страницы магазина)

#### 1. Shop Dashboard
- **URL:** `/shop/index.html`
- **Назначение:** Главный дашборд магазина
- **Функции:**
  - Статистика (товары, просмотры, примерки)
  - Быстрые ссылки на разделы
- **Ссылки:**
  - `/shop/billing/` - биллинг
  - `/shop/products/` - товары
  - `/shop/profile/` - профиль
- **API:** `GET /api/v1/shops/me`
- **WebSocket:** Подключение для уведомлений
- **Скрипты:** config.js, websocket.js, notifications.js, common-utils.js, dashboard.js

#### 2. Shop Billing
- **URL:** `/shop/billing/index.html`
- **Назначение:** Управление финансами
- **Функции:**
  - Просмотр баланса
  - История транзакций
  - Активные подписки на товары
  - Кнопка пополнения
- **API:**
  - `GET /api/v1/shops/me` - баланс
  - `GET /api/v1/shops/me/analytics` - заработано
  - `GET /api/v1/shops/me/transactions` - транзакции
- **Скрипты:** config.js, websocket.js, notifications.js, common-utils.js, dashboard.js

#### 3. Shop Billing Top-up
- **URL:** `/shop/billing/topup.html`
- **Назначение:** Пополнение баланса через PayPal
- **Функции:**
  - Выбор суммы
  - Создание PayPal order
  - Редирект на PayPal
- **API:** `POST /api/v1/payments/shop/top-up`
- **Редирект:**
  - Success → `/public/payment/success.html`
  - Cancel → `/public/payment/cancel.html`
- **Скрипты:** config.js, websocket.js, notifications.js, common-utils.js, topup.js

#### 4. Shop Products
- **URL:** `/shop/products/index.html`
- **Назначение:** Управление товарами магазина
- **Функции:**
  - Добавление товаров
  - Редактирование товаров
  - Удаление товаров
  - Поиск и фильтрация
  - Сортировка
  - Пагинация
- **API:**
  - `GET /api/v1/shops/me/products` - список товаров
  - `POST /api/v1/shops/me/products` - создать товар
  - `PUT /api/v1/products/{id}` - обновить товар
  - `DELETE /api/v1/products/{id}` - удалить товар
- **Скрипты:** config.js, websocket.js, notifications.js, common-utils.js, dashboard.js

#### 5. Shop Profile
- **URL:** `/shop/profile/index.html`
- **Назначение:** Настройки профиля магазина
- **Функции:**
  - Информация о магазине
  - Настройки магазина
- **API:** `GET /api/v1/shops/me`
- **Скрипты:** config.js, websocket.js, notifications.js, common-utils.js, dashboard.js

---

### Admin Routes (Административные страницы)

#### 1. Admin Dashboard
- **URL:** `/admin/index.html`
- **Назначение:** Главная панель администратора
- **Функции:**
  - Статистика платформы
  - Навигация по разделам
  - Финансовые показатели
- **Ссылки:**
  - `/admin/products/` - модерация товаров
  - `/admin/shops/` - управление магазинами
  - `/admin/users/` - управление пользователями
  - `/admin/settings/` - настройки
- **API:** `GET /api/v1/admin/dashboard`
- **WebSocket:** Подключение для уведомлений
- **Скрипты:** config.js, auth.js, websocket.js, notifications.js, common-utils.js, dashboard.js

#### 2. Admin Products
- **URL:** `/admin/products/index.html`
- **Назначение:** Модерация товаров
- **Функции:**
  - Очередь модерации
  - Одобрение товаров
  - Отклонение товаров
  - Просмотр всех товаров
- **API:**
  - `GET /api/v1/admin/moderation/queue` - очередь
  - `GET /api/v1/admin/products/all` - все товары
  - `POST /api/v1/admin/moderation/{id}/approve` - одобрить
  - `POST /api/v1/admin/moderation/{id}/reject` - отклонить
- **Кнопка "Назад":** → `/admin/index.html`
- **Скрипты:** config.js, auth.js, websocket.js, notifications.js, common-utils.js, products.js

#### 3. Admin Shops
- **URL:** `/admin/shops/index.html`
- **Назначение:** Управление магазинами
- **Функции:**
  - Список всех магазинов
  - Детальная информация
  - Статистика магазинов
- **API:** `GET /api/v1/admin/shops`
- **Кнопка "Назад":** → `/admin/index.html`
- **Скрипты:** config.js, auth.js, websocket.js, notifications.js, common-utils.js, shops.js

#### 4. Admin Users
- **URL:** `/admin/users/index.html`
- **Назначение:** Управление пользователями
- **Функции:**
  - Список всех пользователей
  - Детальная информация
  - Статистика пользователей
- **API:** `GET /api/v1/admin/users`
- **Кнопка "Назад":** → `/admin/index.html`
- **Скрипты:** config.js, auth.js, websocket.js, notifications.js, common-utils.js, users.js

#### 5. Admin Settings
- **URL:** `/admin/settings/index.html`
- **Назначение:** Настройки платформы
- **Функции:**
  - Конфигурация платформы
  - Управление настройками
- **API:**
  - `GET /api/v1/admin/settings` - все настройки
  - `PUT /api/v1/admin/settings/{key}` - обновить настройку
- **Кнопка "Назад":** → `/admin/index.html`
- **Скрипты:** config.js, auth.js, websocket.js, notifications.js, common-utils.js, settings.js

---

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/google/login` - OAuth login

### User
- `GET /api/v1/users/me` - Информация о пользователе
- `GET /api/v1/users/me/balance` - Баланс пользователя

### Shop
- `GET /api/v1/shops/me` - Информация о магазине
- `GET /api/v1/shops/me/analytics` - Аналитика магазина
- `GET /api/v1/shops/me/products` - Товары магазина
- `POST /api/v1/shops/me/products` - Создать товар
- `GET /api/v1/shops/me/transactions` - Транзакции магазина

### Products
- `GET /api/v1/products/{id}` - Информация о товаре
- `PUT /api/v1/products/{id}` - Обновить товар
- `DELETE /api/v1/products/{id}` - Удалить товар

### Payments
- `POST /api/v1/payments/shop/top-up` - Пополнение баланса магазина
- `POST /api/v1/payments/shop/rent-product` - Аренда товара для примерки
- `POST /api/v1/payments/user/top-up` - Пополнение баланса пользователя
- `POST /api/v1/payments/capture/{token}` - Capture PayPal payment

### Admin
- `GET /api/v1/admin/dashboard` - Статистика платформы
- `GET /api/v1/admin/products/all` - Все товары
- `GET /api/v1/admin/moderation/queue` - Очередь модерации
- `POST /api/v1/admin/moderation/{id}/approve` - Одобрить товар
- `POST /api/v1/admin/moderation/{id}/reject` - Отклонить товар
- `GET /api/v1/admin/shops` - Все магазины
- `GET /api/v1/admin/users` - Все пользователи
- `GET /api/v1/admin/settings` - Настройки платформы
- `PUT /api/v1/admin/settings/{key}` - Обновить настройку
- `POST /api/v1/admin/refunds/{id}/process` - Обработать возврат

---

## 🌐 Configuration

### API URLs
- **Local:** `http://localhost:8000`
- **Production:** `https://www.api.leema.kz`

### WebSocket URLs
- **Local:** `ws://localhost:8000/ws`
- **Production:** `wss://www.api.leema.kz/ws`

### OAuth
- **Google Client ID:** `222819809615-cb4p93ej04cr6ur9cf5o1jjk9n6dmvuj.apps.googleusercontent.com`
- **Redirect URI:** `{origin}/public/auth/callback.html`

---

## 🔄 Redirect Logic

### После авторизации
```
Тип аккаунта → Куда редирект
─────────────────────────────
user         → /user/dashboard.html
shop         → /shop/index.html
admin        → /admin/index.html
```

### После logout
```
Любой аккаунт → /public/index.html
```

### После платежа
```
Success → Обратно в {accountType} (shop/user)
Cancel  → Обратно в {accountType} (shop/user)
```

---

## 📦 localStorage Keys

### Хранимые данные
- `token` - JWT токен
- `accountType` - Тип аккаунта (user/shop/admin)
- `userData` - JSON данные пользователя
- `requestedAccountType` - Временно хранится при OAuth

---

## 🔌 WebSocket Events

### Shop Events
- `product_approved` - Товар одобрен
- `product_rejected` - Товар отклонен
- `new_order` - Новый заказ
- `balance_updated` - Баланс обновлен

### Admin Events
- `new_product` - Новый товар на модерацию
- `product_updated` - Товар обновлен
- `new_shop` - Новый магазин
- `new_user` - Новый пользователь

### User Events
- `product_available` - Товар доступен
- `balance_updated` - Баланс обновлен

---

## ✅ Verified Routes (Проверенные маршруты)

Все маршруты проверены на корректность:
- ✅ OAuth flow работает
- ✅ Все редиректы корректны
- ✅ API endpoints правильные
- ✅ WebSocket URLs настроены
- ✅ Payment callbacks работают
- ✅ Admin navigation исправлена

---

*Последнее обновление: 2025-10-17*
