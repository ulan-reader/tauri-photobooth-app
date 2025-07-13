import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';

export default function CameraStatusIndicator() {
    const [isConnected, setIsConnected] = useState(true);
    const [isChecking, setIsChecking] = useState(false);

    const checkCameraStatus = async () => {
        try {
            setIsChecking(true);
            const status = await invoke('check_camera_status');
            setIsConnected(status);
            
            if (!status) {
                toast.error("Камера отключена!");
            }
        } catch (error) {
            console.error('Ошибка проверки состояния камеры:', error);
            setIsConnected(false);
        } finally {
            setIsChecking(false);
        }
    };

    const reconnectCamera = async () => {
        try {
            setIsChecking(true);
            await invoke('reconnect_camera');
            setIsConnected(true);
            toast.success("Камера успешно переподключена!");
        } catch (error) {
            console.error('Ошибка переподключения камеры:', error);
            toast.error("Ошибка переподключения камеры");
        } finally {
            setIsChecking(false);
        }
    };

    const refreshCameraSession = async () => {
        try {
            setIsChecking(true);
            await invoke('refresh_camera_session');
            setIsConnected(true);
            toast.success("Сессия камеры обновлена!");
        } catch (error) {
            console.error('Ошибка обновления сессии камеры:', error);
            toast.error("Ошибка обновления сессии камеры");
        } finally {
            setIsChecking(false);
        }
    };

    const forceCleanupSessions = async () => {
        try {
            setIsChecking(true);
            toast.info("Начинаем агрессивную очистку сессий...");
            
            await invoke('force_cleanup_sessions');
            toast.success("Все сессии принудительно очищены!");
            
            // Ждем дополнительно
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Переинициализируем камеру после очистки
            await invoke('initialize_camera');
            setIsConnected(true);
            toast.success("Камера переинициализирована!");
            
            // Запускаем live view
            await invoke('start_live_view');
            toast.success("Live view запущен!");
            
        } catch (error) {
            console.error('Ошибка принудительной очистки сессий:', error);
            toast.error("Ошибка очистки сессий");
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        // Проверяем состояние камеры каждые 5 секунд
        const interval = setInterval(checkCameraStatus, 5000);
        
        // Первоначальная проверка
        checkCameraStatus();
        
        return () => clearInterval(interval);
    }, []);

    if (isConnected) {
        return (
            <div className="fixed top-4 right-4 z-50">
                <div className="flex items-center space-x-2 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Камера подключена</span>
                    <button 
                        onClick={refreshCameraSession}
                        disabled={isChecking}
                        className="ml-2 px-2 py-1 bg-white text-green-500 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                        title="Обновить сессию камеры"
                    >
                        {isChecking ? 'Обновление...' : 'Обновить сессию'}
                    </button>
                    <button 
                        onClick={forceCleanupSessions}
                        disabled={isChecking}
                        className="ml-1 px-2 py-1 bg-yellow-500 text-white rounded text-xs font-medium hover:bg-yellow-600 disabled:opacity-50"
                        title="Принудительная очистка всех сессий (исправить 'PC Full')"
                    >
                        {isChecking ? 'Очистка...' : 'Исправить PC Full'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className="flex items-center space-x-2 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-sm font-medium">Камера отключена</span>
                <button 
                    onClick={reconnectCamera}
                    disabled={isChecking}
                    className="ml-2 px-2 py-1 bg-white text-red-500 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                >
                    {isChecking ? 'Подключение...' : 'Переподключить'}
                </button>
            </div>
        </div>
    );
} 