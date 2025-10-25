const TopUpModule = (function() {
    let state = {
        selectedAmount: 0,
        currentBalance: 0
    };

    const DOM = {
        get accountInfo() { return document.getElementById('accountInfo'); },
        get currentBalance() { return document.getElementById('currentBalance'); },
        get customAmount() { return document.getElementById('customAmount'); },
        get summaryAmount() { return document.getElementById('summaryAmount'); },
        get summaryTotal() { return document.getElementById('summaryTotal'); },
        get amountOptions() { return document.querySelectorAll('.amount-option'); },
        get paymentMethods() { return document.querySelectorAll('.payment-method'); }
    };

    async function loadAccountInfo() {
        const accountType = AuthService.getAccountType();
        
        if (accountType === 'shop') {
            return await loadShopInfo();
        } else if (accountType === 'user' || accountType === 'admin') {
            return await loadUserInfo();
        } else {
            Router.redirectToAuth();
            return null;
        }
    }

    async function loadShopInfo() {
        const shopInfo = await apiRequest(API_ENDPOINTS.SHOPS.ME);
        state.currentBalance = shopInfo.balance || 0;
        return {
            name: shopInfo.shop_name,
            label: 'Shop'
        };
    }

    async function loadUserInfo() {
        const userInfo = await apiRequest(API_ENDPOINTS.USERS.ME);
        const balanceInfo = await apiRequest(API_ENDPOINTS.USERS.BALANCE);
        state.currentBalance = balanceInfo.balance || 0;
        return {
            name: userInfo.email,
            label: 'User'
        };
    }

    function updateAccountDisplay(accountInfo) {
        if (DOM.accountInfo) {
            DOM.accountInfo.textContent = `${accountInfo.label}: ${accountInfo.name}`;
        }
        if (DOM.currentBalance) {
            DOM.currentBalance.textContent = `₸${state.currentBalance.toFixed(2)}`;
        }
    }

    function clearAmountSelection() {
        DOM.amountOptions.forEach(opt => opt.classList.remove('selected'));
        if (DOM.customAmount) {
            DOM.customAmount.value = '';
        }
    }

    function updateSummaryDisplay() {
        const formattedAmount = `₸${state.selectedAmount.toFixed(2)}`;
        if (DOM.summaryAmount) DOM.summaryAmount.textContent = formattedAmount;
        if (DOM.summaryTotal) DOM.summaryTotal.textContent = formattedAmount;
    }

    function validateAmount(amount) {
        if (!amount || amount <= 0) {
            showAlert('Please select a top-up amount', 'error');
            return false;
        }

        const minAmount = APP_CONSTANTS.PAYMENT.MIN_TOPUP_AMOUNT;
        if (amount < minAmount) {
            showAlert(MESSAGES.VALIDATION.MIN_AMOUNT(minAmount), 'error');
            return false;
        }

        if (amount > 10000) {
            showAlert(MESSAGES.VALIDATION.MAX_AMOUNT(10000), 'error');
            return false;
        }

        return true;
    }

    async function createPayment(amount) {
        const accountType = AuthService.getAccountType();
        const endpoint = accountType === 'shop' 
            ? API_ENDPOINTS.PAYMENTS.SHOP_TOP_UP 
            : API_ENDPOINTS.PAYMENTS.USER_TOP_UP;

        showAlert('Creating payment...', 'info');

        return await apiRequest(endpoint, 'POST', {
            payment_type: 'top_up',
            amount: amount,
        });
    }

    async function init() {
        if (!AuthService.isAuthenticated()) {
            Router.redirectToAuth();
            return;
        }

        try {
            const accountInfo = await loadAccountInfo();
            if (accountInfo) {
                updateAccountDisplay(accountInfo);
            }
        } catch (error) {
            showAlert(MESSAGES.ERROR.LOADING_DATA + ': ' + error.message, 'error');
        }
    }

    return {
        init,
        
        selectAmount(amount, element) {
            state.selectedAmount = amount;
            clearAmountSelection();
            if (element) {
                element.classList.add('selected');
            }
            updateSummaryDisplay();
        },

        selectCustomAmount() {
            const customValue = parseFloat(DOM.customAmount?.value);
            if (!isNaN(customValue) && customValue > 0) {
                state.selectedAmount = customValue;
                clearAmountSelection();
                updateSummaryDisplay();
            }
        },

        selectPaymentMethod(method) {
            DOM.paymentMethods.forEach(m => m.classList.remove('selected'));
            event.target.closest('.payment-method')?.classList.add('selected');
        },

        async processPayment() {
            if (!validateAmount(state.selectedAmount)) {
                return;
            }

            try {
                const payment = await createPayment(state.selectedAmount);
                if (payment.approval_url) {
                    window.location.href = payment.approval_url;
                } else {
                    showAlert(MESSAGES.ERROR.PAYMENT_URL_NOT_RECEIVED, 'error');
                }
            } catch (error) {
                CommonUtils.handleError('processPayment', error, true);
            }
        },

        goBack() {
            Router.goBack();
        }
    };
})();

window.onload = () => TopUpModule.init();
window.selectAmount = (amount, element) => TopUpModule.selectAmount(amount, element);
window.selectCustomAmount = () => TopUpModule.selectCustomAmount();
window.selectPaymentMethod = (method) => TopUpModule.selectPaymentMethod(method);
window.processPayment = () => TopUpModule.processPayment();
window.goBack = () => TopUpModule.goBack();
