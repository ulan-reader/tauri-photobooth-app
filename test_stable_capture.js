// Тест стабильного захвата фото
const { invoke } = window.__TAURI__.tauri;

async function testStableCapture() {
    console.log("=== Тест стабильного захвата фото ===");
    
    try {
        // Тест 1: Проверка состояния камеры
        console.log("1. Проверка состояния камеры...");
        const isConnected = await invoke('check_camera_status');
        console.log(`   Камера подключена: ${isConnected}`);
        
        if (!isConnected) {
            console.log("   Инициализируем камеру...");
            await invoke('initialize_camera');
        }
        
        // Тест 2: Запуск live view
        console.log("2. Запуск live view...");
        await invoke('start_live_view');
        console.log("   Live view запущен");
        
        // Тест 3: Попытка захвата фото
        console.log("3. Попытка захвата фото...");
        const captureResult = await invoke('capture_photo_as');
        console.log(`   Результат захвата: ${captureResult}`);
        
        if (captureResult.includes("successfully")) {
            // Тест 4: Получение захваченного изображения
            console.log("4. Получение захваченного изображения...");
            const image = await invoke('get_captured_image');
            console.log(`   Изображение получено, размер: ${image.length} символов`);
            
            // Тест 5: Возврат к live view
            console.log("5. Возврат к live view...");
            await invoke('start_live_view');
            console.log("   Live view восстановлен");
        }
        
        console.log("=== Тест завершен ===");
        
    } catch (error) {
        console.error("Ошибка в тесте:", error);
        
        // Попытка восстановления
        try {
            console.log("Попытка восстановления...");
            await invoke('start_live_view');
            console.log("Live view восстановлен после ошибки");
        } catch (recoveryError) {
            console.error("Ошибка восстановления:", recoveryError);
        }
    }
}

// Функция для множественного тестирования
async function testMultipleCaptures(count = 3) {
    console.log(`=== Тест ${count} последовательных захватов ===`);
    
    for (let i = 1; i <= count; i++) {
        console.log(`\n--- Захват ${i}/${count} ---`);
        
        try {
            await testStableCapture();
            console.log(`✅ Захват ${i} успешен`);
            
            // Пауза между захватами
            if (i < count) {
                console.log("Ожидание 2 секунды перед следующим захватом...");
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
        } catch (error) {
            console.error(`❌ Захват ${i} неудачен:`, error);
        }
    }
    
    console.log("\n=== Тест множественных захватов завершен ===");
}

// Экспортируем функции для использования в консоли браузера
window.testStableCapture = testStableCapture;
window.testMultipleCaptures = testMultipleCaptures;

console.log("Тесты готовы. Выполните:");
console.log("- testStableCapture() - одиночный захват");
console.log("- testMultipleCaptures(5) - 5 последовательных захватов"); 