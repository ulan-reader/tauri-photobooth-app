import React, { useRef, useEffect, useState } from 'react';
import { invoke, convertFileSrc } from "@tauri-apps/api/tauri"
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import bg_screen from "../components/images_for_template/Макет.png";
import templateTriangle from '../assets/templateTriangle.png';
import { useNavigate, NavLink } from 'react-router-dom';
import lev from "../components/images_for_template/левое.png";
import pre from "../components/images_for_template/правое.png";
import left_word from "../components/images_for_template/word_left.png";
import right_word from "../components/images_for_template/word_right.png";
import rulSrc from "../components/images_for_template/rule.png";
import printer from "../assets/printer.png";
import { usePageNavigation } from '../hooks/usePageNavigation.js';
import back_img from '../assets/defaultImage_2.png';
import { drawMyCanvas } from '../components/CanvasDrawer';
import { useStore } from '../admin/store.js';
import { Settings } from "lucide-react"

// import test_image_1 from '../image_beta/IMG_6700.JPG';
// import test_image_2 from '../image_beta/IMG_7107.JPG';
// import test_image_3 from '../image_beta/IMG_7111.JPG';

export default function PrintPage({ images, design, setDesign }) {
  // const [bgImage, setBgImage] = useState(localStorage.getItem("back_4") || `url(${back_img})`);
  const { canvases, currentCanvasId, switchCanvas, updateObjectProps, setCamera, chromokey, reference, background_image_4 } = useStore();
  const currentCanvas = canvases.find(canvas => canvas.id === currentCanvasId);
  usePageNavigation();
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [ isImage, setIsImage ] = useState(null);
  // const imgES = [test_image_1, test_image_2, test_image_3];

  // useEffect(() => {
  //     const fetchImage = async () => {
  //         try {
  //             const image = await invoke('get_image_path', { path: `background/4_background` })
  //             const url_image = `url(${convertFileSrc(image)})`;
  //             setBgImage(url_image);
  //             if (image && image.trim() !== "") {
  //                 setBgImage(url_image);
  //                 localStorage.setItem("back_4", url_image);
  //             } else {
  //                 throw new Error("Изображение не найдено");
  //             }
  //         } catch (err) {
  //             localStorage.removeItem("back_4");
  //             setBgImage(`url(${back_img})`);
  //             console.log(err);
  //         }
  //     };

  //     fetchImage();
  // },[]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawMyCanvas(ctx, canvas, currentCanvas, false, chromokey.isEnabled ? chromokey.backgroundImage : reference, chromokey.isEnabled, !design);
      drawMyCanvas(ctx, canvas, currentCanvas, false, chromokey.isEnabled ? chromokey.backgroundImage : reference, chromokey.isEnabled, !design);

      // Второй вызов отрисовки через небольшой промежchromokey.isEnabled ? chromokey.backgroundImage : reference
      const timeoutId = setTimeout(() => {
        drawMyCanvas(ctx, canvas, currentCanvas, false, chromokey.isEnabled ? chromokey.backgroundImage : reference, chromokey.isEnabled, !design);
      }, 500); // Задержка в 50 миллисекунд (можно варьировать)
      // Очистка таймера, если компонент размонтируется
      const imageData = canvas.toDataURL('image/png');
      setIsImage(imageData);
      return () => {
        clearTimeout(timeoutId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        garbedCanvas(currentCanvas);
      };
    }
  }, [images, design]);

  const garbedCanvas = (currentCanvas) => {
    // const uniqueSortedNumbers = Array.from(
    //       new Set(
    //           currentCanvas.objects
    //               .filter(obj => obj.type === 'image')
    //               .map(obj => obj.numberImage)
    //       )
    //   ).sort((a, b) => a - b);

    //   // 2. Получаем целевой номер, соответствующий images.count
    //   const targetNumber = uniqueSortedNumbers[images.length];
    //   console.log('Target number:', targetNumber);

    //   if (targetNumber === undefined) return;
      
    currentCanvas.objects.forEach(object => {
      if (object.type === 'image' && object.numberImage) {
          updateObjectProps(currentCanvasId, object.id, { imgObject: null, src: '' });
      }
    });
  }

  const handlePrint = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      garbedCanvas(currentCanvas);
      
      let canvasWidth = currentCanvas.canvasProps.width;
      let canvasHeight = currentCanvas.canvasProps.height;
      
      const imageData = canvasRef.current.toDataURL('image/png');
      const imageBase64 = imageData.replace(/^data:image\/(png|jpg);base64,/, '');
      setIsImage(imageBase64);
      toast.done('Printing...', { type: 'info' });
      await invoke('print_image', { imageData: imageBase64, width: Number(canvasWidth), height: Number(canvasHeight) });
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

  return (
    <div className="flex justify-center items-center">
      <div className="select-none relative bg-cover bg-center bg-no-repeat" style={{width: '1280px', height: '1024px', backgroundImage: background_image_4}}>
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
                      <canvas
                        ref={canvasRef}
                        width={currentCanvas.canvasProps.width}
                        height={currentCanvas.canvasProps.height}
                        style={{ maxWidth: '580px', maxHeight: '700px', display: 'block'}}
                      ></canvas>
                    </div>
                  </div>
                </div>
                <button className='h-4 flex justify-center items-center rounded-lg' onClick={handlePrint}><img className='rounded-lg w-36 ml-28' src={printer} alt="" /></button>
              </div>
            </div>
            {/* <div className=' flex justify-start items-center w-full'>
              <button className='w-36 h-20 flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-lg border-white bg-blue-900' onClick={backPage}>
                <img className='w-5 transform -scale-x-100' src={templateTriangle} alt="Back" /> НАЗАД
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}