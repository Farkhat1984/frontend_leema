# План реструктуризации проекта Frontend Leema

## 📋 Анализ текущего состояния

### Проблемы текущей структуры:
1. ❌ HTML файлы разбросаны в корне (16 файлов в root)
2. ❌ Дублирование функционала (admin.html, admin-*.html, products-admin.html, products-management.html)
3. ❌ Нет четкого разделения по ролям (admin/shop/user)
4. ❌ Файлы в папке shop/ не связаны логически с остальными
5. ❌ Нет единой структуры для страниц
6. ❌ JS и CSS файлы смешаны в одной папке assets

### Текущая структура (ХАОС):
```
/var/www/frontend_leema/
├── index.html                    # Главная страница (login + shop dashboard)
├── user.html                     # Страница пользователя
├── callback.html                 # OAuth callback
├── topup.html                    # Пополнение баланса
├── success.html                  # Успешный платеж
├── cancel.html                   # Отмененный платеж
├── admin.html                    # Главная админки
├── admin-dashboard.html          # Админ дашборд
├── admin-products.html           # Управление товарами (admin)
├── admin-shops.html              # Управление магазинами
├── admin-users.html              # Управление пользователями
├── admin-settings.html           # Настройки системы
├── products-admin.html           # ДУБЛИКАТ admin-products
├── products-management.html      # ДУБЛИКАТ admin-products
├── shops-management.html         # ДУБЛИКАТ admin-shops
├── users-management.html         # ДУБЛИКАТ admin-users
├── shop/
│   ├── billing.html              # Биллинг магазина
│   ├── products.html             # Товары магазина
│   └── profile.html              # Профиль магазина
└── assets/
    ├── css/
    │   ├── style.css             # Общие стили
    │   ├── shop.css              # Стили магазина
    │   └── topup.css             # Стили пополнения
    └── js/
        ├── config.js
        ├── websocket.js
        ├── notifications.js
        ├── admin.js
        ├── admin-common.js
        ├── admin-dashboard.js
        ├── admin-products.js
        ├── admin-shops.js
        ├── admin-users.js
        ├── admin-settings.js
        ├── products-admin.js      # ДУБЛИКАТ
        ├── products-management.js # ДУБЛИКАТ
        ├── shops-management.js    # ДУБЛИКАТ
        ├── users-management.js    # ДУБЛИКАТ
        ├── shop.js
        └── topup.js
```

---

## 🎯 Целевая структура (ОРГАНИЗОВАННАЯ)

### Принципы организации:
1. ✅ Разделение по ролям (public / user / shop / admin)
2. ✅ Модульная структура
3. ✅ Четкая иерархия папок
4. ✅ Логическая группировка файлов
5. ✅ Удаление дубликатов
6. ✅ Следование паттернам MVC/Feature-based

