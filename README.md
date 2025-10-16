# Fashion AI Platform - Frontend

Фронтенд для платформы модной одежды с AI-примеркой и управлением магазинами.

## 📁 Структура проекта

```
/var/www/frontend_leema/
│
├── public/                           # Публичные страницы (без авторизации)
│   ├── index.html                    # Главная страница входа
│   ├── auth/
│   │   └── callback.html             # OAuth callback
│   └── payment/
│       ├── success.html              # Успешный платеж
│       └── cancel.html               # Отмененный платеж
│
├── user/                             # Панель пользователя
│   └── dashboard.html                # Дашборд пользователя
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
│   │   ├── common/                   # Общие стили
│   │   ├── components/               # Компоненты
│   │   ├── layouts/
│   │   │   ├── style.css             # Главные стили
│   │   │   └── auth.css              # Стили авторизации
│   │   └── pages/
│   │       ├── shop.css              # Стили магазина
│   │       └── payment.css           # Стили платежей
│   │
│   ├── js/
│   │   ├── core/
│   │   │   ├── config.js             # Конфигурация
│   │   │   ├── auth.js               # Авторизация
│   │   │   ├── websocket.js          # WebSocket
│   │   │   └── notifications.js      # Система уведомлений
│   │   ├── services/                 # Бизнес-логика (готово к созданию)
│   │   ├── utils/                    # Утилиты (готово к созданию)
│   │   ├── components/               # Переиспользуемые компоненты
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   └── login.js
│   │   │   ├── user/
│   │   │   │   └── dashboard.js
│   │   │   ├── shop/
│   │   │   │   ├── dashboard.js
│   │   │   │   └── topup.js
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
│   └── RESTRUCTURE_TODO.md
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

## 🚀 Быстрый старт

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка для production
```bash
npm run build
```

### Запуск с Docker
```bash
cd docker
docker-compose up -d
```

## 🎯 Основные возможности

### Для пользователей
- Просмотр каталога товаров
- AI-примерка одежды
- Управление профилем

### Для магазинов
- Управление товарами (CRUD)
- Загрузка изображений
- Биллинг и транзакции
- Пополнение баланса через PayPal
- Просмотр статистики
- Управление профилем

### Для администраторов
- Модерация товаров
- Управление магазинами
- Управление пользователями
- Настройки системы
- Просмотр аналитики
- WebSocket уведомления в реальном времени

## 🔐 Авторизация

Проект использует Google OAuth для авторизации с поддержкой трех типов аккаунтов:
- **User** - обычные пользователи
- **Shop** - владельцы магазинов
- **Admin** - администраторы платформы

## 🛠 Технологии

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Auth**: Google OAuth 2.0
- **Real-time**: WebSocket
- **Payments**: PayPal integration
- **Containerization**: Docker, Nginx

## 📡 API

Backend API: `https://api.leema.kz`

Конфигурация находится в `assets/js/core/config.js`

## 🎨 Структура стилей

Стили организованы модульно:
- `common/` - базовые стили, переменные, утилиты
- `components/` - стили компонентов (кнопки, формы, модалки)
- `layouts/` - стили layout'ов (auth, dashboard, admin)
- `pages/` - стили специфичных страниц

## 📱 Адаптивность

Проект полностью адаптивен и поддерживает:
- Desktop (1920px+)
- Laptop (1366px+)
- Tablet (768px+)
- Mobile (320px+)

## 🔄 WebSocket события

Поддерживаемые события:
- Product moderation updates
- Balance changes
- Transaction notifications
- System notifications

## 📝 Лицензия

ISC

## 👥 Контакты

Для вопросов и предложений свяжитесь с командой разработки.

---

**Статус**: ✅ Реструктурирован и готов к использованию!
