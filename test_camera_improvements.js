// Тест улучшенной логики обработки ошибок камеры
const { invoke } = window.__TAURI__.tauri;

async function testCameraErrorHandling() {
    console.log("=== Тест улучшенной логики обработки ошибок камеры ===");
    
    try {
        // Тест 1: Проверка состояния камеры
        console.log("1. Проверка состояния камеры...");
        const isConnected = await invoke('check_camera_status');
        console.log(`   Камера подключена: ${isConnected}`);
        
        // Тест 2: Попытка переподключения (если камера отключена)
        if (!isConnected) {
            console.log("2. Попытка переподключения камеры...");
            const result = await invoke('reconnect_camera');
            console.log(`   Результат: ${result}`);
            
            // Проверяем состояние после переподключения
            const newStatus = await invoke('check_camera_status');
            console.log(`   Новое состояние: ${newStatus}`);
        }
        
        // Тест 3: Запуск live view
        console.log("3. Запуск live view...");
        const liveViewResult = await invoke('start_live_view');
        console.log(`   Результат: ${liveViewResult}`);
        
        // Тест 4: Симуляция ошибки "Device busy"
        console.log("4. Тест обработки ошибки 'Device busy'...");
        // Этот тест будет выполняться в реальном времени при получении ошибки 41218
        
        console.log("=== Тест завершен ===");
        
    } catch (error) {
        console.error("Ошибка в тесте:", error);
    }
}

// Экспортируем функцию для использования в консоли браузера
window.testCameraErrorHandling = testCameraErrorHandling;

console.log("Тест готов. Выполните: testCameraErrorHandling()"); 