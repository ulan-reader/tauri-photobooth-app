import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Layout, Fingerprint, Printer, Power, BarChart2 } from "lucide-react"
import Image_icon from '../assets/image_icon.svg';
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import { invoke, convertFileSrc } from '@tauri-apps/api/tauri';
import { useStore } from './store';


export default function Settings({ isDarkMode, setIsDarkMode }) {
    usePageNavigation();
    const { chromokey, setChromokey, setCamera, reference, setReferences, setBackgroundImage, switchCanvas, setCanvasData, chromokeyStatus, updateCameraStatus, updateLiveViewStatus, cameraStatus, isLiveView, chromokeyBackgroundImage, setChromokeyStatus, setChromokeyBackgroundImage, project, setProject } = useStore();
    const [isVisible, setIsVisible] = useState(false);
    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    
    const updateSettings = async () => {
        try {
            const settings = await invoke('read_settings');

            if (settings) {
                setChromokey({ color: settings.color, isEnabled: settings.is_enabled });
                setCamera({ counterCapturePhoto: settings.counter_capture_photo });
            }
            
            const background = await invoke('get_image_path', { path: `settings/chromokey_image`});
            if (background !== "Image file not found.") {
                const imageObject = new Image();
                imageObject.src = convertFileSrc(background);
                setChromokey({ backgroundImage: { imgObject: imageObject, src: imageObject.src } });
            } else {
                const imageObject = new Image();
                imageObject.src = backgroundUrl;
                setChromokey({ backgroundImage: { imgObject: imageObject, src: backgroundUrl } });
            }
        } catch (err) {
            console.error('Ошибка загрузки фона:', err);
        }
    };

    const getSavedPrinter = async () => {
        try {
            const printer = await invoke('update_selected_printer');
        } catch (err) {
            console.error(err);
            // alert('Не удалось загрузить выбранный принтер.');
        }
    }

    const fetchTemplate = async () => {
        if (!project.updateStatus) {
            try {
                const backgroundImageInBase64 = await invoke('get_image_path', { path: `settings/references_image` });
                setReferences({ src: convertFileSrc(backgroundImageInBase64) });
            } catch (err) {
                console.error(err);
            }
    
            try {
                const canvasArray = await invoke('load_all_canvas_data');
                switchCanvas(1); // Switch to the first canvas
                if (canvasArray.length === 0 || !canvasArray) {
                    return;
                }
                setCanvasData(canvasArray); // Use the new function to update the canvases
                setProject({ updateStatus: true });
            } catch (error) {
                console.error(error);
            }
        }
    };
    
    const fetchProjects = async () => {
        try {
            const projectList = await invoke('get_projects');
            setProjects(projectList);
            
        } catch (err) {
            console.error(err);
            alert('Не удалось загрузить список проектов.');
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSave = async () => {
        if (selectedProject) {
            try {
                await invoke('select_project', { projectName: selectedProject.name });
                await invoke('save_project_name', { name: selectedProject.name});
                setProject({ isCurrent: false, name: selectedProject.name });
                console.log(selectedProject.name);
                updateSettings();
                setIsVisible(false);
                // toast.success("Сохранено успешно!");
                
                fetchTemplate();
                getSavedPrinter();
                [1, 2, 3, 4].forEach(async (index) => {
                    try {
                        const image = await invoke('get_image_path', { path: `background/${index}_background` });
                        const url_image = `url(${convertFileSrc(image)})`;
                        setBackgroundImage(`${selectedProject.name}_background_image_${index}`, `background_image_${index}`, url_image);
                    } catch (err) {
                        console.error(err);
                    }
                });
                // await invoke('save_projects_and_create_dir', {projects});
                // await invoke('init_project_path');
                // fetchImage();
            } catch (err) {
                console.error(err);
                alert("Не удалось сохранить проекты.");
            }
        } else {
            alert("Выберите проект перед сохранением.");
        }
        
        // const backgroundImageInBase64 = await invoke('get_image_path', { path: `database/settings/references_image` });
        // setReferences({ src: convertFileSrc(backgroundImageInBase64) });
        // console.log(reference.src);
    };
    


    const handlePrinterChange = (id) => {
        setProjects((prevProjects) => 
            prevProjects.map((project) => ({
                ...project,
                is_used: project.id === id, // Только у выбранного проекта is_used = true
            }))
        );
    
        const selected = projects.find((project) => project.id === id);
        console.log("Selected project:", selected);
        setSelectedProject(selected ? { ...selected, is_used: true } : null);

    };

    const addProject = () => {
        if (newProjectName.trim()) {
            const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
            setProjects([...projects, { id: newId, name: newProjectName.trim(), is_used: false }]);
            setNewProjectName("");
        }
    };

    const removeProject = async (id) => {
        setProjects((prevProjects) => prevProjects.filter((project) => project.id !== id));
        projects.map( async (project) => {
            if (project.id === id) {
                await invoke('delete_project', { projectName: project.name });
            }
        });

    };

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
                        <button onClick={() => setIsVisible(true)} className="text-center py-3 px-4 rounded-lg text-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300">
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