```
/var/www/frontend_leema/
│
├── public/                           # Публичные страницы (доступны без авторизации)
│   ├── index.html                    # Главная страница входа
│   ├── auth/
│   │   └── callback.html             # OAuth callback
│   └── payment/
│       ├── success.html              # Успешный платеж
│       └── cancel.html               # Отмененный платеж
│
├── user/                             # Панель пользователя
│   └── dashboard.html                # Дашборд пользователя (было user.html)
│
├── shop/                             # Панель магазина
│   ├── index.html                    # Главная панель магазина
│   ├── products/
│   │   └── index.html                # Управление товарами
│   ├── billing/
│   │   ├── index.html                # Биллинг и транзакции
│   │   └── topup.html                # Пополнение баланса
│   └── profile/
│       └── index.html                # Профиль магазина
│
├── admin/                            # Административная панель
│   ├── index.html                    # Главная админки (дашборд)
│   ├── products/
│   │   └── index.html                # Управление товарами
│   ├── shops/
│   │   └── index.html                # Управление магазинами
│   ├── users/
│   │   └── index.html                # Управление пользователями
│   └── settings/
│       └── index.html                # Настройки системы
│
├── assets/
│   ├── css/
│   │   ├── common/
│   │   │   ├── base.css              # Базовые стили
│   │   │   ├── variables.css         # CSS переменные
│   │   │   └── utilities.css         # Утилиты
│   │   ├── components/
│   │   │   ├── buttons.css
│   │   │   ├── forms.css
│   │   │   ├── modals.css
│   │   │   ├── cards.css
│   │   │   └── navigation.css
│   │   ├── layouts/
│   │   │   ├── auth.css              # Стили авторизации
│   │   │   ├── dashboard.css         # Стили дашбордов
│   │   │   └── admin.css             # Стили админки
│   │   └── pages/
│   │       ├── shop.css              # Стили магазина
│   │       ├── payment.css           # Стили платежей
│   │       └── user.css              # Стили пользователя
│   │
│   ├── js/
│   │   ├── core/
│   │   │   ├── config.js             # Конфигурация
│   │   │   ├── api.js                # API клиент
│   │   │   ├── auth.js               # Авторизация
│   │   │   ├── websocket.js          # WebSocket
│   │   │   └── notifications.js      # Система уведомлений
│   │   ├── services/
│   │   │   ├── product.service.js    # Сервис товаров
│   │   │   ├── shop.service.js       # Сервис магазинов
│   │   │   ├── user.service.js       # Сервис пользователей
│   │   │   └── payment.service.js    # Сервис платежей
│   │   ├── utils/
│   │   │   ├── helpers.js            # Вспомогательные функции
│   │   │   ├── validators.js         # Валидаторы
│   │   │   └── formatters.js         # Форматтеры
│   │   ├── components/
│   │   │   ├── modal.js              # Модальные окна
│   │   │   ├── table.js              # Таблицы
│   │   │   ├── pagination.js         # Пагинация
│   │   │   └── imageUpload.js        # Загрузка изображений
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── login.js
│   │   │   │   └── callback.js
│   │   │   ├── user/
│   │   │   │   └── dashboard.js
│   │   │   ├── shop/
│   │   │   │   ├── dashboard.js
│   │   │   │   ├── products.js
│   │   │   │   ├── billing.js
│   │   │   │   └── profile.js
│   │   │   └── admin/
│   │   │       ├── dashboard.js
│   │   │       ├── products.js
│   │   │       ├── shops.js
│   │   │       ├── users.js
│   │   │       └── settings.js
│   │   └── shared/
│   │       └── common.js             # Общий функционал
│   │
│   └── images/                       # Изображения, иконки, лого
│
├── docs/                             # Документация
│   ├── ADMIN_REFACTORING.md
│   ├── REACT_REFACTORING_PLAN.md
│   └── RESTRUCTURE_TODO.md (этот файл)
│
├── docker/                           # Docker конфигурация
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
│
├── package.json
├── .gitignore
└── README.md
```

---

## 📝 TODO LIST - Пошаговый план

### ✅ Этап 1: Подготовка и анализ
- [x] Изучить все файлы проекта
- [x] Определить дубликаты
- [x] Составить карту зависимостей
- [x] Создать план реструктуризации

### 🔄 Этап 2: Создание новой структуры папок (БЕЗ ПЕРЕНОСА ФАЙЛОВ)
- [ ] Создать структуру public/
  - [ ] public/auth/
  - [ ] public/payment/
- [ ] Создать структуру user/
- [ ] Создать структуру shop/
  - [ ] shop/products/
  - [ ] shop/billing/
  - [ ] shop/profile/
- [ ] Создать структуру admin/
  - [ ] admin/products/
  - [ ] admin/shops/
  - [ ] admin/users/
  - [ ] admin/settings/
- [ ] Создать новую структуру assets/
  - [ ] assets/css/common/
  - [ ] assets/css/components/
  - [ ] assets/css/layouts/
  - [ ] assets/css/pages/
  - [ ] assets/js/core/
  - [ ] assets/js/services/
  - [ ] assets/js/utils/
  - [ ] assets/js/components/
  - [ ] assets/js/pages/
  - [ ] assets/js/shared/
