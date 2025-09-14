import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import MainPage from './pages/MainPage.jsx';
import TemplatePage from './pages/TemplatePage.jsx';
import CapturePage from './pages/CapturePage.jsx';
import PrintPage from './pages/PrintPage.jsx';

import Settings from './admin/Settings.jsx';
import Touchscreen from './admin/TouchScreen.jsx';
import PrinterInfo from './admin/Printer.jsx';
import TemplateEditor from './admin/TemplateEditor.jsx';
import Timer from './admin/Timer.jsx';
import Editor from './admin/Editor.jsx';
import Chromakey from './admin/ChromaKey.jsx';
import PrinterPopup from './components/PrinterPopup.jsx';
import ListPage from './pages/ListPage.jsx';
import CheckLicensePage from './pages/CheckLicensePage.jsx';
import { useStore } from './admin/store.js';
import PaymentPage from './pages/PaymentPage.jsx';
import PaymentFailed from './pages/PaymentFailed.jsx';

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

                      </>
                    </CheckLicense>
                  }
              />
            </Routes>
          </Router>
        </>
      )
};
