import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import back_img from "../assets/defaultImage.jpeg";

export default function PaymentFailed() {
    const navigate = useNavigate();
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);

        if (timer <= 0) {
            navigate("/");
        }

        return () => clearInterval(interval);
    }, [timer, navigate]);

    const handleRetry = () => {
        console.log("Retrying payment...");
        navigate("/payment");
    };

    const handleCancel = () => {
        console.log("Payment canceled.");
        navigate("/");
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-black">
            <div
                className="relative bg-cover bg-center w-[1280px] h-[1024px] overflow-hidden"
                style={{ backgroundImage: `url(${back_img})` }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                
                <div className="relative z-10 flex flex-col justify-center items-center text-white h-full px-4 animate-fade-in">
                    <h1 className="text-4xl font-bold mb-6 text-center drop-shadow">
                        Оплата не прошла 😔
                    </h1>
                    <p className="text-xl mb-8 text-center">
                        Попробуйте снова. Возврат на главную через: <span className="font-semibold">{timer}</span> сек.
                    </p>
                    <div className="flex gap-6">
                        <button
                            onClick={handleCancel}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition rounded-xl text-lg font-medium shadow-md"
                        >
                            В главную
                        </button>
                        <button
                            onClick={handleRetry}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 transition rounded-xl text-lg font-medium shadow-md"
                        >
                            Повторить оплату
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
