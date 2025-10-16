# ✅ Чеклист после очистки

## Что проверить перед запуском

### 1. Структура файлов
- [x] Удалены все старые HTML из корня
- [x] Удалены старые JS файлы из assets/js/
- [x] Удалены старые CSS файлы из assets/css/
- [x] Nginx конфиги обновлены
- [x] Созданы новые документы (START.md, URL_MAPPING.md, CLEANUP_REPORT.md)

### 2. Git коммиты
- [x] Изменения закоммичены
- [x] Изменения запушены в GitHub

### 3. Перед запуском приложения
- [ ] Проверить `assets/js/core/config.js` (API_URL и WS_URL)
- [ ] Проверить Google OAuth credentials в `public/index.html`
- [ ] Проверить redirect URI в Google Console

### 4. Тестирование после запуска
- [ ] Открыть `/public/index.html` - страница входа загружается
- [ ] Проверить консоль браузера - нет ошибок 404
- [ ] Попробовать OAuth авторизацию
- [ ] Проверить редирект на `/shop/index.html` для shop
- [ ] Проверить редирект на `/admin/index.html` для admin
- [ ] Проверить WebSocket подключение
- [ ] Протестировать CRUD товаров
- [ ] Протестировать модерацию (admin)

### 5. URL которые должны работать
- [ ] `/` → редирект на `/public/index.html`
- [ ] `/public/index.html` - страница входа
- [ ] `/public/auth/callback.html` - OAuth callback
- [ ] `/shop/index.html` - shop dashboard
- [ ] `/shop/products/index.html` - управление товарами
- [ ] `/shop/billing/index.html` - биллинг
- [ ] `/shop/billing/topup.html` - пополнение
- [ ] `/shop/profile/index.html` - профиль
- [ ] `/admin/index.html` - admin dashboard
- [ ] `/admin/products/index.html` - модерация
- [ ] `/admin/shops/index.html` - магазины
- [ ] `/admin/users/index.html` - пользователи
- [ ] `/admin/settings/index.html` - настройки
- [ ] `/user/dashboard.html` - user dashboard

### 6. Assets загружаются
- [ ] `/assets/css/layouts/style.css`
- [ ] `/assets/css/layouts/auth.css`
- [ ] `/assets/css/pages/shop.css`
- [ ] `/assets/css/pages/payment.css`
- [ ] `/assets/js/core/config.js`
- [ ] `/assets/js/core/auth.js`
- [ ] `/assets/js/core/websocket.js`
- [ ] `/assets/js/core/notifications.js`

---

## Команды для проверки

### Запуск с Docker
```bash
cd /var/www/frontend_leema/docker
docker-compose up -d
docker-compose logs -f
```

### Запуск без Docker
```bash
cd /var/www/frontend_leema
python3 -m http.server 8080
# Откройте: http://localhost:8080/public/index.html
```

### Проверка nginx конфига
```bash
cat /var/www/frontend_leema/nginx.conf
```

### Проверка структуры
```bash
cd /var/www/frontend_leema
ls -la
ls -la public/
ls -la shop/
ls -la admin/
ls -la assets/js/core/
```

---

## Что делать если что-то не работает

### 404 на страницах
1. Проверить что файлы существуют
2. Проверить nginx.conf - правильные location блоки
3. Перезапустить nginx/docker

### 404 на CSS/JS
1. Проверить пути в HTML файлах
2. Убедиться что используются относительные пути `../` или `../../`
3. Проверить что файлы есть в assets/

### OAuth не работает
1. Проверить redirect URI в Google Console
2. Должен быть: `http://your-domain/public/auth/callback.html`
3. Проверить client ID в коде

### WebSocket не подключается
1. Проверить `assets/js/core/config.js`
2. Убедиться что WS_URL правильный
3. Проверить что бэкенд запущен

---

**Дата создания:** 2025-10-16  
**Версия:** 1.0
