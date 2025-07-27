import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import back_img_2 from '../assets/defaultImage_2.png'; // Фоновое изображение
import back_img from '../assets/template_default_image.jpg'; // Фоновое изображение
// import back_img_3 from '../assets/defaultImage_3.png'; // Фоновое изображение
// import back_img_4 from '../assets/defaultImage_4.png'; // Фоновое изображение
import { background } from '@chakra-ui/react';

const updateCanvasProperty = (canvasId, propertyUpdates) => set((state) => ({
  canvases: state.canvases.map((canvas) =>
      canvas.id === canvasId
          ? { ...canvas, ...propertyUpdates }
          : canvas
  ),
}));

export const useStore = create(devtools((set) => ({

  background_image_1: `url(${back_img})`,
  background_image_2: `url(${back_img_2})`,
  background_image_3: `url(${back_img_2})`,
  background_image_4: `url(${back_img_2})`,

  setBackgroundImage: (key, image_state, path) => {
      localStorage.setItem(key, path != null ? path : back_img);
      set({ [image_state]: path != null ? path : back_img });
  },

  resetBackgrounds: () => {
    const defaultPaths = {
      background_image_1: back_img,
      background_image_2: back_img_2,
      background_image_3: back_img,
      background_image_4: back_img
    };
    
    Object.keys(defaultPaths).forEach((key) => {
      localStorage.removeItem(key);
    });
    
    set({
      background_image_1: defaultPaths.background_image_1,
      background_image_2: defaultPaths.background_image_2,
      background_image_3: defaultPaths.background_image_3,
      background_image_4: defaultPaths.background_image_4,
    });
  },  
  
  settings_qr_image: null,

  setQRImage: (key, image_state, path) => {
    localStorage.setItem(key, path != null ? path : back_img);
    set({ [image_state]: path != null ? path : back_img });
  },

  license: localStorage.getItem("license") === "true",

  setLicense: (value) => {
    localStorage.setItem("license", value ? "true" : "false");
    set({ license: value });
  },

  camera: {
    isCameraOn: false,
    isLiveView: false,
    counterCapturePhoto: 3,
    payment_enabled: false,
    toggleAutofocus: false,
  },

  setCamera: (updates) => set((state) => ({ camera: { ...state.camera, ...updates } })),

  
  reference: {
    imgObject: '',
    src: back_img || '',
    isEnabled: false,
  },

  setReferences: (updates) => set((state) => ({ reference: { ...state.reference, ...updates }})),


  chromokey: {
    isEnabled: false,
    color: '#00ff00',
    backgroundImage: {
      imgObject: '',
      src: back_img,
    },
    printer_visible: false
  },

  setChromokey: (updates) => set((state) => ({ chromokey: { ...state.chromokey, ...updates } })),


  project: {
    isCurrent: true,
    updateStatus: false,
    name: ''
  },

  setProject: (updates) => set((state) => ({ project: { ...state.project, ...updates } })),

  canvases: [
    {
      id: 1,
      canvasProps: {
        name: 'Canvas 1',
        available: true,
        dottedLine: false,
        backgroundColor: '#0000ff',
        width: 1200,
        height: 1800,
        webpData: null
      },
      objects: [
        {
          id: 1,
          nameObject: 'Фото 1',
          type: 'image',
          numberImage: 1,
          left: 44,
          top: 79,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 2,
          nameObject: 'Фото 2',
          type: 'image',
          numberImage: 1,
          left: 643,
          top: 79,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 3,
          nameObject: 'Фото 3',
          type: 'image',
          numberImage: 2,
          left: 44,
          top: 517,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 4,
          nameObject: 'Фото 4',
          type: 'image',
          numberImage: 2,
          left: 643,
          top: 517,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 5,
          nameObject: 'Фото 5',
          type: 'image',
          numberImage: 3,
          left: 44,
          top: 965,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 6,
          nameObject: 'Фото 6',
          type: 'image',
          numberImage: 3,
          left: 643,
          top: 965,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        }
      ],
    },
    {
      id: 2,
      canvasProps: {
        name: 'Canvas 2',
        available: true,
        dottedLine: true,
        backgroundColor: '#ffff00',
        width: 1200,
        height: 1800,
      },
      objects: [
        {
          id: 1,
          nameobject: 'Фото 1',
          type: 'image',
          numberImage: 1,
          left: 44,
          top: 79,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 2,
          nameobject: 'Фото 2',
          type: 'image',
          numberImage: 1,
          left: 643,
          top: 79,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 3,
          nameobject: 'Фото 3',
          type: 'image',
          numberImage: 2,
          left: 44,
          top: 517,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 4,
          nameobject: 'Фото 4',
          type: 'image',
          numberImage: 2,
          left: 643,
          top: 517,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 5,
          nameobject: 'Фото 5',
          type: 'image',
          numberImage: 3,
          left: 44,
          top: 965,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 6,
          nameobject: 'Фото 6',
          type: 'image',
          numberImage: 3,
          left: 643,
          top: 965,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        }
      ],
    },
    {
      id: 3,
      canvasProps: {
        name: 'Canvas 3',
        available: true,
        dottedLine: false,
        backgroundColor: '#ff0000',
        width: 1200,
        height: 1800,
      },
      objects: [
        {
          id: 1,
          nameobject: 'Фото 1',
          type: 'image',
          numberImage: 1,
          left: 44,
          top: 79,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 2,
          nameobject: 'Фото 2',
          type: 'image',
          numberImage: 1,
          left: 643,
          top: 79,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 3,
          nameobject: 'Фото 3',
          type: 'image',
          numberImage: 2,
          left: 44,
          top: 517,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 4,
          nameobject: 'Фото 4',
          type: 'image',
          numberImage: 2,
          left: 643,
          top: 517,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 5,
          nameobject: 'Фото 5',
          type: 'image',
          numberImage: 3,
          left: 44,
          top: 965,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
        {
          id: 6,
          nameobject: 'Фото 6',
          type: 'image',
          numberImage: 3,
          left: 643,
          top: 965,
          width: 513,
          height: 411,
          // fill: '', // Прозрачный фон для фото-заглушки
          src: '', // Здесь будет ссылка на фото, которая появится после съемки
          zIndex: 3,
          stroke: '#000000',
          strokeWidth: 0,
          rotate: 0,
          opacity: 1,
          shadowColor: '#000000',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        }
      ],
    },
  ],

  error: null,  // Новое состояние для ошибок

  setError: (message) => set({ error: message }),  // Функция для обновления ошибки

  currentCanvasId: 1,

  // Switch between different canvases
  switchCanvas: (canvasId) => set(() => ({
    currentCanvasId: canvasId,
  })),

  setCanvasProps: (canvasId, propertyUpdates) => set((state) => ({
    canvases: state.canvases.map((canvas) =>
      canvas.id === canvasId
        ? {
            ...canvas,
            canvasProps: {
              ...canvas.canvasProps,
              ...propertyUpdates
            }
          }
        : canvas
    ),
  })),

  setCanvasData: (newCanvases) => set({ canvases: newCanvases }),

  // Add new canvas
  addCanvas: () => set((state) => ({
    canvases: [
      ...state.canvases,
      {
        id: Date.now(),
        canvasProps: {
          name: 'New Canvas',
          available: false,
          backgroundColor: '#ffffff',
          width: 1200,
          height: 1800,
        },
        objects: [
          {
            id: 1,
            nameObject: 'Фото 1',
            type: 'image',
            numberImage: 1,
            left: 44,
            top: 79,
            width: 513,
            height: 411,
            // fill: '', // Прозрачный фон для фото-заглушки
            src: '', // Здесь будет ссылка на фото, которая появится после съемки
            zIndex: 1,
            stroke: '#000000',
            strokeWidth: 1,
            rotate: 0,
            opacity: 1,
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
          {
            id: 2,
            nameObject: 'Фото 2',
            type: 'image',
            numberImage: 1,
            left: 643,
            top: 79,
            width: 513,
            height: 411,
            // fill: '', // Прозрачный фон для фото-заглушки
            src: '', // Здесь будет ссылка на фото, которая появится после съемки
            zIndex: 1,
            stroke: '#000000',
            strokeWidth: 1,
            rotate: 0,
            opacity: 1,
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
          {
            id: 3,
            nameObject: 'Фото 3',
            type: 'image',
            numberImage: 2,
            left: 44,
            top: 517,
            width: 513,
            height: 411,
            // fill: '', // Прозрачный фон для фото-заглушки
            src: '', // Здесь будет ссылка на фото, которая появится после съемки
            zIndex: 1,
            stroke: '#000000',
            strokeWidth: 1,
            rotate: 0,
            opacity: 1,
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
          {
            id: 4,
            nameObject: 'Фото 4',
            type: 'image',
            numberImage: 2,
            left: 643,
            top: 517,
            width: 513,
            height: 411,
            // fill: '', // Прозрачный фон для фото-заглушки
            src: '', // Здесь будет ссылка на фото, которая появится после съемки
            zIndex: 1,
            stroke: '#000000',
            strokeWidth: 1,
            rotate: 0,
            opacity: 1,
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
          {
            id: 5,
            nameObject: 'Фото 5',
            type: 'image',
            numberImage: 3,
            left: 44,
            top: 965,
            width: 513,
            height: 411,
            // fill: '', // Прозрачный фон для фото-заглушки
            src: '', // Здесь будет ссылка на фото, которая появится после съемки
            zIndex: 1,
            stroke: '#000000',
            strokeWidth: 1,
            rotate: 0,
            opacity: 1,
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
          {
            id: 6,
            nameObject: 'Фото 6',
            type: 'image',
            numberImage: 3,
            left: 643,
            top: 965,
            width: 513,
            height: 411,
            // fill: '', // Прозрачный фон для фото-заглушки
            src: '', // Здесь будет ссылка на фото, которая появится после съемки
            zIndex: 1,
            stroke: '#000000',
            strokeWidth: 1,
            rotate: 0,
            opacity: 1,
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          }
        ],
      },
    ],
  })),

  addCanvasFromTemplate: (canvas) => set((state) => ({
    canvases: [...state.canvases, canvas]
  })),

  // Remove canvas
  removeCanvas: (canvasId) => set((state) => ({
    canvases: state.canvases.filter(canvas => canvas.id !== canvasId),
    // Убедись, что currentCanvasId обновляется, если удален текущий холст
    currentCanvasId: state.currentCanvasId === canvasId ? state.canvases[0]?.id : state.currentCanvasId,
  })),


  // Add different types of shapes or images
  addObject: (canvasId, newObject) => set((state) => ({
    canvases: state.canvases.map((canvas) =>
      canvas.id === canvasId
        ? {
            ...canvas,
            objects: [...canvas.objects, newObject],
          }
        : canvas
    ),
  })),

  // Remove objects (shapes, images)
  removeObject: (canvasId, objectId) => set((state) => ({
    canvases: state.canvases.map((canvas) =>
      canvas.id === canvasId
        ? {
            ...canvas,
            objects: canvas.objects.filter((obj) => obj.id !== objectId),
          }
        : canvas
    ),
  })),

  // Update object properties
  updateObjectProps: (canvasId, objectId, newProps) => set((state) => {
    return {
      canvases: state.canvases.map((canvas) => {
        if (canvas.id !== canvasId) {
          return canvas;
        }

        const updatedObjects = canvas.objects.map((obj) => {
          if (obj.id !== objectId) {
            return obj;
          }

          return { ...obj, ...newProps };
        });

        return { ...canvas, objects: updatedObjects };
      }),
    };
  }),

  // Move images from gallery to canvas
  addImageToCanvas: (canvasId, imageSrc) => set((state) => ({
    canvases: state.canvases.map((canvas) =>
        canvas.id === canvasId
            ? {
                ...canvas,
                objects: [
                    ...canvas.objects,
                    {
                        id: Date.now(), // Уникальный ID для нового объекта
                        nameObject: 'Image', // Название объекта
                        type: 'image',
                        imageSrc: imageSrc,
                        x: 0, // Начальные координаты по X
                        y: 0, // Начальные координаты по Y
                        width: 100, // Ширина изображения
                        height: 100, // Высота изображения
                        rotate: 0, // Угол поворота
                        opacity: 1, // Прозрачность
                    },
                ],
            }
            : canvas
    ),
})),

  // Resize canvas dimensions
  resizeCanvas: (canvasId, width, height) => set((state) => ({
    canvases: state.canvases.map((canvas) =>
      canvas.id === canvasId
        ? {
            ...canvas,
            canvasProps: {
              ...canvas.canvasProps,
              width: Math.max(100, width), // Minimum width
              height: Math.max(100, height), // Minimum height
            },
          }
        : canvas
    ),
  })),

  // Set aspect ratio
  setAspectRatio: (canvasId, ratio) => set((state) => {
    let newWidth, newHeight;

    switch (ratio) {
      case '1:1':
        newWidth = state.canvases.find(c => c.id === canvasId).canvasProps.height;
        newHeight = newWidth; // Square
        break;
      case '4:6':
        newHeight = state.canvases.find(c => c.id === canvasId).canvasProps.width * 0.75;
        newWidth = state.canvases.find(c => c.id === canvasId).canvasProps.width; // 4:6 ratio
        break;
      default:
        return;
    }

    return {
      canvases: state.canvases.map((canvas) =>
        canvas.id === canvasId
          ? {
              ...canvas,
              canvasProps: {
                ...canvas.canvasProps,
                width: newWidth,
                height: newHeight,
              },
            }
          : canvas
      ),
    };
  }),

})));
