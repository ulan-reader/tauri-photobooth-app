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
import { useStore } from "../admin/store";

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
    const {
        setQRImage,
        project, 
        setProject
    } = useStore();
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
    const handleQRChange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
    
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageSrc = e.target.result;
                const imageObject = new Image();
                imageObject.src = imageSrc;
                // Обновляем состояние с новым изображением
                try {
                    await invoke('save_image', {
                        image: imageSrc,
                        relativePath: "settings/qr_image",
                    })
                } catch (err) {
                    console.error("Ошибка сохранения изображения: ", err);
                }
            };
            reader.readAsDataURL(file);
            const image = await invoke('get_image_path', { path: `settings/qr_image` });
            const url_image = `url(${convertFileSrc(image)})`;
            setQRImage(`${project.name}_settings/qr_image`, "settings/qr_image", url_image);
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
                                className="text-lg dark:bg-gray-800"
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
                                className="text-lg dark:bg-gray-800"
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
            <div className="p-4">
                <h1 className="text-xl font-bold mb-4">Настройки товара</h1>

                <div className="flex gap-8">
                    {/* Левая колонка — форма */}
                    <form
                    className="flex flex-col gap-4 w-1/2"
                    onSubmit={(e) => e.preventDefault()}
                    >
                    <div>
                        <label className="block mb-1">Стоимость:</label>
                        <input
                        type="number"
                        name="amount"
                        step="0.01"
                        value={form.amount}
                        onChange={handleChange}
                        className="border p-1 rounded w-full dark:bg-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block mb-1">Товар (item_id):</label>
                        <input
                        type="number"
                        name="item"
                        value={form.item}
                        onChange={handleChange}
                        className="border p-1 rounded w-full dark:bg-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block mb-1">Название (каз):</label>
                        <input
                        type="text"
                        name="name_kz"
                        value={form.name_kz}
                        onChange={handleChange}
                        className="border p-1 rounded w-full dark:bg-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block mb-1">Название (рус):</label>
                        <input
                        type="text"
                        name="name_ru"
                        value={form.name_ru}
                        onChange={handleChange}
                        className="border p-1 rounded w-full dark:bg-gray-800"
                        />
                    </div>

                    <button
                        type="button"
                        className="bg-blue-600 text-white px-4 py-2 rounded w-fit"
                        onClick={saveToFile}
                    >
                        Сохранить
                    </button>
                    </form>

                    {/* Правая колонка — выбор QR */}
                    <div className="flex items-center justify-center w-1/2">
                    <label
                        style={{
                        width: '300px',
                        height: '300px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '2px dashed gray',
                        cursor: 'pointer',
                        textAlign: 'center',
                        }}
                    >
                        <p>Кликните для выбора QR оплаты</p>
                        <input
                        type="file"
                        accept="image/*"
                        onChange={handleQRChange}
                        className="hidden dark:bg-gray-800"
                        />
                    </label>
                    </div>
                </div>
                </div>
            <ToastContainer />
        </AdminShell>
    )
}