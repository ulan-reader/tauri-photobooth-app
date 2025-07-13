// Тест исправлений для продакшена
// Запуск: node test_production_fixes.js

const { invoke } = require('@tauri-apps/api/core');

async function testProductionFixes() {
    console.log("=== Тест исправлений для продакшена ===");
    
    try {
        // 1. Агрессивная очистка и переподключение
        console.log("\n1. Агрессивная очистка и переподключение...");
        const aggressiveResult = await invoke('aggressive_cleanup_and_reconnect');
        console.log("✅ Агрессивная очистка:", aggressiveResult);
        
        // 2. Проверка статуса
        console.log("\n2. Проверка статуса камеры...");
        const status = await invoke('check_camera_status');
        console.log("✅ Статус камеры:", status);
        
        // 3. Запуск live view
        console.log("\n3. Запуск live view...");
        const liveViewResult = await invoke('start_live_view');
        console.log("✅ Live view:", liveViewResult);
        
        // 4. Ждем стабилизации
        console.log("\n4. Ожидание стабилизации...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 5. Тест захвата без автофокуса (если не поддерживается)
        console.log("\n5. Тест захвата фото...");
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
            const cleanupResult = await invoke('aggressive_cleanup_and_reconnect');
            console.log("✅ Восстановление:", cleanupResult);
        } catch (cleanupError) {
            console.error("❌ Ошибка восстановления:", cleanupError);
        }
    }
}

async function testMultipleCaptures() {
    console.log("\n=== Тест множественных захватов ===");
    
    try {
        // Инициализация
        await invoke('initialize_camera');
        
        // Запуск live view
        await invoke('start_live_view');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Множественные захваты
        for (let i = 1; i <= 5; i++) {
            console.log(`\n--- Захват ${i}/5 ---`);
            
            try {
                const captureResult = await invoke('capture_photo_as');
                console.log(`✅ Захват ${i}:`, captureResult);
                
                // Ждем между захватами
                await new Promise(resolve => setTimeout(resolve, 3000));
                
            } catch (captureError) {
                console.error(`❌ Ошибка захвата ${i}:`, captureError);
                
                // Попытка восстановления
                console.log("🔄 Попытка восстановления...");
                await invoke('force_cleanup_and_reconnect');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        await invoke('stop_live_view');
        console.log("✅ Тест множественных захватов завершен");
        
    } catch (error) {
        console.error("❌ Ошибка теста множественных захватов:", error);
    }
}

async function testDisconnectionHandling() {
    console.log("\n=== Тест обработки отключений ===");
    
    try {
        // 1. Инициализация
        await invoke('initialize_camera');
        
        // 2. Запуск live view
        await invoke('start_live_view');
        
        // 3. Симуляция проблем (быстрые захваты)
        console.log("3. Симуляция проблем с быстрыми захватами...");
        
        for (let i = 1; i <= 3; i++) {
            try {
                await invoke('capture_photo_as');
                console.log(`✅ Быстрый захват ${i} выполнен`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Минимальная пауза
            } catch (error) {
                console.log(`⚠️ Захват ${i} вызвал ошибку:`, error);
                
                // Автоматическое восстановление
                console.log("🔄 Автоматическое восстановление...");
                await invoke('aggressive_cleanup_and_reconnect');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        await invoke('stop_live_view');
        console.log("✅ Тест обработки отключений завершен");
        
    } catch (error) {
        console.error("❌ Ошибка теста отключений:", error);
    }
}

// Запуск всех тестов
async function runAllTests() {
    await testProductionFixes();
    await testMultipleCaptures();
    await testDisconnectionHandling();
}

runAllTests().catch(console.error); 