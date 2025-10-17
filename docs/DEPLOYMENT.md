# Инструкции по деплою Frontend LEEMA

Подробное руководство по развёртыванию приложения на production сервере.

## 🚀 Quick Start (Production)

```bash
# 1. Клонировать репозиторий
cd /var/www
git clone https://github.com/Farkhat1984/frontend_leema.git
cd frontend_leema

# 2. Настроить Nginx
sudo cp nginx.conf /etc/nginx/sites-available/leema
sudo ln -s /etc/nginx/sites-available/leema /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 3. Настроить SSL
sudo certbot --nginx -d www.leema.kz

# 4. Готово!
```

---

## 📋 Требования

### Сервер

- **OS**: Ubuntu 20.04+ / Debian 10+ / CentOS 8+
- **RAM**: Минимум 512MB
- **Disk**: 100MB свободного места
- **Network**: Открыты порты 80, 443

### Программное обеспечение

- **Nginx**: 1.18+
- **Git**: 2.0+
- **Certbot**: для SSL (опционально)

---

## 🔧 Детальная установка

### 1. Установка Nginx

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### CentOS/RHEL
```bash
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

Проверка:
```bash
nginx -v
# nginx version: nginx/1.18.0
```

---

### 2. Клонирование проекта

```bash
# Создать директорию
sudo mkdir -p /var/www
cd /var/www

# Клонировать репозиторий
sudo git clone https://github.com/Farkhat1984/frontend_leema.git

# Установить права
sudo chown -R www-data:www-data /var/www/frontend_leema
sudo chmod -R 755 /var/www/frontend_leema
```

Проверка:
```bash
ls -la /var/www/frontend_leema
# должны быть файлы: public/, shop/, admin/, assets/, etc.
```

---

### 3. Конфигурация Nginx

#### Вариант A: Использовать готовую конфигурацию

```bash
# Скопировать конфиг из репозитория
sudo cp /var/www/frontend_leema/nginx.conf /etc/nginx/sites-available/leema

# Создать симлинк
sudo ln -s /etc/nginx/sites-available/leema /etc/nginx/sites-enabled/

# Удалить дефолтный конфиг (опционально)
sudo rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию
sudo nginx -t

# Перезагрузить Nginx
sudo systemctl reload nginx
```

#### Вариант B: Создать конфигурацию вручную

```bash
sudo nano /etc/nginx/sites-available/leema
```

Вставить конфигурацию:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name www.leema.kz leema.kz;

    root /var/www/frontend_leema;
    index index.html;

    # Логи
    access_log /var/log/nginx/leema_access.log;
    error_log /var/log/nginx/leema_error.log;

    # Основные location
    location / {
        try_files $uri $uri/ /public/index.html;
    }

    # Public страницы
    location /public {
        try_files $uri $uri/ /public/index.html;
    }

    # User страницы
    location /user {
        try_files $uri $uri/ /user/dashboard.html;
    }

    # Shop страницы
    location /shop {
        try_files $uri $uri/ /shop/index.html;
    }

    # Admin страницы
    location /admin {
        try_files $uri $uri/ /admin/index.html;
    }

    # Static assets
    location /assets {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Отключить логи для favicon
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }

    # Безопасность
    location ~ /\.git {
        deny all;
    }

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;
}
```

Активировать:
```bash
sudo ln -s /etc/nginx/sites-available/leema /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 4. Настройка SSL (HTTPS)

#### Установка Certbot

**Ubuntu/Debian:**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

**CentOS/RHEL:**
```bash
sudo yum install certbot python3-certbot-nginx -y
```

#### Получение SSL сертификата

```bash
# Автоматическая настройка SSL
sudo certbot --nginx -d www.leema.kz -d leema.kz

# Следовать инструкциям certbot
# Email: ваш email
# Agree to terms: Yes
# Redirect HTTP to HTTPS: Yes (рекомендуется)
```

#### Автоматическое обновление сертификатов

```bash
# Проверить автообновление
sudo certbot renew --dry-run

# Добавить в crontab (если не добавлено автоматически)
sudo crontab -e
# Добавить строку:
0 0,12 * * * certbot renew --quiet
```

Проверка SSL:
```bash
curl -I https://www.leema.kz
# Должен вернуть 200 OK
```

---

### 5. Настройка Firewall

#### UFW (Ubuntu/Debian)

```bash
# Разрешить Nginx
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable

# Проверить статус
sudo ufw status
```

#### Firewalld (CentOS/RHEL)

```bash
# Разрешить HTTP и HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Проверить
sudo firewall-cmd --list-all
```

---

## 🔄 Обновление приложения

### Автоматический скрипт

Создать скрипт для быстрого обновления:

```bash
sudo nano /usr/local/bin/update-leema
```

Вставить:
```bash
#!/bin/bash

echo "=== Обновление Frontend LEEMA ==="

# Переход в директорию
cd /var/www/frontend_leema || exit 1

# Сохранить изменения (если есть)
echo "Проверка изменений..."
git stash

# Получить обновления
echo "Загрузка обновлений..."
git pull origin main

# Применить сохранённые изменения
git stash pop 2>/dev/null

# Установить права
echo "Установка прав..."
sudo chown -R www-data:www-data /var/www/frontend_leema
sudo chmod -R 755 /var/www/frontend_leema

# Очистить кэш Nginx
echo "Очистка кэша..."
sudo systemctl reload nginx

echo "✅ Обновление завершено!"
echo "Версия: $(git log -1 --pretty=format:'%h - %s')"
```

Сделать исполняемым:
```bash
sudo chmod +x /usr/local/bin/update-leema
```

Использование:
```bash
sudo update-leema
```

---

### Ручное обновление

```bash
# 1. Переход в директорию
cd /var/www/frontend_leema

