import React from 'react';

export default function PhotoProcessingProgress({ 
    isVisible, 
    progress, 
    message, 
    onComplete 
}) {
    if (!isVisible) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            style={{ backdropFilter: 'blur(5px)' }}
        >
            <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md w-full mx-4">
                <div className="text-center">
                    {/* Иконка камеры */}
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                            <svg 
                                className="w-8 h-8 text-white" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                                />
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Сообщение */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {message || 'Обработка фото...'}
                    </h3>

                    {/* Прогресс-бар */}
                    <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Процент */}
                    <div className="text-sm text-gray-600">
                        {Math.round(progress)}%
                    </div>

                    {/* Анимация загрузки */}
                    {progress < 100 && (
                        <div className="mt-4">
                            <div className="flex space-x-1 justify-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Сообщение о завершении */}
                    {progress === 100 && (
                        <div className="mt-4">
                            <div className="text-green-500 font-semibold">
                                ✓ Фото готово!
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 