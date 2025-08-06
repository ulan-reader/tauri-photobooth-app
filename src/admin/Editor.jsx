import React, { useState, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
    RotateCcw,
    RotateCw,
    FlipVertical,
    FlipHorizontal,
    Undo,
    Redo,
    Image as ImageIcon,
    Sun,
    Moon,
    ArrowLeft,
    Sliders,
    Crop as CropIcon,
    Move,
    RefreshCcwDot
} from "lucide-react";
import { Link } from "react-router-dom";
import { invoke, convertFileSrc } from "@tauri-apps/api/tauri";
import { toast, ToastContainer } from "react-toastify";
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import { emit } from '@tauri-apps/api/event';
import AdminShell from "../components/AdminShell";

const filterElements = [
    { name: "brightness", maxValue: 200, icon: Sun },
    { name: "grayscale", maxValue: 200, icon: Moon },
    { name: "sepia", maxValue: 200, icon: Sliders },
    { name: "saturate", maxValue: 200, icon: Sliders },
    { name: "contrast", maxValue: 200, icon: Sliders },
    { name: "hueRotate", maxValue: 360, icon: Sliders }
];

const cropPresets = [
    { label: "16:9", aspect: '16/9' },
    { label: "4:3", aspect: '4/3' },
    { label: "1:1", aspect: '1/1' }
];

const props = {
    page: 'Редактор изображений',
    type: 'editor'
}

import defaultImage from "../assets/defaultImage_2.png";
import { useStore } from "./store.js";

