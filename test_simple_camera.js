// Простой тест камеры
const { invoke } = window.__TAURI__.tauri;

async function testSimpleCamera() {
    console.log("=== Простой тест камеры ===");
    
    try {
        // 1. Инициализация
        console.log("1. Инициализация камеры...");
        const initResult = await invoke('initialize_camera');
        console.log(`   Результат: ${initResult}`);
        
        // 2. Проверка статуса
        console.log("2. Проверка статуса камеры...");
        const status = await invoke('check_camera_status');
        console.log(`   Статус: ${status}`);
        
        // 3. Запуск live view
        console.log("3. Запуск live view...");
        const liveViewResult = await invoke('start_live_view');
        console.log(`   Результат: ${liveViewResult}`);
        
        // 4. Попытка захвата
        console.log("4. Попытка захвата фото...");
        const captureResult = await invoke('capture_photo_as');
        console.log(`   Результат: ${captureResult}`);
        
        console.log("=== Тест завершен ===");
        
    } catch (error) {
        console.error("Ошибка:", error);
    }
}

// Экспортируем функцию
window.testSimpleCamera = testSimpleCamera;

console.log("Простой тест готов. Выполните: testSimpleCamera()"); 