# 🚀 Быстрый старт после реструктуризации

## ✅ Что изменилось?

### Главные изменения:

**Старая главная страница теперь разделена:**
- `/index.html` (старый) → `/public/index.html` (только login)
- Shop Dashboard → `/shop/index.html` (новая страница)

**Новые URL'ы:**
```
ВХОД:           /public/index.html
CALLBACK:       /public/auth/callback.html
USER:           /user/dashboard.html
SHOP DASHBOARD: /shop/index.html ← НОВЫЙ!
SHOP PRODUCTS:  /shop/products/index.html
SHOP BILLING:   /shop/billing/index.html
SHOP TOPUP:     /shop/billing/topup.html
SHOP PROFILE:   /shop/profile/index.html
ADMIN:          /admin/index.html
ADMIN PRODUCTS: /admin/products/index.html
ADMIN SHOPS:    /admin/shops/index.html
ADMIN USERS:    /admin/users/index.html
ADMIN SETTINGS: /admin/settings/index.html
```

## 🏃 Как запустить?

### 1. Проверьте структуру
```bash
ls -la /var/www/frontend_leema/
# Должны увидеть: public/, user/, shop/, admin/, assets/, docs/, docker/
```

### 2. Откройте страницу входа
```
http://your-domain/public/index.html
```

### 3. После авторизации
- **User** → автоматически редирект на `/user/dashboard.html`
- **Shop** → автоматически редирект на `/shop/index.html`
- **Admin** → автоматически редирект на `/admin/index.html`

## 📋 Чек-лист для проверки

### Базовая проверка:
- [ ] Открывается `/public/index.html`
- [ ] Видны кнопки входа через Google
- [ ] Нет ошибок в консоли
- [ ] CSS загружается корректно

### Авторизация:
- [ ] Клик на "Войти как магазин" работает
- [ ] Редирект на Google проходит
- [ ] После авторизации редирект на `/shop/index.html`
- [ ] Токен сохраняется в localStorage

### Shop Dashboard:
- [ ] Страница `/shop/index.html` загружается
- [ ] Отображается статистика
- [ ] Кнопки навигации работают
- [ ] WebSocket подключается

### Навигация:
- [ ] Клик на "Перейти к товарам" → `/shop/products/index.html`
- [ ] Клик на "Перейти к биллингу" → `/shop/billing/index.html`
- [ ] Клик на "Перейти к профилю" → `/shop/profile/index.html`
- [ ] Кнопка "Назад" работает

### Admin:
- [ ] `/admin/index.html` загружается
- [ ] Навигация между секциями работает
- [ ] Модерация товаров работает

## 🔧 Если что-то не работает

### Ошибка 404 на CSS/JS
Проверьте пути в HTML:
```html
<!-- Правильно для /public/index.html -->
<link rel="stylesheet" href="../assets/css/layouts/style.css">
<script src="../assets/js/core/config.js"></script>

<!-- Правильно для /shop/index.html -->
<link rel="stylesheet" href="../assets/css/layouts/style.css">
<script src="../assets/js/core/config.js"></script>

<!-- Правильно для /shop/products/index.html -->
<link rel="stylesheet" href="../../assets/css/layouts/style.css">
<script src="../../assets/js/core/config.js"></script>
```

### Редирект не работает после OAuth
Проверьте `/public/auth/callback.html`:
```javascript
// Должен быть правильный путь:
window.location.href = `${baseUrl}/shop/index.html`;  // для shop
window.location.href = `${baseUrl}/admin/index.html`; // для admin
window.location.href = `${baseUrl}/user/dashboard.html`; // для user
```

### WebSocket не подключается
Проверьте `assets/js/core/config.js`:
```javascript
const API_URL = 'https://api.leema.kz';
const WS_URL = 'wss://api.leema.kz/ws';
```

## 📁 Где что находится?

### HTML страницы:
```
public/index.html              - Вход в систему
public/auth/callback.html      - OAuth callback
shop/index.html                - Dashboard магазина
shop/products/index.html       - Управление товарами
shop/billing/index.html        - Биллинг
shop/billing/topup.html        - Пополнение
shop/profile/index.html        - Профиль
admin/index.html               - Admin dashboard
admin/products/index.html      - Модерация товаров
admin/shops/index.html         - Управление магазинами
admin/users/index.html         - Управление пользователями
admin/settings/index.html      - Настройки
user/dashboard.html            - Панель пользователя
```

### JavaScript модули:
```
assets/js/core/config.js       - Конфигурация API
assets/js/core/auth.js         - Авторизация
assets/js/core/websocket.js    - WebSocket
assets/js/core/notifications.js - Уведомления
assets/js/pages/public/login.js - Логика входа
assets/js/pages/shop/dashboard.js - Shop dashboard
assets/js/pages/admin/dashboard.js - Admin dashboard
assets/js/shared/common.js     - Общий код
```

### CSS стили:
```
assets/css/layouts/style.css   - Главные стили
assets/css/layouts/auth.css    - Стили авторизации
assets/css/pages/shop.css      - Стили магазина
assets/css/pages/payment.css   - Стили платежей
```

## 🐛 Дебаг

### Включить verbose logging:
Откройте консоль браузера (F12) и введите:
```javascript
localStorage.setItem('debug', 'true');
```

### Проверить сохраненные данные:
```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('Role:', localStorage.getItem('userRole'));
console.log('User:', localStorage.getItem('userData'));
```

### Очистить кэш:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## 📞 Поддержка

Если проблемы остались:
1. Проверьте консоль браузера на ошибки
2. Проверьте Network вкладку
3. Убедитесь что API доступен
4. Проверьте документацию в `/docs/`

## 🎉 Готово!

После проверки всех пунктов проект готов к работе!

Если всё работает корректно, можно удалить старые файлы согласно `FILES_TO_DELETE.md`
