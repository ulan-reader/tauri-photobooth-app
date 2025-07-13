// Тест решения проблемы "PC Full"
const { invoke } = window.__TAURI__.tauri;

async function testPCFullFix() {
    console.log("=== Тест решения проблемы PC Full ===");
    
    try {
        // 1. Принудительная очистка всех сессий
        console.log("1. Принудительная очистка всех сессий...");
        const cleanupResult = await invoke('force_cleanup_sessions');
        console.log(`   Результат: ${cleanupResult}`);
        
        // 2. Инициализация камеры
        console.log("2. Инициализация камеры...");
        const initResult = await invoke('initialize_camera');
        console.log(`   Результат: ${initResult}`);
        
        // 3. Запуск live view
        console.log("3. Запуск live view...");
        const liveViewResult = await invoke('start_live_view');
        console.log(`   Результат: ${liveViewResult}`);
        
        // 4. Попытка захвата фото
        console.log("4. Попытка захвата фото...");
        const captureResult = await invoke('capture_photo_as');
        console.log(`   Результат: ${captureResult}`);
        
        if (captureResult.includes("successfully")) {
            // 5. Получение изображения
            console.log("5. Получение захваченного изображения...");
            const image = await invoke('get_captured_image');
            console.log(`   Изображение получено, размер: ${image.length} символов`);
        }
        
        console.log("=== Тест завершен ===");
        console.log("Если камера больше не показывает 'PC Full', проблема решена!");
        
    } catch (error) {
        console.error("Ошибка в тесте:", error);
    }
}

// Функция для быстрого исправления PC Full
async function fixPCFull() {
    console.log("=== Быстрое исправление PC Full ===");
    
    try {
        // Принудительная очистка
        await invoke('force_cleanup_sessions');
        console.log("✅ Сессии очищены");
        
        // Переинициализация камеры
        await invoke('initialize_camera');
        console.log("✅ Камера переинициализирована");
        
        // Запуск live view
        await invoke('start_live_view');
        console.log("✅ Live view запущен");
        
        console.log("🎉 PC Full должен быть исправлен!");
        
    } catch (error) {
        console.error("Ошибка при исправлении:", error);
    }
}

// Экспортируем функции
window.testPCFullFix = testPCFullFix;
window.fixPCFull = fixPCFull;

console.log("Тесты готовы. Выполните:");
console.log("- testPCFullFix() - полный тест решения PC Full");
console.log("- fixPCFull() - быстрое исправление PC Full"); 