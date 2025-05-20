import { useEffect, useState } from "react";
import { usePageNavigation } from "../hooks/usePageNavigation";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api"
import back_img from "../assets/defaultImage.jpeg";
import { useStore } from "../admin/store";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";
import { invoke } from '@tauri-apps/api/tauri';
import kaspi_img from '../assets/kaspi_1.jpg';

const DEVICE_IP = '192.168.1.2';

export default function PaymentPage() {
    usePageNavigation();
    const navigate = useNavigate();
    const [timer, setTimer] = useState(60);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
    const [isPaymentFailed, setIsPaymentFailed] = useState(false);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [productData, setProductData] = useState({
        name_ru: "",
        name_kz: "",
        amount: 0,
        item: 0,
    });

    const {
        canvases,
        switchCanvas,
        currentCanvasId,
        camera,
        setCamera,
        background_image_2
    } = useStore();

    // Таймер
    useEffect(() => {
        if (!isTimerActive || timer <= 0) return;
        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerActive, timer]);

    // Автостарт при загрузке
    useEffect(() => {
        start();
    }, []);

    let interval;
    const start = async () => {
        try {
            setIsTimerActive(true);
            const path = await invoke("take_item_information_path");
            const filePath = `${path}/payment-data.json`;
            const json = await readTextFile(filePath);
            const data = JSON.parse(json);

            setProductData(data);

            console.log('Trying to request')
            await invoke("start_payment_session", {
                payload: {
                    ip: DEVICE_IP,
                    ...data,
                },
            });

            // Статус проверки
            interval = setInterval(() => {
                invoke("get_payment_status", { ip: DEVICE_IP })
                    .then((res) => {
                        if (typeof res === "string") {
                            console.log("Ответ статуса - ", res);
                            setStatus(res);
                            if (res === "paid" || isPaymentSuccessful) {
                                invoke("complete_payment_session", { ip: DEVICE_IP });
                                setIsPaymentSuccessful(true);
                                clearInterval(interval);
                            }
                        }
                    })
                    .catch(err => setError(`Ошибка статуса: ${err}`));
            }, 1000);

        } catch (err) {
            setError("Не удалось загрузить или отправить данные: " + err);
        }
    };

    const cancel = () => {
        clearInterval(interval);
        invoke("cancel_payment_session", { ip: DEVICE_IP })
            .then(() => setStatus("canceled"))
            .catch(err => setError(`Ошибка отмены: ${err}`));
        setIsPaymentFailed(true);
    };

    const handlePayment = async () => {
        clearInterval(interval);
        setIsPaymentSuccessful(true);
        invoke("complete_payment_session", { ip: DEVICE_IP });
        try {
            if (!camera.isCameraOn) {
                await invoke('initialize_camera');
                setCamera({ isCameraOn: true });
            }

            navigate('/capture');
            setCamera({ isLiveView: true });
            await invoke('start_live_view');
            setIsTimerActive(true);
        } catch (error) {
            toast.error("Камера не подключена");
            console.error(error);
        }
    };

    useEffect(() => {
        if (timer === 0 && !isPaymentSuccessful) {
            setIsPaymentFailed(true);
            navigate('/payment-failed');
        }
    }, [timer]);

    useEffect(() => {
        if (isPaymentSuccessful) navigate('/capture');
        else if (isPaymentFailed) navigate('/payment-failed');
    }, [isPaymentSuccessful, isPaymentFailed]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-black">
            <div
                className="relative bg-cover bg-center w-[1280px] h-[1024px] overflow-hidden"
                style={{ backgroundImage: `url(${back_img})` }}
            >
                
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <div className="relative z-10 flex flex-col justify-center items-center h-full text-white animate-fade-in px-4">
                    <h1 className="text-4xl font-bold mb-6 text-center drop-shadow">Подтвердите оплату</h1>
                    {isTimerActive && (
                    <div>
                        <img src={kaspi_img} width={300}/>
                    </div>
                )}
                    <p className="text-xl mb-8 text-center">
                        Время до отмены: <span className="font-semibold">{timer}</span> сек.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6">
                        {isTimerActive && (
                            <div className="p-2 rounded">
                                <p>Товар: {productData.name_ru} / {productData.name_kz}</p>
                                <p>Сумма: {productData.amount}</p>
                                <p>Номер товара: {productData.item}</p>
                            </div>
                        )}
                        <button onClick={handlePayment} className="px-6 py-3 bg-green-600 hover:bg-green-700 transition rounded-xl text-lg font-medium shadow-md">Симулировать успех</button>
                        <button onClick={cancel} className="px-6 py-3 bg-red-600 hover:bg-red-700 transition rounded-xl text-lg font-medium shadow-md">Симулировать ошибку</button>
                    </div>
                </div>
            </div>
            <ToastContainer position="bottom-center" />
        </div>
    );
}
