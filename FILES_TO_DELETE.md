# Файлы для удаления после тестирования

⚠️ **ВНИМАНИЕ:** Удаляйте эти файлы ТОЛЬКО после полного тестирования новой структуры!

## HTML файлы в корне (перенесены в новую структуру):

```bash
# Эти файлы ПЕРЕНЕСЕНЫ, старые версии можно удалить:
rm /var/www/frontend_leema/index.html              # → /public/index.html
rm /var/www/frontend_leema/callback.html           # → /public/auth/callback.html
rm /var/www/frontend_leema/success.html            # → /public/payment/success.html
rm /var/www/frontend_leema/cancel.html             # → /public/payment/cancel.html
rm /var/www/frontend_leema/user.html               # → /user/dashboard.html
rm /var/www/frontend_leema/topup.html              # → /shop/billing/topup.html
rm /var/www/frontend_leema/admin.html              # → /admin/index.html
rm /var/www/frontend_leema/admin-dashboard.html    # → /admin/index.html (объединен)
rm /var/www/frontend_leema/admin-products.html     # → /admin/products/index.html
rm /var/www/frontend_leema/admin-shops.html        # → /admin/shops/index.html
rm /var/www/frontend_leema/admin-users.html        # → /admin/users/index.html
rm /var/www/frontend_leema/admin-settings.html     # → /admin/settings/index.html

# ДУБЛИКАТЫ - удалить:
rm /var/www/frontend_leema/products-admin.html     # ДУБЛИКАТ admin-products.html
rm /var/www/frontend_leema/products-management.html # ДУБЛИКАТ admin-products.html
rm /var/www/frontend_leema/shops-management.html    # ДУБЛИКАТ admin-shops.html
rm /var/www/frontend_leema/users-management.html    # ДУБЛИКАТ admin-users.html
```

## Старая папка shop/ (перенесена):

```bash
# Удалить всю старую папку shop/ после переноса:
rm -rf /var/www/frontend_leema/shop/products.html   # → /shop/products/index.html
rm -rf /var/www/frontend_leema/shop/billing.html    # → /shop/billing/index.html
rm -rf /var/www/frontend_leema/shop/profile.html    # → /shop/profile/index.html

# После переноса всех файлов можно удалить старую папку целиком:
# rm -rf /var/www/frontend_leema/shop/  # НО ОСТОРОЖНО! Новая структура тоже в shop/
```

## JavaScript файлы (старые версии в assets/js/):

```bash
# Core файлы (перенесены в assets/js/core/):
rm /var/www/frontend_leema/assets/js/config.js          # → core/config.js
rm /var/www/frontend_leema/assets/js/websocket.js       # → core/websocket.js
rm /var/www/frontend_leema/assets/js/notifications.js   # → core/notifications.js

# Admin файлы (перенесены в assets/js/pages/admin/):
rm /var/www/frontend_leema/assets/js/admin.js           # → pages/admin/dashboard.js
rm /var/www/frontend_leema/assets/js/admin-dashboard.js # → pages/admin/dashboard.js (объединен)
rm /var/www/frontend_leema/assets/js/admin-products.js  # → pages/admin/products.js
rm /var/www/frontend_leema/assets/js/admin-shops.js     # → pages/admin/shops.js
rm /var/www/frontend_leema/assets/js/admin-users.js     # → pages/admin/users.js
rm /var/www/frontend_leema/assets/js/admin-settings.js  # → pages/admin/settings.js
rm /var/www/frontend_leema/assets/js/admin-common.js    # → shared/common.js

# Shop файлы (перенесены в assets/js/pages/shop/):
rm /var/www/frontend_leema/assets/js/shop.js            # → pages/shop/dashboard.js
rm /var/www/frontend_leema/assets/js/topup.js           # → pages/shop/topup.js

# ДУБЛИКАТЫ - удалить:
rm /var/www/frontend_leema/assets/js/products-admin.js     # ДУБЛИКАТ admin-products.js
rm /var/www/frontend_leema/assets/js/products-management.js # ДУБЛИКАТ admin-products.js
rm /var/www/frontend_leema/assets/js/shops-management.js    # ДУБЛИКАТ admin-shops.js
rm /var/www/frontend_leema/assets/js/users-management.js    # ДУБЛИКАТ admin-users.js

# Бэкап файлы - удалить:
rm /var/www/frontend_leema/assets/js/admin.js.bak      # БЭКАП файл
```

## CSS файлы (старые версии в assets/css/):

```bash
# Перенесены в layouts/ и pages/:
rm /var/www/frontend_leema/assets/css/style.css     # → layouts/style.css
rm /var/www/frontend_leema/assets/css/shop.css      # → pages/shop.css
rm /var/www/frontend_leema/assets/css/topup.css     # → pages/payment.css
```

## Docker файлы (скопированы):

```bash
# Старые версии в корне (скопированы в docker/):
rm /var/www/frontend_leema/Dockerfile           # → docker/Dockerfile
rm /var/www/frontend_leema/docker-compose.yml   # → docker/docker-compose.yml
rm /var/www/frontend_leema/nginx.conf           # → docker/nginx.conf
```

