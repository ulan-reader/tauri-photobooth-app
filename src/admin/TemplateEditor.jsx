import { useState, useRef, useEffect } from 'react';
import AdminShell from '../components/AdminShell';
import { useStore } from './store';
import { Plus, Save, Square, Circle, Triangle, Minus, Trash2, Star, Octagon, FileImage, SaveIcon, ArrowBigUpDash, X, RefreshCcwDot } from "lucide-react";
import ObjectProperties from '../components/ObjectProperties';
import { useFetcher, useNavigate } from 'react-router-dom';
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import { toast } from 'react-toastify';
import { invoke, convertFileSrc } from '@tauri-apps/api/tauri';
import { saveCanvasData, saveCanvasImage, saveCanvasTemplate } from '../utils/canvasUtils';
import KonvaCanvas from '../components/KonvaCanvas';

const props = {
    page: 'Редактор Шаблонов',
    type: 'template',
};

export default function TemplateEditor() {
    const navigate = useNavigate();
    usePageNavigation();
    const stageRef = useRef();

    const { reference, setReferences, chromokey, setChromokey, setProject, addObject, setCanvasProps, canvases, currentCanvasId, updateObjectProps, removeObject, addCanvas, removeCanvas, switchCanvas, setCanvasData, addCanvasFromTemplate } = useStore();
    const [activeTab, setActiveTab] = useState('shapes');
    const currentCanvas = canvases.find(canvas => canvas.id === currentCanvasId);
    const fileInputRef = useRef(null);
    const fileInputRefForSelect = useRef(null);
    const [selectedObjectId, setSelectedObjectId] = useState(null);
    const [showTemplateModel, setShowTemplateModel] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [canvasTemplateName, setCanvasTemplateName] = useState('');
    const canvasTemplate = JSON.parse(localStorage.getItem('canvasTemplates'));

    useEffect(() => {
        if (showTemplateModel) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showTemplateModel]);

    useEffect(() => {
        loadAllCanvasData();
    }, []);

    const updateObject = (id, newProps) => {
        updateObjectProps(currentCanvasId, id, newProps);
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
        let newImage = {
            id: Date.now(),
            nameObject: 'Изображение ' + Date.now(),
            type: 'image',
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
            src: '',
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
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new window.Image();
                img.src = event.target.result;
                img.onload = () => {
                    addNewImage(event.target.result, img.width, img.height, img);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFullScreenImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new window.Image();
                img.src = event.target.result;
                img.onload = async () => {
                    const newImage = {
                        id: Date.now(),
                        nameObject: 'Изображение ' + Date.now(),
                        type: 'image',
                        src: event.target.result,
                        imgObject: img,
                        left: 0,
                        top: 0,
                        width: img.width,
                        height: img.height,
                        zIndex: 2,
                        rotate: 0,
                        opacity: 1
                    };
                    const srcPath = await invoke('save_part_templates', { data: event.target.result, canvasId: String(currentCanvasId), objectId: String(newImage.id) });
                    newImage.src = convertFileSrc(srcPath);
                    addObject(currentCanvasId, newImage);
                };
            };
            toast.success("Добавлен шаблон на весь экран (оригинальный размер)");
            reader.readAsDataURL(file);
        }
    };

    async function loadAllCanvasData() {
        try {
            const canvasArray = await invoke('load_all_canvas_data');
            if (canvasArray.length === 0 || !canvasArray) {
                canvases.forEach(async canvas => {
                    canvas.objects.map((obj) => {
                        if (obj.type === 'image') obj.imgObject = '';
                    });
                    await saveCanvasImage(canvas.id, canvas, { current: { toDataURL: () => '' } });
                    saveCanvasData(canvas.id, canvas);
                });
                return;
            }
            let firstCanvas = canvasArray.find(canvas => canvas.id === 1);
            if (!firstCanvas) {
                switchCanvas(canvasArray[0].id);
            } else {
                switchCanvas(1);
            }
            setCanvasData(canvasArray);
            toast.success('Данные обновлены');
        } catch (error) {
            toast.error('Failed to load all canvas data:', error);
        }
    }

    async function addCanvasTemplate() {
        await saveCanvasTemplate(currentCanvas, { current: { toDataURL: () => '' } });
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
            switchCanvas(1);
            setSelectedObjectId(null);
            toast.success('Холст удален');
        } catch (error) {
            console.log('Failed to delete canvas:', error);
            toast.error('Не удалось удалить холст:', error);
        }
    }

    const handlePrint = async (currentCanvasId) => {
        toast('Printing...', { type: 'info' });
        // Здесь можно реализовать экспорт изображения из Konva, если нужно
        // Например, через ref на Stage и stageRef.current.toDataURL()
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
        setShowTemplateModel(false);
        // saveAllData(canvasData, canvasData.id, canvasRefForSelect);
    }

    // Обработчик клика по пустому месту для снятия выделения
    const handleStageClick = (e) => {
        if (e.target === e.target.getStage()) {
            setSelectedObjectId(null);
        }
    };

    // Обработчик нажатия клавиши Delete для удаления объекта
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Del') && selectedObjectId) {
                removeShape();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedObjectId]);

    // Добавить функцию для выбора фона
    const handleBackgroundChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageSrc = e.target.result;
            const imageObject = new window.Image();
            imageObject.src = imageSrc;
            setReferences({ src: imageSrc, imgObject: imageObject });
            try {
                await invoke('save_image', {
                    image: imageSrc,
                    relativePath: "settings/references_image",
                });
            } catch (err) {
                console.error("Ошибка сохранения изображения: ", err);
            }
        };
        reader.readAsDataURL(file);
    };

    // Вычисляем масштаб для предпросмотра
    const maxPreviewWidth = 400;
    const maxPreviewHeight = 600;
    const canvasWidth = currentCanvas?.canvasProps?.width || 1200;
    const canvasHeight = currentCanvas?.canvasProps?.height || 1800;
    const scale = Math.min(
        maxPreviewWidth / canvasWidth,
        maxPreviewHeight / canvasHeight,
        1 // не увеличивать, только уменьшать
    );
    const previewWidth = Math.round(canvasWidth * scale);
    const previewHeight = Math.round(canvasHeight * scale);

    async function handleSaveCanvas() {
        try {
            await saveCanvasData(currentCanvas.id, currentCanvas, currentCanvas.canvasProps.available);
            let dataUrl = '';
            if (stageRef.current) {
                dataUrl = stageRef.current.toDataURL();
            }
            console.log(dataUrl, stageRef)
            if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
                await saveCanvasImage(currentCanvas.id, currentCanvas, dataUrl);
                toast.success('Холст и изображение сохранены!');
            } else {
                
                toast.error('Ошибка: не удалось получить изображение холста!');
            }
        } catch (e) {
            toast.error('Ошибка при сохранении холста');
            console.error(e)
        }
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
                                        className="w-full border border-gray-300 rounded px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
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
                    <div style={{width: currentCanvas?.canvasProps?.width > currentCanvas?.canvasProps?.height ? previewWidth : previewHeight, height: currentCanvas?.canvasProps?.width > currentCanvas?.canvasProps?.height ? previewWidth : previewHeight, overflow: 'hidden'}}>
                        <div className="flex justify-between items-center mb-4">
                            <KonvaCanvas
                                width={canvasWidth}
                                height={canvasHeight}
                                scale={scale}
                                objects={currentCanvas.objects}
                                selectedId={selectedObjectId}
                                onSelect={setSelectedObjectId}
                                onChange={updateObject}
                                onStageClick={handleStageClick}
                                backgroundColor={currentCanvas?.canvasProps?.backgroundColor}
                                chromokey={chromokey}
                                reference={reference}
                                showDottedLine={currentCanvas?.canvasProps?.dottedLine}
                                ref={stageRef}
                                editable={true}
                            />
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
                                            style={{ display: 'none' }}
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
                                        style={{ display: 'none' }}
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
                                                className="hidden"
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
                                            className='h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md w-40 dark:bg-gray-800 dark:text-white'
                                        />
                                    </div>
                                </div>
                            )}
                            {activeTab === 'canvas' && (
                                <div className='flex flex-col gap-4'>
                                    <div className='px-2 gap-x-2 gap-y-4'>
                                        <p>Шаблоны</p>
                                        <div className='flex flex-col overflow-auto min-h-24 max-h-48 gap-1 border rounded-md bg-gray-150 p-1'>
                                            {canvases.map((canvas) => (
                                                <button key={canvas.id} onClick={() => switchCanvas(canvas.id)} className={currentCanvas?.id === canvas.id ? 'bg-blue-500 text-white rounded-md ' : 'flex justify-start'}>{canvas?.canvasProps?.name}</button>
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
                                            <button className='flex bg-green-500 text-white p-2 rounded-lg' onClick={handleSaveCanvas}><SaveIcon />Сохранить холст</button>
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
                                                    onChange={(e) => setCanvasProps(currentCanvas?.id, { width: e.target.value })}
                                                    value={currentCanvas?.canvasProps?.width}
                                                    className='h-8 px-1 border border-gray-300 dark:border-gray-600 rounded-md w-16 dark:bg-gray-800 dark:text-white'/>
                                            </div>
                                            <div className='flex gap-2 items-center justify-center'>
                                                <label className='w-4 flex items-center justify-center'>H</label>
                                                <input
                                                    min={200}
                                                    max={1800}
                                                    type='number'
                                                    onChange={(e) => setCanvasProps(currentCanvas.id, { height: e.target.value })}
                                                    value={currentCanvas?.canvasProps?.height}
                                                    className='h-8 px-1 border border-gray-300 dark:border-gray-600 rounded-md w-16 dark:bg-gray-800 dark:text-white'/>
                                            </div>
                                            <div className='flex gap-5 items-center  col-span-3'>
                                                <p>Цвет заливки</p>
                                                <input
                                                    className='h-8 border border-gray-300 dark:border-gray-600 rounded-md w-16 dark:bg-gray-800 dark:text-white'
                                                    type="color"
                                                    value={currentCanvas.canvasProps.backgroundColor}
                                                    onChange={(e) => setCanvasProps(currentCanvas.id, { backgroundColor: e.target.value })}
                                                />
                                                <button onClick={refreshCanvasPropsSize}><RefreshCcwDot /></button>
                                            </div>
                                            <div className='flex gap-5 items-center  col-span-3'>
                                                <p>Название холста</p>
                                                <textarea
                                                    className='p-2 h-auto border border-gray-300 dark:border-gray-600 rounded-md w-48 text-wrap dark:bg-gray-800 dark:text-white'
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
                                                    className='w-5 h-5 dark:bg-gray-800 dark:border-gray-600'
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
                                                        className='w-4 h-4 dark:bg-gray-800 dark:border-gray-600'
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
        </AdminShell>
    );
}
