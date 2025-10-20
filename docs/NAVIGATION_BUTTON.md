# Навигационная кнопка "Вернуться на главную"

## Описание

На всех страницах проекта автоматически добавляется единая кнопка "← Вернуться на главную" с единообразным стилем.

## Как это работает

Скрипт `assets/js/shared/navigation.js` автоматически:
1. Определяет тип страницы (admin/shop/user)
2. Определяет соответствующую главную страницу
3. Добавляет кнопку возврата, если текущая страница не является главной
4. Обновляет стиль существующих кнопок "Назад" для единообразия

## Стиль кнопки

```html
<a href="/admin/index.html" class="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium transition-colors group">
    <i class="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
    <span>Вернуться на главную</span>
</a>
```

### Особенности:
- Иконка стрелки с анимацией при наведении
- Фиолетовый цвет (#7c3aed) с плавным переходом
- Flexbox для выравнивания иконки и текста
- Адаптивный дизайн (работает на всех размерах экрана)

## Главные страницы

- Admin: `/admin/index.html`
- Shop: `/shop/index.html`
- User: `/user/index.html`
- Public: `/public/index.html`

## Подключение к новым страницам

Добавьте скрипт перед закрывающим тегом `</body>`:

```html
<script defer src="../../assets/js/shared/navigation.js?v=1001"></script>
</body>
```

## Автоматическое добавление на все страницы

Используйте скрипт `docker/add-navigation-v2.sh`:

```bash
cd /var/www/frontend_leema
./docker/add-navigation-v2.sh
```

Этот скрипт автоматически добавит `navigation.js` на все страницы в директориях `admin`, `shop` и `user`.

## API

Скрипт экспортирует объект `NavigationUtils` с методами:

```javascript
// Добавить кнопку вручную
NavigationUtils.addBackButton();

// Получить URL главной страницы
const homeUrl = NavigationUtils.getHomeUrl();

// Проверить, главная ли это страница
const isHome = NavigationUtils.isHomePage();
```

## Отключение для конкретной страницы

Если нужно отключить кнопку на конкретной странице, просто не добавляйте скрипт `navigation.js` на эту страницу.
