/**
 * Navigation utilities - добавляет единую кнопку "Вернуться на главную" на всех страницах
 */

(function() {
    'use strict';

    // Определяем тип страницы и главную страницу
    function getHomeUrl() {
        const path = window.location.pathname;
        
        if (path.includes('/admin/')) {
            return '/admin/index.html';
        } else if (path.includes('/shop/')) {
            return '/shop/index.html';
        } else if (path.includes('/user/')) {
            return '/user/index.html';
        } else {
            return '/';
        }
    }

    // Проверяем, не главная ли это страница
    function isHomePage() {
        const path = window.location.pathname;
        const homePages = ['/admin/index.html', '/shop/index.html', '/user/index.html', '/', '/index.html'];
        
        // Проверяем точное совпадение или если путь заканчивается на '/'
        return homePages.some(page => path.endsWith(page)) || path.endsWith('/admin/') || path.endsWith('/shop/') || path.endsWith('/user/');
    }

    // Создаём кнопку "Вернуться на главную"
    function createBackButton() {
        if (isHomePage()) {
            return; // Не показываем на главных страницах
        }

        const homeUrl = getHomeUrl();
        
        const backButton = document.createElement('div');
        backButton.className = 'mb-6';
        backButton.innerHTML = `
            <a href="${homeUrl}" class="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium transition-colors group">
                <i class="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                <span>Вернуться на главную</span>
            </a>
        `;

        return backButton;
    }

    // Добавляем кнопку в начало основного контента
    function addBackButton() {
        // Ищем основной контейнер с контентом
        const selectors = [
            '.max-w-7xl.mx-auto',
            '.container',
            'main',
            'body > div:not(header):not(nav)'
        ];
        
        let mainContainer = null;
        for (const selector of selectors) {
            mainContainer = document.querySelector(selector);
            if (mainContainer) break;
        }
        
        if (!mainContainer) {
            console.warn('[Navigation] Main container not found');
            return;
        }

        // Проверяем, нет ли уже кнопки "Назад" или "Вернуться"
        const existingBackButton = Array.from(document.querySelectorAll('a')).find(a => 
            a.textContent.includes('Назад') || a.textContent.includes('Вернуться')
        );
        
        if (existingBackButton && existingBackButton.href.includes('index.html')) {
            // Обновляем стиль существующей кнопки
            const parent = existingBackButton.parentElement;
            parent.className = 'mb-6';
            existingBackButton.className = 'inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium transition-colors group';
            existingBackButton.innerHTML = `
                <i class="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                <span>Вернуться на главную</span>
            `;
            return;
        }

        // Создаём и добавляем новую кнопку
        const backButton = createBackButton();
        if (backButton) {
            // Ищем место для вставки - после alert контейнера или в начале mainContainer
            const alertContainer = document.getElementById('alertContainer') || 
                                 document.getElementById('adminAlertContainer');
            
            if (alertContainer) {
                // Вставляем после alert контейнера
                if (alertContainer.nextSibling) {
                    alertContainer.parentNode.insertBefore(backButton, alertContainer.nextSibling);
                } else {
                    alertContainer.parentNode.appendChild(backButton);
                }
            } else {
                // Вставляем в начало mainContainer
                if (mainContainer.firstChild) {
                    mainContainer.insertBefore(backButton, mainContainer.firstChild);
                } else {
                    mainContainer.appendChild(backButton);
                }
            }
        }
    }

    // Инициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addBackButton);
    } else {
        // Небольшая задержка, чтобы дать время другим скриптам загрузиться
        setTimeout(addBackButton, 100);
    }

    // Экспортируем для использования в других скриптах
    window.NavigationUtils = {
        addBackButton,
        getHomeUrl,
        isHomePage
    };
})();
