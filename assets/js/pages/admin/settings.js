// Страница настроек платформы

async function loadPageData() {
    try {
        await loadSettings();
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
}

async function loadSettings() {
    try {
        const settings = await apiRequest('/api/v1/admin/settings');
        const container = document.getElementById('settingsList');

        container.innerHTML = settings.map(setting => `
            <div class="form-group" id="setting_group_${setting.key}">
                <label>${setting.description || setting.key}</label>
                <input type="text" value="${setting.value}" id="setting_${setting.key}">
                <button class="btn btn-primary" onclick="updateSetting('${setting.key}')">Сохранить</button>
            </div>
        `).join('');
    } catch (error) {
        showAlert('Ошибка загрузки настроек: ' + error.message, 'error');
    }
}

async function updateSetting(key) {
    try {
        const value = document.getElementById(`setting_${key}`).value;
        await apiRequest(`/api/v1/admin/settings/${key}`, 'PUT', { key, value });
        showAlert('Настройка обновлена', 'success');
    } catch (error) {
        showAlert('Ошибка обновления настройки: ' + error.message, 'error');
    }
}

// WebSocket handlers
function onSettingsUpdate(data) {
    if (data.data && data.data.key) {
        const inputElement = document.getElementById(`setting_${data.data.key}`);
        if (inputElement && data.data.new_value !== undefined) {
            inputElement.value = data.data.new_value;
        }
    }
}

// Make functions globally accessible
window.updateSetting = updateSetting;
