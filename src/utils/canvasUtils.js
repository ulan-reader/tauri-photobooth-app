import { invoke, convertFileSrc } from '@tauri-apps/api/tauri';
import { toast } from 'react-toastify';

export async function saveCanvasData(canvasId, canvasData) {
    try {
        await invoke('save_canvas_data', {
            canvasId: String(canvasId), // ID холста
            data: JSON.stringify(canvasData), // Данные холста в формате JSON
            available: canvasData.canvasProps.available,
        });
        console.log('Canvas data saved successfully.');
    } catch (error) {
        console.error('Failed to save canvas data:', error);
    }
}

export async function saveCanvasImage(canvasId, canvasData, canvasRef) {
    try {
        const imageDataUrl = canvasRef.current.toDataURL('image/png');

        // Убираем префикс data:image/png;base64, чтобы передать только base64
        const imageBase64 = imageDataUrl.replace(/^data:image\/(png|jpg);base64,/, '');

        // Отправляем на бэк
        await invoke('save_canvas_image', {
            canvasId: String(canvasId),
            base64Image: imageBase64,
            available: canvasData.canvasProps.available,
        });
        // toast.success('Изображение сохранено');
        const image = await invoke('get_image_path', { path: `template/${canvasData.canvasProps.available ? `available` : `not_available`}/canvas_${canvasId}` });
        canvasData.canvasProps.webpData = convertFileSrc(image);
        // console.log('Canvas image saved successfully.');
    } catch (error) {
        console.error('Failed to save canvas image:', error);
    }
}

export async function saveCanvasTemplate(canvasData, canvasRef) {
    try {
        const imageDataUrl = canvasRef.current.toDataURL('image/png');

        // Убираем префикс data:image/png;base64, чтобы передать только base64
        const imageBase64 = imageDataUrl.replace(/^data:image\/(png|jpg);base64,/, '');

        // Отправляем на бэк
        await invoke('save_canvas_template', {
            data: JSON.stringify(canvasData),
            base64Image: imageBase64
        });
        toast.success('Шаблон добавлен в выборку');
        const templates = await invoke('get_saved_canvas_template_paths');
        console.log('Canvas templates:', templates);
        const images = templates.map((template) => ({
            json: template.json,
            image: convertFileSrc(template.image)
        }));
        localStorage.setItem('canvasTemplates', JSON.stringify(images));
        // console.log('Canvas template paths:', images);

        console.log('Canvas template saved successfully.');
    } catch (error) {
        console.error('Failed to save canvas template:', error);
    }
}