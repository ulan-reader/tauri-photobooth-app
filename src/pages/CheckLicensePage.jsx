import React, { useEffect, useCallback, useState } from 'react';
import { useStore } from '../admin/store';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/tauri';
import licenseCheckIcon from '../assets/license-check.png';
import verifyLicenseIcon from '../assets/verify-license.png';
import changeLicenseIcon from '../assets/change-license.png';


export default function CheckLicensePage() {
    const { license, setLicense } = useStore();
    const navigate = useNavigate();
    const [loadingVerify, setLoadingVerify] = useState(false);
    const [loadingCheck, setLoadingCheck] = useState(false);

    useEffect(() => {
        const storedLicense = localStorage.getItem("license") === "true";
        if (storedLicense) {
            setLicense(true);
            navigate('/');
        }
    }, [navigate, setLicense]);

    const checkLicense = useCallback(async () => {
        try {
            setLoadingCheck(true);
            await invoke('check_license')
                .then((state) => {
                    localStorage.setItem("license", "true");
                    setLicense(true);
                    toast.success(state);
                    navigate('/');
                    setLoadingCheck(false);
                })
                .catch((error) => {
                    setLoadingCheck(false);
                    toast.error(error);
                    navigate('/license');
                    console.error(error);
                });
                setLoadingCheck(false);
        } catch (error) {
            setLoadingCheck(false);
            navigate('/license');
            toast.error('Ошибка при проверке лицензии');
            console.error(error);
        }
    }, [navigate, setLicense]);

    const verifyLicense = useCallback(async () => {
        try {
            setLoadingVerify(true);
            await invoke('verify_license')
                .then((data) => {
                    localStorage.setItem("license", "true");
                    setLicense(true);
                    toast.success(data);
                    navigate('/');
                    setLoadingVerify(false);
                })
                .catch((error) => {
                    setLoadingVerify(false);
                    navigate('/license');
                    toast.error(error);
                    console.error(error);
                });
        } catch (error) {
            setLoadingVerify(false);
            navigate('/license');
            toast.error('Ошибка при проверке лицензии');
            console.error(error);
        }
    }, [navigate, setLicense]);

    return (
        <div className='w-screen h-screen flex flex-col justify-center items-center gap-40'>
            <div className='flex items-center'>
                <img className='w-24' src={licenseCheckIcon}/>
                <h1 className='text-7xl '>Проверка лицензии</h1>
            </div>
            <div className='flex justify-around items-center w-[900px]'>
                <button 
                    onClick={verifyLicense}
                    className='flex items-center justify-center text-3xl border rounded-md px-10 py-4 transition-all duration-300 transform hover:scale-105 hover:bg-gray-200'
                >
                    {loadingVerify ? (
                        <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                    ) : (
                        <img src={changeLicenseIcon} className='w-10 mr-2' />
                    )}
                    {loadingVerify ? 'Загрузка...' : 'Выбрать Лицензию'}
                </button>
                <button 
                    onClick={checkLicense} 
                    className='flex items-center justify-center text-3xl border rounded-md px-10 py-4 transition-all duration-300 transform hover:scale-105 hover:bg-gray-200'
                >
                    {loadingCheck ? (
                        <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                    ) : (
                        <img src={verifyLicenseIcon} className='w-10'/> 
                    )}
                    {loadingCheck ? 'Загрузка...' : 'Проверить лицензию'}
                </button>
            </div>
        </div>
    )
}