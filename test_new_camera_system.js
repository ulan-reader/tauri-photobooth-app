// Тест новой системы камеры с автофокусом
// Запуск: node test_new_camera_system.js

const { invoke } = require('@tauri-apps/api/core');

async function testNewCameraSystem() {
    console.log("=== Тест новой системы камеры ===");
    
    try {
        // 1. Инициализация камеры
        console.log("\n1. Инициализация камеры...");
        const initResult = await invoke('initialize_camera');
        console.log("✅ Инициализация:", initResult);
        
        // 2. Проверка статуса камеры
        console.log("\n2. Проверка статуса камеры...");
        const status = await invoke('check_camera_status');
        console.log("✅ Статус камеры:", status);
        
        // 3. Запуск live view
        console.log("\n3. Запуск live view...");
        const liveViewResult = await invoke('start_live_view');
        console.log("✅ Live view:", liveViewResult);
        
        // 4. Ждем немного для стабилизации
        console.log("\n4. Ожидание стабилизации...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 5. Захват фото с автофокусом
        console.log("\n5. Захват фото с автофокусом...");
        const captureResult = await invoke('capture_photo_as');
        console.log("✅ Захват фото:", captureResult);
        
        // 6. Получение изображения
        console.log("\n6. Получение изображения...");
        const imageResult = await invoke('get_captured_image');
        console.log("✅ Изображение получено, размер:", imageResult.length, "символов");
        
        // 7. Остановка live view
        console.log("\n7. Остановка live view...");
        const stopResult = await invoke('stop_live_view');
        console.log("✅ Live view остановлен:", stopResult);
        
        console.log("\n=== Тест завершен успешно! ===");
        
    } catch (error) {
        console.error("❌ Ошибка:", error);
        
        // Попытка восстановления
        console.log("\n🔄 Попытка восстановления...");
        try {
            const cleanupResult = await invoke('force_cleanup_and_reconnect');
            console.log("✅ Восстановление:", cleanupResult);
        } catch (cleanupError) {
            console.error("❌ Ошибка восстановления:", cleanupError);
        }
    }
}

async function testAutofocus() {
    console.log("\n=== Тест автофокуса ===");
    
    try {
        // Инициализация
        await invoke('initialize_camera');
        
        // Запуск live view
        await invoke('start_live_view');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Множественные захваты для проверки автофокуса
        for (let i = 1; i <= 3; i++) {
            console.log(`\n--- Захват ${i}/3 ---`);
            
            const captureResult = await invoke('capture_photo_as');
            console.log(`✅ Захват ${i}:`, captureResult);
            
            // Ждем между захватами
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        await invoke('stop_live_view');
        console.log("✅ Тест автофокуса завершен");
        
    } catch (error) {
        console.error("❌ Ошибка теста автофокуса:", error);
    }
}

async function testSessionManagement() {
    console.log("\n=== Тест управления сессиями ===");
    
    try {
        // 1. Принудительная очистка
        console.log("1. Принудительная очистка сессий...");
        const cleanupResult = await invoke('force_cleanup_sessions');
        console.log("✅ Очистка:", cleanupResult);
        
        // 2. Переподключение
        console.log("2. Переподключение камеры...");
        const reconnectResult = await invoke('force_cleanup_and_reconnect');
        console.log("✅ Переподключение:", reconnectResult);
        
        // 3. Проверка работы
        console.log("3. Проверка работы камеры...");
        const status = await invoke('check_camera_status');
        console.log("✅ Статус:", status);
        
        console.log("✅ Тест управления сессиями завершен");
        
    } catch (error) {
        console.error("❌ Ошибка теста сессий:", error);
    }
}

// Запуск всех тестов
async function runAllTests() {
    await testNewCameraSystem();
    await testAutofocus();
    await testSessionManagement();
}

runAllTests().catch(console.error); 