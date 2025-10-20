# Docker Hot Reload Setup

Теперь Docker настроен на автоматическую синхронизацию файлов через volumes.

## Как это работает

Все изменения в исходных файлах автоматически отражаются в контейнере:
- `/var/www/frontend_leema/admin` → `/usr/share/nginx/html/admin`
- `/var/www/frontend_leema/shop` → `/usr/share/nginx/html/shop`
- `/var/www/frontend_leema/user` → `/usr/share/nginx/html/user`
- `/var/www/frontend_leema/public` → `/usr/share/nginx/html/public`
- `/var/www/frontend_leema/assets` → `/usr/share/nginx/html/assets`

## Команды

### 1. Простой перезапуск nginx (рекомендуется)
```bash
cd /var/www/frontend_leema/docker
./reload.sh
```
или
```bash
docker exec frontend-leema nginx -s reload
```

**Используйте для:** HTML, JS, CSS изменений

### 2. Полный перезапуск контейнера
```bash
cd /var/www/frontend_leema/docker
docker-compose restart
```

**Используйте для:** изменений nginx.conf

### 3. Пересборка (только если изменен Dockerfile)
```bash
cd /var/www/frontend_leema/docker
docker-compose down
docker-compose build
docker-compose up -d
```

## Проверка

Проверить, что файлы синхронизированы:
```bash
docker exec frontend-leema ls -la /usr/share/nginx/html/
```

Проверить логи:
```bash
docker logs frontend-leema
```

## Важно

- Изменения в HTML/JS/CSS видны сразу (может потребоваться Ctrl+F5 в браузере)
- После изменений можно просто сделать `./reload.sh` или перезапустить контейнер
- Не нужно пересобирать образ при изменении кода!