# 2. Получить обновления
git pull origin main

# 3. Установить права (если нужно)
sudo chown -R www-data:www-data .
sudo chmod -R 755 .

# 4. Перезагрузить Nginx
sudo systemctl reload nginx

# 5. Проверить
curl -I https://www.leema.kz
```

---

## 📊 Мониторинг

### Логи Nginx

```bash
# Access logs
sudo tail -f /var/log/nginx/leema_access.log

# Error logs
sudo tail -f /var/log/nginx/leema_error.log

# Поиск ошибок
sudo grep "error" /var/log/nginx/leema_error.log
```

### Статус сервисов

```bash
# Nginx статус
sudo systemctl status nginx

# Проверка конфигурации
sudo nginx -t

# Перезагрузка при необходимости
sudo systemctl reload nginx
sudo systemctl restart nginx  # полный рестарт
```

### Мониторинг производительности

```bash
# Статистика Nginx
curl http://localhost/nginx_status

# Использование диска
df -h /var/www/frontend_leema

# Последние коммиты
cd /var/www/frontend_leema
git log --oneline -5
```

---

## 🧪 Тестирование после деплоя

### 1. Проверка доступности страниц

```bash
# Главная страница
curl -I https://www.leema.kz
curl -I https://www.leema.kz/public/index.html

# User dashboard
curl -I https://www.leema.kz/user/dashboard.html

# Shop dashboard
curl -I https://www.leema.kz/shop/index.html

# Admin dashboard
curl -I https://www.leema.kz/admin/index.html

# Все должны вернуть 200 OK
```

### 2. Проверка статических ресурсов

```bash
# CSS
curl -I https://www.leema.kz/assets/css/layouts/style.css

# JavaScript
curl -I https://www.leema.kz/assets/js/core/config.js

# Должны вернуть 200 OK с Cache-Control
```

### 3. Проверка редиректов

```bash
# HTTP → HTTPS redirect
curl -I http://www.leema.kz
# Должен вернуть 301 или 308 redirect на HTTPS

# Root → /public/index.html
curl -I https://www.leema.kz/
# Должен вернуть 200 OK
```

### 4. Проверка SSL

```bash
# SSL сертификат
openssl s_client -connect www.leema.kz:443 -servername www.leema.kz

# Или через онлайн сервис:
# https://www.ssllabs.com/ssltest/analyze.html?d=www.leema.kz
```

---

## 🔒 Безопасность

### Базовая безопасность Nginx

Добавить в `/etc/nginx/sites-available/leema`:

```nginx
# Скрыть версию Nginx
server_tokens off;

# Защита от clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# XSS Protection
add_header X-XSS-Protection "1; mode=block" always;

# Content Type Options
add_header X-Content-Type-Options "nosniff" always;

# Referrer Policy
add_header Referrer-Policy "no-referrer-when-downgrade" always;

# Content Security Policy (настроить под свои нужды)
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline';" always;
```

После изменений:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Ограничение доступа к git

Уже включено в базовую конфигурацию:
```nginx
location ~ /\.git {
    deny all;
}
```

### Rate Limiting (опционально)

Защита от DDoS атак:

```nginx
# В секции http (/etc/nginx/nginx.conf)
http {
    limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
    
    # В server блоке
    server {
        location / {
            limit_req zone=one burst=20 nodelay;
            # ... остальная конфигурация
        }
    }
}
```

---

## 🐛 Troubleshooting

### Проблема: 502 Bad Gateway

**Причина:** Backend API недоступен

**Решение:**
```bash
# Проверить backend
curl https://www.api.leema.kz/health

# Если не работает - проверить backend сервис
```

### Проблема: 404 Not Found на страницах

**Причина:** Неправильная конфигурация try_files

**Решение:**
```bash
# Проверить конфигурацию Nginx
sudo nginx -t

# Проверить права на файлы
ls -la /var/www/frontend_leema/public/index.html

# Исправить права если нужно
sudo chown -R www-data:www-data /var/www/frontend_leema
```

### Проблема: Старые файлы после обновления

**Причина:** Кэш браузера

**Решение:**
```bash
# Очистить кэш Nginx
sudo systemctl reload nginx

# В браузере: Ctrl+Shift+R (hard reload)
# Или проверить версию скриптов (?v=8)
```

### Проблема: SSL сертификат не обновляется

**Причина:** Проблемы с certbot

**Решение:**
```bash
# Проверить статус certbot
sudo certbot renew --dry-run

# Если ошибка - попробовать принудительное обновление
sudo certbot renew --force-renewal

# Перезагрузить Nginx
sudo systemctl reload nginx
```

---

## 📞 Поддержка

При проблемах с деплоем:

1. Проверить логи Nginx: `/var/log/nginx/leema_error.log`
2. Проверить статус сервисов: `sudo systemctl status nginx`
3. Проверить конфигурацию: `sudo nginx -t`
4. Создать Issue на GitHub: https://github.com/Farkhat1984/frontend_leema/issues

---

## 📝 Checklist деплоя

- [ ] Nginx установлен и запущен
- [ ] Репозиторий склонирован в `/var/www/frontend_leema`
- [ ] Права установлены (www-data:www-data, 755)
- [ ] Nginx конфигурация создана и активирована
- [ ] `nginx -t` проходит успешно
- [ ] Nginx перезагружен
- [ ] SSL сертификат установлен (certbot)
- [ ] Firewall настроен (порты 80, 443)
- [ ] Все страницы доступны (200 OK)
- [ ] Редиректы работают
- [ ] Статические ресурсы загружаются
- [ ] SSL работает (https://)
- [ ] Автообновление SSL настроено

---

*Последнее обновление: 2025-10-17 - Этап 10*
