import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, ArrowLeft } from "lucide-react"
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import { invoke } from '@tauri-apps/api';
import AdminShell from '../components/AdminShell';

const props = {
    page: 'Проверка принтера',
    type: 'printer'
}

export default function PrinterInfo({ isDarkMode, setShowPopup, setLoading, showPopup }) {

    usePageNavigation();

    const [printerData, setPrinterData] = useState();

    async function openPrinterSettings() {
        try {
            const process = invoke('printer_settings');
        //   await process.execute();
            console.log(process);
            console.log('Settings window opened');
        } catch (err) {
            console.error('Failed to open printer settings:', err);
        }
    }
    
    async function openPrinterStatus() {
        try {
            invoke('printer_status');
        } catch (err) {
            console.error('Failed to open printer status:', err);
        }
    }
    useEffect(() => {
        const get_printer = async () => {
            try {
                const response = await invoke('printer_information');
                if (response) {
                    setPrinterData(response); 
                }
            } catch (error) {
                toast.error('Не удалось получить информацию о принтере');
            }
        }

        if (!showPopup) {
            get_printer();
        }
    }, [showPopup]);

    const handleSetPrinter = () => {
        setLoading(false);
        setShowPopup(true);
    }
    

    return (
        <AdminShell props={props}>
            <div className="grid grid-cols-2 gap-8">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600 grid grid-cols-2">
                    <h2 className="text-2xl font-bold mb-4 col-span-2">Информация о принтере</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Имя принтера</p>
                            <p className="text-lg font-medium">{printerData?.Name}</p>
                        </div>
                        {/* <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Драйвер принтера</p>
                            <p className="text-lg font-medium">{printerData?.DriverName}</p>
                        </div> */}
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Порт подключения</p>
                            <p className="text-lg font-medium">{printerData?.PortName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Подключение</p>
                            <p className="text-lg font-medium">{printerData?.Local === true ? 'Локальное' : 'Сетевое'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Статус принтера</p>
                            <p className="text-lg font-medium">{printerData?.PrinterStatus}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Текущая ошибка</p>
                            <p className="text-lg font-medium">{printerData?.DetectedErrorState}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Поддерживаемые размеры бумаги</p>
                            {printerData?.CapabilityDescriptions?.map((type) => <p className="text-lg font-medium" key={type}>{type}</p>)}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className='overflow-y-auto h-56'>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Поддерживаемые размеры бумаги</p>
                            {printerData?.PrinterPaperNames?.map((type) => <p className="text-lg font-medium" key={type}>{type}</p>)}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Разрешение печати</p>
                            <p className="text-lg font-medium">{printerData?.VerticalResolution} DPI</p>
                        </div>
                    </div>
                </div>
                <div className='grid grid-rows-2 gap-8'>
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h2 className="text-2xl font-bold mb-4">Статус очереди</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Количество заданий в очереди</p>
                                <p className="text-lg font-medium">{printerData?.JobCountSinceLastReset}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Формат данных задания</p>
                                <p className="text-lg font-medium">{printerData?.PrintJobDataType}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h2 className="text-2xl font-bold mb-4">Настройки общего доступа</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Общий доступ</p>
                                <p className="text-lg font-medium">{printerData?.Shared ? 'Включен' : 'Отключен'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Имя общего ресурса</p>
                                <p className="text-lg font-medium">{printerData?.ShareName}</p>
                            </div>
                            <div>
                                <button className="text-sm text-blue-600 dark:text-gray-400" onClick={handleSetPrinter}>Поменять принтер</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button>
                    <span 
                        onClick={() => openPrinterSettings(printerData?.Name)}
                        className="px-6 py-3 rounded-lg text-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
                    >Открыть настройки принтера</span>
                </button>
                <button>
                    <span
                        onClick={() => openPrinterStatus()}
                        className="px-6 py-3 rounded-lg text-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
                    >Окрыть статус принтеров</span>
                </button>
                <Link 
                    to="/settings"
                    className="px-6 py-3 rounded-lg text-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
                >
                Назад к настройкам
                </Link>
            </div>
        </AdminShell>
    )
}



// return (
//     <AdminShell props={props}>
//         <div className="grid grid-cols-2 gap-8">
//             <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
//             <h2 className="text-2xl font-bold mb-4">Информация о принтере</h2>
//             <div className="space-y-4">
//                 <div>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">Статус</p>
//                 <p className="text-lg font-medium">null</p>
//                 </div>
//                 <div>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">Серийный номер</p>
//                 <p className="text-lg font-medium">null</p>
//                 </div>
//                 <div>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">CVD</p>
//                 <p className="text-lg font-medium">null</p>
//                 </div>
//                 <div>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">Размер медиа</p>
//                 <p className="text-lg font-medium">null</p>
//                 </div>
//             </div>
//             </div>
//             <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
//             <h2 className="text-2xl font-bold mb-4">Счетчики</h2>
//             <div className="space-y-4">
//                 <div>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">Счетчик жизни</p>
//                 <p className="text-lg font-medium">nullnull</p>
//                 </div>
//                 <div>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">Счетчик A (5x7)</p>
//                 <p className="text-lg font-medium">nullnull</p>
//                 </div>
//                 <div>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">Счетчик B (6x8)</p>
//                 <p className="text-lg font-medium">nullnull</p>
//                 </div>
//             </div>
//             </div>
//         </div>

//         <div className="mt-8 bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
//             <h2 className="text-2xl font-bold mb-4">Расходные материалы</h2>
//             <div className="space-y-6">
//             <div>
//                 <div className="flex justify-between mb-2">
//                 <span>Бумага</span>
//                 <span>null%</span>
//                 </div>
//                 {/* <Progress value={printerData.paperRemaining} className="w-full" /> */}
//             </div>
//             <div>
//                 <div className="flex justify-between mb-2">
//                 <span>Чернила</span>
//                 <span>null%</span>
//                 </div>
//                 {/* <Progress value={printerData.inkRemaining} className="w-full" /> */}
//             </div>
//             <div>
//                 <div className="flex justify-between mb-2">
//                 <span>Медиа</span>
//                 <span>null%</span>
//                 </div>
//                 {/* <Progress value={printerData.mediaRemaining} className="w-full" /> */}
//             </div>
//             </div>
//         </div>

//         <div className="mt-8 flex justify-end">
//             <Link 
//             to="/settings"
//             className="px-6 py-3 rounded-lg text-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
//             >
//             Назад к настройкам
//             </Link>
//         </div>

//         <ToastContainer />
//     </AdminShell>
// )