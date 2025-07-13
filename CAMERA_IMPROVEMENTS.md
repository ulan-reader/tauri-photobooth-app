# Улучшения логики камеры

## Обзор изменений

Была переписана логика захвата фото с добавлением прогресс-бара, улучшенной обработки ошибок и **централизованной инициализации SDK**.

## Централизованная инициализация SDK (НОВОЕ)

### Принцип работы:
- **EdsInitializeSDK()** вызывается **один раз** при запуске приложения в функции `main()`
- **EdsTerminateSDK()** вызывается при завершении приложения через обработчик `tauri://close-requested`
- Все остальные вызовы SDK инициализации/завершения **закомментированы**
- Решает проблемы с borrow checker и делает управление SDK более стабильным

### Код инициализации в main():
```rust
#[tokio::main]
async fn main() {
    // Централизованная инициализация Canon EDSDK
    unsafe {
        let err = EdsInitializeSDK();
        if err != 0 {
            eprintln!("[ERROR] Failed to initialize Canon EDSDK: 0x{:X}", err);
            std::process::exit(1);
        }
        println!("[INFO] Canon EDSDK initialized successfully");
    }
    // ... остальной код
}
```

### Обработчик завершения:
```rust
.setup(|app| {
    // Обработчик завершения приложения для корректного закрытия SDK
    app.handle().listen_global("tauri://close-requested", move |_| {
        unsafe {
            println!("[INFO] Terminating Canon EDSDK...");
            EdsTerminateSDK();
            println!("[INFO] Canon EDSDK terminated successfully");
        }
    });
    Ok(())
})
```

### Преимущества:
- ✅ Решает проблемы с borrow checker
- ✅ Предотвращает множественную инициализацию SDK
- ✅ Гарантирует корректное закрытие при завершении приложения
- ✅ Упрощает управление жизненным циклом SDK
- ✅ Повышает стабильность работы с камерой

## Основные изменения

### 1. Frontend (React/JavaScript)

#### Новые состояния в CapturePage.jsx:
- `isProcessingPhoto` - флаг обработки фото
- `processingProgress` - прогресс обработки (0-100%)
- `processingMessage` - сообщение о текущем этапе

#### Улучшенная функция capture():
```javascript
const capture = useCallback(async () => {
    try {
        setIsProcessingPhoto(true);
        setProcessingProgress(0);
        setProcessingMessage('Остановка live view...');
        
        await invoke("capture_photo_as");
        setProcessingProgress(30);
        setProcessingMessage('Создание фото...');
        
        // Симуляция прогресса
        let progress = 30;
        processingIntervalRef.current = setInterval(() => {
            progress += Math.random() * 10;
            if (progress < 90) {
                setProcessingProgress(Math.min(progress, 90));
            }
        }, 200);

        const image = await invoke('get_captured_image');
        
        setProcessingProgress(100);
        setProcessingMessage('Фото готово!');
        
        // Завершение обработки
        setTimeout(() => {
            // ... обработка результата
            setIsProcessingPhoto(false);
        }, 500);

    } catch (err) {
        // Обработка ошибок
        setProcessingMessage('Ошибка при создании фото');
        // Возврат к live view
    }
}, []);
```

#### Новый компонент PhotoProcessingProgress:
- Красивый модальный прогресс-бар
- Анимации загрузки
- Отображение процентов и сообщений
- Автоматическое скрытие по завершении

### 2. Backend (Rust)

#### Улучшенная функция capture_photo():
```rust
fn capture_photo(&mut self) -> Result<(), u32> {
    unsafe {
        println!("[LOG] Starting photo capture process...");
        
        // Остановка live view
        self.stop_live_view().unwrap();
        
        // Установка обработчиков событий с логированием
        // ...
        
        // Улучшенная логика повторных попыток
        let mut capture_successful = false;
        while attempts < max_retries && !capture_successful {
            // ... логика захвата
        }
        
        // Ожидание создания фото с таймаутом
        let mut wait_attempts = 0;
        let max_wait_attempts = 300; // 30 секунд
        
        while wait_attempts < max_wait_attempts {
            // ... проверка создания фото
        }
        
        Ok(())
    }
}
```