## Скрипт для безопасного удаления

Создайте этот скрипт и запустите ТОЛЬКО после полного тестирования:

```bash
#!/bin/bash
# cleanup_old_files.sh

echo "⚠️  ВНИМАНИЕ: Это удалит старые файлы!"
echo "Убедитесь, что новая структура работает корректно!"
read -p "Продолжить? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Отменено."
    exit 0
fi

cd /var/www/frontend_leema

# Создаем бэкап перед удалением
echo "Создание бэкапа..."
tar -czf old_structure_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    index.html callback.html success.html cancel.html user.html topup.html \
    admin*.html products-*.html shops-*.html users-*.html \
    assets/js/config.js assets/js/websocket.js assets/js/notifications.js \
    assets/js/admin*.js assets/js/shop.js assets/js/topup.js \
    assets/js/products-*.js assets/js/shops-*.js assets/js/users-*.js \
    assets/css/style.css assets/css/shop.css assets/css/topup.css \
    Dockerfile docker-compose.yml nginx.conf 2>/dev/null

echo "Бэкап создан!"

# Удаление HTML дубликатов
echo "Удаление HTML дубликатов..."
rm -f products-admin.html products-management.html shops-management.html users-management.html

# Удаление JS дубликатов
echo "Удаление JS дубликатов..."
rm -f assets/js/products-admin.js assets/js/products-management.js
rm -f assets/js/shops-management.js assets/js/users-management.js
rm -f assets/js/admin.js.bak

# Удаление старых HTML файлов (опционально, раскомментируйте при необходимости)
# echo "Удаление старых HTML файлов..."
# rm -f index.html callback.html success.html cancel.html user.html topup.html
# rm -f admin.html admin-dashboard.html admin-products.html admin-shops.html admin-users.html admin-settings.html

# Удаление старых JS файлов (опционально, раскомментируйте при необходимости)
# echo "Удаление старых JS файлов..."
# rm -f assets/js/config.js assets/js/websocket.js assets/js/notifications.js
# rm -f assets/js/admin.js assets/js/admin-dashboard.js assets/js/admin-products.js
# rm -f assets/js/admin-shops.js assets/js/admin-users.js assets/js/admin-settings.js
# rm -f assets/js/admin-common.js assets/js/shop.js assets/js/topup.js

# Удаление старых CSS файлов (опционально, раскомментируйте при необходимости)
# echo "Удаление старых CSS файлов..."
# rm -f assets/css/style.css assets/css/shop.css assets/css/topup.css

# Удаление Docker файлов из корня (опционально, раскомментируйте при необходимости)
# echo "Удаление Docker файлов из корня..."
# rm -f Dockerfile docker-compose.yml nginx.conf

echo "✅ Очистка завершена!"
echo "Бэкап сохранен в текущей директории"
```

## Порядок удаления (рекомендуется):

### Этап 1: Удалить только дубликаты (безопасно)
```bash
rm products-admin.html products-management.html shops-management.html users-management.html
rm assets/js/products-admin.js assets/js/products-management.js
rm assets/js/shops-management.js assets/js/users-management.js
rm assets/js/admin.js.bak
```

### Этап 2: После тестирования - удалить старые HTML
```bash
rm index.html callback.html success.html cancel.html user.html topup.html
rm admin.html admin-dashboard.html admin-products.html admin-shops.html
rm admin-users.html admin-settings.html
```

### Этап 3: После тестирования - удалить старые JS
```bash
rm assets/js/config.js assets/js/websocket.js assets/js/notifications.js
rm assets/js/admin*.js assets/js/shop.js assets/js/topup.js
```

### Этап 4: После тестирования - удалить старые CSS
```bash
rm assets/css/style.css assets/css/shop.css assets/css/topup.css
```

### Этап 5: После тестирования - удалить Docker из корня
```bash
rm Dockerfile docker-compose.yml nginx.conf
```

## ⚠️ ВАЖНО:

1. **НЕ УДАЛЯЙТЕ** файлы до полного тестирования!
2. **СОЗДАЙТЕ БЭКАП** перед удалением
3. **ПРОТЕСТИРУЙТЕ** каждую функцию в новой структуре
4. **ПРОВЕРЬТЕ** все пути и ссылки
5. **УБЕДИТЕСЬ** что WebSocket работает
6. **ПРОВЕРЬТЕ** что OAuth работает
7. **ПРОТЕСТИРУЙТЕ** все CRUD операции

## Checklist перед удалением:

- [ ] Авторизация работает
- [ ] Callback редиректит правильно
- [ ] Shop dashboard загружается
- [ ] Admin dashboard загружается
- [ ] Все страницы доступны
- [ ] Все стили загружаются
- [ ] Все скрипты работают
- [ ] WebSocket подключается
- [ ] Нет ошибок в консоли
- [ ] Нет 404 ошибок
- [ ] Создан бэкап
- [ ] Команда в курсе изменений

**ТОЛЬКО ПОСЛЕ** выполнения всех пунктов можно удалять старые файлы!
