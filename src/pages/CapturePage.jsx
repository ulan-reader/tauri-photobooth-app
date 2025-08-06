import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { convertFileSrc, invoke } from '@tauri-apps/api/tauri';
// import { listen } from '@tauri-apps/api/event';
import '../App.css';
import { Loader2 } from "lucide-react";
import templateTriangle from '../assets/templateTriangle.png';
import cameraCapture from '../assets/cameraCapture.png';
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import { useStore } from '../admin/store.js';
import { drawCromakeyBackgroundImage, drawMyCanvas } from '../components/CanvasDrawer.jsx'

// import test_image_1 from '../image_beta/IMG_6700.JPG';
// import test_image_2 from '../image_beta/IMG_7107.JPG';
// import test_image_3 from '../image_beta/IMG_7111.JPG';

// import test_image_1 from '../image_beta/image.png';
// import test_image_2 from '../image_beta/image_2.png';
// import test_image_3 from '../image_beta/image.png';


import { toast } from 'react-toastify';
// import RemoveBackground from '../ChromaKeyTest.jsx';
// import * as bodyPix from "@tensorflow-models/body-pix";
// import "@tensorflow/tfjs";

export default function CaptureScreen({ onCapture }) {
    // const [bgImage, setBgImage] = useState(localStorage.getItem("back_3") || `url(${back_img})`);
    const { camera, setCamera, chromokey, setChromokey, canvases, currentCanvasId, updateObjectProps, switchCanvas, background_image_3 } = useStore();
    const currentCanvas = canvases.find(canvas => canvas.id === currentCanvasId);
    // const imagesLenght = currentCanvas.objects.filter(object => object.type === 'image' && object.src === '').reduce((max, obj) => Math.max(max, obj.numberImage), 0);
    usePageNavigation();
    const canvasRefDataImage = useRef(null);
    const canvasRefMain = useRef(null);
    const backgroundImageRef = useRef(null);
    const intervalRef = useRef(null); // Хранение ссылки на интервал
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);

    const [isCameraReady, setIsCameraReady] = useState(true);

    const [capturedImage, setCapturedImage] = useState(null);
    const [countdown, setCountdown] = useState(camera.counterCapturePhoto);
    const [isShooting, setIsShooting] = useState(false);
    const [images, setImages] = useState([]);
    const navigate = useNavigate();
    const [imageData, setImageData] = useState(null);
    const [errCount, setErrCount] = useState(0);
    const canvasRefLayout = useRef(null);
    const [forCapture, setForCapture] = useState(true);
    const [isImageCounted, setIsImageCounted] = useState(false);
    const [imagesLenght, setImagesLenght] = useState(0);
    const clearedNumbers = new Set(); // Используем Set для исключения повторений
    let uniqueClearedNumbers = [];
    // useEffect(() => {
    //     const fetchImage = async () => {
    //         try {
    //             const image = await invoke('get_image_path', { path: `background/3_background` })
    //             const url_image = `url(${convertFileSrc(image)})`;
    //             setBgImage(url_image);
    //             if (image && image.trim() !== "") {
    //                 setBgImage(url_image);
    //                 localStorage.setItem("back_3", url_image);
    //             } else {
    //                 throw new Error("Изображение не найдено");
    //             }
    //         } catch (err) {
    //             localStorage.removeItem("back_3");
    //             setBgImage(`url(${back_img})`);
    //             console.log(err);
    //         }
    //     };

    //     fetchImage();
    // },[]);

    const drawBackImage = useCallback(() => {
        if (!chromokey.backgroundImage.src) return;

        const bgCanvas = backgroundImageRef.current;
        const bgCtx = bgCanvas.getContext("2d");
        bgCanvas.width = 630;
        bgCanvas.height = 630;
        drawCromakeyBackgroundImage(bgCtx, bgCanvas, chromokey.backgroundImage, true)
    }, [chromokey]);

    const processVideoFrames = useCallback((base64Image, test_num) => {
        const canvas = canvasRefMain.current;
        const ctx = canvas.getContext("2d");

        const image = new Image();
        image.src = base64Image;

        image.onload = () => {
            canvas.width = 630;
            canvas.height = 630;
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
                console.log(chromokey.color);

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
        if (test_num){
            setTimeout(() => {
                setCapturedImage(canvas.toDataURL("image/png"));
            }, 50);
        }
        image.onerror = (err) => console.error('Ошибка загрузки изображения:', err);
    }, [chromokey.isEnabled , chromokey.color]);

    const hexToRgb = (hex) => {
        const match = /^#([a-fA-F0-9]{6})$/.exec(hex);
        console.log(match);
        if (!match) return null;
    
        const r = parseInt(match[1].substr(0, 2), 16);
        const g = parseInt(match[1].substr(2, 2), 16);
        const b = parseInt(match[1].substr(4, 2), 16);
    
        return [r, g, b];
    };

    let errorCount = 0;
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                if (!camera.isLiveView) {
                    await invoke('start_live_view');
                    setCamera({ isLiveView: true });
                };
                const base64Image = await invoke('download_ev_image_command');
                processVideoFrames(base64Image);
            } catch (err) {
                console.error('Ошибка загрузки кадра:', err);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [camera, processVideoFrames]);



    // Функция для захвата фото через Tauri
    const capture = useCallback(async () => {
        try {
            const capture = await invoke("capture_photo_as", { autofocusEnabled: camera.toggleAutofocus });

            
            invoke('get_captured_image').then((image) => {
                processVideoFrames(`data:image/jpeg;base64,${image}`, 1);
            });
            setCamera({ isLiveView: false });
            setForCapture(false);
            setIsShooting(false);
            setCountdown(camera.counterCapturePhoto);

            // setIsShooting(false);
        } catch (err) {
            console.log("Ошибка захвата фото:", err);
        }
    }, [images]);

    
    // Обработка обратного отсчета перед съемкой
    const startCountdown = useCallback(() => {
        if(!camera.isLiveView) {
            setCamera({ isLiveView: true });
        }
        setIsShooting(true);
        let timer = camera.counterCapturePhoto;
        // const cerRes = cer + 1;
        // setCer(cerRes);
        intervalRef.current = setInterval(() => {
            timer -= 1;
            setCountdown(timer);

            if (timer <= 0) {
                // stop
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                capture();
            }
        }, 1000);
    }, [capture, camera]);

    // Сохранение фото
    const savePhoto = useCallback( async () => {
        // startLiveView();
        setIsButtonDisabled(true);
        setTimeout(() => setIsButtonDisabled(false), (camera.counterCapturePhoto || 3) + 1000);

        const newImage = {
            id: new Date().getTime(),
            name: `photo-${new Date().getTime()}`,
            url: capturedImage
        };
        setImages(prevImages => [...prevImages, newImage]);

        if (images.length + 1 < imagesLenght) {
            
            invoke('start_live_view').then(() => {
                setCamera({ isLiveView: true });
                setCapturedImage(null);
    
                startCountdown();
            });
        } else {
            onCapture([...images, newImage]);

            // await invoke('end_camera');
            // setCamera({ isCameraOn: false });

            invoke('stop_live_view').then(() => {
                setCamera({ isLiveView: false });
                navigate('/print');
            });
        }
    }, [capturedImage, images, navigate, onCapture, startCountdown, imagesLenght]);

    // Пересъемка фото
    const reshootPhoto = useCallback( async () => {
        invoke('start_live_view')
        .then(() => {
            setCamera({ isLiveView: true });
            setCapturedImage(null);
            startCountdown();
        })
        .catch((err) => {
            console.error('Ошибка перезапуска прямого эфира:', err);
        });
    }, [startCountdown]);

    const first_counter = () => {
        setIsImageCounted(true);
        clearedNumbers.clear(); // очищаем set перед новым проходом
        garbedCanvas(currentCanvas);
    }
    useEffect(() => {
        if (!isImageCounted) first_counter();
        updateImageCapture();
        drawBackImage();
    }, [capturedImage]);

    const garbedCanvas = (currentCanvas) => {

        currentCanvas.objects.forEach(object => {
            if (object.type === 'image' && object.numberImage != null) {
                updateObjectProps(currentCanvasId, object.id, { imgObject: null, src: '' });

                if (object.numberImage != null) {
                    clearedNumbers.add(object.numberImage); // Сохраняем уникальные номера
                }
            }
        });
        uniqueClearedNumbers = Array.from(clearedNumbers);
        setImagesLenght(clearedNumbers.size);
    }

    const updateImageCapture = useCallback(() => {
        const canvas = canvasRefLayout.current;
        if (!canvas || !currentCanvas) return;

        const ctx = canvas.getContext('2d');

        // 1. Получаем уникальные номера numberImage по возрастанию
        const uniqueSortedNumbers = Array.from(
            new Set(
                currentCanvas.objects
                    .filter(obj => obj.type === 'image' && obj.numberImage != null)
                    .map(obj => obj.numberImage)
            )
        ).sort((a, b) => a - b);

        // 2. Получаем целевой номер, соответствующий images.count
        const targetNumber = uniqueSortedNumbers[images.length];

        console.log('Target number:', targetNumber);

        if (targetNumber === undefined) return; // если изображение лишнее — игнорируем

        // 3. Вставляем снимок во все объекты с этим номером
        currentCanvas.objects.forEach(object => {
            if (object.type === 'image' && object.numberImage === targetNumber) {
                updateObjectProps(currentCanvasId, object.id, { imgObject: null, src: '' });
                updateObjectProps(currentCanvasId, object.id, { src: capturedImage });
            }
        });
    }, [capturedImage, images.length]);


    useEffect(() => {
        const canvas = canvasRefLayout.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            drawMyCanvas(ctx, canvas, currentCanvas, false, chromokey.backgroundImage, chromokey.isEnabled, false);
            const timeoutId = setTimeout(() => {
                drawMyCanvas(ctx, canvas, currentCanvas, false, chromokey.backgroundImage, chromokey.isEnabled, false);
              }, 50); // Задержка в 50 миллисекунд (можно варьировать)
              // Очистка таймера, если компонент размонтируется
            const imageData = canvas.toDataURL('image/png');
            return () => {
                clearTimeout(timeoutId);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = 0;
                canvas.height = 0;
        };
        }
    }, [images]);

    useEffect(() => {
        return () => {
            const mainCanvas = canvasRefMain.current;
            const bgCanvas = backgroundImageRef.current;

            if (mainCanvas) {
                const ctx = mainCanvas.getContext("2d");
                ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
                mainCanvas.width = 0;
                mainCanvas.height = 0;
            }

            if (bgCanvas) {
                const ctx = bgCanvas.getContext("2d");
                ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
                bgCanvas.width = 0;
                bgCanvas.height = 0;
            }
        };
    }, []);

    const handleBack = async () => {
        // Очищаем интервал, если он существует
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null; // Сбрасываем ссылку на интервал
        }
        setImages([]);
        garbedCanvas(currentCanvas);
        switchCanvas(1);
        await invoke('stop_live_view');
        setCamera({ isLiveView: false });
        navigate('/template');
    }

    return (
        <div className="flex justify-center items-center">
            <div className="select-none relative bg-cover bg-center bg-no-repeat" style={{ width: '1280px', height: '1024px', backgroundImage: background_image_3 }}>
                <div className='back-img'></div>
                <div className='absolute top-0 left-0 w-full h-full flex justify-center items-center text-white text-2xl z-10'>
                    <div className='flex w-screen justify-center items-center'>
                        <canvas ref={canvasRefLayout} width={1280} height={1024} style={{ maxWidth: '270px', maxHeight: '400px' }} className='absolute top-64 left-7'/>
                        <div className='flex flex-col gap-6 items-center px-20 w-full absolute'>
                            <div className='text-5xl items-center text-center -top-5 stroke'>
                                ЧТОБЫ СОЗДАТЬ ФОТО, <br /> НАЖМИТЕ НА КНОПКУ ПОД РАМКОЙ
                            </div>
                            <div className='w-full'>
                                {!isCameraReady && (
                                    <ins className='bg-gray-800 p-5 rounded-md z-10' style={{ position: 'absolute', top: '30%', left: '32%', height: '10%', textAlign: 'center' }}>
                                        ИДЕТ ПОДКЛЮЧЕНИЕ ФОТОКАМЕРЫ
                                    </ins>
                                )}
                                {!capturedImage ? (
                                    <div className='flex flex-col items-center w-full gap-10'>
                                        <div className='border-solid border-2 capture-container rounded-md' style={{ width: 633, height: 633, position: 'relative' }}>
                                            {isCameraReady && (
                                                <div style={{ width: 630, height: 630, position: 'relative' }}>
                                                    <canvas className='rounded-md' ref={backgroundImageRef} width="630" height="630" style={{ position: 'absolute', zIndex: 1, display: chromokey.isEnabled ? 'block' : 'none' }} />
                                                    <canvas className='rounded-md' ref={canvasRefMain} width="630" height="630" style={{ position: 'absolute', zIndex: 2 }} />
                                                </div>
                                            )}
                                            {isCameraReady && isShooting && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    fontSize: '100px',
                                                    fontWeight: 'bold',
                                                    color: 'white',
                                                    textShadow: '2px 2px 10px rgba(0, 0, 0, 0.7)',
                                                    zIndex: 3
                                                }}>
                                                    {countdown === 0 ? <Loader2 className="animate-spin text-white w-20 h-20" /> : countdown}
                                                </div>
                                            )}
                                        </div>
                                        <div className='h-40 flex justify-between items-center w-full'>
                                            {!camera.payment_enabled && (
                                                <button className='w-36 h-20 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg border-white bg-blue-900'  onClick={handleBack} disabled={isButtonDisabled}>
                                                    <img className='w-5 transform -scale-x-100' src={templateTriangle} alt="Back" /> НАЗАД
                                                </button>
                                            )}
                                            {camera.payment_enabled ? (
                                                <div className='flex-1 flex justify-center items-center'>
                                                    {!isShooting && forCapture && (
                                                        <button onClick={startCountdown}>
                                                            <img src={cameraCapture} className='w-72' alt="Capture Photo" />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className='flex justify-center items-center'>
                                                    {!isShooting && forCapture && (
                                                        <button onClick={startCountdown}>
                                                            <img src={cameraCapture} className='w-72' alt="Capture Photo" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {!camera.payment_enabled && (
                                                <button className='w-36 h-20 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg border-white bg-blue-900' style={{ visibility: 'hidden' }}>
                                                    <img className='w-5 transform -scale-x-100' src={templateTriangle} alt="Back" /> НАЗАД
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className='flex flex-col items-center w-full gap-10'>
                                        {/* <img src={capturedImage} className='object-cover' style={{ width: 530, height: 530, position: 'relative' }} /> */}
                                        <canvas ref={backgroundImageRef} width="630" height="630" style={{ position: 'absolute', zIndex: 1, display: chromokey.isEnabled ? 'block' : 'none' }} />
                                        <img src={capturedImage} alt='Captured' style={{ width: 633, height: 633, position: 'relative', zIndex: 2 }} className='border-solid border-2 capture-container rounded-md object-cover' />
                                        <div className='h-40 flex justify-between items-center w-full'>
                                            {!camera.payment_enabled && (
                                                <button className='w-36 h-20 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg border-white bg-blue-900' onClick={handleBack}>
                                                    <img className='w-5 transform -scale-x-100' src={templateTriangle} alt="Back" /> НАЗАД
                                                </button>
                                            )}
                                            {camera.payment_enabled ? (
                                                <div className='flex-1 flex justify-around items-center gap-20'>
                                                    <button className='text-red-700 border-2 rounded-3xl px-12 py-8 bg-white font-bold' onClick={reshootPhoto} disabled={isButtonDisabled}>
                                                        <span className='text-5xl '>НЕТ</span><br />ПЕРЕСНЯТЬ ФОТО
                                                    </button>
                                                    <button className='text-lime-500 border-2 rounded-3xl px-12 py-8 bg-white font-bold' onClick={savePhoto} disabled={isButtonDisabled}>
                                                        <span className='text-5xl '>ДА</span><br />НРАВИТСЯ ФОТО
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className='flex-1 flex justify-around items-center gap-20'>
                                                    <button className='text-red-700 border-2 rounded-3xl px-12 py-8 bg-white font-bold' onClick={reshootPhoto} disabled={isButtonDisabled}>
                                                        <span className='text-5xl '>НЕТ</span><br />ПЕРЕСНЯТЬ ФОТО
                                                    </button>
                                                    <button className='text-lime-500 border-2 rounded-3xl px-12 py-8 bg-white font-bold' onClick={savePhoto} disabled={isButtonDisabled}>
                                                        <span className='text-5xl '>ДА</span><br />НРАВИТСЯ ФОТО
                                                    </button>
                                                </div>
                                            )}
                                            {!camera.payment_enabled && (
                                                <button className='w-36 h-20 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg border-white bg-blue-900' style={{ visibility: 'hidden' }} onClick={handleBack}>
                                                    <img className='w-5 transform -scale-x-100' src={templateTriangle} alt="Back" /> НАЗАД
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}