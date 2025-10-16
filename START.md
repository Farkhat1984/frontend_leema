# 🚀 Запуск Frontend Leema

## ✅ Готово к работе!

Проект очищен от старых файлов. Работаем только с новой модульной структурой.

---

## 📁 Активные URL

### Главная (вход в систему)
```
http://localhost/public/index.html
или просто
http://localhost/
```

### Магазин (Shop)
```
http://localhost/shop/                    # Dashboard
http://localhost/shop/products/           # Управление товарами
http://localhost/shop/billing/            # Биллинг
http://localhost/shop/billing/topup.html  # Пополнение баланса
http://localhost/shop/profile/            # Профиль
```

### Администратор (Admin)
```
http://localhost/admin/                   # Dashboard
http://localhost/admin/products/          # Модерация товаров
http://localhost/admin/shops/             # Управление магазинами
http://localhost/admin/users/             # Управление пользователями
http://localhost/admin/settings/          # Настройки системы
```

### Пользователь (User)
```
http://localhost/user/dashboard.html      # Дашборд пользователя
```

---

## 🐳 Запуск с Docker

### 1. Запуск контейнера
```bash
cd /var/www/frontend_leema/docker
docker-compose up -d
```

### 2. Проверка статуса
```bash
docker-compose ps
docker-compose logs -f
```

### 3. Остановка
```bash
docker-compose down
```

### 4. Перезапуск
```bash
docker-compose restart
```

---

## 🛠 Запуск без Docker

### С простым HTTP сервером
```bash
cd /var/www/frontend_leema
python3 -m http.server 8080
# Откройте: http://localhost:8080/public/index.html
```

### С Nginx напрямую
```bash
# Скопируйте nginx.conf в /etc/nginx/sites-available/
sudo cp nginx.conf /etc/nginx/sites-available/leema
sudo ln -s /etc/nginx/sites-available/leema /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔧 Конфигурация

### API Endpoint
Настроено в `assets/js/core/config.js`:
```javascript
const API_URL = 'https://api.leema.kz';
const WS_URL = 'wss://api.leema.kz/ws';
```

### OAuth
Google OAuth настроен в `public/index.html` и `public/auth/callback.html`

---

## ✅ Проверка работоспособности

### 1. Откройте главную страницу
```
http://localhost/public/index.html
```
Должны увидеть страницу входа с кнопками Google OAuth

### 2. Проверьте консоль браузера (F12)
Не должно быть ошибок 404 для CSS и JS файлов

### 3. Проверьте пути
```
✅ /public/index.html - работает
✅ /shop/index.html - работает
✅ /admin/index.html - работает
✅ /assets/css/layouts/style.css - загружается
✅ /assets/js/core/config.js - загружается
```

---

## 📚 Документация

- `README.md` - Основная документация
- `URL_MAPPING.md` - Карта всех URL
- `QUICK_START.md` - Быстрый старт
- `CLEANUP_REPORT.md` - Отчет об очистке
- `docs/` - Техническая документация

---

## 🎯 Типичные задачи

### Авторизация
1. Откройте `/public/index.html`
2. Нажмите "Войти как магазин" или "Войти как администратор"
3. Авторизуйтесь через Google
4. Произойдет редирект на `/public/auth/callback.html`
5. Затем на соответствующий dashboard

### Добавление товара (Shop)
1. Откройте `/shop/index.html`
2. Перейдите в "Товары" → `/shop/products/index.html`
3. Нажмите "Добавить товар"
4. Заполните форму и загрузите изображения

### Модерация товаров (Admin)
1. Откройте `/admin/index.html`
2. Перейдите в "Товары" → `/admin/products/index.html`
3. Просмотрите очередь модерации
4. Approve/Reject товары

---

## 🐛 Проблемы и решения

### 404 на CSS/JS
Проверьте пути в HTML:
```html
<!-- Правильно для /public/index.html -->
<link rel="stylesheet" href="../assets/css/layouts/style.css">

<!-- Правильно для /shop/products/index.html -->
<link rel="stylesheet" href="../../assets/css/layouts/style.css">
```

### WebSocket не подключается
Проверьте `assets/js/core/config.js` - должен быть правильный WS_URL

### OAuth не работает
1. Проверьте Google OAuth credentials
2. Проверьте redirect URI в Google Console
3. Должен быть: `http://localhost/public/auth/callback.html`

---

## 📊 Структура проекта

```
/var/www/frontend_leema/
├── public/          # Публичные страницы
├── user/            # Панель пользователя
├── shop/            # Панель магазина
├── admin/           # Админ панель
├── assets/          # CSS, JS, images
├── docker/          # Docker конфигурация
├── docs/            # Документация
└── nginx.conf       # Nginx конфиг
```

---

## 🎉 Готово!

Проект очищен и готов к работе с новыми модульными путями.

**Удалено:** 41 старых файлов  
**Структура:** Чистая и организованная  
**Статус:** ✅ Работает

---

**Дата:** 2025-10-16  
**Версия:** 2.0 (после очистки)
