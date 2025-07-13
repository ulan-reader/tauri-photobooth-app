import React, { useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text } from 'react-konva';
import useImage from 'use-image';

// Компонент для рендера изображения по src
function PhotoSlot({ src, ...props }) {
  const [image] = useImage(src);
  return <KonvaImage image={image} {...props} />;
}

// Пример шаблона с фото-слотами
export default function PhotoTemplateKonvaDemo() {
  // Массив объектов макета (фигуры и фото-слоты)
  const [objects, setObjects] = useState([
    {
      id: 1,
      type: 'rect',
      left: 50,
      top: 50,
      width: 300,
      height: 400,
      fill: '#e0e0e0',
    },
    {
      id: 2,
      type: 'image',
      left: 80,
      top: 80,
      width: 240,
      height: 320,
      numberImage: 1,
      src: '', // Фото будет подставлено позже
    },
    {
      id: 3,
      type: 'rect',
      left: 400,
      top: 50,
      width: 300,
      height: 400,
      fill: '#e0e0e0',
    },
    {
      id: 4,
      type: 'image',
      left: 430,
      top: 80,
      width: 240,
      height: 320,
      numberImage: 2,
      src: '',
    },
    {
      id: 5,
      type: 'text',
      left: 50,
      top: 470,
      text: 'Ваш шаблон',
      fontSize: 32,
      fill: '#333',
    },
  ]);

  // Функция для подстановки фото в слот по номеру
  const handleSetPhoto = (e, numberImage) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setObjects((prev) =>
        prev.map((obj) =>
          obj.type === 'image' && obj.numberImage === numberImage
            ? { ...obj, src: event.target.result }
            : obj
        )
      );
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', gap: 32 }}>
      <div>
        {/* Кнопки для загрузки фото в каждый слот */}
        <div style={{ marginBottom: 16 }}>
          <label>
            Фото 1:
            <input type="file" accept="image/*" onChange={(e) => handleSetPhoto(e, 1)} />
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>
            Фото 2:
            <input type="file" accept="image/*" onChange={(e) => handleSetPhoto(e, 2)} />
          </label>
        </div>
        <Stage width={800} height={600} style={{ border: '1px solid #ccc', background: '#fafafa' }}>
          <Layer>
            {objects.map((obj) => {
              if (obj.type === 'rect') {
                return (
                  <Rect
                    key={obj.id}
                    x={obj.left}
                    y={obj.top}
                    width={obj.width}
                    height={obj.height}
                    fill={obj.fill}
                  />
                );
              }
              if (obj.type === 'image') {
                return (
                  <PhotoSlot
                    key={obj.id}
                    src={obj.src}
                    x={obj.left}
                    y={obj.top}
                    width={obj.width}
                    height={obj.height}
                  />
                );
              }
              if (obj.type === 'text') {
                return (
                  <Text
                    key={obj.id}
                    x={obj.left}
                    y={obj.top}
                    text={obj.text}
                    fontSize={obj.fontSize}
                    fill={obj.fill}
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>
      <div style={{ maxWidth: 300 }}>
        <h3>Инструкция / Instruction</h3>
        <ol>
          <li>Нажмите "Фото 1" или "Фото 2" и выберите изображение.</li>
          <li>Фото появится в соответствующем слоте макета.</li>
          <li>Можно расширять: добавлять больше слотов, фигур, текста и т.д.</li>
        </ol>
        <p>Вся логика динамической подстановки фото реализуется через numberImage и src.</p>
        <p>All logic for dynamic photo slotting is handled via numberImage and src.</p>
      </div>
    </div>
  );
} 