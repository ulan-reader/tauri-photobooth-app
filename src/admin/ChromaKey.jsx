import React, { useRef, useEffect, useCallback, useState } from "react";
import AdminShell from "../components/AdminShell";
import { useStore } from "./store";
import { SaveIcon, ArrowBigUpDash } from "lucide-react";
import backgroundUrl from "../assets/defaultImage_2.png";
import { convertFileSrc, invoke } from '@tauri-apps/api/tauri';
import { toast, ToastContainer } from "react-toastify";
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import { drawCromakeyBackgroundImage } from '../components/CanvasDrawer.jsx'

const props = { page: 'Chromakey', type: 'chromakey' };

export default function Chromakey() {
    const { camera, setCamera, chromokey, setChromokey } = useStore();
    const canvasRef = useRef(null);
    const backgroundImageRef = useRef(null);
    const [image, setImage] = useState(null);

    usePageNavigation();

    useEffect(() => {
        updateSettings();
    }, []);

    useEffect(() => {
        if (!chromokey.backgroundImage.src) return;

        const bgCanvas = backgroundImageRef.current;
        const bgCtx = bgCanvas.getContext("2d");
        bgCanvas.width = 530;
        bgCanvas.height = 530;
        drawCromakeyBackgroundImage(bgCtx, bgCanvas, chromokey.backgroundImage, true)

        // backgr.onerror = (err) => console.error('Ошибка загрузки фона:', err);
    }, [chromokey.backgroundImage]);

    const processVideoFrames = useCallback((base64Image) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const image = new Image();
        image.src = base64Image;

        image.onload = () => {
            canvas.width = 530;
            canvas.height = 530;
            const canvasAspect = canvas.width / canvas.height;
            const imageAspect = image.width / image.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            // Рассчитываем размеры и смещения для "object-cover"
            if (imageAspect > canvasAspect) {
                // Изображение шире, чем канвас
                drawWidth = canvas.height * imageAspect;
                drawHeight = canvas.height;
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            } else {
                // Изображение выше, чем канвас
                drawWidth = canvas.width;
                drawHeight = canvas.width / imageAspect;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

            if (chromokey.isEnabled) {
                const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = frame.data;
                const [r, g, b] = hexToRgb(chromokey.color); 
                console.log('Цвет хромакея:', r, g, b);

                const tolerance = 50;  // Уровень погрешности для цветового сравнения

                for (let i = 0; i < data.length; i += 4) {
                    const pr = data[i];     // Красный компонент пикселя
                    const pg = data[i + 1]; // Зеленый компонент пикселя
                    const pb = data[i + 2]; // Синий компонент пикселя

                    // Проверка, находится ли цвет пикселя в пределах погрешности
                    if (Math.abs(pr - r) < tolerance && Math.abs(pg - g) < tolerance && Math.abs(pb - b) < tolerance) {
                        data[i + 3] = 0; // Убираем пиксели этого цвета (делаем их прозрачными)
                    }
                }

                ctx.putImageData(frame, 0, 0);
            }
        };

        image.onerror = (err) => console.error('Ошибка загрузки изображения:', err);
    }, [chromokey, camera]);

    const hexToRgb = (hex) => {
        const match = /^#([a-fA-F0-9]{6})$/.exec(hex);
        console.log(match);
        if (!match) return null;
    
        const r = parseInt(match[1].substr(0, 2), 16);
        const g = parseInt(match[1].substr(2, 2), 16);
        const b = parseInt(match[1].substr(4, 2), 16);
    
        return [r, g, b];
    };

    useEffect(() => {
        if (!camera.isLiveView) return;

        const interval = setInterval(async () => {
            try {
                const base64Image = await invoke('download_ev_image_command');
                processVideoFrames(base64Image);
            } catch (err) {
                console.error('Ошибка загрузки кадра:', err);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [camera.isLiveView, processVideoFrames]);

    const toggleLiveView = useCallback(async () => {
        try {
            if (!camera.isCameraOn) {
                await invoke('initialize_camera');
                setCamera({ isCameraOn: true });
            }
        } catch (error) {
            toast.error(error)
            return;
        }
        if (camera.isLiveView) {
            await invoke('stop_live_view');
            setCamera({ isLiveView: false });
        } else {
            await invoke('start_live_view');
            setCamera({ isLiveView: true });
        }
    }, [camera.isLiveView, camera.isCameraOn, setCamera]);

    // Обработчик для изменения фона
    const handleBackgroundChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageSrc = e.target.result;
            const imageObject = new Image();
            imageObject.src = imageSrc;
            // Обновляем состояние с новым изображением
            setChromokey({ backgroundImage: { imgObject: imageObject, src: imageSrc } });
            try {
                await invoke('save_image', {
                    image: imageSrc,
                    relativePath: "settings/chromokey_image",
                })
            } catch (err) {
                console.error("Ошибка сохранения изображения: ", err);
            }
        };
        reader.readAsDataURL(file);
    };

    const saveChanged = async () => {
        try {
            await invoke('save_settings', { color: chromokey.color, counter: camera.counterCapturePhoto, status: chromokey.isEnabled, visible: chromokey.printer_visible, payment: camera.payment_enabled, autofocus: camera.toggleAutofocus });
            console.log('Изменения успешно сохранены');
        } catch (err) {
            console.error('Ошибка сохранения фона:', err);
        }
    };
    
    const updateSettings = async () => {
        try {
            const settings = await invoke('read_settings');

            if (settings) {
                setChromokey({ color: settings.color, isEnabled: settings.is_enabled, printer_visible: settings.printer_visible });
                setCamera({ counterCapturePhoto: settings.counter_capture_photo, toggleAutofocus: settings.toggle_autofocus });
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
    const toggleAutofocus = async () => {
        try {
            setCamera({ toggleAutofocus: !camera.toggleAutofocus });
        } catch (err) {
            console.error('Ошибка установки автофокуса:', err);
        }
    }
    
    

    return (
        <AdminShell props={props}>
            <div className="flex ">
                <div className="relative w-3/5 h-full">
                    <canvas ref={backgroundImageRef} width="530" height="530" style={{ position: 'absolute', zIndex: 1, display: chromokey.isEnabled ? 'block' : 'none' }} />
                    <canvas ref={canvasRef} width="530" height="530" style={{ position: 'absolute', zIndex: 2 }} />
                </div>
                <div className="flex flex-col justify-between w-2/5 gap-4">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-4">
                        <button className={`p-2 rounded-lg border ${camera.isLiveView === true ? 'bg-blue-500' : 'bg-red-500'} text-white`} onClick={toggleLiveView}>Включить камеру</button>
                        <button className={`p-2 rounded-lg border ${chromokey.isEnabled ? 'bg-blue-500' : 'bg-red-500'} text-white`} onClick={() => setChromokey({ isEnabled: !chromokey.isEnabled })}>Chromakey {chromokey.isEnabled ? 'включен' : 'выключен'}</button>
                        <div
                            className="rounded-lg border flex justify-center items-center cursor-pointer col-span-2 w-fit h-fit"
                            style={{ overflow: 'hidden', background: '#f3f3f3' }}
                        >
                            <label style={{ width: '370px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {chromokey.backgroundImage.src ? (
                                    <img
                                        className="object-cover w-full h-full"
                                        src={chromokey.backgroundImage.src}
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
                    <div className="flex flex-row items-center justify-start gap-2">
                        <label htmlFor="chromakey-color">Выберите цвет для хромакея:</label>
                        <input 
                            type="color"
                            className="h-8 border border-gray-300 dark:border-gray-600 rounded-md w-16 dark:bg-gray-800"
                            id="chromakey-color"
                            value={chromokey.color} 
                            onChange={(e) => { setChromokey({ color: e.target.value }) }}
                        />
                    </div>
                    <div className='flex gap-4 items-center justify-start flex-row' >
                        <span className=''>Счетчик перед фото</span>
                        <input
                            type='number'
                            min={0}
                            max={20}
                            value={camera.counterCapturePhoto ?? 3}
                            onChange={(e) => setCamera({ counterCapturePhoto: Number(e.target.value) })}
                            className='h-8 pl-2 border border-gray-300 dark:border-gray-600 rounded-md w-16 dark:bg-gray-800'/>
                    </div>
                    <div className='flex gap-4 items-center justify-start flex-row' >
                        <span className=''>Сделать видным список фотографии</span>
                        <input
                            type='checkbox'
                            checked={chromokey.printer_visible ?? false}
                            onChange={(e) => setChromokey({ printer_visible: e.target.checked })}
                            className='h-8 pl-2 border border-gray-300 dark:border-gray-600 rounded-md w-16 dark:bg-gray-800'/>
                    </div>
                    <div className='flex gap-4 items-center justify-start flex-row' >
                        <span className=''>Сделать активным способ оплаты</span>
                        <input
                            type='checkbox'
                            checked={camera.payment_enabled ?? false}
                            onChange={(e) => setCamera({ payment_enabled: e.target.checked })}
                            className='h-8 pl-2 border border-gray-300 dark:border-gray-600 rounded-md w-16'/>
                    </div>
                    <div className='flex gap-4 items-center justify-start flex-row' >

                        {camera.toggleAutofocus ?
                        (<span className=''>Автофокус включен</span>
                        ) : 
                        (<span className=''>Автофокус выключен</span>)
                        }
                        <input
                            type='checkbox'
                            checked={camera.toggleAutofocus}
                            onChange={toggleAutofocus}
                            className='h-8 pl-2 border border-gray-300 dark:border-gray-600 rounded-md w-16 dark:bg-gray-800'/>
                    </div>
                    <div className="flex justify-between">
                        <button className="flex bg-green-500 text-white p-2 rounded-lg" onClick={saveChanged}><SaveIcon />Сохранить изменения</button>
                        <button className="flex bg-yellow-500 text-white p-2 rounded-lg" onClick={updateSettings}><ArrowBigUpDash />Обновить</button>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </AdminShell>
    );
}
