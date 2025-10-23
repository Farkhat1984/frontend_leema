/**
 * Unified Alert System for Fashion AI Platform
 * Modern Tailwind-based notification system
 * Shows alerts only at the top of the screen
 * Prevents duplicate notifications
 */

class AlertSystem {
    constructor() {
        this.container = null;
        this.activeAlerts = new Set();
        this.maxAlerts = 5;
        this.alertQueue = [];
        this.init();
    }

    init() {
        this.createContainer();
        this.bindGlobalHandler();
    }

    createContainer() {
        const existing = document.querySelectorAll('#alertContainer, .alert-container, #toastContainer');
        existing.forEach(el => el.remove());

        // Create new unified container - positioned TOP RIGHT
        this.container = document.createElement('div');
        this.container.id = 'unifiedAlertContainer';
        this.container.className = 'fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-md pointer-events-none';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        // Prevent duplicate alerts
        const alertKey = `${type}-${message}`;
        if (this.activeAlerts.has(alertKey)) {
            return;
        }

        // Queue alert if too many active
        if (this.container.children.length >= this.maxAlerts) {
            this.alertQueue.push({ message, type, duration });
            return;
        }

        this.activeAlerts.add(alertKey);
        const alert = this.createAlert(message, type, duration);
        this.container.appendChild(alert);

        // Trigger animation
        setTimeout(() => {
            alert.classList.remove('opacity-0', 'translate-x-full');
            alert.classList.add('opacity-100', 'translate-x-0');
        }, 10);

        if (duration > 0) {
            setTimeout(() => {
                this.remove(alert, alertKey);
            }, duration);
        }

        return alert;
    }

    createAlert(message, type, duration) {
        const alert = document.createElement('div');
        
        // Color schemes
        const schemes = {
            success: {
                bg: 'bg-white',
                border: 'border-l-4 border-green-500',
                iconBg: 'bg-green-100',
                icon: 'fa-check-circle',
                iconColor: 'text-green-600',
                textColor: 'text-gray-900'
            },
            error: {
                bg: 'bg-white',
                border: 'border-l-4 border-red-500', 
                iconBg: 'bg-red-100',
                icon: 'fa-times-circle',
                iconColor: 'text-red-600',
                textColor: 'text-gray-900'
            },
            warning: {
                bg: 'bg-white',
                border: 'border-l-4 border-orange-500',
                iconBg: 'bg-orange-100', 
                icon: 'fa-exclamation-triangle',
                iconColor: 'text-orange-600',
                textColor: 'text-gray-900'
            },
            info: {
                bg: 'bg-white',
                border: 'border-l-4 border-blue-500',
                iconBg: 'bg-blue-100',
                icon: 'fa-info-circle',
                iconColor: 'text-blue-600',
                textColor: 'text-gray-900'
            }
        };

        const scheme = schemes[type] || schemes.info;
        
        alert.className = `${scheme.bg} ${scheme.border} rounded-lg shadow-lg p-4 flex items-start gap-3 opacity-0 translate-x-full transition-all duration-300 pointer-events-auto max-w-full`;

        alert.innerHTML = `
            <div class="${scheme.iconBg} rounded-lg p-2 flex-shrink-0">
                <i class="fas ${scheme.icon} ${scheme.iconColor} text-lg"></i>
            </div>
            <div class="flex-1 pt-0.5">
                <p class="text-sm font-medium ${scheme.textColor}">${this.escapeHtml(message)}</p>
            </div>
            <button class="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0 alert-close">
                <i class="fas fa-times text-sm"></i>
            </button>
        `;

        // Close button handler
        const closeBtn = alert.querySelector('.alert-close');
        closeBtn.addEventListener('click', () => {
            const alertKey = `${type}-${message}`;
            this.remove(alert, alertKey);
        });

        return alert;
    }

    remove(alert, alertKey) {
        alert.classList.add('opacity-0', 'translate-x-full');
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.parentElement.removeChild(alert);
            }
            
            if (alertKey) {
                this.activeAlerts.delete(alertKey);
            }
            
            // Show queued alert
            if (this.alertQueue.length > 0) {
                const queued = this.alertQueue.shift();
                setTimeout(() => {
                    this.show(queued.message, queued.type, queued.duration);
                }, 100);
            }
        }, 300);
    }

    bindGlobalHandler() {
        // Bind to global window object for compatibility
        window.showAlert = (message, type = 'info', duration = 3000) => {
            this.show(message, type, duration);
        };

        // Bind aliases for different systems
        window.showSuccess = (message, duration = 3000) => {
            this.show(message, 'success', duration);
        };

        window.showError = (message, duration = 3000) => {
            this.show(message, 'error', duration);
        };

        window.showWarning = (message, duration = 3000) => {
            this.show(message, 'warning', duration);
        };

        window.showInfo = (message, duration = 3000) => {
            this.show(message, 'info', duration);
        };
    }

    // Integration with existing notification manager
    integrateWithNotificationManager() {
        if (window.notificationManager) {
            const originalShowToast = window.notificationManager.showToast;
            window.notificationManager.showToast = (message, type, duration) => {
                return this.show(message, type, duration);
            };
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Clear all alerts
    clearAll() {
        this.activeAlerts.clear();
        this.alertQueue = [];
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    handleWebSocketEvent(eventData, eventId) {
        if (this.activeAlerts.has(eventId)) {
            return false; // Already shown
        }
        return true; // Can show
    }
}

window.alertSystem = new AlertSystem();

// Auto-integrate with notification manager when it loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.alertSystem && window.notificationManager) {
        window.alertSystem.integrateWithNotificationManager();
    }
});

// Integration hook for late-loading notification manager
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.alertSystem && window.notificationManager) {
            window.alertSystem.integrateWithNotificationManager();
        }
    }, 100);
});