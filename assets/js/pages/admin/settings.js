const AdminSettingsModule = (function() {
    if (!localStorage.getItem('platform')) {
        localStorage.setItem('platform', 'web');
    }

    const DOM = {
        get settingsList() { return document.getElementById('settingsList'); }
    };

    function initializeWebSocket() {
        if (typeof CommonUtils !== 'undefined' && CommonUtils.initWebSocket) {
            CommonUtils.initWebSocket('admin', {
                'settings.updated': (data) => { handleSettingsUpdate(data); }
            });
        }
    }

    function createSettingRow(setting) {
        return `
            <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all" id="setting_group_${setting.key}">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    ${setting.description || setting.key}
                </label>
                <div class="flex gap-3">
                    <input 
                        type="text" 
                        value="${setting.value}" 
                        id="setting_${setting.key}"
                        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    >
                    <button 
                        class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md whitespace-nowrap min-w-[140px]" 
                        onclick="AdminSettingsModule.updateSetting('${setting.key}')"
                    >
                        <i class="fas fa-save mr-2"></i>Save
                    </button>
                </div>
            </div>
        `;
    }

    function updateButtonState(button, state) {
        const states = {
            loading: {
                html: '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...',
                disabled: true,
                classes: { add: [], remove: [] }
            },
            success: {
                html: '<i class="fas fa-check mr-2"></i>Saved',
                disabled: true,
                classes: { 
                    add: ['bg-green-600'], 
                    remove: ['bg-purple-600', 'hover:bg-purple-700'] 
                }
            },
            reset: {
                html: null,
                disabled: false,
                classes: { 
                    add: ['bg-purple-600', 'hover:bg-purple-700'], 
                    remove: ['bg-green-600'] 
                }
            }
        };

        const config = states[state];
        if (!config) return;

        if (config.html) {
            button.innerHTML = config.html;
        }
        button.disabled = config.disabled;
        
        if (config.classes.add.length) {
            button.classList.add(...config.classes.add);
        }
        if (config.classes.remove.length) {
            button.classList.remove(...config.classes.remove);
        }
    }

    function highlightSettingUpdate(key) {
        const groupElement = document.getElementById(`setting_group_${key}`);
        if (groupElement) {
            groupElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
            setTimeout(() => {
                groupElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
            }, 2000);
        }
    }

    function handleSettingsUpdate(data) {
        if (data.data && data.data.key) {
            const inputElement = document.getElementById(`setting_${data.data.key}`);
            
            if (inputElement && data.data.new_value !== undefined) {
                inputElement.value = data.data.new_value;
                highlightSettingUpdate(data.data.key);
            }
        }
    }

    async function loadSettings() {
        try {
            const settings = await apiRequest(API_ENDPOINTS.ADMIN.SETTINGS);
            
            if (!DOM.settingsList) return;
            
            DOM.settingsList.innerHTML = settings.map(setting => createSettingRow(setting)).join('');
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_SETTINGS + ': ' + error.message, 'error');
        }
    }

    async function updateSetting(key) {
        const buttonElement = event.target.closest('button');
        const originalButtonHtml = buttonElement.innerHTML;
        
        try {
            updateButtonState(buttonElement, 'loading');
            
            const value = document.getElementById(`setting_${key}`).value;
            await apiRequest(`/api/v1/admin/settings/${key}`, 'PUT', { key, value });
            
            updateButtonState(buttonElement, 'success');
            
            setTimeout(() => {
                buttonElement.innerHTML = originalButtonHtml;
                updateButtonState(buttonElement, 'reset');
            }, 2000);
            
        } catch (error) {
            buttonElement.innerHTML = originalButtonHtml;
            buttonElement.disabled = false;
            showAlert(MESSAGES.ERROR.UPDATING_SETTINGS + ': ' + error.message, 'error');
        }
    }

    async function init() {
        try {
            initializeWebSocket();
            await loadSettings();
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_DATA + ': ' + error.message, 'error');
        }
    }

    return {
        init,
        updateSetting
    };
})();

window.AdminSettingsModule = AdminSettingsModule;
AdminSettingsModule.init();
