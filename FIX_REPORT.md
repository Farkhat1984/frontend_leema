# Отчет об исправлении - Пустые страницы после Google авторизации

## Проблема
После успешной Google авторизации все страницы (user, shop, admin) отображались пустыми - только с небольшими стилями но без виджетов и контента.

## Причины

### 1. Неправильные пути к CSS файлам
**Проблема:** HTML страницы пытались загрузить CSS напрямую из `/assets/css/`, но файлы находились в подпапках:
- `/assets/css/layouts/style.css`
- `/assets/css/pages/shop.css`

**Ошибки в логах:**
```
[error] open() "/usr/share/nginx/html/assets/css/style.css" failed (2: No such file or directory)
[error] open() "/usr/share/nginx/html/assets/css/shop.css" failed (2: No such file or directory)
```

### 2. Неправильная логика сохранения accountType для админов
**Проблема:** При входе как admin, в localStorage сохранялось `accountType: 'user'`, из-за чего страница admin/index.html не могла распознать авторизованного админа и постоянно редиректила на user/dashboard.html.

### 3. JavaScript ошибка в shop/dashboard.js
**Проблема:** Код пытался показать/скрыть несуществующий элемент `loginPage` на странице shop/index.html, что вызывало JavaScript ошибку и остановку выполнения скрипта. Страница оставалась пустой.

```javascript
// Ошибка: элемент loginPage не существует в shop/index.html
document.getElementById('loginPage').style.display = 'none';
```

## Исправления

### 1. Исправлены пути к CSS во всех HTML файлах:
- `/var/www/frontend_leema/user/dashboard.html`
- `/var/www/frontend_leema/shop/products.html`
- `/var/www/frontend_leema/shop/profile.html`
- `/var/www/frontend_leema/shop/billing.html`

**Было:**
```html
<link rel="stylesheet" href="../assets/css/style.css">
<link rel="stylesheet" href="../assets/css/shop.css">
```

**Стало:**
```html
<link rel="stylesheet" href="../assets/css/layouts/style.css">
<link rel="stylesheet" href="../assets/css/pages/shop.css">
```

### 2. Исправлена логика сохранения accountType в callback.html

**Было:**
```javascript
localStorage.setItem('accountType', accountType); // всегда 'user' для админов
```

**Стало:**
```javascript
if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('userRole', data.user.role);
    
    // Определяем accountType на основе запроса и роли
    if (requestedType === 'admin' && data.user.role === 'admin') {
        localStorage.setItem('accountType', 'admin');
    } else {
        localStorage.setItem('accountType', 'user');
    }
} else if (data.shop) {
    localStorage.setItem('shop', JSON.stringify(data.shop));
    localStorage.setItem('accountType', 'shop');
}
```

### 3. Исправлена логика в shop/dashboard.js

**Было:**
```javascript
// Попытка показать несуществующий loginPage
if (!token || !accountType) {
    document.getElementById('loginPage').style.display = 'flex';
}

async function loadShopDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('shopDashboard').style.display = 'block';
    // ...
}
```

**Стало:**
```javascript
// Редирект на страницу логина вместо показа несуществующего элемента
if (!token || !accountType) {
    window.location.href = `${window.location.origin}/public/index.html`;
}

async function loadShopDashboard() {
    // Безопасная проверка существования элемента
    const dashboardEl = document.getElementById('shopDashboard');
    if (dashboardEl) {
        dashboardEl.style.display = 'block';
    }
    // ...
}
```

## Результат
✅ CSS файлы теперь загружаются корректно  
✅ Страницы отображаются с полным функционалом и виджетами  
✅ Админы правильно перенаправляются на admin/index.html  
✅ Пользователи перенаправляются на user/dashboard.html  
✅ Магазины перенаправляются на shop/index.html  
✅ JavaScript ошибки исправлены, скрипты выполняются корректно

## Как протестировать
1. Очистите localStorage в браузере (F12 → Application → Local Storage → Clear)
2. Войдите через Google как пользователь/магазин/админ
3. Проверьте что страница загружается с полными стилями и виджетами
4. Проверьте что редиректы работают правильно
5. Проверьте консоль браузера на отсутствие ошибок

## Команды для пересборки контейнера
```bash
cd /var/www/frontend_leema
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d --build
```