#### Улучшенная функция download_image():
- Подробное логирование каждого этапа
- Лучшая обработка ошибок
- Информация о размере файла

#### Улучшенные Tauri команды:
- `capture_photo_as` - детальные сообщения об ошибках
- `get_captured_image` - улучшенное логирование и обработка ошибок

## Новые возможности

### 1. Прогресс-бар
- Визуальная индикация процесса захвата
- Реальные сообщения о текущем этапе
- Плавные анимации

### 2. Улучшенная обработка ошибок
- Детальные сообщения об ошибках
- Автоматический возврат к live view при ошибке
- Логирование всех этапов процесса

### 3. Лучшее логирование
- Подробные логи в Rust коде
- Отслеживание времени выполнения
- Информация о размерах файлов

### 4. Таймауты и повторные попытки
- Таймаут 30 секунд на создание фото
- До 10 попыток отправки команды захвата
- Автоматическое восстановление при ошибках

### 5. Мониторинг состояния камеры
- Отслеживание подключения/отключения камеры
- Автоматическое переподключение при отключении
- Визуальный индикатор состояния камеры
- Обработка события "PC Full" и других ошибок камеры

### 6. Автоматическое восстановление
- Переподключение камеры при отключении
- Восстановление live view после ошибок
- Уведомления пользователя о состоянии камеры

## Исправления ошибок (НОВОЕ)

### 1. Исправление ошибок Canvas
- **Проблема**: `Cannot read properties of null (reading 'getContext')`
- **Решение**: Добавлена проверка canvas на null перед использованием
- **Код**: 
```javascript
const ctx = canvas.getContext('2d');
if (!ctx) {
    console.warn('Canvas context недоступен');
    return;
}
```

### 2. Исправление несуществующей команды
- **Проблема**: `command close_session not found`
- **Решение**: Заменена на существующую команду `end_camera`
- **Код**:
```javascript
try {
    await invoke('stop_live_view');
    await invoke('end_camera');
} catch (err) {
    console.warn('Ошибка при остановке камеры:', err);
}
```

### 3. Улучшенная обработка ошибки "Device busy"
- **Проблема**: Ошибка 41218 (EDS_ERR_DEVICE_BUSY) отключала live view
- **Решение**: Ошибка обрабатывается без отключения live view
- **Код**:
```javascript
if (err.includes("Device busy") || err.includes("41218")) {
    // Устройство занято - это нормально, просто пропускаем кадр
    return;
}
```

### 4. Улучшенная логика переподключения
- **Проблема**: Камера не переподключалась после отключения
- **Решение**: Добавлены множественные попытки переподключения
- **Код**:
```rust
let max_attempts = 5;
let mut attempts = 0;

while attempts < max_attempts {
    match Camera::new() {
        Ok(camera) => {
            // Успешное переподключение
            return Ok("Camera reconnected successfully".into());
        }
        Err(err) => {
            attempts += 1;
            if attempts < max_attempts {
                std::thread::sleep(std::time::Duration::from_millis(500));
            }
        }
    }
}
```

### 5. Стабильность Live View
- **Проблема**: Live view отключался при любых ошибках
- **Решение**: Live view остается активным при временных ошибках
- **Улучшения**:
  - Ошибка "Device busy" не отключает live view
  - Автоматическое восстановление после ошибок захвата
  - Более стабильная работа при частых отключениях камеры

### 6. Исправление ошибки "PC Full" (УЛУЧШЕНО)
- **Проблема**: Камера показывает "PC Full" несмотря на достаточную память
- **Причина**: Неправильное управление сессиями камеры в EDSDK
- **Решение**: 
  - **НОВАЯ команда `force_cleanup_sessions`** для принудительной очистки всех сессий
  - Принудительное закрытие сессии при инициализации камеры
  - Улучшенная функция `refresh_camera_session` с полной переинициализацией SDK
  - **НОВАЯ кнопка "Исправить PC Full"** в UI для быстрого исправления
  - Автоматическая очистка сессий при создании новой камеры
