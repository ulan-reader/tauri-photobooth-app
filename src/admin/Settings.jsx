import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Image, Layout, Fingerprint, Printer, Power, BarChart2 } from "lucide-react"
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import { invoke, convertFileSrc } from '@tauri-apps/api/tauri';
import { useStore } from './store';


export default function Settings({ isDarkMode, setIsDarkMode }) {
    const navigate = useNavigate();
    usePageNavigation();
    const { chromokeyStatus, updateCameraStatus, updateLiveViewStatus, cameraStatus, isLiveView, chromokeyBackgroundImage, setChromokeyStatus, setChromokeyBackgroundImage, setProject, project } = useStore();

    useEffect(() => {
        const checkStatus = async() => {
            if (isLiveView) {
                await invoke('stop_live_view');
                updateLiveViewStatus(false);
            };
        }


        checkStatus()
    }, [isLiveView, chromokeyStatus, updateCameraStatus])

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode)
    }



    const settingsSections = [
        // { title: "Начало", description: "Начало", link: '/', icon: Image },
        { title: "Редактор главного фона", description: "Изменение фона всего приложения", link: '/settings/editor', icon: Image_icon },
        { title: "Редактор шаблонов", description: "Управление шаблонами", link: '/settings/template-editor', icon: Layout },
        { title: "Проверка экрана", description: "Настройка сенсорного экрана", link: '/settings/touchscreen', icon: Fingerprint },
        { title: "Проверка принтера", description: "Управление подключенным принтером", link: '/settings/printer', icon: Printer },
        { title: "Управление питанием", description: "Настройка энергосбережения", link: '/settings/timer', icon: Power },
        { title: "Cromakey", description: "Настройка зеленого фона", link: '/settings/chromakey', icon: Image_icon },
        // { title: "Статистика", description: "Журнал действий и созданных фото", link: '/settings/statistic', icon: BarChart2 },
    ]

    return (
        <div className="min-h-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <div className="rounded-3xl border-8 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300" style={{width: '1000px', height: '850px'}}>
                {isVisible ? (
                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center text-2xl z-10">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col gap-14" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        <h2 style={{fontSize: '22px', fontWeight: 'bold', textAlign: 'center'}}>Выберите проект</h2>
                        <ul className="px-2 gap-x-2 gap-y-4 flex flex-col overflow-auto min-h-24 max-h-80">
                            {projects.map((project) => (
                                <li key={project.id} className="project-item flex justify-between items-center py-2 border-b" >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="radio"
                                            name="selectedProject"
                                            checked={project.is_used}
                                            onChange={() => handlePrinterChange(project.id)}
                                        />
                                        <span onClick={() => handlePrinterChange(project.id)} style={{cursor: 'pointer'}}>{project.name}</span>
                                    </div>
                                    <button onClick={() => removeProject(project.id)} className="delete-button bg-red-500 text-white px-2 py-1 rounded-md">
                                        Удалить
                                    </button>
                                </li>
                            ))}
                            <div className="create-project mt-4 py-2 border-b" >
                                <input
                                    type="text"
                                    placeholder="Введите имя проекта"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="project-input border px-2 py-1 rounded-md mr-2"
                                />
                                <button onClick={addProject} className="create-button bg-blue-500 text-white px-4 py-1 rounded-md">
                                    Создать проект
                                </button>
                            </div>
                        </ul>       

                        <button onClick={handleSave} className="confirm-button mt-4 bg-green-500 text-white px-6 py-2 rounded-md">
                            Подтвердить
                        </button>
                    </div>
                </div>
                ): (

                <main className="p-8">
                    <header className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-bold">Настройки</h1>
                        <Link
                            to='/'
                            className="text-center py-3 px-4 rounded-lg text-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
                        >
                            Главный экран
                        </Link>
                        {/* <Link
                            to='/'
                            onClick={() => setProject({ updateStatus: true })}
                            className="text-center py-3 px-4 rounded-lg text-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
                        >
                            Выбрать проект
                        </Link> */}
                        <button onClick={() => {setProject({ ...project, isCurrent: true, updateStatus: true }); console.log(project); navigate('/')}} className="text-center py-3 px-4 rounded-lg text-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300">
                             Выбрать проект
                         </button>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200"
                            aria-label={isDarkMode ? "Включить светлую тему" : "Включить темную тему"}
                        >
                            {isDarkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-700" />}
                        </button>
                    </header>
                    
                    <div className="grid grid-cols-2 gap-8">
                        {settingsSections.map((section, index) => (
                            <div key={index} className="transition-all duration-300 hover:shadow-lg p-6 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center mb-4">
                                {typeof section.icon === 'string' ? (
                                    <img src={section.icon} alt={section.title} className="w-8 h-8 mr-4 text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <section.icon className="w-8 h-8 mr-4 text-blue-600 dark:text-blue-400" />
                                )}
                                    <div>
                                        <h2 className="text-2xl font-bold">{section.title}</h2>
                                        <p className="text-lg text-gray-600 dark:text-gray-300">{section.description}</p>
                                    </div>
                                </div>
                                <Link
                                    to={section.link}
                                    className="block w-full text-center py-3 px-4 rounded-lg text-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
                                >
                                    Настроить
                                </Link>
                            </div>
                        ))}
                    </div>
                </main>
                )   }
                {/* <button onClick={listen}>Listen</button> */}
            </div>
        </div>
    )
}