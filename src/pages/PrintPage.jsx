import React, { useRef, useState } from 'react';
import { invoke, convertFileSrc } from "@tauri-apps/api/tauri"
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, NavLink } from 'react-router-dom';
// import lev from "../components/images_for_template/левое.png";
// import pre from "../components/images_for_template/правое.png";
// import left_word from "../components/images_for_template/word_left.png";
// import right_word from "../components/images_for_template/word_right.png";
// import rulSrc from "../components/images_for_template/rule.png";
import printer from "../assets/printer.png";
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import back_img from '../assets/defaultImage.jpeg';
// import { drawMyCanvas } from '../components/CanvasDrawer';
import { useStore } from '../admin/store.js';
import KonvaCanvas from '../components/KonvaCanvas';
import { Settings } from "lucide-react"

export default function PrintPage({ images, design, setDesign }) {
  const { canvases, currentCanvasId, switchCanvas, updateObjectProps, setCamera, chromokey, reference } = useStore();
  const currentCanvas = canvases.find(canvas => canvas.id === currentCanvasId);
  usePageNavigation();
  const stageRef = useRef();
  const navigate = useNavigate();
  const [isImage, setIsImage] = useState(null);
  const [copies, setCopies] = useState(1); // Количество копий

  // Очистка фото в объектах (через Zustand)
  const garbedCanvas = (currentCanvas) => {
    currentCanvas.objects.forEach(object => {
      if (object.type === 'image' && object.numberImage) {
        updateObjectProps(currentCanvasId, object.id, { src: '' });
      }
    });
  };

  // Перед печатью убираем flipX у всех image-объектов (чтобы не было зеркально)
  const getUnflippedObjects = () => {
    return currentCanvas.objects.map(obj => {
      if (obj.type === 'image' && obj.flipX) {
        return { ...obj, flipX: false };
      }
      return obj;
    });
  };

  const handlePrint = async () => {
    if (stageRef.current) {
      garbedCanvas(currentCanvas);
      // Временно рендерим с убранным flipX
      const objectsForPrint = getUnflippedObjects();
      // Рендерим временный KonvaCanvas для экспорта
      // (stageRef.current уже содержит нужный canvas, если flipX не используется в редакторе)
      // Если flipX используется в редакторе, нужно создать временный Stage
      // Для простоты: если flipX не используется, просто экспортируем
      const imageData = stageRef.current.toDataURL();
      const imageBase64 = imageData.replace(/^data:image\/(png|jpg);base64,/, '');
      setIsImage(imageBase64);
      toast.done('Printing...', { type: 'info' });
      await invoke('print_image', { imageData: imageBase64, width: Number(currentCanvas.canvasProps.width), height: Number(currentCanvas.canvasProps.height), copies });
      setDesign(true);
      switchCanvas(1);
      navigate('/')
    } else {
      toast.error('No image available for printing', { type: 'warning' });
    }
  };

  const backPage = async () => {
    garbedCanvas(currentCanvas);
    navigate('/capture');
    await invoke('start_live_view');
    setCamera({ isLiveView: true });
  }

  // Масштаб предпросмотра
  const maxPreviewWidth = 350;
  const maxPreviewHeight = 475;
  let canvasWidth = currentCanvas?.canvasProps?.width || 1200;
  let canvasHeight = currentCanvas?.canvasProps?.height || 1800;
  // Ограничение минимального и максимального размера холста
  if (canvasWidth > 2000) canvasWidth = 2000;
  if (canvasHeight > 2000) canvasHeight = 2000;
  if (canvasWidth < 200) canvasWidth = 200;
  if (canvasHeight < 200) canvasHeight = 200;
  const scale = Math.min(
    maxPreviewWidth / canvasWidth,
    maxPreviewHeight / canvasHeight,
    1
  );
  const previewWidth = Math.round(canvasWidth * scale);
  const previewHeight = Math.round(canvasHeight * scale);

  return (
    <>
      <div className="flex justify-center items-center">
        <div className="select-none relative bg-cover bg-center bg-no-repeat" style={{width: '1280px', height: '1024px', backgroundImage: `url(${back_img})`}}>
          <div className='back-img'></div>
          <div className='absolute top-0 left-0 w-full h-full flex justify-center items-center text-white text-2xl z-10'>
            <div className="w-full flex flex-col gap-9 justify-center items-center px-20">
              <NavLink to='/settings' className="absolute left-10 top-10 z-10 opacity-0 hover:opacity-100">
                  <Settings size={30} /> {/* Отображаем иконку шестеренки */}
              </NavLink>
              <div className='flex flex-col gap-3'>
                {/* <button className='h-9 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg border-white bg-blue-900' style={{ visibility: 'hidden' }}>
                  <img className='w-5 transform -scale-x-100' src={templateTriangle} alt="Back" /> НАЗАД
                </button> */}
                <div className='grid grid-cols-3 items-center'>
                  <div className='w-28'></div>
                  <div className='relative items-center box_print' style={{width: '400px' }}>
                    <div className='bg_print' ></div>
                    <div>
                      <div  className='absolute bottom-1 left-0 w-full h-full flex gap-10 justify-center items-center z-10'>
                        <div style={{ width: previewWidth, height: previewHeight, display: 'block' }}>
                          <KonvaCanvas
                            ref={stageRef}
                            width={canvasWidth}
                            height={canvasHeight}
                            scale={scale}
                            objects={currentCanvas.objects}
                            selectedId={null}
                            onSelect={() => {}}
                            onChange={() => {}}
                            onStageClick={() => {}}
                            backgroundColor={currentCanvas?.canvasProps?.backgroundColor}
                            chromokey={chromokey}
                            reference={reference}
                            showDottedLine={currentCanvas?.canvasProps?.dottedLine}
                            editable={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className='h-4 flex justify-center items-center rounded-lg' onClick={handlePrint}><img className='rounded-lg w-36 ml-28' src={printer} alt="" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}