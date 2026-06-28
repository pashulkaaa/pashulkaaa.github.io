const tg = window.Telegram.WebApp;
tg.expand();

// Получаем user_id из данных Telegram
const user_id = tg.initDataUnsafe?.user?.id;
if (!user_id) {
    alert('Ошибка: не удалось определить пользователя.');
}

// Определяем базовый URL API (для локальной разработки используем localhost, для продакшена — ваш домен)
// При локальном запуске app.py на порту 5000, используем http://localhost:5000
// При деплое на PythonAnywhere — https://ваш_логин.pythonanywhere.com
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://pashulkaaa.pythonanywhere.com'; // Замените на ваш реальный адрес

// DOM элементы
const tabAdd = document.getElementById('tab-add');
const tabList = document.getElementById('tab-list');
const panelAdd = document.getElementById('panel-add');
const panelList = document.getElementById('panel-list');
const form = document.getElementById('transaction-form');
const categoryInput = document.getElementById('category');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type-select');
const statusMessage = document.getElementById('status-message');
const transactionsList = document.getElementById('transactions-list');

// Переключение вкладок
tabAdd.addEventListener('click', () => {
    tabAdd.classList.add('active');
    tabList.classList.remove('active');
    panelAdd.style.display = 'block';
    panelList.style.display = 'none';
});

tabList.addEventListener('click', () => {
    tabList.classList.add('active');
    tabAdd.classList.remove('active');
    panelAdd.style.display = 'none';
    panelList.style.display = 'block';
    loadTransactions();
});

// Функция показа статуса
function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = type;
    setTimeout(() => {
        statusMessage.className = '';
        statusMessage.textContent = '';
    }, 4000);
}

// Отправка новой транзакции
form.addEventListener('submit', async function(event) {
    event.preventDefault();

    const type = typeSelect.value;
    const category = categoryInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!category) {
        showStatus('Введите категорию.', 'error');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showStatus('Введите корректную сумму.', 'error');
        return;
    }

    // Отправляем данные через Telegram WebApp (для уведомления бота)
    const data = { type, category, amount };
    tg.sendData(JSON.stringify(data));

    // Также отправляем через API, чтобы добавить в БД и сразу обновить список
    try {
        const response = await fetch(`${API_BASE}/api/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, type, category, amount })
        });
        const result = await response.json();
        if (result.status === 'ok') {
            showStatus(`✅ ${type === 'income' ? 'Доход' : 'Расход'} "${category}" на сумму ${amount} ₽ добавлен!`, 'success');
            form.reset();
            // Если мы на вкладке "Транзакции", обновим список
            if (panelList.style.display !== 'none') {
                loadTransactions();
            }
        } else {
            showStatus('Ошибка при добавлении.', 'error');
        }
    } catch (error) {
        showStatus('Ошибка соединения с сервером.', 'error');
        console.error(error);
    }
});

// Загрузка списка транзакций
async function loadTransactions() {
    transactionsList.innerHTML = '<p class="loading">Загрузка...</p>';
    try {
        const response = await fetch(`${API_BASE}/api/transactions?user_id=${user_id}`);
        if (!response.ok) throw new Error('Network error');
        const transactions = await response.json();

        if (transactions.length === 0) {
            transactionsList.innerHTML = '<p class="loading">Пока нет транзакций.</p>';
            return;
        }

        // Сортируем по дате (новые сверху)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        let html = '';
        transactions.forEach(t => {
            const typeRu = t.type === 'income' ? 'Доход' : 'Расход';
            const emoji = t.type === 'income' ? '💰' : '💸';
            const amountClass = t.type === 'income' ? 'income' : 'expense';
            const sign = t.type === 'income' ? '+' : '-';
            html += `
                <div class="transaction-item">
                    <div class="left">
                        <span class="category">${emoji} ${t.category}</span>
                        <span class="date">${t.date.replace('T', ' ').slice(0, 16)}</span>
                    </div>
                    <span class="amount ${amountClass}">${sign}${t.amount.toFixed(2)} ₽</span>
                </div>
            `;
        });
        transactionsList.innerHTML = html;

    } catch (error) {
        transactionsList.innerHTML = '<p class="loading">Ошибка загрузки данных.</p>';
        console.error(error);
    }
}


// При открытии приложения показываем вкладку "Изменения" по умолчанию
tabAdd.click();
