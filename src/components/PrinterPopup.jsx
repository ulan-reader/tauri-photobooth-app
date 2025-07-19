import { invoke } from "@tauri-apps/api";
import React, { useState, useEffect } from "react";

export default function PrinterPopup({ onClose, loading }) {
    const [printers, setPrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState(null);

    const fetchPrinters = async () => {
        try {
            const printersList = await invoke('get_printers_info');
            setPrinters(printersList);
        } catch (err) {
            console.error(err);
            alert('Не удалось загрузить список принтеров.');
        }
    };

    useEffect(() => {
        fetchPrinters();
    }, []);

    const handleSave = async () => {
        if (selectedPrinter) {
            await invoke('saving_printer_data', { printer: selectedPrinter });
            onClose();
        }
    };

    useEffect(() => {
        if (loading) {
            onClose();
        }
    }, [loading]);

    const handlePrinterChange = (printer) => {
        setPrinters(printers.map(p => 
            ({ ...p, is_used: p.id === printer.id })
        ));
        setSelectedPrinter({ ...printer, is_used: true });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg w-80 h-auto">
                <h3 className="text-lg font-bold mb-4">Выберите принтер</h3>
                <ul className="space-y-2">
                    {printers.length > 0 ? (
                        printers.map((printer) => (
                            <li key={printer.id} className="flex items-center space-x-2">
                                <label htmlFor={printer.id} className="cursor-pointer">
                                    <input
                                        type="radio"
                                        name="printer"
                                        checked={printer.is_used}
                                        onChange={() => handlePrinterChange(printer)}
                                        className="form-radio"
                                        id={printer.id}
                                    />
                                    {printer.name}
                                </label>
                            </li>
                        ))
                    ) : (
                        <li>Принтеры не найдены</li>
                    )}
                </ul>
                <div className="mt-4 flex justify-center">
                    <button 
                        onClick={handleSave} 
                        disabled={!selectedPrinter} 
                        className={`py-2 px-4 rounded ${selectedPrinter ? 'bg-blue-500 text-white' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        Сохранить выбор
                    </button>
                    {/* <button onClick={onClose} className="bg-gray-300 text-black py-2 px-4 rounded">Закрыть</button> */}
                </div>
            </div>
        </div>
    );
}
