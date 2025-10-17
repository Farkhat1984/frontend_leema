let selectedAmount = 0;
let currentBalanceValue = 0;





window.onload = async function () {


    if (!token) {
        window.location.href = `${window.location.origin}/index.html`;
        return;
    }


    try {
        if (accountType === 'shop') {
            const shopInfo = await apiRequest('/api/v1/shops/me');
            currentBalanceValue = shopInfo.balance || 0;
            document.getElementById('accountInfo').textContent = `Магазин: ${shopInfo.shop_name}`;
        } else if (accountType === 'user' || accountType === 'admin') {

            const userInfo = await apiRequest('/api/v1/users/me');
            const balanceInfo = await apiRequest('/api/v1/users/me/balance');
            currentBalanceValue = balanceInfo.balance || 0;
            document.getElementById('accountInfo').textContent = `Пользователь: ${userInfo.email}`;
        } else {
            window.location.href = `${window.location.origin}/index.html`;
            return;
        }

        document.getElementById('currentBalance').textContent = `$${currentBalanceValue.toFixed(2)}`;
    } catch (error) {
        showAlert('Ошибка загрузки данных: ' + error.message, 'error');
    }
};

function selectAmount(amount, element) {
    selectedAmount = amount;


    document.querySelectorAll('.amount-option').forEach(opt => opt.classList.remove('selected'));


    if (element) {
        element.classList.add('selected');
    }


    document.getElementById('customAmount').value = '';

    updateSummary();
}

function selectCustomAmount() {
    const customValue = parseFloat(document.getElementById('customAmount').value);
    if (!isNaN(customValue) && customValue > 0) {
        selectedAmount = customValue;


        document.querySelectorAll('.amount-option').forEach(opt => opt.classList.remove('selected'));

        updateSummary();
    }
}

function selectPaymentMethod(method) {

    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    event.target.closest('.payment-method').classList.add('selected');
}

function updateSummary() {
    document.getElementById('summaryAmount').textContent = `$${selectedAmount.toFixed(2)}`;
    document.getElementById('summaryTotal').textContent = `$${selectedAmount.toFixed(2)}`;
}

async function processPayment() {

    if (selectedAmount <= 0) {
        showAlert('Пожалуйста, выберите сумму пополнения', 'error');
        return;
    }

    try {
        let endpoint = '';
        if (accountType === 'shop') {
            endpoint = '/api/v1/payments/shop/top-up';
        } else {
            endpoint = '/api/v1/payments/user/top-up';
        }

        showAlert('Создание платежа...', 'info');

        const payment = await apiRequest(endpoint, 'POST', {
            payment_type: 'top_up',
            amount: selectedAmount
        });


        if (payment.approval_url) {

            window.location.href = payment.approval_url;
        } else {
            showAlert('Ошибка: не получен URL для оплаты', 'error');
        }
    } catch (error) {
        showAlert('Ошибка создания платежа: ' + error.message, 'error');
    }
}

function goBack() {
    const baseUrl = window.location.origin;
    if (accountType === 'admin') {
        window.location.href = `${baseUrl}/admin/index.html`;
    } else {
        window.location.href = `${baseUrl}/index.html`;
    }
}