export default function Editor({ isDarkMode }) {

    usePageNavigation();
    const [whyBg, setWhyBg] = useState(1);
    // const [bgImage, setBgImage] = useState(localStorage.getItem(`back_${whyBg}`));
    const { setBackgroundImage, project } = useStore();
    
    const [property, setProperty] = useState(filterElements[0]);
    const [details, setDetails] = useState(null);
    const [crop, setCrop] = useState({
        x: 0,
        y: 0,
        width: 100,
        height: 100
    });
    const [aspect, setAspect] = useState('4/3');
    const [history, setHistory] = useState([{
        image: "",
        brightness: 100,
        grayscale: 0,
        sepia: 0,
        saturate: 100,
        contrast: 100,
        hueRotate: 0,
        rotate: 0,
        vertical: 1,
        horizontal: 1
    }]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [state, setState] = useState({
        image: defaultImage,
        brightness: 100,
        grayscale: 0,
        sepia: 0,
        saturate: 100,
        contrast: 100,
        hueRotate: 0,
        rotate: 0,
        vertical: 1,
        horizontal: 1
    });
    const [activeTab, setActiveTab] = useState("filters");

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const image = await invoke('get_image_path', { path: `background/${whyBg}_background`});
                const url_image = convertFileSrc(image);
                // localStorage.setItem(`back_${whyBg}`, url_image);
                const newState = {
                    ...state,
                    image: url_image || defaultImage,
                    brightness: 100,
                    grayscale: 0,
                    sepia: 0,
                    saturate: 100,
                    contrast: 100,
                    hueRotate: 0,
                    rotate: 0,
                    vertical: 1,
                    horizontal: 1
                    };
                setState(newState);
                updateHistory(newState);
            } catch (err) {
                const newState = {
                    ...state,
                    image: defaultImage,
                    brightness: 100,
                    grayscale: 0,
                    sepia: 0,
                    saturate: 100,
                    contrast: 100,
                    hueRotate: 0,
                    rotate: 0,
                    vertical: 1,
                    horizontal: 1
                    };
                setState(newState);
                updateHistory(newState);
                console.log(err);
            }
        };
        fetchImage();
    }, [whyBg]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
        root.classList.add("dark");
        } else {
        root.classList.remove("dark");
        }
    }, [isDarkMode]);

    const handleSliderChange = e => {
        const value = parseFloat(e.target.value);
        const newState = { ...state, [property.name]: value };
        setState(newState);
        updateHistory(newState);
    };

    const rotate = direction => {
        const newRotate = (state.rotate + (direction === "left" ? -90 : 90)) % 360;
        const newState = { ...state, rotate: newRotate };
        setState(newState);
        updateHistory(newState);
    };

    const flip = axis => {
        const newState = {
        ...state,
        [axis]: state[axis] === 1 ? -1 : 1
        };
        setState(newState);
        updateHistory(newState);
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setState(history[newIndex]);
        }
    };

    const undo = () => {
        if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setState(history[newIndex]);
        }
    };

    const refreshCcwDot = async () => {
        try {
            const image = await invoke('delete_image', { relativePath: `background/${whyBg}_background` });
            // const url_image = `url(data:image/jpeg;base64,${image})`;
            // setBgImage(url_image);
            const newState = {
                ...state,
                image: defaultImage,
                brightness: 100,
                grayscale: 0,
                sepia: 0,
                saturate: 100,
                contrast: 100,
                hueRotate: 0,
                rotate: 0,
                vertical: 1,
                horizontal: 1
                };
            setState(newState);
            updateHistory(newState);
            console.log(image)
            localStorage.removeItem(`back_${whyBg}`);
        } catch (err) {
            console.log(err);
        }
    }

    const handleImageUpload = e => {
        if (e.target.files && e.target.files.length !== 0) {
        const reader = new FileReader();
        reader.onload = () => {
            const newState = {
            ...state,
            image: reader.result,
            brightness: 100,
            grayscale: 0,
            sepia: 0,
            saturate: 100,
            contrast: 100,
            hueRotate: 0,
            rotate: 0,
            vertical: 1,
            horizontal: 1
            };
            setState(newState);
            updateHistory(newState);
        };
        reader.readAsDataURL(e.target.files[0]);
        }
    };

    const cropImage = () => {
        if (!crop?.width || !crop?.height || !details) return;
        const canvas = document.createElement("canvas");
        const scaleX = details.naturalWidth / details.width;
        const scaleY = details.naturalHeight / details.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
        ctx.drawImage(
            details,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        const base64Url = canvas.toDataURL("image/jpg");
        setState({ ...state, image: base64Url });
        }
    };

    const saveImage = async () => {
        if (!details) return;
        const canvas = document.createElement("canvas");
        const scaleFactor = 0.9; // Измените этот фактор для изменения разрешения (например, 0.5 уменьшит размер в два раза)
        canvas.width = details.naturalWidth * scaleFactor;
        canvas.height = details.naturalHeight * scaleFactor;
        const ctx = canvas.getContext("2d");

        if (ctx) {
            ctx.filter = `brightness(${state.brightness}%) grayscale(${state.grayscale}%) sepia(${state.sepia}%) saturate(${state.saturate}%) contrast(${state.contrast}%) hue-rotate(${state.hueRotate}deg)`;

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((state.rotate * Math.PI) / 180);
            ctx.scale(state.vertical, state.horizontal);

            ctx.drawImage(
                details,
                -canvas.width / 2,
                -canvas.height / 2,
                canvas.width,
                canvas.height
            );

            const dataURL = canvas.toDataURL('image/webp', 0.8);
            // const fileName = `${whyBg}_bg.jpeg`;
            // setBackgroundImage(`background_image_${whyBg}`, `url(${convertFileSrc(dataURL)})`);
            try {
                await invoke('save_image', {
                    image: dataURL,
                    relativePath: `background/${whyBg}_background`,
                })
                toast.success("Изображение успешно сохранено!", {
                    autoClose: 2000,
                });
            } catch (err) {
                console.error("Ошибка сохранения изображения: ", err);
            }

            try {
                const image = await invoke('get_image_path', { path: `background/${whyBg}_background` });
                const url_image = `url(${convertFileSrc(image)})`;
                setBackgroundImage(`${project.name}_background_image_${whyBg}`, `background_image_${whyBg}`, url_image);
            } catch (err) {
                console.error("Ошибка получения изображения: ", err);
            }
        }
    };

    const updateHistory = newState => {
        const updatedHistory = history.slice(0, historyIndex + 1);
        if (JSON.stringify(updatedHistory[updatedHistory.length - 1]) !== JSON.stringify(newState)) {
        setHistory([...updatedHistory, newState]);
        setHistoryIndex(updatedHistory.length);
        }
    };

    const getAspectRatio = aspect => {
        const [width, height] = aspect.split('/').map(Number);
        return width / height;
    };

    return (
        <AdminShell props={props} >
            <div className="flex gap-8">
                <div className="w-2/3">
                <div className="aspect-[4/3] flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                    {state.image ? (
                    <ReactCrop crop={crop} aspect={getAspectRatio(aspect)} onChange={c => setCrop(c)} className="w-full h-full flex items-center justify-center object-center object-contain">
                        <img
                            onLoad={e => setDetails(e.currentTarget)}
                            style={{
                                filter: `brightness(${state?.brightness}%) grayscale(${state?.grayscale}%) sepia(${state?.sepia}%) saturate(${state?.saturate}%) contrast(${state?.contrast}%) hue-rotate(${state?.hueRotate}deg)`,
                                transform: `rotate(${state?.rotate}deg) scale(${state?.vertical},${state?.horizontal})`,
                                width: "100%",
                                height: "100%",
                                // objectFit: "contain", // Или 'cover', если нужно заполнить всю область
                            }}
                            src={state.image}
                            alt="Редактируемое изображение"
                            className="w-full h-full object-center object-cover"
                        />
                    </ReactCrop>
                    ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <ImageIcon className="w-16 h-16 mb-2" />
                        <span>Выберите изображение</span>
                    </div>
                    )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <label
                        htmlFor="imageUpload"
                        className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 flex items-center"
                    >
                        <ImageIcon className="w-5 h-5 mr-2" />
                        Загрузить изображение
                    </label>
                    <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                    <button
                        onClick={cropImage}
                        className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors duration-300 flex items-center"
                    >
                        <CropIcon className="w-5 h-5 mr-2" />
                        Обрезать изображение
                    </button>
                    <button
                        onClick={saveImage}
                        className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors duration-300 flex items-center"
                    >
                    <Move className="w-5 h-5 mr-2" />
                        Сохранить изображение
                    </button>
                </div>
                </div>
                <div className="w-1/3 bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-lg">
                <div className="mb-6 flex justify-center">
                    <button
                        onClick={() => setActiveTab("filters")}
                        className={`px-4 py-2 rounded-l-full ${activeTab === "filters" ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'} hover:bg-blue-700 transition-colors duration-300`}
                    >
                        Фильтры
                    </button>
                    <button
                        onClick={() => setActiveTab("transform")}
                        className={`px-4 py-2 rounded-r-full ${activeTab === "transform" ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'} hover:bg-blue-700 transition-colors duration-300`}
                    >
                        Трансформация
                    </button>
                </div>
                {activeTab === "filters" && (
                    <>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {filterElements.map(el => (
                        <button
                            key={el?.name}
                            onClick={() => setProperty(el)}
                            className={`p-2 rounded ${property?.name === el?.name ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'} hover:bg-blue-700 transition-colors duration-300 flex flex-col items-center`}
                        >
                            <el.icon className="w-6 h-6 mb-1" />
                            {el?.name}
                        </button>
                        ))}
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 font-semibold">{property?.name}</label>
                        <input
                        type="range"
                        min="0"
                        max={property?.maxValue}
                        value={state[property?.name]}
                        onChange={handleSliderChange}
                        className="w-full appearance-none bg-gray-300 dark:bg-gray-600 h-2 rounded-full outline-none"
                        />
                        <div className="text-right mt-1">{state[property?.name]}</div>
                    </div>
                    </>
                )}
                {activeTab === "transform" && (
                    <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button onClick={() => rotate("left")} className="p-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300 flex items-center justify-center">
                        <RotateCcw className="w-6 h-6 mr-2" /> Влево
                        </button>
                        <button onClick={() => rotate("right")} className="p-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300 flex items-center justify-center">
                        <RotateCw className="w-6 h-6 mr-2" /> Вправо
                        </button>
                        <button onClick={() => flip("vertical")} className="p-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300 flex items-center justify-center">
                        <FlipVertical className="w-6 h-6 mr-2" /> Верт.
                        </button>
                        <button onClick={() => flip("horizontal")} className="p-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300 flex items-center justify-center">
                        <FlipHorizontal className="w-6 h-6 mr-2" /> Гориз.
                        </button>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 font-semibold">Соотношение сторон</label>
                        <div className="flex justify-between">
                        {cropPresets.map(preset => (
                            <button
                            key={preset?.label}
                            onClick={() => setAspect(preset?.aspect)}
                            className={`px-4 py-2 rounded ${aspect === preset?.aspect ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'} hover:bg-blue-700 transition-colors duration-300`}
                            >
                            {preset?.label}
                            </button>
                        ))}
                        </div>
                    </div>
                    </>
                )}
                <div className="flex justify-center gap-4 mt-6">
                    <button onClick={undo} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300" disabled={historyIndex === 0}>
                        <Undo className="w-6 h-6" />
                    </button>
                    <button onClick={redo} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300" disabled={historyIndex === history.length - 1}>
                        <Redo className="w-6 h-6" />
                    </button>
                    <button onClick={refreshCcwDot} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300" disabled={historyIndex === 0}>
                        <RefreshCcwDot className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid-cols-2 grid justify-center gap-4 mt-6">
                    <button onClick={() => setWhyBg(1)} className={`py-1 px-3 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300 ${whyBg === 1 ? 'bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 hover:bg-blue-800' : ''}`}>
                        Главная
                    </button>
                    <button onClick={() => setWhyBg(2)} className={`py-1 px-3 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300 ${whyBg === 2 ? 'bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 hover:bg-blue-800' : ''}`}>
                        Шаблоны
                    </button>
                    <button onClick={() => setWhyBg(3)} className={`py-1 px-3 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300 ${whyBg === 3 ? 'bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 hover:bg-blue-800' : ''}`}>
                        Фото
                    </button>
                    <button onClick={() => setWhyBg(4)} className={`py-1 px-3 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-300 ${whyBg === 4 ? 'bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 hover:bg-blue-800' : ''}`}>
                        Печать
                    </button>
                </div>
                <input value={whyBg} className='mt-4 -ml-3 h-8 border border-gray-300 dark:border-gray-600 rounded-md w-11 pl-4 bg-white' disabled/>
                </div>
            </div>
            <ToastContainer />
        </AdminShell>
    );
}