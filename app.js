// Инициализируем приложение Telegram
const tg = window.Telegram.WebApp;

// Расширяем приложение на весь экран
tg.expand();

// Получаем элементы формы
const form = document.getElementById('expense-form');
const categoryInput = document.getElementById('category');
const amountInput = document.getElementById('amount');
const statusMessage = document.getElementById('status-message');

// Функция для отображения статуса
function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = type;
    // Скрываем сообщение через 3 секунды
    setTimeout(() => {
        statusMessage.className = '';
        statusMessage.textContent = '';
    }, 3000);
}

// Обработчик отправки формы
form.addEventListener('submit', function(event) {
    event.preventDefault(); // Предотвращаем перезагрузку страницы

    const category = categoryInput.value.trim();
    const amount = parseFloat(amountInput.value);

    // Простая валидация
    if (!category) {
        showStatus('Пожалуйста, введите категорию.', 'error');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showStatus('Пожалуйста, введите корректную сумму.', 'error');
        return;
    }

    // 1. Формируем данные для отправки
    const data = {
        type: 'expense', // Указываем, что это расход
        category: category,
        amount: amount
    };

    // 2. Отправляем данные боту через Telegram WebApp API
    //    Бот получит их в поле message.web_app_data
    tg.sendData(JSON.stringify(data));

    // 3. Показываем сообщение об успехе и очищаем форму
    showStatus(`Расход "${category}" на сумму ${amount} ₽ добавлен!`, 'success');
    form.reset();

    // 4. (Опционально) Закрываем Mini App через секунду
    // setTimeout(() => tg.close(), 1500);
});