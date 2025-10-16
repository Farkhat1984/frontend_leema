# План рефакторинга Frontend Leema на React с Docker

## Текущая структура проекта

### Существующие страницы и функционал:
1. **index.html** - Главная страница (панель магазина)
   - Авторизация через Google (user/shop)
   - Dashboard магазина со статистикой
   - Управление товарами (CRUD)
   - Биллинг и платежи
   - Профиль магазина

2. **admin.html** - Административная панель
   - Управление товарами
   - Управление магазинами
   - Управление пользователями
   - Настройки системы

3. **Другие страницы:**
   - callback.html - OAuth callback
   - topup.html - Пополнение баланса
   - success.html - Успешный платеж
   - cancel.html - Отмененный платеж
   - products-management.html
   - shops-management.html
   - users-management.html

### Ключевые технологии:
- Vanilla JavaScript
- WebSocket для real-time обновлений
- Google OAuth авторизация
- PayPal интеграция
- RESTful API (https://api.leema.kz)

---

## Этапы рефакторинга

### Этап 1: Настройка React проекта
**Цель:** Создать современное React приложение с необходимыми инструментами

**Действия:**
1. Создать новую структуру проекта React
2. Настроить:
   - React Router для маршрутизации
   - Axios для API запросов
   - Context API для управления состоянием
   - WebSocket клиент
   - CSS-in-JS или styled-components
3. Установить необходимые зависимости:
   - react, react-dom, react-router-dom
   - axios
   - @tanstack/react-query (для кеширования)
   - zustand или redux (state management)
   - socket.io-client или native WebSocket
   - react-toastify (уведомления)

**Файлы для создания:**
```
react-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   ├── utils/
│   ├── styles/
│   ├── App.jsx
│   └── index.js
├── package.json
├── Dockerfile
└── .dockerignore
```

---

### Этап 2: Структура компонентов и страниц
**Цель:** Разработать модульную архитектуру компонентов

#### 2.1 Общие компоненты (components/common/)
- **Layout**
  - Header.jsx - Шапка с навигацией
  - Sidebar.jsx - Боковое меню (для админки)
  - Footer.jsx - Подвал

- **UI Components**
  - Button.jsx - Кнопки
  - Input.jsx - Поля ввода
  - Modal.jsx - Модальные окна
  - Card.jsx - Карточки
  - Alert.jsx - Уведомления
  - LoadingSpinner.jsx - Загрузка
  - Pagination.jsx - Пагинация
  - ConfirmDialog.jsx - Диалог подтверждения

- **WebSocket**
  - WebSocketProvider.jsx - Провайдер для WebSocket
  - NotificationToast.jsx - Toast уведомления
  - ConnectionStatus.jsx - Индикатор подключения

#### 2.2 Страницы (pages/)
- **Auth**
  - LoginPage.jsx - Страница входа
  - CallbackPage.jsx - OAuth callback

- **Shop Dashboard** (pages/shop/)
  - ShopDashboard.jsx - Главная панель магазина
  - ProductsList.jsx - Список товаров
  - ProductForm.jsx - Форма создания/редактирования товара
  - ShopProfile.jsx - Профиль магазина
  - BillingSection.jsx - Биллинг и транзакции
  - ActiveRents.jsx - Активные подписки

- **Admin Dashboard** (pages/admin/)
  - AdminDashboard.jsx - Главная админ панель
  - ProductsManagement.jsx - Управление товарами
  - ShopsManagement.jsx - Управление магазинами
  - UsersManagement.jsx - Управление пользователями
  - SettingsManagement.jsx - Настройки системы

- **Payment**
  - TopUpPage.jsx - Пополнение баланса
  - SuccessPage.jsx - Успешный платеж
  - CancelPage.jsx - Отмененный платеж

#### 2.3 Хуки (hooks/)
- useAuth.js - Авторизация
- useWebSocket.js - WebSocket подключение
- useNotifications.js - Уведомления
- useProducts.js - Работа с товарами
- useTransactions.js - Транзакции
- useSettings.js - Настройки

#### 2.4 Сервисы (services/)
- api.js - Базовый API клиент (axios)
- authService.js - Авторизация
- productService.js - Товары
- shopService.js - Магазины
- userService.js - Пользователи
- paymentService.js - Платежи
- websocketService.js - WebSocket менеджер
- notificationService.js - Уведомления

#### 2.5 Контекст (context/)
- AuthContext.jsx - Контекст авторизации
- WebSocketContext.jsx - Контекст WebSocket
- NotificationContext.jsx - Контекст уведомлений
- ConfigContext.jsx - Конфигурация (API URLs)

---

### Этап 3: Миграция функционала

#### 3.1 Авторизация и OAuth
**Исходные файлы:** index.html (loginWithGoogle), callback.html

**Новая реализация:**
- LoginPage с кнопками входа
- Google OAuth flow
- Обработка callback
- Сохранение токенов в localStorage
- Protected routes

**Компоненты:**
```jsx
// LoginPage.jsx
- Google Sign In кнопки (user/shop)
- Редирект на Google OAuth
- Обработка типа аккаунта

// CallbackPage.jsx
- Обработка OAuth callback
- Получение токенов
- Редирект на dashboard
```

#### 3.2 Панель магазина (Shop Dashboard)
**Исходные файлы:** index.html, shop.js

**Функционал для миграции:**
1. **Статистика магазина**
   - Всего товаров
   - Активных товаров
   - Просмотры
   - Примерки

2. **Профиль магазина**
   - Редактирование названия
   - Описание
   - Email (readonly)

3. **Биллинг**
   - Баланс магазина
   - Заработано всего
   - История транзакций
   - Активные подписки
   - Пополнение баланса

4. **Товары**
   - Список товаров с пагинацией
   - Создание товара
   - Редактирование товара
   - Удаление товара
   - Загрузка изображений
   - Статусы модерации

**Компоненты:**
```jsx
// ShopDashboard.jsx - Главный контейнер
  ├── StatsGrid.jsx - Статистика
  ├── ShopProfile.jsx - Профиль
  ├── BillingSection.jsx
  │   ├── BalanceCard.jsx
  │   ├── TransactionsList.jsx
  │   └── ActiveRents.jsx
  └── ProductsSection.jsx
      ├── ProductCard.jsx
      ├── ProductModal.jsx (create/edit)
      └── Pagination.jsx
```

#### 3.3 Административная панель
**Исходные файлы:** admin.html, admin.js, admin-*.js

**Функционал для миграции:**
1. **Dashboard**
   - Общая статистика
   - Очередь модерации

2. **Управление товарами**
   - Модерация товаров
   - Approve/Reject
   - Просмотр деталей

3. **Управление магазинами**
   - Список магазинов
   - Блокировка/разблокировка
   - Просмотр статистики

4. **Управление пользователями**
   - Список пользователей
   - Управление ролями
   - Статистика

5. **Настройки системы**
   - Product rent price
   - Approval fee
   - Другие настройки

**Компоненты:**
```jsx
// AdminDashboard.jsx
  ├── AdminSidebar.jsx
  ├── AdminStats.jsx
  └── ModerationQueue.jsx

// ProductsManagement.jsx
  ├── ProductsTable.jsx
  ├── ModerationModal.jsx
  └── ProductDetails.jsx

// ShopsManagement.jsx
  └── ShopsTable.jsx

// UsersManagement.jsx
  └── UsersTable.jsx

// SettingsManagement.jsx
  └── SettingsForm.jsx
```

#### 3.4 WebSocket интеграция
**Исходные файлы:** websocket.js, notifications.js

**Функционал для миграции:**
1. WebSocket менеджер
   - Подключение/переподключение
   - Heartbeat (ping/pong)
   - Обработка событий
   - Подписка на комнаты

2. Система уведомлений
   - Toast notifications
   - История уведомлений
   - Badge с количеством
   - Обработка всех типов событий

**Реализация:**
```jsx
// WebSocketProvider.jsx
- useWebSocket hook
- Event handlers
- Auto-reconnect
- Connection status

// NotificationProvider.jsx
- Toast system (react-toastify)
- Notification history
- Event handling
```

#### 3.5 Платежная система
**Исходные файлы:** topup.html, success.html, cancel.html

**Функционал:**
1. Пополнение баланса (PayPal)
2. Оплата аренды товара
3. Success/Cancel страницы

**Компоненты:**
```jsx
// TopUpPage.jsx
// SuccessPage.jsx
// CancelPage.jsx
```

---

### Этап 4: Стилизация
**Цель:** Перенести все стили в React-формат

**Подходы:**
1. **CSS Modules** - модульные стили
2. **Styled Components** - CSS-in-JS
3. **Tailwind CSS** - utility-first (опционально)

**Действия:**
1. Конвертировать style.css → глобальные стили
2. Конвертировать shop.css → стили компонентов магазина
3. Конвертировать topup.css → стили платежных страниц
4. Создать theme.js для общих переменных (цвета, шрифты)

---

### Этап 5: Конфигурация и окружение
**Цель:** Настроить переменные окружения

**Файлы:**
```env
# .env.development
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000/ws

# .env.production
REACT_APP_API_URL=https://api.leema.kz
REACT_APP_WS_URL=wss://api.leema.kz/ws
```

**Config:**
```js
// config.js
const config = {
  apiUrl: process.env.REACT_APP_API_URL,
  wsUrl: process.env.REACT_APP_WS_URL,
};
export default config;
```

---

### Этап 6: Docker конфигурация
**Цель:** Контейнеризация React приложения

#### 6.1 Multi-stage Dockerfile
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 6.2 Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./react-frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=https://api.leema.kz
      - REACT_APP_WS_URL=wss://api.leema.kz/ws
    volumes:
      - ./react-frontend:/app
      - /app/node_modules
```

#### 6.3 Nginx конфигурация
```nginx
server {
  listen 80;

  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
  }

  # Proxy API requests
  location /api {
    proxy_pass https://api.leema.kz;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

### Этап 7: Тестирование и оптимизация

#### 7.1 Тестирование
1. Unit тесты (Jest + React Testing Library)
2. E2E тесты (Cypress)
3. Тестирование WebSocket соединений
4. Тестирование OAuth flow

#### 7.2 Оптимизация
1. Code splitting (React.lazy)
2. Image optimization
3. Bundle size optimization
4. Мemoization (React.memo, useMemo, useCallback)
5. Service Worker для PWA (опционально)

---

## Детальный план выполнения (пошаговый)

### Шаг 1: Инициализация проекта ✓
- [ ] Создать React приложение (create-react-app или Vite)
- [ ] Настроить структуру папок
- [ ] Установить зависимости
- [ ] Настроить ESLint и Prettier

### Шаг 2: Базовая инфраструктура ✓
- [ ] Создать API сервис (axios)
- [ ] Настроить React Router
- [ ] Создать контексты (Auth, WebSocket, Notifications)
- [ ] Настроить переменные окружения

### Шаг 3: Авторизация ✓
- [ ] LoginPage компонент
- [ ] CallbackPage компонент
- [ ] AuthContext и useAuth hook
- [ ] Protected Routes
- [ ] Logout функционал

### Шаг 4: Общие компоненты ✓
- [ ] Layout (Header, Footer)
- [ ] UI компоненты (Button, Input, Modal, Card)
- [ ] Alert/Toast система
- [ ] LoadingSpinner
- [ ] Pagination

### Шаг 5: Панель магазина ✓
- [ ] ShopDashboard layout
- [ ] StatsGrid компонент
- [ ] ShopProfile компонент
- [ ] ProductsList с пагинацией
- [ ] ProductForm (create/edit)
- [ ] Image upload функционал
- [ ] Delete с подтверждением
- [ ] BillingSection
- [ ] TransactionsList
- [ ] ActiveRents

### Шаг 6: Административная панель ✓
- [ ] AdminDashboard layout
- [ ] AdminSidebar
- [ ] ProductsManagement (модерация)
- [ ] ShopsManagement
- [ ] UsersManagement
- [ ] SettingsManagement

### Шаг 7: WebSocket и уведомления ✓
- [ ] WebSocketProvider
- [ ] useWebSocket hook
- [ ] NotificationProvider
- [ ] Toast уведомления
- [ ] Event handlers для всех событий
- [ ] Connection status индикатор
- [ ] История уведомлений

### Шаг 8: Платежная система ✓
- [ ] TopUpPage
- [ ] PayPal интеграция
- [ ] SuccessPage
- [ ] CancelPage
- [ ] Rent payment функционал

### Шаг 9: Стилизация ✓
- [ ] Перенести стили из style.css
- [ ] Создать theme
- [ ] Адаптивная верстка
- [ ] Анимации и transitions

### Шаг 10: Docker ✓
- [ ] Dockerfile (multi-stage)
- [ ] docker-compose.yml
- [ ] nginx.conf
- [ ] .dockerignore
- [ ] Build и тест

### Шаг 11: Финальная проверка ✓
- [ ] Тестирование всех функций
- [ ] Проверка WebSocket
- [ ] Проверка OAuth
- [ ] Проверка всех CRUD операций
- [ ] Проверка адаптивности
- [ ] Оптимизация производительности

---

## Ключевые зависимости

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0",
    "react-toastify": "^9.1.0",
    "socket.io-client": "^4.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

---

## Сохраняемый функционал

### ✅ Полностью сохраняется:
1. Google OAuth авторизация (user/shop/admin)
2. Панель магазина с CRUD товаров
3. Загрузка изображений
4. Биллинг и транзакции
5. PayPal интеграция
6. WebSocket real-time обновления
7. Система уведомлений
8. Административная панель
9. Модерация товаров
10. Управление магазинами и пользователями
11. Настройки системы
12. Пагинация
13. Все API эндпоинты

### 🎯 Улучшения:
1. Модульная компонентная архитектура
2. Переиспользуемые компоненты
3. Централизованное управление состоянием
4. Оптимизация производительности
5. Лучшая типизация (опционально TypeScript)
6. Современный инструментарий сборки
7. Docker контейнеризация
8. Улучшенная поддержка окружений
9. Code splitting
10. Лучшая структура проекта

---

## Примерное время выполнения

| Этап | Время |
|------|-------|
| 1. Инициализация проекта | 1 час |
| 2. Базовая инфраструктура | 2 часа |
| 3. Авторизация | 2 часа |
| 4. Общие компоненты | 3 часа |
| 5. Панель магазина | 6 часов |
| 6. Административная панель | 6 часов |
| 7. WebSocket и уведомления | 3 часа |
| 8. Платежная система | 2 часа |
| 9. Стилизация | 4 часа |
| 10. Docker | 2 часа |
| 11. Финальная проверка | 3 часа |
| **ИТОГО** | **34 часа** |

---

## Заключение

Этот план обеспечивает:
- ✅ Полное сохранение функционала
- ✅ Современная React архитектура
- ✅ Docker контейнеризация
- ✅ Улучшенная поддержка
- ✅ Масштабируемость
- ✅ Производительность

Готов приступить к реализации! 🚀
