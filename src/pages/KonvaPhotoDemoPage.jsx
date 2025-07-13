import React from 'react';
import PhotoTemplateKonvaDemo from '../components/PhotoTemplateKonvaDemo';

// Пример страницы для демонстрации работы react-konva с фото-слотами
// Example page for demoing react-konva photo slots
export default function KonvaPhotoDemoPage() {
  return (
    <div style={{ padding: 32 }}>
      <h2>Демо: Макет с фото-слотами на react-konva</h2>
      <PhotoTemplateKonvaDemo />
    </div>
  );
} 