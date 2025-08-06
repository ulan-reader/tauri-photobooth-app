import { useState, useRef, useEffect } from 'react';
import AdminShell from '../components/AdminShell';
import { useStore } from './store';
import { Plus, Save, Square, Circle, Triangle, Minus, Trash2, Star, Octagon, FileImage, SaveIcon, ArrowBigUpDash, X, RefreshCcwDot } from "lucide-react";
import ObjectProperties from '../components/ObjectProperties';
import { useFetcher, useNavigate } from 'react-router-dom';
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import { toast, ToastContainer } from 'react-toastify';
import { invoke, convertFileSrc } from '@tauri-apps/api/tauri';
import { drawMyCanvas } from '../components/CanvasDrawer';
import { saveCanvasData, saveCanvasImage, saveCanvasTemplate } from '../utils/canvasUtils';

const props = {
    page: 'Редактор Шаблонов',
    type: 'template',
};

export default function TemplateEditor() {
    const navigate = useNavigate();
    usePageNavigation();

    const { reference, setReferences, chromokey, setChromokey, setProject, addObject, setCanvasProps, canvases, currentCanvasId, updateObjectProps, removeObject, addCanvas, removeCanvas, switchCanvas, setCanvasData, addCanvasFromTemplate } = useStore();
    const [activeTab, setActiveTab] = useState('shapes');
    const canvasRef = useRef(null);
    const canvasRefForSelect = useRef(null);
    const currentCanvas = canvases.find(canvas => canvas.id === currentCanvasId);
    const fileInputRef = useRef(null);
    const fileInputRefForSelect = useRef(null);
    const [selectedObjectId, setSelectedObjectId] = useState(null);
    const [showTemplateModel, setShowTemplateModel] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [canvasTemplateName, setCanvasTemplateName] = useState('');
    const canvasTemplate = JSON.parse(localStorage.getItem('canvasTemplates'));
    // const canvasTemplate = canvasTemplates ? canvasTemplates : [];

    useEffect(() => {
        if (showTemplateModel) {
            document.body.style.overflow = 'hidden'; // блокирует прокрутку
        } else {
            document.body.style.overflow = 'auto';   // возвращает обратно
        }
      
        // Очистка при размонтировании компонента или изменении showTemplateModel
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showTemplateModel]);

    useEffect(() => {
        loadAllCanvasData();
        // loadAllCanvasData();
        // loadAllCanvasData();
    }, []);

    const handleObjectClick = (e) => {
        // Получаем координаты клика относительно холста
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        // Ищем все объекты, которые находятся под кликом
        const clickedObjects = currentCanvas.objects.filter(obj => {
            return (
                x >= obj.left &&
                x <= obj.left + obj.width &&
                y >= obj.top &&
                y <= obj.top + obj.height
            );
        });
        if (clickedObjects.length > 0) {
            const topObject = clickedObjects.reduce((highest, obj) => {
                return (highest.zIndex > obj.zIndex) ? highest : obj;            
            }); 
            setSelectedObjectId(topObject.id);
        } else {
            setSelectedObjectId(null);
        }
    };

    const updateObject = (id, newProps) => {
        updateObjectProps(currentCanvasId, id, newProps);  // Триггерим обновление с новыми объектами
    };

    const fullPage = () => {
        updateObject(selectedObjectId, {
            left: 0,
            top: 0,
            width: 1240,
            height: 1844
        })
    };

    const removeShape = () => {
        if (selectedObjectId) {
            removeObject(currentCanvasId, selectedObjectId);
            setSelectedObjectId(null);
            toast.success('Объект удален');
        } else {
            toast.error('Выберите объект для удаления');
        }
    }

    // Добавление новой фигуры
    const addShape = (shapeType) => {
        const newShape = {
            id: Date.now(),
            nameObject: 'Фигура ' + shapeType,
            type: shapeType,
            left: 460,
            top: 700,
            width: 300,
            height: 300,
            fill: '#ff0000',
            zIndex: 4,
            stroke: '#000000',
            strokeWidth: 0,
            rotate: 0,
            opacity: 1,
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
        };
        if (shapeType === 'star') newShape.spikes = 5;
        if (shapeType === 'polygon') newShape.sides = 9;
        if (shapeType === 'line') {
            newShape.strokeWidth = 10;
            newShape.height = 10;
        }
        addObject(currentCanvasId, newShape);
    };

    const addNewImage = async (imageSrc, imgWidth, imgHeight, imgObject) => {
        // const existingImage = currentCanvas.objects.find(obj => obj.src === imageSrc);
        // if (existingImage) return; // Пропускаем, если изображение уже существует
        let newImage = {
            id: Date.now(),
            nameObject: 'Изображение ' + Date.now(),
            type: 'image',
            // fill: 'rgba(0, 0, 0, 0)', // Прозрачный фон для изображения
            src: imageSrc,
            imgObject: imgObject,
            left: 50,
            top: 50,
            width: imgWidth,
            height: imgHeight,
            zIndex: 4,
            rotate: 0,
            opacity: 1
        };
        const srcPath = await invoke('save_part_templates', { data: imageSrc, canvasId: String(currentCanvasId), objectId: String(newImage.id) });
        newImage.src = convertFileSrc(srcPath);
        addObject(currentCanvasId, newImage);
    };

    const addPhotoPlaceholder = () => {
        const photoPlaceholder = {
            id: Date.now(),
            nameObject: 'Фото ' + Date.now(),
            type: 'image',
            left: 48,
            top: 48,
            width: 530,
            height: 490,
            numberImage: 1,
            // fill: 'rgba(0, 0, 0, 0)', // Прозрачный фон для фото-заглушки
            src: '', // Здесь будет ссылка на фото, которая появится после съемки
            zIndex: 1,
            stroke: '#000000',
            strokeWidth: 1,
            rotate: 0,
            opacity: 1,
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
        };
        addObject(currentCanvasId, photoPlaceholder);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];  // Получаем первый файл из input
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    addNewImage(event.target.result, img.width, img.height, img);  // Передаем base64 и реальные размеры изображения
                };
            };
            reader.readAsDataURL(file);  // Преобразуем файл в base64
        }
    };

    const handleFullScreenImageUpload = (e) => {
        const file = e.target.files[0];  // Получаем первый файл из input
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = async () => {
                        // addNewImage(event.target.result, img.width, img.height, img);  // Передаем base64 и реальные размеры изображения
                        // imageSrc, imgWidth, imgHeight, imgObject
                    const newImage = {
                        id: Date.now(),
                        nameObject: 'Изображение ' + Date.now(),
                        type: 'image',
                        // fill: 'rgba(0, 0, 0, 0)', // Прозрачный фон для изображения
                        src: event.target.result,
                        imgObject: img,
                        left: 0,
                        top: 0,
                        width: currentCanvas.canvasProps.width,
                        height: currentCanvas.canvasProps.height,
                        zIndex: 2,
                        rotate: 0,
                        opacity: 1
                    };
                    const srcPath = await invoke('save_part_templates', { data: event.target.result, canvasId: String(currentCanvasId), objectId: String(newImage.id) });
                    newImage.src = convertFileSrc(srcPath);
                    addObject(currentCanvasId, newImage);
                };
            };
            toast.success("Доавлен шаблон на весь экран");
            reader.readAsDataURL(file);  // Преобразуем файл в base64
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const canvasSel = canvasRefForSelect.current;
        const ctxSel = canvasSel.getContext('2d');
        function drawDashedCenterLines(ctx, canvasWidth, canvasHeight, object) {
            // Центр объекта
            const objectCenterX = object.x + object.width / 2;
            const objectCenterY = object.y + object.height / 2;
        
            // Настройки для линий
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'; // Полупрозрачный черный цвет
            ctx.lineWidth = 10; // Толщина линии
            ctx.setLineDash([50, 5]); // Пунктир: 5px линия, 5px пробел
        
            // Рисуем вертикальную линию через центр объекта
            ctx.beginPath();
            ctx.moveTo(objectCenterX, 0); // Начало линии сверху
            ctx.lineTo(objectCenterX, canvasHeight); // Линия вниз до края холста
            ctx.stroke();
        
            // Рисуем горизонтальную линию через центр объекта
            // ctx.beginPath();
            // ctx.moveTo(0, objectCenterY); // Начало линии слева
            // ctx.lineTo(canvasWidth, objectCenterY); // Линия вправо до края холста
            // ctx.stroke();
        
            // Сбрасываем пунктирный стиль для последующих линий
            ctx.setLineDash([]);
        }
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const object = { x: 0, y: 0, width: 1220, height: 1840 };


        

        const drawMarkers = (ctx, obj) => {
            if (!obj) return;

            const borderThickness = 8; // Толщина линии
            const lineLength = obj.width / 2;
            const topLineLength = obj.height / 2; // Длина линий на каждом углу

            ctx.strokeStyle = 'black'; // Цвет линии
            ctx.lineWidth = borderThickness;

            // Линии сверху
            ctx.beginPath();
            ctx.moveTo(obj.left - 4, obj.top); // Верхний левый
            ctx.lineTo(obj.left + lineLength, obj.top); // Верхний левый горизонтально
            ctx.moveTo(obj.left, obj.top); // Верхний левый
            ctx.lineTo(obj.left, obj.top + topLineLength); // Верхний левый вертикально

            ctx.moveTo(obj.left + obj.width + 4, obj.top); // Верхний правый
            ctx.lineTo(obj.left + obj.width - lineLength, obj.top); // Верхний правый горизонтально
            ctx.moveTo(obj.left + obj.width, obj.top); // Верхний правый
            ctx.lineTo(obj.left + obj.width, obj.top + topLineLength); // Верхний правый вертикально

            // Линии снизу
            ctx.moveTo(obj.left - 4, obj.top + obj.height); // Нижний левый
            ctx.lineTo(obj.left + lineLength, obj.top + obj.height); // Нижний левый горизонтально
            ctx.moveTo(obj.left, obj.top + obj.height); // Нижний левый
            ctx.lineTo(obj.left, obj.top + obj.height - topLineLength); // Нижний левый вертикально

            ctx.moveTo(obj.left + obj.width + 4, obj.top + obj.height); // Нижний правый
            ctx.lineTo(obj.left + obj.width - lineLength, obj.top + obj.height); // Нижний правый горизонтально
            ctx.moveTo(obj.left + obj.width, obj.top + obj.height); // Нижний правый
            ctx.lineTo(obj.left + obj.width, obj.top + obj.height - topLineLength); // Нижний правый вертикально

            ctx.stroke();
        };
    
        if (currentCanvas) {
            // Рисуем основной холст
            drawMyCanvas(ctx, canvas, currentCanvas, true, chromokey.isEnabled ? chromokey.backgroundImage : reference, chromokey.isEnabled, false);
    
            // Рисуем выделение только на основном холсте
            if (selectedObjectId) {
                const selectedObject = currentCanvas.objects.find(obj => obj.id === selectedObjectId);
                if (selectedObject) {
                    drawMarkers(ctx, selectedObject);
                }
            }
    
            // Рисуем вспомогательный холст, но без выделения
            drawMyCanvas(ctxSel, canvasSel, currentCanvas, false, chromokey.isEnabled ? chromokey.backgroundImage : reference, true, false);
            drawMyCanvas(ctxSel, canvasSel, currentCanvas, false, chromokey.isEnabled ? chromokey.backgroundImage : reference, true, false);
        }
    }, [currentCanvas, selectedObjectId]);

    const [isDragging, setIsDragging] = useState(false); // To check if we're dragging
    const [draggedObjectId, setDraggedObjectId] = useState(null); // To store which object is being dragged
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // To track the offset of the drag start

    // async function getAppDataPath() {
    //     const path = await configDir();
    //     return path;
    // }

    useEffect(() => {
        const canvas = canvasRef.current;

        const handleMouseDown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const clickedObjects = currentCanvas.objects.filter(obj => {
                return (
                    x >= obj.left &&
                    x <= obj.left + obj.width &&
                    y >= obj.top &&
                    y <= obj.top + obj.height
                );
            });
            if (clickedObjects.length > 0) {
                const topObject = clickedObjects.reduce((maxObj, obj) =>
                    obj.zIndex > maxObj.zIndex ? obj : maxObj
                );
                setIsDragging(true);
                setDraggedObjectId(topObject.id);
                setDragOffset({ x: x - topObject.left, y: y - topObject.top });
            } else {
                setSelectedObjectId(null);
            }
        };

        const handleMouseMove = (e) => {
            if (!isDragging || !draggedObjectId) return;
            setSelectedObjectId(draggedObjectId);
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const newLeft = Math.round(x - dragOffset.x);
            const newTop = Math.round(y - dragOffset.y);
            // Update the object's position
            updateObject(draggedObjectId, { left: newLeft, top: newTop });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setDraggedObjectId(null);
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, draggedObjectId, dragOffset, currentCanvas?.objects]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedObjectId || !currentCanvas) return;
    
            const step = 1; // Шаг перемещения объекта
            const object = currentCanvas.objects.find(obj => obj.id === selectedObjectId);
            if (!object) return;
    
            switch (e.key) {
                case 'ArrowUp':
                    updateObject(selectedObjectId, { top: object.top - step });
                    break;
                case 'ArrowDown':
                    updateObject(selectedObjectId, { top: object.top + step });
                    break;
                case 'ArrowLeft':
                    updateObject(selectedObjectId, { left: object.left - step });
                    break;
                case 'ArrowRight':
                    updateObject(selectedObjectId, { left: object.left + step });
                    break;
                case 'Delete':
                    removeObject(selectedObjectId);
                    removeShape(selectedObjectId);
                    setSelectedObjectId(null);
                    break;
                case 'Escape':
                    removeObject(selectedObjectId);
                    setSelectedObjectId(null);
                default:
                    break;
            }
        };
    
        // Добавляем слушатель события
        window.addEventListener('keydown', handleKeyDown);
    
        // Удаляем слушатель при размонтировании
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedObjectId, currentCanvas, updateObject, removeObject]);

    async function loadAllCanvasData() {
        // const names = await invoke('get_saved_canvas_template_paths');
        // console.log(names)
        try {
            const canvasArray = await invoke('load_all_canvas_data');
             // Switch to the first canvas
            if (canvasArray.length === 0 || !canvasArray) {
                // const path = await getAppDataPath();
                canvases.forEach(async canvas => {
                    canvas.objects.map((obj) => {
                        if (obj.type === 'image') obj.imgObject = '';
                    });
                    await saveCanvasImage(canvas.id, canvas, canvasRefForSelect);
                    console.log(canvas.id, canvas.canvasProps.webpData);
                    saveCanvasData(canvas.id, canvas);
                });

                return;
            }
            let firstCanvas = canvasArray.find(canvas => canvas.id === 1);

            if (!firstCanvas) {
                switchCanvas(canvasArray[0].id);
                console.log('Switching to the first canvas');
            } else {
                switchCanvas(1);
            }
            // console.log(currentCanvas)
            setCanvasData(canvasArray); // Use the new function to update the canvases
            
            toast.success('Данные обновлены');
        } catch (error) {
            toast.error('Failed to load all canvas data:', error);
            // Handle error if necessary
        }
    }
    
    async function addCanvasTemplate() {
        await saveCanvasTemplate(currentCanvas, canvasRef);
    }

    async function handleRemoveCanvas() {
        try {
            if (canvases.length === 1 || currentCanvas.id === 1) {
                if (canvases.length === 1) toast.error('Нельзя удалить последний холст');
                else toast.error('Нельзя удалить первый холст');
                return;
            }
            removeCanvas(currentCanvas.id);
            await invoke('delete_canvas_image_and_data', {
                canvasId: String(currentCanvas.id),
                available: currentCanvas.canvasProps.available
            });
            // if ( canvases.length === 1 ) switchCanvas(1);
            switchCanvas(1);
            // switchCanvas(currentCanvas.id - 1);
            setSelectedObjectId(null);
            toast.success('Холст удален');
        } catch (error) {
            console.log('Failed to delete canvas:', error);
            toast.error('Не удалось удалить холст:', error);
        }
    }

    const saveAllData = async (currentCanvas, canvasId, canvasRefForSelect) => {
        try {
            canvases.forEach(async canvas => {
                const canvasSel = canvasRefForSelect.current;
                const ctxSel = canvasSel.getContext('2d');
                canvas.objects.map((obj) => {
                    if (obj.type === 'image' && obj.numberImage != null) obj.imgObject = '';
                });
                const saved = setInterval(() => {
                    drawMyCanvas(ctxSel, canvasSel, canvas, false, chromokey.isEnabled ? chromokey.backgroundImage : reference, true, false);
                    drawMyCanvas(ctxSel, canvasSel, canvas, false, chromokey.isEnabled ? chromokey.backgroundImage : reference, true, false);
                    saveCanvasImage(canvas.id, canvas, canvasRefForSelect)
                        .then(() => {
                            console.log(canvas.id, canvas.canvasProps.webpData);
                            saveCanvasData(canvas.id, canvas);
                        });
                    
                }, 2000);

                setTimeout(() => {
                    clearInterval(saved);
                }, 6500);
            });
            // currentCanvas.objects.map((obj) => {
            //     if (obj.type === 'image') obj.imgObject = '';
            // });
            // // const image = await invoke('get_image_path', { path: `template/${currentCanvas.canvasProps.available ? `available` : `not_available`}/canvas_${currentCanvas.id}` });
            // // currentCanvas.canvasProps.webpData = `url(${convertFileSrc(image)})`;
            // await saveCanvasImage(canvasId, currentCanvas, canvasRefForSelect);
            // console.log(canvasId, currentCanvas.canvasProps.webpData);
            // saveCanvasData(canvasId, currentCanvas);
            toast.success('Данные сохранены');
        } catch (error) {
            console.log(error);
            toast.error('Не удалось сохранить данные:', error);
        }
    }

    const handlePrint = async ( currentCanvasId ) => {
        const canvas = canvasRef.current;
        const currentCanvas = canvases.find(canvas => canvas.id === currentCanvasId);
        console.log(currentCanvas)
        if (canvas) {
            const ctx = canvas.getContext('2d');
            let canvasWidth = currentCanvas.canvasProps.width;
            let canvasHeight = currentCanvas.canvasProps.height;
            const imageData = canvasRef.current.toDataURL('image/png');
            const imageBase64 = imageData.replace(/^data:image\/(png|jpg);base64,/, '');
            toast('Printing...', { type: 'info' });
            await invoke('print_image', { imageData: imageBase64, width: Number(canvasWidth), height: Number(canvasHeight) });
        } else {
            toast('No image available for printing', { type: 'warning' });
        }
    };

    const handleBackgroundChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageSrc = e.target.result;
            const imageObject = new Image();
            imageObject.src = imageSrc;
            // Обновляем состояние с новым изображением
            setReferences({ src: imageSrc, imgObject: imageObject });
            try {
                await invoke('save_image', {
                    image: imageSrc,
                    relativePath: "settings/references_image",
                })
            } catch (err) {
                console.error("Ошибка сохранения изображения: ", err);
            }
        };
        reader.readAsDataURL(file);

    };

    function handleToggle() {
        setReferences({ isEnabled: !reference.isEnabled })
    }

    function refreshCanvasPropsSize() {
        let width = currentCanvas.canvasProps.width;
        let height = currentCanvas.canvasProps.height;
        setCanvasProps(currentCanvas.id, { width: height, height: width });
    }


    async function changeTemplate() {
        if (!selectedTemplate) return
        const template = canvasTemplate.find(template => template.image === selectedTemplate);
        toast.info('Загрузка шаблона...');
        const data = await invoke('load_canvas_template', { path: `${template.json}.json` });
        let canvasData = JSON.parse(data);
        canvasData.id = Date.now();
        canvasData.canvasProps.webpData = null;
        canvasData.canvasProps.name = canvasTemplateName == '' ? 'Без названия' : canvasTemplateName;
        addCanvasFromTemplate(canvasData);
        setCanvasTemplateName('');
        switchCanvas(canvasData.id);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        // drawMyCanvas(canvasRef.current.getContext('2d'), canvasRef.current, canvasData, true, chromokey.isEnabled ? chromokey.backgroundImage : reference, chromokey.isEnabled, false);
        drawMyCanvas(ctx, canvas, canvasData, true, chromokey.isEnabled ? chromokey.backgroundImage : reference, chromokey.isEnabled, false);
        drawMyCanvas(ctx, canvas, canvasData, true, chromokey.isEnabled ? chromokey.backgroundImage : reference, chromokey.isEnabled, false);
        // drawMyCanvas(ctx, canvas, canvasData, true, chromokey.isEnabled ? chromokey.backgroundImage : reference, chromokey.isEnabled, false);
        // await saveCanvasImage(canvasData.id, canvasData, canvasRefForSelect);
        // console.log(canvasData.id, canvasData.canvasProps.webpData);
        // saveCanvasData(canvasData.id, canvasData);
        // console.log(canvasData);
        // loadAllCanvasData();
        
        setShowTemplateModel(false);
        saveAllData(canvasData, canvasData.id, canvasRefForSelect);

        
        // Чтобы отменить:
        // clearTimeout(timeoutId);
        
        // navigate('/settings/template-editor');
    }

    return (
        <AdminShell props={props}>
            <div className="flex flex-col">
                <div className='flex gap-8 w-full justify-between'>
                    {showTemplateModel && (
                        <div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
                            <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] space-y-4">
                                <h2 className="text-xl font-semibold">Новый шаблон</h2>
                    
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Название</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        value={canvasTemplateName ?? ''}
                                        onChange={(e) => setCanvasTemplateName(e.target.value)}
                                    />
                                </div>
                        
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Выберите шаблон</label>
                                    <div className="grid grid-cols-2 gap-3 overflow-auto max-h-80">
                                        {canvasTemplate?.length === 0 || canvasTemplate === null ? (
                                            <div className="col-span-2 text-gray-400 text-center py-6">
                                                Нет доступных шаблонов, сначала добавьте шаблон
                                            </div>
                                        ) : (
                                            canvasTemplate.map((template, index) => (
                                            <div
                                                key={index}
                                                className={`border-2 rounded cursor-pointer transition-all p-2 ${
                                                selectedTemplate === template.image
                                                    ? "border-blue-500"
                                                    : "border-transparent"
                                                }`}
                                                onClick={() => setSelectedTemplate(template.image)}
                                            >
                                                <img
                                                    src={template.image}
                                                    alt={`template-${index}`}
                                                    className="w-full h-24 object-contain rounded"
                                                />
                                            </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                        
                                <div className="flex justify-between">
                                    <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onClick={() => setShowTemplateModel(false)}>
                                        <X />
                                    </button>
                                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={changeTemplate}>
                                        Выбрать холст
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div style={{width: currentCanvas?.canvasProps?.width / 3 || "400px"}}>
                        <div className="flex justify-between items-center mb-4">
                            {/* Canvas or shapes will be rendered here */}
                            <canvas ref={canvasRef} style={{ border: '1px solid black', width: currentCanvas?.canvasProps?.width / 3 || "400px", height: currentCanvas?.canvasProps?.height / 3 || "600px" }}
                                onClick={(e) => handleObjectClick(e)}
                            />
                            <canvas ref={canvasRefForSelect} style={{ width: '400px', height: '600px', display: 'none'}} />
                            {/* Render canvas from `canvases` */}
                            {/* <button onClick={addCanvasTemplate}>
                                Add template canvas
                            </button> */}
                        </div>
                    </div>
                    <div style={{width: "340px"}}>
                        <div className="w-full flex gap-2 flex-col">
                            <div className="grid w-full grid-cols-3 bg-gray-50 dark:bg-gray-700 p-1 rounded-md border border-gray-200 dark:border-gray-600">
                                <button
                                    className={`p-1 ${activeTab === 'shapes' ? 'bg-white dark:bg-gray-500  rounded-md border' : ''}`}
                                    onClick={() => setActiveTab('shapes')}
                                >
                                    Фото рамки
                                </button>
                                <button
                                    className={`p-1 ${activeTab === 'properties' ? 'bg-white dark:bg-gray-500 rounded-md border' : ''}`}
                                    onClick={() => setActiveTab('properties')}
                                >
                                    Размер
                                </button>
                                <button
                                    className={`p-1 ${activeTab === 'canvas' ? 'bg-white dark:bg-gray-500 rounded-md border' : ''}`}
                                    onClick={() => setActiveTab('canvas')}
                                >
                                    Шаблоны
                                </button>
                            </div>

                            <div>
                            {activeTab === 'shapes' && (
                                <div className='flex flex-col'>
                                    <div className="flex justify-between p-2">
                                        <button onClick={() => addShape('rectangle')}><Square /></button>
                                        <button onClick={() => addShape('circle')}><Circle /></button>
                                        <button onClick={() => addShape('star')}><Star /></button>
                                        <button onClick={() => addShape('polygon')}><Octagon /></button>
                                        <button onClick={() => addShape('triangle')}><Triangle /></button>
                                        <button onClick={() => addShape('line')}><Minus /></button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}  // Скрываем input
                                        />
                                        <button onClick={() => fileInputRef.current.click()}><FileImage /></button>
                                        <button onClick={() => removeShape()}><Trash2 /></button>
                                    </div>
                                    <button onClick={() => addPhotoPlaceholder()} className="bg-blue-500 text-white p-3 rounded-lg mt-3 flex justify-center">
                                        <Plus /> Добавить фото-заглушку
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRefForSelect}
                                        accept="image/*"
                                        onChange={handleFullScreenImageUpload}
                                        style={{ display: 'none' }}  // Скрываем input
                                    />
                                    <button onClick={() => fileInputRefForSelect.current.click()} className="bg-blue-500 text-white p-3 rounded-lg mt-3 flex justify-center">
                                        <FileImage /> Добавить шаблон на весь экран
                                    </button>
                                    <div
                                        className="rounded-lg border flex justify-center items-center cursor-pointer col-span-2 w-fit h-fit mt-3"
                                        style={{ overflow: 'hidden', background: '#f3f3f3' }}
                                    >
                                        <label style={{ width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            {reference.src ? (
                                                <img
                                                    className="object-cover w-full h-full"
                                                    src={reference.src}
                                                    alt="Сохранённый фон"
                                                />
                                            ) : (
                                                <p>Кликните для выбора фона</p>
                                            )}
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleBackgroundChange} 
                                                className="hidden" // Скрываем input
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'properties' && (
                                <div className='flex flex-col gap-4'>
                                    <div className='px-2 gap-x-2 gap-y-4'>
                                        <p>Объекты</p>
                                        <div className='flex flex-col overflow-auto h-48 gap-1 border rounded-md bg-gray-150 p-1'>
                                            {currentCanvas.objects.map((obj) => (
                                                <button key={obj.id} onClick={() => setSelectedObjectId(obj.id)} className={selectedObjectId === obj.id ? 'bg-blue-500 text-white rounded-md ' : 'flex justify-start'}>{obj?.nameObject || 'Измените название'}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <ObjectProperties setSelectedObjectId={setSelectedObjectId} selectedObjectId={selectedObjectId} currentCanvas={currentCanvas} updateObject={updateObject}/>
                                    <div className='flex justify-between px-2'>
                                        <button onClick={() => removeShape()}><Trash2 /></button>
                                        <input type="text"
                                            value={currentCanvas?.objects.find(obj => obj.id === selectedObjectId)?.nameObject || ''}
                                            onChange={(e) => updateObject(selectedObjectId, { nameObject: e.target.value })}
                                            className='h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md w-40'
                                        />
                                    </div>
                                    {/* <div className='flex justify-center px-2'>
                                        <button onClick={() => fullPage()} className='border border-gray-300 rounded-md px-4 bg-blue-400'>
                                            <p>На весь экран</p>
                                        </button>
                                    </div> */}

                                </div>
                            )}
                            {activeTab === 'canvas' && (
                                <div className='flex flex-col gap-4'>
                                    <div className='px-2 gap-x-2 gap-y-4'>
                                        <p>Шаблоны</p>
                                        <div className='flex flex-col overflow-auto min-h-24 max-h-48 gap-1 border rounded-md bg-gray-150 p-1'>
                                            {canvases.map((canvas) => (
                                                <button key={canvas.id} onClick={() => switchCanvas(canvas.id)} className={currentCanvas.id === canvas.id ? 'bg-blue-500 text-white rounded-md ' : 'flex justify-start'}>{canvas.canvasProps.name}</button>
                                            ))}
                                        </div>
                                        <div className="border-t border-gray-300 my-2"></div>
                                        <div className='flex mt-1 justify-between'>
                                            <button className='flex bg-blue-500 text-white p-2 rounded-lg' onClick={() => {
                                                    setShowTemplateModel(true)
                                                    console.log(canvasTemplate)
                                                }}><Plus /> Добавить новый холст</button>
                                            <button className='bg-red-500 rounded-lg p-2 text-white' onClick={handleRemoveCanvas}><Trash2 /></button>
                                        </div>
                                        <div className='flex mt-1 justify-between'>
                                            <button className='flex bg-green-500 text-white p-2 rounded-lg' onClick={() => saveAllData(currentCanvas, currentCanvasId, canvasRefForSelect)}><SaveIcon />Сохранить холст</button>
                                            {/* <button className='flex bg-yellow-500 text-white p-2 rounded-lg' onClick={loadAllCanvasData}><ArrowBigUpDash /> Update</button> */}
                                            <div className="relative group inline-block">
                                                <button
                                                    className="flex bg-yellow-500 text-white p-2 rounded-lg"
                                                    onClick={addCanvasTemplate}
                                                >
                                                    <Plus />
                                                </button>

                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-yellow-500 text-white text-sm px-2 py-1 rounded-lg shadow-md z-10">
                                                    Добавить шаблон
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='px-2 gap-x-2 gap-y-4'>
                                        <div className='grid grid-cols-3 px-2 gap-x-2 gap-y-4'>
                                            <p>Размер</p>
                                            <div className='flex gap-2 items-center justify-center'>
                                                <label className='w-4 flex items-center justify-center'>W</label>
                                                <input
                                                    min={200}
                                                    max={1800}
                                                    type='number'
                                                    onChange={(e) => setCanvasProps(currentCanvas.id, { width: e.target.value })}
                                                    value={currentCanvas.canvasProps.width}
                                                    className='h-8 px-1 border border-gray-300 dark:border-gray-600 rounded-md w-16'/>
                                            </div>
                                            <div className='flex gap-2 items-center justify-center'>
                                                <label className='w-4 flex items-center justify-center'>H</label>
                                                <input
                                                    min={200}
                                                    max={1800}
                                                    type='number'
                                                    onChange={(e) => setCanvasProps(currentCanvas.id, { height: e.target.value })}
                                                    value={currentCanvas.canvasProps.height}
                                                    className='h-8 px-1 border border-gray-300 dark:border-gray-600 rounded-md w-16'/>
                                            </div>
                                            <div className='flex gap-5 items-center  col-span-3'>
                                                <p>Цвет заливки</p>
                                                <input
                                                    className='h-8 border border-gray-300 dark:border-gray-600 rounded-md w-16'
                                                    type="color"
                                                    value={currentCanvas.canvasProps.backgroundColor}
                                                    onChange={(e) => setCanvasProps(currentCanvas.id, { backgroundColor: e.target.value })}
                                                />
                                                <button onClick={refreshCanvasPropsSize}><RefreshCcwDot /></button>
                                            </div>
                                            <div className='flex gap-5 items-center  col-span-3'>
                                                <p>Название холста</p>
                                                <textarea
                                                    className='p-2 h-auto border border-gray-300 dark:border-gray-600 rounded-md w-48 text-wrap'
                                                    rows={1}
                                                    value={currentCanvas.canvasProps.name || 'Нету названия'}
                                                    onChange={(e) => setCanvasProps(currentCanvas.id, { name: e.target.value || 'Нету названия' })}
                                                />
                                            </div>
                                            <button
                                                className={`flex items-center justify-evenly col-span-3 ${currentCanvas.canvasProps.available ? 'bg-green-500' : 'bg-red-500'} text-white py-2 rounded-lg`}
                                                onClick={() => setCanvasProps(currentCanvas.id, { available: !currentCanvas.canvasProps.available })}>
                                                <input
                                                    type='checkbox'
                                                    checked={currentCanvas.canvasProps.available}
                                                    className='w-5 h-5'
                                                    onChange={() => setCanvasProps(currentCanvas.id, { available: !currentCanvas.canvasProps.available })}
                                                    />
                                                <p className='text-2xl'>Использовать Холст</p>
                                            </button>
                                            <div className='flex gap-2 items-center col-span-3 flex-wrap '>
                                                <button
                                                    className={`flex items-center justify-evenly w-fit bg-blue-600 text-white p-2 rounded-lg`}
                                                    onClick={() => handlePrint(currentCanvasId)}>
                                                    <p className='text-sm'>Пробная печать</p>
                                                </button>
                                                <button
                                                    className={`flex gap-2 items-center justify-evenly ${currentCanvas.canvasProps.dottedLine ? 'bg-green-500' : 'bg-red-500'} text-white p-2 rounded-lg`}
                                                    onClick={() => setCanvasProps(currentCanvas.id, { dottedLine: !currentCanvas.canvasProps.dottedLine })}>
                                                    <input
                                                        type='checkbox'
                                                        checked={currentCanvas.canvasProps.dottedLine}
                                                        className='w-4 h-4'
                                                        onChange={() => setCanvasProps(currentCanvas.id, { dottedLine: !currentCanvas.canvasProps.dottedLine })}
                                                        />
                                                    <p className='text-sm'>Пунктирной линии </p>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer className="absolute" />
        </AdminShell>
    );
}
