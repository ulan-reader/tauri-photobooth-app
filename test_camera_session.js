// Тест обновления сессии камеры для исправления "PC Full"
const { invoke } = window.__TAURI__.tauri;

async function testCameraSessionRefresh() {
    console.log("=== Тест обновления сессии камеры ===");
    
    try {
        // Тест 1: Проверка текущего состояния
        console.log("1. Проверка текущего состояния камеры...");
        const isConnected = await invoke('check_camera_status');
        console.log(`   Камера подключена: ${isConnected}`);
        
        if (!isConnected) {
            console.log("   Камера не подключена, пытаемся подключить...");
            await invoke('initialize_camera');
            console.log("   Камера инициализирована");
        }
        
        // Тест 2: Обновление сессии камеры
        console.log("2. Обновление сессии камеры...");
        const result = await invoke('refresh_camera_session');
        console.log(`   Результат: ${result}`);
        
        // Тест 3: Проверка состояния после обновления
        console.log("3. Проверка состояния после обновления...");
        const newStatus = await invoke('check_camera_status');
        console.log(`   Новое состояние: ${newStatus}`);
        
        // Тест 4: Запуск live view
        console.log("4. Запуск live view...");
        const liveViewResult = await invoke('start_live_view');
        console.log(`   Результат: ${liveViewResult}`);
        
        console.log("=== Тест завершен ===");
        console.log("Теперь камера должна работать без ошибки 'PC Full'");
        
    } catch (error) {
        console.error("Ошибка в тесте:", error);
    }
}

// Функция для принудительного обновления сессии
async function forceRefreshSession() {
    console.log("Принудительное обновление сессии камеры...");
    
    try {
        // Останавливаем live view
        await invoke('stop_live_view');
        console.log("Live view остановлен");
        
        // Обновляем сессию
        await invoke('refresh_camera_session');
        console.log("Сессия обновлена");
        
        // Запускаем live view заново
        await invoke('start_live_view');
        console.log("Live view запущен заново");
        
        console.log("Сессия успешно обновлена!");
        
    } catch (error) {
        console.error("Ошибка при обновлении сессии:", error);
    }
}

// Экспортируем функции для использования в консоли браузера
window.testCameraSessionRefresh = testCameraSessionRefresh;
window.forceRefreshSession = forceRefreshSession;

console.log("Тесты готовы. Выполните:");
console.log("- testCameraSessionRefresh() - полный тест");
console.log("- forceRefreshSession() - быстрое обновление сессии"); 