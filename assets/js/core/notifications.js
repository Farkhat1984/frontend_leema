/**
 * Notification System для Fashion AI Platform
 *
 * Управляет отображением уведомлений (toast notifications)
 * для WebSocket событий
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 50; // Максимум уведомлений в истории
        this.container = null;
        this.badge = null;
        this.unreadCount = 0;

        this.init();
    }

    /**
     * Инициализация
     */
    init() {
        // Создаем контейнер для toast уведомлений
        this.createToastContainer();

        // Создаем badge для количества непрочитанных
        this.createNotificationBadge();
    }

    /**
     * Создать контейнер для toast уведомлений
     */
    createToastContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * Создать badge для количества уведомлений
     */
    createNotificationBadge() {
        // Badge будет добавлен в header через CSS
        this.badge = document.createElement('div');
        this.badge.id = 'notificationBadge';
        this.badge.className = 'notification-badge';
        this.badge.style.display = 'none';

        // Добавляем в header, если есть
        const header = document.querySelector('.header .user-info');
        if (header) {
            header.insertBefore(this.badge, header.firstChild);
        }
    }

    /**
     * Показать toast уведомление
     * @param {string} message - Текст уведомления
     * @param {string} type - Тип: success, error, warning, info
     * @param {number} duration - Длительность отображения в мс (0 = бесконечно)
     */
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Иконка в зависимости от типа
        const icon = this.getIcon(type);

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        this.container.appendChild(toast);

        // Анимация появления
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Автоматическое удаление
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Удалить toast уведомление
     */
    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Получить иконку для типа уведомления
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Обработать WebSocket событие и показать уведомление
     * @param {object} eventData - Данные события
     */
    handleWebSocketEvent(eventData) {
        const eventType = eventData.event;
        const data = eventData.data;

        console.log('🔔 Handling WebSocket notification:', eventType, data);

        // Добавляем в историю
        this.addToHistory(eventData);

        // Формируем сообщение в зависимости от типа события
        let message = '';
        let type = 'info';

        switch (eventType) {
            // === Product Events ===
            case 'product.created':
                message = `Товар "${data.product_name}" создан и отправлен на модерацию`;
                type = 'info';
                break;

            case 'product.updated':
                message = `Товар "${data.product_name}" обновлен`;
                type = 'info';
                break;

            case 'product.deleted':
                message = `Товар "${data.product_name}" удален`;
                type = 'warning';
                break;

            case 'product.approved':
                message = `✅ Товар "${data.product_name}" одобрен! Стоимость модерации: $${data.approval_fee}`;
                type = 'success';
                break;

            case 'product.rejected':
                message = `❌ Товар "${data.product_name}" отклонен. Причина: ${data.moderation_notes || 'Не указана'}`;
                type = 'error';
                break;

            // === Balance Events ===
            case 'balance.updated':
                const change = data.change_amount > 0 ? `+$${data.change_amount}` : `-$${Math.abs(data.change_amount)}`;
                message = `Баланс обновлен: ${change}. Новый баланс: $${data.new_balance}`;
                type = data.change_amount > 0 ? 'success' : 'warning';
                break;

            // === Transaction Events ===
            case 'transaction.completed':
                message = `💰 Транзакция завершена: $${data.amount} (${this.getTransactionTypeName(data.transaction_type)})`;
                type = 'success';
                break;

            case 'transaction.failed':
                message = `❌ Транзакция провалилась: ${data.description || 'Неизвестная ошибка'}`;
                type = 'error';
                break;

            // === Order Events ===
            case 'order.created':
                message = `🛍️ Новый заказ на товар "${data.product_name}" ($${data.amount})`;
                type = 'info';
                break;

            case 'order.completed':
                message = `✅ Заказ на товар "${data.product_name}" выполнен`;
                type = 'success';
                break;

            // === Review Events ===
            case 'review.created':
                message = `⭐ Новый отзыв на товар "${data.product_name}" (${data.rating}/5): ${data.comment}`;
                type = 'info';
                break;

            // === Settings Events ===
            case 'settings.updated':
                message = `⚙️ Настройка "${data.description || data.key}" обновлена: ${data.old_value} → ${data.new_value}`;
                type = 'info';
                break;

            // === Moderation Events ===
            case 'moderation.queue_updated':
                message = `📋 Очередь модерации обновлена: ${data.pending_count} товаров ожидают проверки`;
                type = 'info';
                break;

            default:
                message = `Событие: ${eventType}`;
                type = 'info';
        }

        // Показываем toast
        this.showToast(message, type);

        // Увеличиваем счетчик непрочитанных
        this.incrementUnreadCount();
    }

    /**
     * Получить название типа транзакции
     */
    getTransactionTypeName(type) {
        const names = {
            'top_up': 'Пополнение',
            'product_rent': 'Аренда товара',
            'product_purchase': 'Покупка товара',
            'shop_payout': 'Выплата',
            'approval_fee': 'Комиссия модерации'
        };
        return names[type] || type;
    }

    /**
     * Добавить событие в историю
     */
    addToHistory(eventData) {
        this.notifications.unshift({
            ...eventData,
            timestamp: eventData.timestamp || new Date().toISOString(),
            read: false
        });

        // Ограничиваем количество уведомлений
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }
    }

    /**
     * Увеличить счетчик непрочитанных
     */
    incrementUnreadCount() {
        this.unreadCount++;
        this.updateBadge();
    }

    /**
     * Обнулить счетчик непрочитанных
     */
    resetUnreadCount() {
        this.unreadCount = 0;
        this.updateBadge();

        // Отмечаем все уведомления как прочитанные
        this.notifications.forEach(n => n.read = true);
    }

    /**
     * Обновить badge с количеством
     */
    updateBadge() {
        if (!this.badge) return;

        if (this.unreadCount > 0) {
            this.badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            this.badge.style.display = 'flex';
        } else {
            this.badge.style.display = 'none';
        }
    }

    /**
     * Получить историю уведомлений
     */
    getHistory() {
        return this.notifications;
    }

    /**
     * Очистить историю
     */
    clearHistory() {
        this.notifications = [];
        this.resetUnreadCount();
    }

    /**
     * Показать всплывающее окно с историей уведомлений
     */
    showHistoryModal() {
        // Простая модалка для истории
        const modal = document.createElement('div');
        modal.className = 'notification-history-modal';

        const content = `
            <div class="notification-history-content">
                <div class="notification-history-header">
                    <h3>История уведомлений</h3>
                    <button onclick="this.closest('.notification-history-modal').remove()">×</button>
                </div>
                <div class="notification-history-list">
                    ${this.notifications.length === 0 ? '<p style="text-align: center; color: #999;">Нет уведомлений</p>' : ''}
                    ${this.notifications.map(n => `
                        <div class="notification-history-item ${n.read ? 'read' : 'unread'}">
                            <div class="notification-history-time">
                                ${new Date(n.timestamp).toLocaleString('ru-RU')}
                            </div>
                            <div class="notification-history-event">${n.event}</div>
                            <div class="notification-history-data">
                                ${JSON.stringify(n.data, null, 2)}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="notification-history-footer">
                    <button class="btn btn-secondary" onclick="notificationManager.clearHistory(); this.closest('.notification-history-modal').remove();">Очистить всё</button>
                    <button class="btn btn-primary" onclick="notificationManager.resetUnreadCount();">Отметить все как прочитанные</button>
                </div>
            </div>
        `;

        modal.innerHTML = content;
        document.body.appendChild(modal);

        // Отмечаем как прочитанные при открытии
        setTimeout(() => this.resetUnreadCount(), 500);
    }
}

// Создаем глобальный экземпляр
window.notificationManager = new NotificationManager();

console.log('✅ Notification manager loaded');
