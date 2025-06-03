import { Link, NavLink, resolvePath, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from 'react';
import '../App.css';
import main_icon from '../assets/main_camera_icon.png';
import { toast,ToastContainer } from "react-toastify";
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import { invoke, convertFileSrc } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { useStore } from "../admin/store";
// import ChromakeyTest from "../ChromaKeyTest";
// import image_beta from '../image_beta/IMG_6700.JPG'
import { saveCanvasData, saveCanvasImage, saveCanvasTemplate } from "../utils/canvasUtils";
import { drawMyCanvas } from "../components/CanvasDrawer";
import { Settings } from "lucide-react"
import { set } from "lodash";
import printer from "../assets/printer.png";
import backgroundUrl from "../assets/defaultImage.png";
import { appDir, configDir } from '@tauri-apps/api/path';
import { fetchProjects, fetchTemplate, getReferences, getSavedPrinter, handleSaveProject, updateSettings } from "../utils/projectConfig.js";

export default function MainPage({ active, loading, setLoading, setActive, design }) {
    const { license, project, setProject, chromokey, setChromokey, reference, setReferences, setCamera, setCanvasData, currentCanvasId, canvases, switchCanvas, background_image_1, setBackgroundImage } = useStore();
    const currentCanvas = canvases.find(canvas => canvas.id === currentCanvasId);
    const canvasRefForSelect = useRef(null);
    const navigate = useNavigate();
    usePageNavigation();

    useEffect(() => {
        if (!license) navigate('/license');
    }, [license, navigate]);

    const [projects, setProjects] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    
    const fetchSavedProject = async () => {
        try {
            const savedProjectName = await invoke('load_project_name');
            // console.log('Saved project name:', savedProjectName);
            // setSelectedProject({ name: savedProjectName });
            handleSaveProject({ name: savedProjectName }, setProject, setActive, setBackgroundImage, backgroundUrl);
            updateSettings(setChromokey, setCamera, backgroundUrl);
            getReferences(setReferences);
            fetchTemplate(switchCanvas, setCanvasData);
            getSavedPrinter(setLoading);
        } catch (error) {
            setProject({ ...project, updateStatus: true });
            console.error('Error loading project name:', error);
        }
    }

    useEffect(() => {
        if (project.isCurrent && project.updateStatus) {
            // fetchSavedProject();
            console.log('Start ');
            fetchProjects(setProjects);
        }
        if (project.isCurrent && !project.updateStatus) {
            const save = async () => {
                await fetchSavedProject();
                console.log('Start saved');
                // await handleSave();
            }

            save();
            // fetchProjects(setProjects)
        }
        
        
    }, []);

    const handleSave = async () => {
        if (selectedProject) {
            console.log("Selected project:", selectedProject);
            handleSaveProject(selectedProject, setProject, setActive, setBackgroundImage, backgroundUrl);
            updateSettings(setChromokey, setCamera, backgroundUrl);
            getReferences(setReferences);
            window.location.reload();
            fetchTemplate(switchCanvas, setCanvasData);
            getSavedPrinter(setLoading);
            saveCanvasTemplate(canvases[0], canvasRefForSelect)
        }
    }
    


    const handleProjectChange = (id) => {
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
    
    return (
        <div className={`${active == true ? "pointer-events-none": "pointer-events-auto"} flex justify-center items-center`}>
            <div className="select-none relative  bg-cover bg-center bg-no-repeat" style={{width: '1280px', height: '1024px', backgroundImage: background_image_1}}>
                <div className='back-img'></div>
                {project.isCurrent ? (
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
                                            onChange={() => handleProjectChange(project.id)}
                                        />
                                        <span onClick={() => handleProjectChange(project.id)} style={{cursor: 'pointer'}}>{project.name}</span>
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
                ) : (
                <div className='absolute top-0 left-0 w-full h-full flex justify-evenly items-center text-white text-2xl z-10'>
                    {/* <img src={image} alt="" /> */}
                    <div className="w-28"></div>
                    <div className="flex flex-col">
                        <NavLink to='/settings' className="absolute left-10 top-10 z-10 opacity-0 hover:opacity-100">
                            <Settings size={30} /> {/* Отображаем иконку шестеренки */}
                        </NavLink>
                        <NavLink to='/template'><img src={main_icon} alt="camera icon"  /></NavLink>
                        {/* <div style={word}><button onClick={() => navigate('/template')} >НАЧАТЬ ФОТОСЕССИЮ</button></div> */}
                        <canvas ref={canvasRefForSelect} style={{ width: '400px', height: '600px', display: 'none'}} />
                    </div>
                    <div className="w-28">
                        { chromokey.printer_visible && <NavLink to="/list"><img className="w-28" src={printer} alt="" /></NavLink> }
                    </div>
                </div>
                ) }
            </div>
            <ToastContainer />
        </div>
    )
}

const link = {
    position: 'absolute',
    top: '330px',
    left: '30%',
    width: '400px',
    // height: '340px',
    borderRadius: '15px',
    backgroundSize: 'cover',
}

const word = {
    position: 'absolute',
    top: '70%',
    left: '35%',
    color: 'white',
    textAlign: 'center',
    fontSize: '50px',
    lineHeight: '1.3',
    width: '400px',
    height: '200px',
}