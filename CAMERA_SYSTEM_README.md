# Новая система управления камерой Canon

## Обзор изменений

Мы полностью переработали систему управления камерой Canon для решения проблемы "PC Full" и улучшения стабильности работы.

### Основные улучшения:

1. **Простая архитектура**: Убрали сложную систему событий и состояний
2. **Автоматическое управление сессиями**: Сессии открываются только когда нужно
3. **Автофокус**: Добавлена поддержка автофокуса при съемке
4. **Надежная очистка ресурсов**: Правильное освобождение ресурсов камеры

## Новая структура CameraManager

```rust
struct CameraManager {
    camera_ref: Option<*mut c_void>,
    is_session_open: bool,
    is_live_view_active: bool,
}
```

### Основные методы:

- `new()` - Создание нового менеджера камеры
- `get_camera_ref()` - Получение ссылки на камеру
- `open_session()` - Открытие сессии камеры
- `close_session()` - Закрытие сессии камеры
- `enable_autofocus()` - Включение автофокуса
- `capture_photo()` - Захват фото с автофокусом
- `start_live_view()` - Запуск live view
- `stop_live_view()` - Остановка live view
- `download_evf_image()` - Загрузка EVF изображения

## Как использовать

### 1. Инициализация камеры

```javascript
// В React компоненте
const initializeCamera = async () => {
  try {
    const result = await invoke('initialize_camera');
    console.log('Камера инициализирована:', result);
  } catch (error) {
    console.error('Ошибка инициализации камеры:', error);
  }
};
```

### 2. Запуск Live View

```javascript
const startLiveView = async () => {
  try {
    const result = await invoke('start_live_view');
    console.log('Live view запущен:', result);
  } catch (error) {
    console.error('Ошибка запуска live view:', error);
  }
};
```

### 3. Захват фото с автофокусом

```javascript
const capturePhoto = async () => {
  try {
    const result = await invoke('capture_photo_as');
    console.log('Фото захвачено:', result);
    
    // Получение захваченного изображения
    const imageData = await invoke('get_captured_image');
    console.log('Данные изображения получены');
  } catch (error) {
    console.error('Ошибка захвата фото:', error);
  }
};
```

### 4. Остановка Live View

```javascript
const stopLiveView = async () => {
  try {
    const result = await invoke('stop_live_view');
    console.log('Live view остановлен:', result);
  } catch (error) {
    console.error('Ошибка остановки live view:', error);
  }
};
```

### 5. Обновление сессии камеры

```javascript
const refreshCamera = async () => {
  try {
    const result = await invoke('refresh_camera_session');
    console.log('Сессия камеры обновлена:', result);
  } catch (error) {
    console.error('Ошибка обновления сессии:', error);
  }
};
```

### 6. Принудительная очистка сессий (для исправления "PC Full")

```javascript
const forceCleanup = async () => {
  try {
    const result = await invoke('force_cleanup_sessions');
    console.log('Сессии очищены:', result);
  } catch (error) {
    console.error('Ошибка очистки сессий:', error);
  }
};
```

## Решение проблемы "PC Full"

### Автоматическое решение

Новая система автоматически:
1. Устанавливает правильную емкость камеры
2. Настраивает сохранение на компьютер
3. Правильно управляет сессиями

### Ручное решение

Если проблема все еще возникает:

1. **Через UI**: Нажмите кнопку "Исправить PC Full"
2. **Через консоль**: Вызовите команду `force_cleanup_sessions`
3. **Перезапуск**: Перезапустите приложение

## Автофокус

Теперь при каждом захвате фото автоматически:
1. Включается режим автофокуса
2. Выполняется команда автофокуса
3. Делается небольшая пауза для фокусировки
4. Выполняется съемка

## Логирование

Система ведет подробные логи:
- `[LOG]` - Информационные сообщения
- `[WARNING]` - Предупреждения
- `[ERROR]` - Ошибки

## Тестирование

Для тестирования новой системы:

```bash
cd src-tauri
cargo build
cargo run
```

## Совместимость

Новая система полностью совместима с существующим фронтендом. Все команды Tauri остались теми же.

## Устранение неполадок

### Камера не подключается
1. Проверьте USB соединение
2. Убедитесь, что камера включена
3. Попробуйте `refresh_camera_session`

### Ошибка "PC Full"
1. Вызовите `force_cleanup_sessions`
2. Перезапустите приложение
3. Проверьте свободное место на диске

### Live View не работает
1. Убедитесь, что камера подключена
2. Попробуйте `refresh_camera_session`
3. Проверьте логи на наличие ошибок

## Производительность

Новая система:
- Быстрее инициализируется
- Использует меньше памяти
- Стабильнее работает
- Правильно освобождает ресурсы 