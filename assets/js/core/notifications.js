
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 50;
        this.container = null;
        this.badge = null;
        this.unreadCount = 0;
        this.shownEvents = new Set(); // Track shown events to prevent duplicates

        this.init();
    }

    init() {
        this.createToastContainer();
        this.createNotificationBadge();
    }

    createToastContainer() {
        // Don't create container if unified alert system exists
        if (window.alertSystem) {
            this.container = window.alertSystem.container;
            return;
        }
        
        const existing = document.getElementById('toastContainer');
        if (existing) {
            existing.remove();
        }
        
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.className = 'fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-md pointer-events-none';
        document.body.appendChild(this.container);
    }

    createNotificationBadge() {
        this.badge = document.createElement('div');
        this.badge.id = 'notificationBadge';
        this.badge.className = 'notification-badge';
        this.badge.style.display = 'none';

        const header = document.querySelector('.header .user-info');
        if (header) {
            header.insertBefore(this.badge, header.firstChild);
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        // Use unified alert system if available
        if (window.alertSystem) {
            return window.alertSystem.show(message, type, duration);
        }
        
        // Fallback to old system
        return this._showToastFallback(message, type, duration);
    }

    _showToastFallback(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        
        // Tailwind classes based on type
        let bgClass, borderClass, iconBg, iconClass, iconColor;
        
        switch(type) {
            case 'success':
                bgClass = 'bg-white';
                borderClass = 'border-l-4 border-green-500';
                iconBg = 'bg-green-100';
                iconClass = 'fa-check-circle';
                iconColor = 'text-green-600';
                break;
            case 'error':
                bgClass = 'bg-white';
                borderClass = 'border-l-4 border-red-500';
                iconBg = 'bg-red-100';
                iconClass = 'fa-times-circle';
                iconColor = 'text-red-600';
                break;
            case 'warning':
                bgClass = 'bg-white';
                borderClass = 'border-l-4 border-orange-500';
                iconBg = 'bg-orange-100';
                iconClass = 'fa-exclamation-triangle';
                iconColor = 'text-orange-600';
                break;
            default: // info
                bgClass = 'bg-white';
                borderClass = 'border-l-4 border-blue-500';
                iconBg = 'bg-blue-100';
                iconClass = 'fa-info-circle';
                iconColor = 'text-blue-600';
        }

        toast.className = `${bgClass} ${borderClass} rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[320px] max-w-md opacity-0 translate-x-full transition-all duration-300 pointer-events-auto`;

        toast.innerHTML = `
            <div class="${iconBg} rounded-lg p-2 flex-shrink-0">
                <i class="fas ${iconClass} ${iconColor} text-lg"></i>
            </div>
            <div class="flex-1 pt-0.5">
                <p class="text-sm font-medium text-gray-900">${message}</p>
            </div>
            <button class="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0" onclick="this.closest('div[class*=\\'translate-x\\']').remove()">
                <i class="fas fa-times text-sm"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.remove('opacity-0', 'translate-x-full');
            toast.classList.add('opacity-100', 'translate-x-0');
        }, 10);

        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        return toast;
    }

    removeToast(toast) {
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    handleWebSocketEvent(eventData) {
        const eventType = eventData.event;
        const data = eventData.data;
        
        // Create unique event ID to prevent duplicates
        const eventId = `${eventType}-${data.product_id || data.order_id || data.transaction_id || ''}-${eventData.timestamp || Date.now()}`;
        
        // Use unified alert system for duplicate prevention if available
        if (window.alertSystem && !window.alertSystem.handleWebSocketEvent(eventData, eventId)) {
            return;
        }
        
        // Fallback to local duplicate prevention
        if (this.shownEvents.has(eventId)) {
            return;
        }
        
        // Mark this event as shown
        this.shownEvents.add(eventId);
        
        // Clean up old event IDs (keep only last 100)
        if (this.shownEvents.size > 100) {
            const arr = Array.from(this.shownEvents);
            this.shownEvents = new Set(arr.slice(-100));
        }

        this.addToHistory(eventData);

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
                const change = data.change_amount > 0 ? `+₸${data.change_amount}` : `-₸${Math.abs(data.change_amount)}`;
                message = `Баланс обновлен: ${change}. Новый баланс: ₸${data.new_balance}`;
                type = data.change_amount > 0 ? 'success' : 'warning';
                break;

            // === Transaction Events ===
            case 'transaction.completed':
                message = `💰 Транзакция завершена: ₸${data.amount} (${this.getTransactionTypeName(data.transaction_type)})`;
                type = 'success';
                break;

            case 'transaction.failed':
                message = `❌ Транзакция провалилась: ${data.description || 'Неизвестная ошибка'}`;
                type = 'error';
                break;

            // === Order Events ===
            case 'order.created':
                message = `🛍️ Новый заказ на товар "${data.product_name}" (₸${data.amount})`;
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
                // Не показываем уведомление для необработанных событий
                return;
        }

        // Показываем уведомление только если сообщение определено
        if (message) {
            this.showToast(message, type);
            this.incrementUnreadCount();
        }
    }

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

    incrementUnreadCount() {
        this.unreadCount++;
        this.updateBadge();
    }

    resetUnreadCount() {
        this.unreadCount = 0;
        this.updateBadge();

        // Отмечаем все уведомления как прочитанные
        this.notifications.forEach(n => n.read = true);
    }

    updateBadge() {
        if (!this.badge) return;

        if (this.unreadCount > 0) {
            this.badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            this.badge.style.display = 'flex';
        } else {
            this.badge.style.display = 'none';
        }
    }

    getHistory() {
        return this.notifications;
    }

    clearHistory() {
        this.notifications = [];
        this.resetUnreadCount();
    }

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

        setTimeout(() => this.resetUnreadCount(), 500);
    }
}

window.notificationManager = new NotificationManager();
