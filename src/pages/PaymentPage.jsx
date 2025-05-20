import { useEffect, useState } from "react";
import { usePageNavigation } from "../hooks/usePageNavigation";
import { useNavigate } from "react-router-dom";
import back_img from "../assets/defaultImage.jpeg";
import { useStore } from "../admin/store";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function PaymentPage() {
    usePageNavigation();
    const navigate = useNavigate();
    const [timer, setTimer] = useState(60);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
    const [isPaymentFailed, setIsPaymentFailed] = useState(false);
    const {
        canvases,
        switchCanvas,
        currentCanvasId,
        camera,
        setCamera,
        background_image_2
    } = useStore();

    useEffect(() => {
        if (!isTimerActive || timer <= 0) return;
        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerActive, timer]);

    useEffect(() => {
        if (timer === 0 && !isPaymentSuccessful) {
            setIsPaymentFailed(true);
            navigate('/payment-failed');
        }
    }, [timer]);

    useEffect(() => {
        if (isPaymentSuccessful) {
            navigate('/capture');
        } else if (isPaymentFailed) {
            navigate('/payment-failed');
        }
    }, [isPaymentSuccessful, isPaymentFailed]);

    const handlePayment = async () => {
        try {
            console.log("init camera");

            if (!camera.isCameraOn) {
                await invoke('initialize_camera');
                setCamera({ isCameraOn: true });
            }

            navigate('/payment');
            setCamera({ isLiveView: true });
            await invoke('start_live_view');
            setIsTimerActive(true);

        } catch (error) {
            toast.error("Камера не подключена");
            console.log("Error: ", error);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-black">
            <div
                className="relative bg-cover bg-center w-[1280px] h-[1024px] overflow-hidden"
                style={{ backgroundImage: `url(${back_img})` }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                <div className="relative z-10 flex flex-col justify-center items-center h-full text-white animate-fade-in px-4">
                    <h1 className="text-4xl font-bold mb-6 text-center drop-shadow">
                        Подтвердите оплату
                    </h1>
                    <p className="text-xl mb-8 text-center">
                        Время до отмены: <span className="font-semibold">{timer}</span> сек.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <button
                            onClick={() => setIsTimerActive(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition rounded-xl text-lg font-medium shadow-md"
                        >
                            Начать оплату
                        </button>
                        <button
                            onClick={handlePayment}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 transition rounded-xl text-lg font-medium shadow-md"
                        >
                            Симулировать успех
                        </button>
                        <button
                            onClick={() => setIsPaymentFailed(true)}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 transition rounded-xl text-lg font-medium shadow-md"
                        >
                            Симулировать ошибку
                        </button>
                    </div>
                </div>
            </div>
            <ToastContainer position="bottom-center" />
        </div>
    );
}