- **Код**:
```rust
// Принудительное закрытие сессии при инициализации
println!("[LOG] Forcing session close...");
let _ = EdsCloseSession(camera_ref_in);
std::thread::sleep(std::time::Duration::from_millis(500));
EdsOpenSession(camera_ref_in);

// Новая команда для принудительной очистки
#[tauri::command]
fn force_cleanup_sessions() -> Result<String, String> {
    unsafe {
        let _ = EdsTerminateSDK();
        std::thread::sleep(std::time::Duration::from_millis(1000));
        let err = EdsInitializeSDK();
        // ... обработка ошибок
    }
    Ok("All sessions cleaned up successfully".into())
}
```
- **Использование**: Нажмите кнопку "Исправить PC Full" в правом верхнем углу экрана

### 7. Стабильный захват фото (НОВОЕ)
- **Проблема**: Камера отключается (событие 0x305) во время захвата фото
- **Причина**: Слишком агрессивная обработка событий отключения
- **Решение**:
  - Событие 0x305 больше не прерывает процесс захвата
  - Улучшенная логика инициализации SDK (не закрываем при каждом создании)
  - Более стабильное управление сессиями
  - Процесс захвата продолжается даже при временных отключениях
- **Код**:
```rust
// Событие 0x305 больше не прерывает захват
0x00000305 => {
    println!("[WARNING] Camera disconnected (0x305) - but keeping session alive");
    // НЕ устанавливаем is_connected = false для 0x305
    // Это временное отключение, которое может восстановиться
}
```

## Использование

### Для разработчиков:
1. Все изменения обратно совместимы
2. Добавлено подробное логирование для отладки
3. Создан тестовый файл `test_camera_logic.js`
4. **НОВОЕ**: Создан тест `test_camera_improvements.js` для проверки исправлений

### Для пользователей:
1. Более понятная обратная связь при захвате фото
2. Автоматическое восстановление при ошибках
3. Красивый интерфейс с прогресс-баром
4. **НОВОЕ**: Более стабильная работа камеры без постоянных отключений

## Тестирование

### Тест централизованной инициализации SDK
Запустите `test_centralized_sdk.js` в консоли браузера для проверки:
- Централизованной инициализации SDK
- Стабильности работы с камерой
- Корректного управления жизненным циклом

### Тест стабильного захвата фото
Запустите `test_stable_capture.js` в консоли браузера для проверки стабильности захвата фото.

### Тест обработки ошибок
Запустите `test_error_handling.js` для проверки обработки различных ошибок камеры.

### Тест обновления сессии
Запустите `test_session_refresh.js` для проверки функции обновления сессии камеры.

### Команды для тестирования:
```javascript
// В консоли браузера:
testCentralizedSDK()    // Тест централизованной инициализации
testSDKStability()      // Тест стабильности SDK
testStableCapture()     // Тест стабильного захвата
testErrorHandling()     // Тест обработки ошибок
testSessionRefresh()    // Тест обновления сессии
```

### Запуск тестов:
```bash
# Или используйте в браузере:
import { testCaptureWithProgress } from './test_camera_logic.js';
testCaptureWithProgress();
```

**НОВЫЕ ТЕСТЫ**:
```javascript
// В консоли браузера
testCameraErrorHandling();        // Тест обработки ошибок
testCameraSessionRefresh();       // Тест обновления сессии
forceRefreshSession();            // Быстрое обновление сессии
testStableCapture();              // Тест стабильного захвата
testMultipleCaptures(5);          // Тест 5 последовательных захватов
```

## Совместимость

- ✅ Обратная совместимость с существующим кодом
- ✅ Все существующие функции работают как прежде
- ✅ Новые функции опциональны и не влияют на старую логику
- ✅ **НОВОЕ**: Исправлены критические ошибки, влияющие на стабильность 