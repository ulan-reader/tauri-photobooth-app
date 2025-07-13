// Базовый URL контроллера (замените на актуальный IP)
const BASE_URL = 'http://192.168.1.2/httppay';

// Функция для отправки HTTP POST запроса
async function sendRequest(act, body = {}) {
    // Формируем тело запроса с обязательным полем act
    const requestBody = { act, ...body };

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(requestBody).length
            },
            body: JSON.stringify(requestBody)
        });

        // Проверяем, успешен ли запрос
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Парсим JSON-ответ
        const data = await response.json();

        // Проверяем наличие обязательного поля error
        if (!data.hasOwnProperty('error')) {
            throw new Error('Response does not contain "error" field');
        }

        return data;
    } catch (error) {
        console.error(`Error in ${act} request:, error.message`);
        return { error: 'unknown', message: error.message };
    }
}

// Запрос статуса
async function getStatus() {
    return await sendRequest('status');
}

// Начало сессии
async function startSession(amount, item, name_kz = '', name_ru = '') {
    // Валидация полей
    if (typeof amount !== 'number' || amount < 0.01 || amount > 9999.99) {
        return { error: 'bad_values', message: 'Invalid amount' };
    }
    if (typeof item !== 'number' || item < 0 || item > 65535) {
        return { error: 'bad_values', message: 'Invalid item' };
    }
    if (typeof name_kz !== 'string' || name_kz.length > 31) {
        return { error: 'bad_values', message: 'Invalid name_kz' };
    }
    if (typeof name_ru !== 'string' || name_ru.length > 31) {
        return { error: 'bad_values', message: 'Invalid name_ru' };
    }

    return await sendRequest('request', { amount, item, name_kz, name_ru });
}

// Завершение сессии
async function completeSession() {
    return await sendRequest('complete');
}

// Отмена сессии
async function cancelSession() {
    return await sendRequest('cancel');
}

// Отправка или удаление информации об ошибках (DEPRECATED)
async function sendInfo(infoArray = []) {
    // Валидация массива info
    if (!Array.isArray(infoArray)) {
        return { error: 'bad_args', message: 'Info must be an array' };
    }
    for (const item of infoArray) {
        if (typeof item.code !== 'number' || typeof item.description !== 'string' || item.description.length > 63) {
            return { error: 'bad_values', message: 'Invalid info object' };
        }
    }

    return await sendRequest('info', { info: infoArray });
}

// Запрос опций контроллера
async function getOptions() {
    return await sendRequest('option');
}

// Периодический запрос статуса (каждую секунду)
function pollStatus(callback, interval = 1000) {
    const polling = async () => {
        const response = await getStatus();
        callback(response);
        // Если сессия активна, продолжаем опрос
        if (response.status === 'session' || response.status === 'paid') {
            setTimeout(polling, interval);
        }
    };
    polling();
}

// Пример использования
async function example() {
    // Получить статус
    let response = await getStatus();
    console.log('Status:', response);

    // Начать сессию
    if (response.status === 'idle') {
        response = await startSession(10.99, 123, 'Товар KZ', 'Товар RU');
        console.log('Start session:', response);
    }

    // Периодический опрос статуса
    pollStatus((statusResponse) => {
        console.log('Polled status:', statusResponse);

        // Если сессия оплачена, завершаем или отменяем
        if (statusResponse.status === 'paid') {
            // Пример завершения
            completeSession().then((completeResponse) => {
                console.log('Complete session:', completeResponse);
            });
            // Или отмена
            // cancelSession().then((cancelResponse) => {
            //     console.log('Cancel session:', cancelResponse);
            // });
        }
    });

    // Отправить информацию об ошибке
    response = await sendInfo([{ code: 123, description: 'qwerty' }]);
    console.log('Send info:', response);

    // Удалить коды ошибок
    response = await sendInfo([]);
    console.log('Clear info:', response);

    // Получить опции
    response = await getOptions();
    console.log('Options:', response);
}

// Запуск примера
example().catch(console.error);