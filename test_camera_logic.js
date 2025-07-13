// Тестовый файл для проверки логики камеры
// Этот файл можно использовать для тестирования функций без реальной камеры

// Симуляция функции capture_photo_as
async function simulateCapturePhoto() {
    console.log("Симуляция захвата фото...");
    
    // Симуляция задержки
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Симуляция успешного захвата
    return "Photo captured successfully";
}

// Симуляция функции get_captured_image
async function simulateGetCapturedImage() {
    console.log("Симуляция получения изображения...");
    
    // Симуляция задержки
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Возвращаем тестовое base64 изображение (1x1 пиксель)
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
}

// Тестовая функция захвата с прогресс-баром
async function testCaptureWithProgress() {
    console.log("Начинаем тест захвата с прогресс-баром...");
    
    try {
        // Симуляция прогресса
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress < 90) {
                console.log(`Прогресс: ${Math.round(progress)}%`);
            }
        }, 200);
        
        // Выполняем захват
        const captureResult = await simulateCapturePhoto();
        console.log("Результат захвата:", captureResult);
        
        // Получаем изображение
        const imageData = await simulateGetCapturedImage();
        console.log("Изображение получено, размер:", imageData.length);
        
        // Завершаем прогресс
        clearInterval(progressInterval);
        console.log("Прогресс: 100%");
        
        console.log("Тест завершен успешно!");
        return imageData;
        
    } catch (error) {
        console.error("Ошибка в тесте:", error);
        throw error;
    }
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        simulateCapturePhoto,
        simulateGetCapturedImage,
        testCaptureWithProgress
    };
}

// Запуск теста если файл выполняется напрямую
if (typeof window === 'undefined') {
    testCaptureWithProgress()
        .then(() => console.log("Все тесты прошли успешно!"))
        .catch(error => console.error("Тесты завершились с ошибкой:", error));
} 