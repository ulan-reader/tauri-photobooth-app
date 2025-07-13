// Агрессивный тест решения проблемы PC Full
const { invoke } = window.__TAURI__.tauri;

async function aggressivePCFullFix() {
    console.log("=== АГРЕССИВНОЕ исправление PC Full ===");
    
    try {
        // 1. Принудительная очистка ВСЕХ сессий
        console.log("1. Принудительная очистка ВСЕХ сессий...");
        await invoke('force_cleanup_sessions');
        console.log("✅ Все сессии очищены");
        
        // 2. Ждем дополнительно
        console.log("2. Ожидание 3 секунды...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 3. Инициализация камеры
        console.log("3. Инициализация камеры...");
        await invoke('initialize_camera');
        console.log("✅ Камера инициализирована");
        
        // 4. Запуск live view
        console.log("4. Запуск live view...");
        await invoke('start_live_view');
        console.log("✅ Live view запущен");
        
        // 5. Попытка захвата
        console.log("5. Попытка захвата фото...");
        const captureResult = await invoke('capture_photo_as');
        console.log(`✅ Захват: ${captureResult}`);
        
        if (captureResult.includes("successfully")) {
            // 6. Получение изображения
            console.log("6. Получение изображения...");
            const image = await invoke('get_captured_image');
            console.log(`✅ Изображение получено (${image.length} символов)`);
        }
        
        console.log("🎉 АГРЕССИВНОЕ исправление PC Full завершено!");
        console.log("Камера должна больше не показывать 'PC Full'");
        
    } catch (error) {
        console.error("❌ Ошибка в агрессивном исправлении:", error);
    }
}

// Функция для множественного тестирования
async function testMultipleCaptures(count = 5) {
    console.log(`=== Тест ${count} последовательных захватов ===`);
    
    try {
        // Начальная очистка
        await invoke('force_cleanup_sessions');
        await invoke('initialize_camera');
        await invoke('start_live_view');
        
        for (let i = 1; i <= count; i++) {
            console.log(`\n--- Захват ${i}/${count} ---`);
            
            try {
                const captureResult = await invoke('capture_photo_as');
                console.log(`✅ Захват ${i}: ${captureResult}`);
                
                if (captureResult.includes("successfully")) {
                    const image = await invoke('get_captured_image');
                    console.log(`✅ Изображение ${i} получено`);
                }
                
                // Пауза между захватами
                if (i < count) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (error) {
                console.error(`❌ Ошибка в захвате ${i}:`, error);
                
                // Если ошибка PC Full, пробуем исправить
                if (error.includes("PC Full") || error.includes("0x8D07")) {
                    console.log("🔄 Обнаружена ошибка PC Full, исправляем...");
                    await invoke('force_cleanup_sessions');
                    await invoke('initialize_camera');
                    await invoke('start_live_view');
                }
            }
        }
        
        console.log("\n🎉 Тест множественных захватов завершен!");
        
    } catch (error) {
        console.error("❌ Ошибка в тесте множественных захватов:", error);
    }
}

// Функция для мониторинга состояния камеры
async function monitorCameraStatus(duration = 30000) {
    console.log(`=== Мониторинг состояния камеры (${duration/1000} сек) ===`);
    
    const startTime = Date.now();
    const interval = setInterval(async () => {
        try {
            const status = await invoke('check_camera_status');
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            console.log(`[${elapsed}s] Камера: ${status ? '✅ Подключена' : '❌ Отключена'}`);
            
            if (Date.now() - startTime >= duration) {
                clearInterval(interval);
                console.log("🏁 Мониторинг завершен");
            }
        } catch (error) {
            console.error("❌ Ошибка проверки статуса:", error);
        }
    }, 5000);
}

// Экспортируем функции
window.aggressivePCFullFix = aggressivePCFullFix;
window.testMultipleCaptures = testMultipleCaptures;
window.monitorCameraStatus = monitorCameraStatus;

console.log("🔥 Агрессивные тесты готовы:");
console.log("- aggressivePCFullFix() - агрессивное исправление PC Full");
console.log("- testMultipleCaptures(5) - тест 5 последовательных захватов");
console.log("- monitorCameraStatus(60000) - мониторинг 60 секунд"); 