- [ ] Создать папку docs/
- [ ] Создать папку docker/

### 🔄 Этап 3: Перенос и организация HTML файлов

#### Public страницы:
- [ ] index.html → public/index.html (обновить пути к assets)
- [ ] callback.html → public/auth/callback.html (обновить пути)
- [ ] success.html → public/payment/success.html (обновить пути)
- [ ] cancel.html → public/payment/cancel.html (обновить пути)

#### User страницы:
- [ ] user.html → user/dashboard.html (обновить пути)

#### Shop страницы:
- [ ] Создать shop/index.html (объединить функционал из index.html - shop dashboard)
- [ ] shop/products.html → shop/products/index.html (обновить пути)
- [ ] shop/billing.html → shop/billing/index.html (обновить пути)
- [ ] topup.html → shop/billing/topup.html (обновить пути)
- [ ] shop/profile.html → shop/profile/index.html (обновить пути)

#### Admin страницы:
- [ ] admin.html → admin/index.html (главная админки)
- [ ] Объединить admin-dashboard.html → admin/index.html (если дублируется)
- [ ] admin-products.html → admin/products/index.html (обновить пути)
- [ ] admin-shops.html → admin/shops/index.html (обновить пути)
- [ ] admin-users.html → admin/users/index.html (обновить пути)
- [ ] admin-settings.html → admin/settings/index.html (обновить пути)

#### Удалить дубликаты:
- [ ] УДАЛИТЬ products-admin.html (дубликат admin-products.html)
- [ ] УДАЛИТЬ products-management.html (дубликат admin-products.html)
- [ ] УДАЛИТЬ shops-management.html (дубликат admin-shops.html)
- [ ] УДАЛИТЬ users-management.html (дубликат admin-users.html)

### 🔄 Этап 4: Реорганизация CSS файлов

#### Разбить style.css на модули:
- [ ] Извлечь CSS переменные → assets/css/common/variables.css
- [ ] Извлечь базовые стили → assets/css/common/base.css
- [ ] Извлечь утилиты → assets/css/common/utilities.css
- [ ] Извлечь стили кнопок → assets/css/components/buttons.css
- [ ] Извлечь стили форм → assets/css/components/forms.css
- [ ] Извлечь стили модалок → assets/css/components/modals.css
- [ ] Извлечь стили карточек → assets/css/components/cards.css
- [ ] Извлечь стили навигации → assets/css/components/navigation.css
- [ ] Извлечь стили авторизации → assets/css/layouts/auth.css
- [ ] Извлечь стили дашборда → assets/css/layouts/dashboard.css
- [ ] Извлечь стили админки → assets/css/layouts/admin.css

#### Перенести специфичные стили:
- [ ] shop.css → assets/css/pages/shop.css
- [ ] topup.css → assets/css/pages/payment.css (переименовать)
- [ ] Создать assets/css/pages/user.css (если нужно)

#### Создать главный файл:
- [ ] Создать assets/css/main.css (импортирует все модули)

### 🔄 Этап 5: Реорганизация JavaScript файлов

#### Core модули:
- [ ] config.js → assets/js/core/config.js
- [ ] websocket.js → assets/js/core/websocket.js
- [ ] notifications.js → assets/js/core/notifications.js
- [ ] Создать assets/js/core/api.js (базовый API клиент)
- [ ] Создать assets/js/core/auth.js (авторизация)

#### Services:
- [ ] Создать assets/js/services/product.service.js (из admin-products.js)
- [ ] Создать assets/js/services/shop.service.js (из admin-shops.js)
- [ ] Создать assets/js/services/user.service.js (из admin-users.js)
- [ ] Создать assets/js/services/payment.service.js (из topup.js)

#### Utils:
- [ ] Создать assets/js/utils/helpers.js
- [ ] Создать assets/js/utils/validators.js
- [ ] Создать assets/js/utils/formatters.js

