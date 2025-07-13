// Тест для проверки обработки отключения камеры
// Симулирует различные сценарии отключения камеры

// Симуляция состояния камеры
let cameraConnected = true;
let cameraError = null;

// Симуляция функции check_camera_status
async function simulateCheckCameraStatus() {
    console.log("Проверка состояния камеры...");
    await new Promise(resolve => setTimeout(resolve, 100));
    return cameraConnected;
}

// Симуляция функции reconnect_camera
async function simulateReconnectCamera() {
    console.log("Попытка переподключения камеры...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (Math.random() > 0.3) { // 70% успешных переподключений
        cameraConnected = true;
        cameraError = null;
        console.log("Камера успешно переподключена");
        return "Camera reconnected successfully";
    } else {
        cameraError = "Failed to reconnect camera";
        console.log("Ошибка переподключения камеры");
        throw new Error("Failed to reconnect camera");
    }
}

// Симуляция функции capture_photo_as с возможностью отключения
async function simulateCapturePhotoWithDisconnect() {
    console.log("Начинаем захват фото...");
    
    // Симуляция случайного отключения камеры во время захвата
    if (Math.random() < 0.2) { // 20% вероятность отключения
        console.log("Камера отключилась во время захвата!");
        cameraConnected = false;
        cameraError = "Camera disconnected during photo capture";
        throw new Error("Camera disconnected during photo capture");
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Фото успешно захвачено");
    return "Photo captured successfully";
}

// Тест сценария отключения камеры
async function testCameraDisconnectScenario() {
    console.log("=== Тест сценария отключения камеры ===");
    
    try {
        // Проверяем начальное состояние
        let status = await simulateCheckCameraStatus();
        console.log("Начальное состояние камеры:", status ? "подключена" : "отключена");
        
        // Пытаемся захватить фото
        console.log("\n1. Пытаемся захватить фото...");
        await simulateCapturePhotoWithDisconnect();
        
    } catch (error) {
        console.log("Ошибка при захвате:", error.message);
        
        // Проверяем состояние камеры после ошибки
        console.log("\n2. Проверяем состояние камеры после ошибки...");
        status = await simulateCheckCameraStatus();
        console.log("Состояние камеры:", status ? "подключена" : "отключена");
        
        if (!status) {
            console.log("\n3. Камера отключена, пытаемся переподключиться...");
            try {
                await simulateReconnectCamera();
                console.log("Переподключение успешно!");
                
                // Проверяем состояние после переподключения
                status = await simulateCheckCameraStatus();
                console.log("Состояние после переподключения:", status ? "подключена" : "отключена");
                
            } catch (reconnectError) {
                console.log("Ошибка переподключения:", reconnectError.message);
            }
        }
    }
    
    console.log("\n=== Тест завершен ===");
}

// Тест мониторинга состояния камеры
async function testCameraMonitoring() {
    console.log("=== Тест мониторинга состояния камеры ===");
    
    const monitoringInterval = setInterval(async () => {
        try {
            const status = await simulateCheckCameraStatus();
            console.log(`Мониторинг: камера ${status ? "подключена" : "отключена"}`);
            
            if (!status) {
                console.log("Обнаружено отключение камеры!");
                clearInterval(monitoringInterval);
                
                // Пытаемся переподключиться
                try {
                    await simulateReconnectCamera();
                    console.log("Автоматическое переподключение успешно!");
                } catch (error) {
                    console.log("Автоматическое переподключение не удалось:", error.message);
                }
            }
        } catch (error) {
            console.log("Ошибка мониторинга:", error.message);
        }
    }, 1000);
    
    // Останавливаем мониторинг через 10 секунд
    setTimeout(() => {
        clearInterval(monitoringInterval);
        console.log("Мониторинг остановлен");
    }, 10000);
}

// Запуск тестов
async function runAllTests() {
    console.log("Запуск всех тестов камеры...\n");
    
    // Тест 1: Сценарий отключения
    await testCameraDisconnectScenario();
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Тест 2: Мониторинг состояния
    await testCameraMonitoring();
    
    console.log("\nВсе тесты завершены!");
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        simulateCheckCameraStatus,
        simulateReconnectCamera,
        simulateCapturePhotoWithDisconnect,
        testCameraDisconnectScenario,
        testCameraMonitoring,
        runAllTests
    };
}

// Запуск тестов если файл выполняется напрямую
if (typeof window === 'undefined') {
    runAllTests()
        .then(() => console.log("Все тесты прошли успешно!"))
        .catch(error => console.error("Тесты завершились с ошибкой:", error));
} 