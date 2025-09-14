import { useEffect, useState, useRef } from "react";
import { usePageNavigation } from "../hooks/usePageNavigation";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api"
import { convertFileSrc } from "@tauri-apps/api/tauri";
import back_img from "../assets/defaultImage_2.png";
import { useStore } from "../admin/store";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";
import kaspi_img from '../assets/kaspi_1.jpg';

const DEVICE_IP = '192.168.1.1';

export default function PaymentPage() {
    usePageNavigation();
    const navigate = useNavigate();
    const [timer, setTimer] = useState(60);
    const [isTimerActive, setIsTimerActive] = useState(true);
    const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
    const [isPaymentFailed, setIsPaymentFailed] = useState(false);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [isSessionStarted, setIsSessionStarted] = useState(false);
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
        background_image_2,
        chromokey, 
        setChromokey,
        settings_qr_image, 
        setQRImage,
        project, 
        setProject
    } = useStore();

    useEffect(() => {
        const loadImage = async () => {
          try {
            const image = await invoke("get_image_path", { path: `settings/qr_image` });
            const imageConverted = convertFileSrc(image);
            const url_image = `url(${imageConverted})`;
            setQRImage(`${project.name}_settings/qr_image`, "settings_qr_image", url_image);
            console.log("QR image loaded:", url_image);
          } catch (err) {
            console.error("Ошибка загрузки изображения:", err);
          }
        };
    
        loadImage();
    }, []);
    // Таймер
    let interval;
    useEffect(() => {
        if (!isTimerActive || timer <= 0) {
            cancel();
            setTimer((prev) => prev + 2);
            clearInterval(interval);
        };
        interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerActive, timer]);

    // Автостарт при загрузке
    const isStartedRef = useRef(false);

    useEffect(() => {
        // navigate('/capture');
        if (!isStartedRef.current) {
            isStartedRef.current = true;
            start();
        }
    }, []);

    const intervalRef = useRef(null);
    const isMountedRef = useRef(true); // Флаг монтирования компонента

    const start = async () => {
        try {
            setIsTimerActive(true);
            clearExistingInterval(); // Очищаем существующий интервал
            startStatusPolling(); // Запускаем опрос статуса
            
            const path = await invoke("take_item_information_path");
            const filePath = `${path}/payment-data.json`;
            const json = await readTextFile(filePath);
            const data = JSON.parse(json);
            setProductData(data);

            const result = await invoke("start_payment_session", {
            payload: { 
                ip: DEVICE_IP,
                amount: parseFloat(data.amount),
                item: parseInt(data.item),
                name_kz: data.name_kz.substring(0, 31),
                name_ru: data.name_ru.substring(0, 31)
            }
        }).catch(err => {
            console.error("Ошибка вызова start_payment_session:", err);
            if (err === "Некорректная сумма"){
                toast.error("Неверная сумма оплаты");
            }
            else if (err === "Название слишком длинное"){
                toast.error("Название слишком длинное");
            }
            else if (err === "Некорректный номер продукта"){
                toast.error("Некорректный номер продукта");
            }
            else {
                toast.error("Терминал оплаты не подключен или не работает");
            }
            throw new Error(`Ошибка сервера: ${err}`);
        });

        console.error("Result:", result);
        switch (result) {
            case "ok":
                console.log("Платеж инициирован успешно");
                break;
            case "failure":
                // throw new Error("Ошибка платежа");
                toast.error("Не удалось начать сессию платежа");
                cancel();
            case "collision":
                // throw new Error("Конфликт платежа");
                toast.error("Не удалось обратиться на платежную систему");
                cancel();
            case "bad_args":
                // throw new Error("Неверные аргументы");
                toast.error("Для оплаты были выставлеты не верные аргументы");
                cancel();
            case "bad_values":
                // throw new Error("Неверные значения");
                toast.error("Для оплаты были выставлены не верные значения");
                cancel();
            default:
                // throw new Error("Неизвестный ответ сервера");
                toast.error("Не удалось обратиться на платежную систему");
                cancel();
        }
        } catch (err) {
            setError("Не удалось загрузить или отправить данные: " + err);
            clearExistingInterval();
        }
    };

    // Вынесем логику опроса статуса в отдельную функцию
    const startStatusPolling = () => {
        intervalRef.current = setInterval(async () => {
            
            try {
                const res = await invoke("get_payment_status", { ip: DEVICE_IP });
                if (typeof res === "string") {
                    setStatus(res);
                    console.log("Ответ status - ", res);
                    if (res === "paid") {    
                        await completePayment();
                        setIsPaymentSuccessful(true);
                    }
                    else if (res === "canceled") {
                        toast.info("Сессия была отменена");
                        await completePayment();
                    }
                    else if (res === "session") {
                        setIsSessionStarted(true);
                    }
                }
            } catch (err) {
                setError(`Ошибка статуса: ${err}`);
            }
        }, 1000);
    };

    const completePayment = async () => {
        try {
            const result = await invoke("complete_payment_session", { ip: DEVICE_IP });
            if (result === "ok") {
                // toast.info("Оплата успешно прошла");
                clearExistingInterval();
            }
            else if (result === "collision"){
                toast.error("Ошибка: Поступило несколько запросов однавременно. Попробуйте снова через 60 секунд");
            }
            else {
                toast.error("Ошибка оплаты");
            }
        } catch (err) {
            setError(`Ошибка оплаты: ${err}`);
        }
    };

    const clearExistingInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const cancel = async () => {
        try {
            const result = await invoke("cancel_payment_session", { ip: DEVICE_IP });
            if (result === "ok") {
                // toast.info("Оплата успешно отменена");
                setIsPaymentFailed(true);
            }
            else if(result === "collision"){
                toast.error("Ошибка: Поступило несколько запросов однавременно. Попробуйте снова через 60 секунд");
            }
            else {
                toast.error("Ошибка отмены оплаты");
            }
        } catch (err) {
            setError(`Ошибка отмены: ${err}`);
        }
        await completePayment();
    };

    const handlePayment = async () => {

        setIsPaymentSuccessful(true);
        await cancel();
        // await completePayment();
        
        try {
            if (!camera.isCameraOn) {
                await invoke('initialize_camera');
                setCamera({ isCameraOn: true });
            }
            navigate('/capture');
            setCamera({ isLiveView: true });
            await invoke('start_live_view');
        } catch (error) {
            toast.error("Камера не подключена");
            console.error(error);
        }
    };

    useEffect(() => {
        if (timer === 0 && !isPaymentSuccessful) {
            setIsPaymentFailed(true);
            clearExistingInterval();
            navigate('/payment-failed');
        }
    }, [timer]);

    useEffect(() => {
        if (isPaymentSuccessful) {
            if (!camera.isCameraOn) invoke('initialize_camera').then(() => setCamera({ isCameraOn: true }));
            clearExistingInterval();
            navigate('/capture')
        }
        else if (isPaymentFailed) {
            clearExistingInterval();
            navigate('/payment-failed');
        }
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
                        <div className="p-2 rounded justify-center items-center text-center text-2xl">
                                <p>{productData.name_ru} / {productData.name_kz}</p>
                                <p>Стоимость: {productData.amount}</p>
                        </div>
                        {(settings_qr_image && isSessionStarted) ? (
                            <img src={settings_qr_image.replace(/^url\((.*)\)$/, "$1")} width={400} />
                        ) : (
                            <p className="text-6xl bold text-center">QR не загружен</p>
                        )}
                    </div>
                )}
                    <p className="text-xl mb-8 text-center">
                        Время до отмены: <span className="font-semibold">{timer}</span> сек.
                    </p>
                    {chromokey.printer_visible && (
                    <div className="flex flex-wrap justify-center gap-6">
                        <button onClick={handlePayment} className="px-6 py-3 bg-green-600 hover:bg-green-700 transition rounded-xl text-lg font-medium shadow-md">Симулировать успех</button>
                        <button onClick={cancel} className="px-6 py-3 bg-red-600 hover:bg-red-700 transition rounded-xl text-lg font-medium shadow-md">Симулировать ошибку</button>
                    </div>
                    )}
                </div>
            </div>
            <ToastContainer position="bottom-center" />
        </div>
    );
}