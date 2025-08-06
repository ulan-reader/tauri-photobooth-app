import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { toast } from "react-toastify";
import back_img_2 from '../assets/defaultImage_2.png'; // Фоновое изображение


export async function fetchProjects(setProjects) {
    try {
        const projectList = await invoke('get_projects');
        setProjects(projectList);
        
    } catch (err) {
        console.error(err);
        toast.error('Не удалось загрузить список проектов.');
    }
};

export async function getSavedPrinter(setLoading) {
    try {
        const printer = await invoke('update_selected_printer');
        if (printer) {
            setLoading(true);
        }
    } catch (err) {
        console.error(err);
        // alert('Не удалось загрузить выбранный принтер.');
    }
}

export async function updateSettings(setChromokey, setCamera, backgroundUrl) {
    try {
        const settings = await invoke('read_settings');
        setChromokey({ color: settings.color, isEnabled: settings.is_enabled, printer_visible: settings.printer_visible });
        setCamera({ counterCapturePhoto: settings.counter_capture_photo, toggleAutofocus: settings.toggle_autofocus });
    } catch (err) {
        setChromokey({ color: '#00ff00', isEnabled: false, printer_visible: false });
        setCamera({ counterCapturePhoto: Number(3), toggleAutofocus: false });
        await invoke('save_settings', { color: '#00ff00', counter: Number(3), status: false, visible: false, payment: false, autofocus: false });
        console.error('Ошибка загрузки настроек хромокея:', err);
    }

    try {
        const background = await invoke('get_image_path', { path: `settings/chromokey_image`});
        const imageObject = new Image();
        imageObject.src = convertFileSrc(background);
        setChromokey({ backgroundImage: { imgObject: imageObject, src: imageObject.src } });
    } catch (err) {
        const imageObject = new Image();
        imageObject.src = back_img_2;
        setChromokey({ backgroundImage: { imgObject: imageObject, src: back_img_2 } });
        console.error('Ошибка загрузки фона:', err);
    }
}

export async function getReferences(setReferences) {
    try {
        const backgroundImageInBase64 = await invoke('get_image_path', { path: `settings/references_image` });
        setReferences({ src: convertFileSrc(backgroundImageInBase64) });
    } catch (err) {
        console.error(err);
        toast.error('Не удалось загрузить список референсов.');
    }
}

export async function fetchTemplate(switchCanvas, setCanvasData) {
    try {
        const canvasArray = await invoke('load_all_canvas_data');
        switchCanvas(1); // Switch to the first canvas
        if (canvasArray.length === 0 || !canvasArray) {
            return;
        }
        setCanvasData(canvasArray); // Use the new function to update the canvases
        // setProject({ updateStatus: true });
    } catch (error) {
        console.error(error);
    }
}

export async function handleSaveProject(selectedProject, setProject, setActive, setBackgroundImage, backgroundUrl) {
    if (selectedProject) {
        try {
            await invoke('select_project', { projectName: selectedProject.name });
            setProject({ isCurrent: false, name: selectedProject.name });
            // console.log(selectedProject.name);
            
            // toast.success("Сохранено успешно!");
            setActive(true);
            [1, 2, 3, 4].forEach(async (index) => {
                try {
                    const image = await invoke('get_image_path', { path: `background/${index}_background` });
                    const url_image = `url(${convertFileSrc(image)})`;
                    setBackgroundImage(`${selectedProject.name}_background_image_${index}`, `background_image_${index}`, url_image);
                } catch (err) {
                    if (index === 1) setBackgroundImage(`${selectedProject.name}_background_image_${index}`, `background_image_${index}`, `url(${backgroundUrl})`);
                    else setBackgroundImage(`${selectedProject.name}_background_image_${index}`, `background_image_${index}`, `url(${back_img_2})`);
                    
                    console.error(err);
                }
            });
        } catch (err) {
            console.error(err);
            toast.error("Не удалось сохранить проекты.");
        }
    } else {
        toast.info("Выберите проект перед сохранением.");
    }
}