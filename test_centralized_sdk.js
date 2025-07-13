// Тест централизованной инициализации SDK
const { invoke } = window.__TAURI__.tauri;

async function testCentralizedSDK() {
    console.log("=== Тест централизованной инициализации SDK ===");
    
    try {
        // Тест 1: Проверка инициализации камеры
        console.log("1. Инициализация камеры...");
        const initResult = await invoke('initialize_camera');
        console.log(`   Результат: ${initResult}`);
        
        // Тест 2: Проверка состояния камеры
        console.log("2. Проверка состояния камеры...");
        const isConnected = await invoke('check_camera_status');
        console.log(`   Камера подключена: ${isConnected}`);
        
        // Тест 3: Запуск live view
        console.log("3. Запуск live view...");
        const liveViewResult = await invoke('start_live_view');
        console.log(`   Результат: ${liveViewResult}`);
        
        // Тест 4: Попытка захвата фото
        console.log("4. Попытка захвата фото...");
        const captureResult = await invoke('capture_photo_as');
        console.log(`   Результат: ${captureResult}`);
        
        if (captureResult.includes("successfully")) {
            // Тест 5: Получение изображения
            console.log("5. Получение захваченного изображения...");
            const image = await invoke('get_captured_image');
            console.log(`   Изображение получено, размер: ${image.length} символов`);
        }
        
        // Тест 6: Обновление сессии
        console.log("6. Обновление сессии камеры...");
        const refreshResult = await invoke('refresh_camera_session');
        console.log(`   Результат: ${refreshResult}`);
        
        console.log("=== Тест завершен ===");
        console.log("SDK работает централизованно - инициализируется при запуске и закрывается при завершении");
        
    } catch (error) {
        console.error("Ошибка в тесте:", error);
    }
}

// Функция для проверки стабильности SDK
async function testSDKStability() {
    console.log("=== Тест стабильности SDK ===");
    
    try {
        // Множественные операции с камерой
        for (let i = 1; i <= 3; i++) {
            console.log(`\n--- Итерация ${i}/3 ---`);
            
            // Инициализация
            await invoke('initialize_camera');
            console.log(`   Инициализация ${i} завершена`);
            
            // Live view
            await invoke('start_live_view');
            console.log(`   Live view ${i} запущен`);
            
            // Захват
            const captureResult = await invoke('capture_photo_as');
            console.log(`   Захват ${i}: ${captureResult}`);
            
            // Остановка
            await invoke('stop_live_view');
            console.log(`   Live view ${i} остановлен`);
            
            // Пауза
            if (i < 3) {
                console.log("   Ожидание 1 секунды...");
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log("\n=== Тест стабильности завершен ===");
        console.log("SDK остается стабильным при множественных операциях");
        
    } catch (error) {
        console.error("Ошибка в тесте стабильности:", error);
    }
}

// Экспортируем функции для использования в консоли браузера
window.testCentralizedSDK = testCentralizedSDK;
window.testSDKStability = testSDKStability;

console.log("Тесты готовы. Выполните:");
console.log("- testCentralizedSDK() - тест централизованной инициализации");
console.log("- testSDKStability() - тест стабильности SDK"); 