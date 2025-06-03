import { useEffect, useState } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/tauri";
import { NavLink } from "react-router-dom";
import printer from '../assets/printer.png'
import image from '../assets/image.png'
import refresh_icon from '../assets/refresh.png'
import templateTriangle from '../assets/templateTriangle.png';
import { usePageNavigation } from "../hooks/usePageNavigation";
import back_img from '../assets/defaultImage_2.png'; // Фоновое изображение

export default function ListPage() {
    usePageNavigation();

    const [listPhotos, setListPhotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    async function fetchData() {
        const list = await invoke('get_image_paths')
        // setListPhotos([]);
        setListPhotos(list);
        console.log(list);
    }

    useEffect(() => {
        fetchData()
    }, [])

    function selectPhoto(photo) {
        console.log(photo);
        setSelectedPhoto(photo);
    }

    async function printPhoto() {
        if (selectedPhoto) {
            await invoke('print_image_use_path', { imagePath: selectedPhoto })
        }
    }

    return (
        <div className="flex justify-center items-center ">
            <div className="select-none relative flex flex-col bg-cover bg-center bg-no-repeat" style={{width: '1280px', height: '1024px', backgroundImage: `url(${back_img})`}}>
                <div className="flex justify-around items-center w-full py-5 px-10 h-24">
                    <NavLink to="/" className="flex items-center gap-2 px-2 py-1 bg-blue-600 text-white rounded-md"><img className='w-2 -scale-x-100' src={templateTriangle} alt="Forward" />Назад</NavLink>
                    <h1 className="text-4xl font-bold">Список фотографий</h1>
                    <button onClick={fetchData} className="flex items-center px-2 py-1 bg-white text-green-700 hover:text-gray-800 rounded-md gap-1"><img className="h-5 w-5" src={refresh_icon} /> Обновить</button>
                </div>
                <div className="flex w-full justify-center items-center px-4 h-5/6">
                    <div className="flex flex-col gap-4 w-4/5 overflow-y-auto rounded-lg border-[3px] h-full">
                        <ul className="flex flex-wrap gap-4 justify-center items-center py-2">
                            {listPhotos.map((photo) => (
                                <li key={photo} ><button className={`border-4 ${selectedPhoto === photo ? "border-blue-500" : "border-transparent"} rounded-lg`} onClick={() => {selectPhoto(photo)}}><img className="h-[500px] w-[300px] rounded-sm" src={convertFileSrc(photo)}/></button></li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex flex-col gap-4 w-1/5 justify-center items-center">
                        <button className="flex flex-col w-32 h-32 bg-white rounded-lg justify-center items-center" onClick={() => {printPhoto()}}>
                            <img src={printer} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}