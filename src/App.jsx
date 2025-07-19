import React, { Children, useCallback, useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
// import MainPage from './admin/TemplateEditor.jsx';
const MainPage = lazy(() => import('./pages/MainPage.jsx'));
// import MainPage from './ChromaKeyTest.jsx';
const TemplatePage = lazy(() => import('./pages/TemplatePage.jsx'));
const CapturePage = lazy(() => import('./pages/CapturePage.jsx'));
const PrintPage = lazy(() => import('./pages/PrintPage.jsx'));

import Settings from './admin/Settings.jsx';
import Touchscreen from './admin/TouchScreen.jsx';
import PrinterInfo from './admin/Printer.jsx';
import TemplateEditor from './admin/TemplateEditor.jsx';
import Timer from './admin/Timer.jsx';
import Editor from './admin/Editor.jsx';
import Chromakey from './admin/ChromaKey.jsx';
import PrinterPopup from './components/PrinterPopup.jsx';
import { usePageNavigation } from './hooks/usePageNavigation.js';
import ListPage from './pages/ListPage.jsx';
import CheckLicensePage from './pages/CheckLicensePage.jsx';
import { useStore } from './admin/store.js';
import { invoke } from '@tauri-apps/api/tauri';
import PaymentPage from './pages/PaymentPage.jsx';
import PaymentFailed from './pages/PaymentFailed.jsx';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// const CheckLicense = lazy(() => import('./components/CheckLicense.jsx'));

export function CheckLicense({ children }) {
  const { license } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const storedLicense = localStorage.getItem("license") === "true";
    if (!storedLicense) {
      navigate('/license');
    }
  }, [license, navigate]);
  useEffect(() => {
      const disableContextMenu = (e) => {
        e.preventDefault(); // Отключает стандартное контекстное меню
      };

      window.addEventListener("contextmenu", disableContextMenu);

      return () => {
        window.removeEventListener("contextmenu", disableContextMenu);
      };
  }, []);
  return license ? children : null;
}

export default function App(){
  const [showPopup, setShowPopup] = useState(false);
  const { license } = useStore();
  const [design, setDesign] = useState(true);
  const [images, setImages] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
        <>
          <Router>
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-2xl">Загрузка...</div>}>
              <Routes>
                <Route path="/license" element={<CheckLicensePage />} /> 
                <Route 
                    path="/*"
                    element={
                      <CheckLicense>
                        <>
                          <Routes>
                            <Route path="/" element={<MainPage active={showPopup} setLoading={setLoading} loading={loading} setActive={setShowPopup} design={design}/>}/>
                            <Route path="/template" element={<TemplatePage design={design} setDesign={setDesign} />} />
                            <Route path="/payment" element={<PaymentPage />} />
                            <Route path="/payment-failed" element={<PaymentFailed />} />
                            <Route path="/capture" element={<CapturePage onCapture={setImages}/>} />
                            <Route path="/print" element={<PrintPage design={design} images={images} onPrint={() => {}} setDesign={setDesign} />} />
                            <Route path="/list" element={<ListPage />} />

                            <Route path="/settings" element={<Settings isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
                            <Route path="/settings/touchscreen" element={<Touchscreen isDarkMode={isDarkMode} />} />
                            <Route path="/settings/printer" element={<PrinterInfo isDarkMode={isDarkMode} setShowPopup={setShowPopup} setLoading={setLoading} showPopup={showPopup}/>} />
                            <Route path="/settings/timer" element={<Timer />} />
                            <Route path="/settings/editor" element={<Editor isDarkMode={isDarkMode}/>} />
                            <Route path="/settings/template-editor" element={<TemplateEditor isDarkMode={isDarkMode} />} />
                            <Route path="/settings/chromakey" element={<Chromakey />} />
                          </Routes>
                          {showPopup && <PrinterPopup  onClose={() => setShowPopup(false)} loading={loading}/>}

                          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
                        </>
                      </CheckLicense>
                    }
                />
              </Routes>
            </Suspense>
          </Router>
        </>
      )
};
