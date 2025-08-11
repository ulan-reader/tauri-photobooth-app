import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import templateTriangle from '../assets/templateTriangle.png';
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import back_img from '../assets/defaultImage_2.png';
import { invoke, convertFileSrc } from "@tauri-apps/api/tauri"
import { useStore } from '../admin/store.js';
import { toast, ToastContainer } from 'react-toastify';
import { background } from '@chakra-ui/react';

export default function TemplatePage({ design, setDesign }) {
    // const [bgImage, setBgImage] = useState(localStorage.getItem("back_2") || `url(${back_img})`);
    const { canvases, switchCanvas, currentCanvasId, camera, setCamera, background_image_2, buttonsColor } = useStore();
    const availableCanvases = canvases.filter((canvas) => canvas.canvasProps.available === true);
    const navigate = useNavigate();
    usePageNavigation();

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const canvasHolder = () => {
            setCurrentIndex(availableCanvases.findIndex(t => t.id === currentCanvasId));
        };
        canvasHolder();
    },[]);
    const handleNext = async () => {
        try {
            console.log("init camera")
           
        
            // if (!camera.isCameraOn) {
            //     await invoke('initialize_camera');
            //     setCamera({ isCameraOn: true });
            // }
            navigate('/print')

            // setCamera({ isLiveView: true });
            // await invoke('start_live_view');
        } catch(error) {
            // toast.error("Камера не подключена");
            console.log("Error: ", error);
            return
        }
    };

    const prevSlide = () => {
        const currentIndex = availableCanvases.findIndex(t => t.id === currentCanvasId);
        const prevIndex = (currentIndex < availableCanvases.length - 1) ? currentIndex + 1 : 0;
        switchCanvas(availableCanvases[prevIndex].id);
        setCurrentIndex(prevIndex);
    };
    const nextSlide = () => {
        const currentIndex = availableCanvases.findIndex(t => t.id === currentCanvasId);
        const nextIndex = (currentIndex > 0) ? currentIndex - 1 : availableCanvases.length - 1;
        switchCanvas(availableCanvases[nextIndex].id);
        setCurrentIndex(nextIndex);
    };

    return (
        <div className="flex justify-center items-center">
            <div className="select-none relative bg-cover bg-center bg-no-repeat" style={{width: '1280px', height: '1024px', backgroundImage: background_image_2}}>
                <div className='back-img'></div>
                <div className='absolute top-0 left-0 w-full h-full flex justify-center items-center text-white text-2xl z-10'>
                    <div className='w-full flex flex-col gap-9 justify-center items-center'>
                        <b className='text-6xl stroke'>ВЫБЕРИТЕ ШАБЛОН</b>
                        <div className='flex flex-col w-full px-20 gap-16'>
                            <div className='flex items-center justify-center'>
                                <img
                                    onClick={prevSlide}
                                    className='h-24 cursor-pointer transform -scale-x-100'
                                    src={templateTriangle}
                                    alt="Previous"
                                />
                                <div className='relative items-center my-1 box_templ py-200'>
                                    <div className='bg_mak'></div>
                                {availableCanvases.length > 1 ? (
                                    // Галерея изображений
                                    <div className='absolute bottom-1 left-0 w-full h-full flex gap-6 justify-center items-center z-10'>
                                        <img
                                            src={availableCanvases[(currentIndex + 1 + availableCanvases.length) % availableCanvases.length]?.canvasProps?.webpData}
                                            alt={availableCanvases[(currentIndex + 1 + availableCanvases.length) % availableCanvases.length]?.canvasProps?.name}
                                            className="w-64 max-h-96 opacity-50 cursor-pointer"
                                            onClick={prevSlide}
                                        />
                                        <img
                                            src={availableCanvases[currentIndex]?.canvasProps?.webpData}
                                            alt={availableCanvases[currentIndex]?.canvasProps?.name}
                                            className="w-80 h-112 cursor-pointer border-4 border-blue-500"
                                        />
                                        <img
                                            src={availableCanvases[(currentIndex - 1 + availableCanvases.length) % availableCanvases.length]?.canvasProps?.webpData}
                                            alt={availableCanvases[(currentIndex - 1 + availableCanvases.length) % availableCanvases.length]?.canvasProps?.name}
                                            className="w-64 max-h-96 opacity-50 cursor-pointer"
                                            onClick={nextSlide}
                                        />
                                    </div>
                                ) : (
                                    // Только одно изображение
                                    <div className="absolute bottom-1 left-0 w-full h-full flex justify-center items-center z-10">
                                        <img
                                            src={availableCanvases[0].canvasProps.webpData}
                                            alt={availableCanvases[0].canvasProps.name}
                                            className="w-80 h-112 cursor-pointer border-4 border-blue-500"
                                        />
                                    </div>
                                )}

                                </div>
                                <img
                                    className='h-24 cursor-pointer'
                                    onClick={nextSlide}
                                    src={templateTriangle}
                                    alt="Next"
                                />
                            </div>
                            <div className='flex justify-between items-center'>
                                <button className='w-36 h-20 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg border-white' style={{background: buttonsColor.main, color: buttonsColor.mainText}} onClick={() => navigate('/')}>
                                    <img className='w-5 transform -scale-x-100' src={templateTriangle} alt="Back" /> НАЗАД
                                </button>
                                <button
                                    onClick={() => setDesign(true)}
                                    className={`border-2 rounded-3xl px-12 py-8 bg-white ${design  ? 'ring-4 ring-blue-500' : ''}`}
                                >
                                    <p className='w-44 text-black text-2xl font-medium'>ЦВЕТНОЕ ФОТО</p>
                                </button>
                                <button
                                    onClick={() => setDesign(false)}
                                    className={`border-2 rounded-3xl px-12 py-8 bg-white ${ !design ? 'ring-4 ring-blue-500' : ''}`}
                                >
                                    <p className='w-44 text-black text-2xl font-medium'>ЧЕРНО-БЕЛОЕ ФОТО</p>
                                </button>
                                <button className='w-36 h-20 cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg border-white text-2xl' style={{background: buttonsColor.main, color: buttonsColor.mainText}} onClick={handleNext}>
                                    ДАЛЕЕ <img className='w-5' src={templateTriangle} alt="Forward" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};