#### Components:
- [ ] Создать assets/js/components/modal.js
- [ ] Создать assets/js/components/table.js
- [ ] Создать assets/js/components/pagination.js
- [ ] Создать assets/js/components/imageUpload.js

#### Pages - Public:
- [ ] Создать assets/js/pages/public/login.js (из index.html login логики)
- [ ] Создать assets/js/pages/public/callback.js (из callback.html)

#### Pages - User:
- [ ] Создать assets/js/pages/user/dashboard.js (из user.html)

#### Pages - Shop:
- [ ] shop.js → assets/js/pages/shop/dashboard.js (рефакторинг)
- [ ] Создать assets/js/pages/shop/products.js (из shop/products.html)
- [ ] Создать assets/js/pages/shop/billing.js (из shop/billing.html)
- [ ] topup.js → assets/js/pages/shop/topup.js
- [ ] Создать assets/js/pages/shop/profile.js (из shop/profile.html)

#### Pages - Admin:
- [ ] admin.js → assets/js/pages/admin/dashboard.js (рефакторинг)
- [ ] admin-products.js → assets/js/pages/admin/products.js
- [ ] admin-shops.js → assets/js/pages/admin/shops.js
- [ ] admin-users.js → assets/js/pages/admin/users.js
- [ ] admin-settings.js → assets/js/pages/admin/settings.js

#### Shared:
- [ ] admin-common.js → assets/js/shared/common.js

#### Удалить дубликаты:
- [ ] УДАЛИТЬ products-admin.js (дубликат admin-products.js)
- [ ] УДАЛИТЬ products-management.js (дубликат)
- [ ] УДАЛИТЬ shops-management.js (дубликат)
- [ ] УДАЛИТЬ users-management.js (дубликат)
- [ ] УДАЛИТЬ admin-dashboard.js (если объединен с admin.js)
- [ ] УДАЛИТЬ admin.js.bak (бэкап файл)

### 🔄 Этап 6: Обновление путей во всех файлах

#### HTML файлы:
- [ ] Обновить пути к CSS в public/index.html
- [ ] Обновить пути к JS в public/index.html
- [ ] Обновить пути к CSS в public/auth/callback.html
- [ ] Обновить пути к JS в public/auth/callback.html
- [ ] Обновить пути в public/payment/success.html
- [ ] Обновить пути в public/payment/cancel.html
- [ ] Обновить пути в user/dashboard.html
- [ ] Обновить пути в shop/index.html
- [ ] Обновить пути в shop/products/index.html
- [ ] Обновить пути в shop/billing/index.html
- [ ] Обновить пути в shop/billing/topup.html
- [ ] Обновить пути в shop/profile/index.html
- [ ] Обновить пути в admin/index.html
- [ ] Обновить пути в admin/products/index.html
- [ ] Обновить пути в admin/shops/index.html
- [ ] Обновить пути в admin/users/index.html
- [ ] Обновить пути в admin/settings/index.html

#### JavaScript файлы:
- [ ] Обновить импорты в assets/js/core/config.js
- [ ] Обновить импорты во всех services
- [ ] Обновить импорты во всех utils
- [ ] Обновить импорты во всех components
- [ ] Обновить импорты во всех pages
- [ ] Обновить API пути в config.js

#### CSS файлы:
- [ ] Создать imports в main.css
- [ ] Обновить пути к изображениям (если есть)

### 🔄 Этап 7: Перенос документации и конфигурации

- [ ] Переместить ADMIN_REFACTORING.md → docs/
- [ ] Переместить REACT_REFACTORING_PLAN.md → docs/
- [ ] Переместить RESTRUCTURE_TODO.md → docs/
- [ ] Переместить Dockerfile → docker/
- [ ] Переместить docker-compose.yml → docker/
- [ ] Переместить nginx.conf → docker/
- [ ] Обновить пути в docker-compose.yml
- [ ] Обновить пути в Dockerfile

### 🔄 Этап 8: Обновление навигации

