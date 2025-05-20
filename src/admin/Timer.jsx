import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowLeft } from "lucide-react";
import Switch from 'react-switch';
import '../App.css'
import { invoke } from "@tauri-apps/api/tauri";
import { toast, ToastContainer } from "react-toastify";
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import AdminShell from "../components/AdminShell";
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";

const props = {
    page: 'Время работы фотобудки',
    type: 'clock'
}

export default function Timer() {

    usePageNavigation();

    const [workhours, setWorkhours] = useState({ start: '09:00', end: '21:00', is_always_active: false });

    const handleWorkHoursChange = (type, value) => {
        setWorkhours( prev => ({ ...prev, [type]: value }));
    }
    const [form, setForm] = useState({
        amount: 100.0,
        item: 1,
        name_kz: "Атауы",
        name_ru: "Название",
      });
    
      const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
          ...prev,
          [name]:
            name === "amount"
              ? parseFloat(value)
              : name === "item"
              ? parseInt(value)
              : value,
        }));
      };
    
      const saveToFile = async () => {
        const path = await invoke("take_item_information_path");
        const filePath = `${path}/payment-data.json`;
    
        await writeTextFile(filePath, JSON.stringify(form, null, 2));
        alert("Сохранено!");
      };

    useEffect(() => {
        const loadHours = async () => {
          try {
            const hours = await invoke("get_work_hours");
            setWorkhours(hours);
            toast.info(hours);
            console.log("Work hours loaded:", hours);
          } catch (error) {
            console.error("Failed to load work hours:", error);
            toast.error("Failed to load work hours.");
          }
        };
    
        // Вызываем функцию загрузки только один раз
        loadHours();
      }, []);

    useEffect(() => {
    const loadFromFile = async () => {
        try {
        const path = await invoke("take_item_information_path");
        const filePath = `${path}/payment-data.json`;
        const json = await readTextFile(filePath);
        const parsed = JSON.parse(json);
        setForm(parsed);
        } catch (err) {
        console.log("Файл не найден или ошибка чтения, загружается значение по умолчанию.");
        }
    };
    loadFromFile();
    }, []);

    const saveSchedule = async () => {
        try {
            console.log("Trying to save");
            if (workhours.is_always_active){
                await invoke("set_work_hours", { start: workhours.start, end: workhours.end, isAlwaysActive: workhours.is_always_active });
                toast.success("Фотобудка будет работать круглосуточно!");
            }
            else{
                await invoke("set_work_hours", { start: workhours.start, end: workhours.end, isAlwaysActive: workhours.is_always_active });
                toast.success(`Фотобудка будет работать с ${workhours.start} до ${workhours.end}`);
            }
            console.log(workhours.is_always_active)
        } catch (error) {
            toast.error("Failed to save schedule");
            console.log(error)
        }
    }

    const handleChangeTimeActive = () => {
        setWorkhours((prevState) => ({
          ...prevState, // Копируем все поля из предыдущего состояния
          is_always_active: !prevState.is_always_active, // Меняем только поле is_always_active
        }));
    };

    return (
        <AdminShell props={props}>

            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <label htmlFor="always-on" className="text-lg">Работать круглосуточно</label>
                    <Switch
                        id="always-on"
                        checked={workhours.is_always_active}
                        onChange={handleChangeTimeActive}
                        offColor="#ccc"
                        onColor="#4caf50"
                        handleDiameter={20}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        height={24}
                        width={42}
                        className="react-switch"
                    />
                </div>

                
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label htmlFor="startTime" className="text-lg">Время начала работы</label>
                            <input
                                type="time"
                                name=""
                                id="startTime"
                                value={workhours.start}
                                onChange={(e) => handleWorkHoursChange('start', e.target.value)}
                                className="text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="endTime" className="text-lg">Время окончания работы</label>
                            <input
                                type="time"
                                name=""
                                id="endTime"
                                value={workhours.end}
                                onChange={(e) => handleWorkHoursChange('end', e.target.value)}
                                className="text-lg"
                            />
                        </div>
                    </div>

                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-b-lg">
                    <h2 className="text-lg font-semibold mb-2">Текущее расписание:</h2>
                    <p className="text-lg">
                        {workhours.is_always_active
                            ? "Фотобудка работает круглосуточно"
                            : `Фотобудка работает с ${workhours.start} до ${workhours.end}`
                        }
                    </p>
                </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
                <button>
                    <Link to='/settings'>Отмена</Link>
                </button>
                <button onClick={saveSchedule}>Сохранить расписание</button>
            </div>
            <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold">Настройки товара</h1>
            <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                <div>
                <label className="block">Стоимость:</label>
                <input
                    type="number"
                    name="amount"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    className="border p-1 rounded w-full"
                />
                </div>
                <div>
                <label className="block">Товар (item_id):</label>
                <input
                    type="number"
                    name="item"
                    value={form.item}
                    onChange={handleChange}
                    className="border p-1 rounded w-full"
                />
                </div>
                <div>
                <label className="block">Название (каз):</label>
                <input
                    type="text"
                    name="name_kz"
                    value={form.name_kz}
                    onChange={handleChange}
                    className="border p-1 rounded w-full"
                />
                </div>
                <div>
                <label className="block">Название (рус):</label>
                <input
                    type="text"
                    name="name_ru"
                    value={form.name_ru}
                    onChange={handleChange}
                    className="border p-1 rounded w-full"
                />
                </div>

                <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={saveToFile}
                >
                Сохранить
                </button>
            </form>
            </div>
            <ToastContainer />
        </AdminShell>
    )
}