#### Обновить ссылки навигации:
- [ ] В public/index.html обновить редиректы
- [ ] В shop/index.html обновить навигацию между разделами
- [ ] В admin/index.html обновить навигацию между разделами
- [ ] В всех shop/* страницах обновить ссылки "назад"
- [ ] В всех admin/* страницах обновить ссылки "назад"

### 🔄 Этап 9: Тестирование

#### Функциональное тестирование:
- [ ] Протестировать авторизацию (Google OAuth)
- [ ] Протестировать callback страницу
- [ ] Протестировать редиректы по ролям
- [ ] Протестировать user dashboard
- [ ] Протестировать shop dashboard
- [ ] Протестировать управление товарами (shop)
- [ ] Протестировать биллинг (shop)
- [ ] Протестировать пополнение баланса
- [ ] Протестировать профиль магазина
- [ ] Протестировать admin dashboard
- [ ] Протестировать модерацию товаров (admin)
- [ ] Протестировать управление магазинами (admin)
- [ ] Протестировать управление пользователями (admin)
- [ ] Протестировать настройки системы (admin)
- [ ] Протестировать WebSocket уведомления
- [ ] Протестировать все CRUD операции
- [ ] Протестировать все формы
- [ ] Протестировать все модальные окна

#### Технические проверки:
- [ ] Проверить загрузку всех CSS файлов
- [ ] Проверить загрузку всех JS файлов
- [ ] Проверить отсутствие 404 ошибок
- [ ] Проверить консоль браузера на ошибки
- [ ] Проверить работу на разных браузерах
- [ ] Проверить адаптивность на мобильных

### 🔄 Этап 10: Финализация

- [ ] Удалить старые файлы из корня (после подтверждения)
- [ ] Удалить старую папку shop/ (после переноса)
- [ ] Удалить дубликаты JS файлов
- [ ] Очистить старую структуру assets/
- [ ] Обновить .gitignore
- [ ] Обновить README.md с новой структурой
- [ ] Создать CHANGELOG.md
- [ ] Закоммитить изменения в git

### 🔄 Этап 11: Docker и деплой

- [ ] Обновить Dockerfile с новыми путями
- [ ] Обновить nginx.conf с новыми путями
- [ ] Обновить docker-compose.yml
- [ ] Протестировать Docker build
- [ ] Протестировать Docker run
- [ ] Проверить работу в контейнере
- [ ] Создать production сборку

---

## 🎯 Карта зависимостей файлов

### HTML → JS зависимости:

#### public/index.html (главная):
- assets/js/core/config.js
- assets/js/core/auth.js
- assets/js/pages/public/login.js

#### public/auth/callback.html:
- assets/js/core/config.js
- assets/js/pages/public/callback.js

#### user/dashboard.html:
- assets/js/core/config.js
- assets/js/core/auth.js
- assets/js/core/websocket.js
- assets/js/core/notifications.js
- assets/js/pages/user/dashboard.js

#### shop/index.html (dashboard):
- assets/js/core/config.js
- assets/js/core/auth.js
- assets/js/core/websocket.js
- assets/js/core/notifications.js
- assets/js/shared/common.js
- assets/js/pages/shop/dashboard.js

#### shop/products/index.html:
- assets/js/core/config.js
- assets/js/core/auth.js
- assets/js/services/product.service.js
- assets/js/components/modal.js
- assets/js/components/imageUpload.js
- assets/js/pages/shop/products.js

#### shop/billing/index.html:
- assets/js/core/config.js
- assets/js/core/auth.js
- assets/js/services/payment.service.js
- assets/js/pages/shop/billing.js

#### shop/billing/topup.html:
- assets/js/core/config.js
- assets/js/services/payment.service.js
- assets/js/pages/shop/topup.js

#### admin/index.html:
- assets/js/core/config.js
- assets/js/core/auth.js
- assets/js/core/websocket.js
- assets/js/core/notifications.js
- assets/js/shared/common.js
- assets/js/pages/admin/dashboard.js

#### admin/products/index.html:
- assets/js/core/config.js
- assets/js/shared/common.js
- assets/js/services/product.service.js
- assets/js/pages/admin/products.js

#### admin/shops/index.html:
- assets/js/core/config.js
- assets/js/shared/common.js
- assets/js/services/shop.service.js
- assets/js/pages/admin/shops.js

#### admin/users/index.html:
- assets/js/core/config.js
- assets/js/shared/common.js
- assets/js/services/user.service.js
- assets/js/pages/admin/users.js

#### admin/settings/index.html:
- assets/js/core/config.js
- assets/js/shared/common.js
- assets/js/pages/admin/settings.js

---

## 📊 Метрики проекта

### Файлы для удаления (дубликаты):
1. products-admin.html
2. products-management.html
3. shops-management.html
4. users-management.html
5. admin-dashboard.html (возможно)
6. products-admin.js
7. products-management.js
8. shops-management.js
9. users-management.js
10. admin.js.bak

**Всего к удалению: 10 файлов**

### Файлы для переноса:
- HTML: 16 файлов → реорганизация в 18 файлов (с новой структурой)
- CSS: 3 файла → 12+ модульных файлов
- JS: 19 файлов → 30+ модульных файлов

### Новые файлы для создания:
- CSS модули: ~12 файлов
- JS сервисы: ~4 файла
- JS utils: ~3 файла
- JS components: ~4 файла
- Главный CSS: 1 файл

---

## ⚠️ Критические моменты (не потерять функционал!)

1. **WebSocket подключения** - сохранить всю логику из websocket.js
2. **OAuth авторизация** - сохранить flow из callback.html
3. **Модерация товаров** - сохранить approve/reject логику
4. **Загрузка изображений** - сохранить image upload функционал
5. **PayPal интеграция** - сохранить payment flow
6. **Real-time уведомления** - сохранить notifications.js логику
7. **Пагинация** - сохранить во всех списках
8. **Фильтры и поиск** - сохранить в админке
9. **Валидация форм** - сохранить все проверки
10. **API токены** - сохранить в config.js

---

## 🚀 Порядок выполнения (приоритет)

### Приоритет 1 (ВЫСОКИЙ) - Критическая инфраструктура:
1. Создать структуру папок
2. Перенести config.js
3. Перенести auth логику
4. Перенести websocket.js
5. Перенести notifications.js

### Приоритет 2 (СРЕДНИЙ) - Основной функционал:
1. Реорганизовать HTML файлы
2. Обновить пути в HTML
3. Создать сервисы
4. Перенести страницы shop
5. Перенести страницы admin

### Приоритет 3 (НИЗКИЙ) - Стилизация и оптимизация:
1. Разбить CSS на модули
2. Создать компоненты
3. Создать utils
4. Оптимизировать код
5. Документация

---

## 📚 Паттерны проектирования применяемые:

1. **Feature-based structure** - группировка по функциональности
2. **Module pattern** - модульная организация JS
3. **Service layer** - разделение бизнес-логики
4. **Component-based** - переиспользуемые компоненты
5. **MVC-like** - разделение логики, представления, данных
6. **DRY** - избежание дублирования кода
7. **Separation of Concerns** - разделение ответственности
8. **Single Responsibility** - один файл = одна задача

---

## ✅ Критерии успешности:

1. ✅ Нет дубликатов файлов
2. ✅ Четкая структура папок
3. ✅ Модульный код
4. ✅ Легко найти любой файл
5. ✅ Весь функционал работает
6. ✅ Нет ошибок в консоли
7. ✅ Все тесты проходят
8. ✅ Docker собирается и работает
9. ✅ Код легко поддерживать
10. ✅ Готово к дальнейшему развитию

---

## 🎉 Результат:

Из ХАОСА с 16 HTML файлами в корне, дубликатами и смешанными стилями получим ОРГАНИЗОВАННУЮ структуру с четким разделением по ролям, модульным кодом и легкой навигацией!

**Статус: ГОТОВ К ВЫПОЛНЕНИЮ! 🚀**
