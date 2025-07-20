// import React, { useRef, useEffect, forwardRef } from 'react';
// import { Stage, Layer, Rect, Circle, Star, RegularPolygon, Line, Image as KonvaImage, Transformer, Group, Text } from 'react-konva';
// import useImage from 'use-image';

// function URLImage({ src, flipX = false, ...props }) {
//   const [image] = useImage(src, 'anonymous');
//   return <KonvaImage image={image} scaleX={flipX ? -1 : 1} x={flipX ? (props.x || 0) + (props.width || 0) : props.x} {...props} />;
// }

// // Цвета для номеров 1-10
// const numberColors = [
//   '#FF3B30', // 1 - красный
//   '#007AFF', // 2 - синий
//   '#34C759', // 3 - зелёный
//   '#FF9500', // 4 - оранжевый
//   '#AF52DE', // 5 - фиолетовый
//   '#FFCC00', // 6 - жёлтый
//   '#5AC8FA', // 7 - голубой
//   '#FF2D55', // 8 - розовый
//   '#5856D6', // 9 - индиго
//   '#4CD964', // 10 - лаймовый
// ];

// function getContrastYIQ(hexcolor) {
//   // Определяет, какой цвет текста лучше на данном фоне (белый или черный)
//   hexcolor = hexcolor.replace('#', '');
//   const r = parseInt(hexcolor.substr(0,2),16);
//   const g = parseInt(hexcolor.substr(2,2),16);
//   const b = parseInt(hexcolor.substr(4,2),16);
//   const yiq = ((r*299)+(g*587)+(b*114))/1000;
//   return (yiq >= 128) ? '#000' : '#fff';
// }

// const KonvaCanvas = forwardRef(function KonvaCanvas({
//   width,
//   height,
//   objects,
//   selectedId,
//   onSelect,
//   onChange,
//   onStageClick,
//   backgroundColor = '#222', // по умолчанию тёмный фон
//   chromokey,
//   reference,
//   showDottedLine = false,
//   scale = 1,
//   stageRef, // не нужен, ref теперь через forwardRef
//   editable = true
// }, ref) {
//   const trRef = useRef();
//   const layerRef = useRef();

//   useEffect(() => {
//     if (trRef.current && selectedId) {
//       // Transformer применяется к Group (или Rect/Image), у которых id совпадает с selectedId
//       const node = layerRef.current.findOne(`#object-${selectedId}`);
//       if (node) {
//         trRef.current.nodes([node]);
//         trRef.current.getLayer().batchDraw();
//       }
//     }
//   }, [selectedId, objects]);

//   // Dotted center lines
//   const DottedLines = () => (
//     <>
//       <Line
//         points={[width / 2, 0, width / 2, height]}
//         stroke="rgba(200,200,200,0.3)"
//         strokeWidth={2}
//         dash={[20, 10]}
//       />
//       <Line
//         points={[0, height / 2, width, height / 2]}
//         stroke="rgba(200,200,200,0.3)"
//         strokeWidth={2}
//         dash={[20, 10]}
//       />
//     </>
//   );

//   // Сортировка по zIndex
//   const sortedObjects = [...objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

//   return (
//     <Stage
//       width={width}
//       height={height}
//       scaleX={scale}
//       scaleY={scale}
//       onMouseDown={onStageClick}
//       ref={ref}
//       style={{ background: backgroundColor, borderRadius: 12, boxShadow: '0 0 8px #111', border: '2px solid #333' }}
//     >
//       <Layer ref={layerRef}>
//         {showDottedLine && <DottedLines />}
//         {sortedObjects.map((obj) => {
//           // --- Группа: цветной квадрат с номером/фото ---
//           if (
//             obj.numberImage &&
//             obj.numberImage >= 1 &&
//             obj.numberImage <= 10
//           ) {
//             const color = numberColors[obj.numberImage - 1];
//             // Если есть src (фото) — показываем фото, иначе цветной квадрат с номером
//             // Центрируем номер по вертикали и горизонтали
//             const fontSize = Math.min(obj.width, obj.height) * 0.6;
//             const textColor = getContrastYIQ(color);
//             return (
//               <Group
//                 key={obj.id}
//                 id={`object-${obj.id}`}
//                 x={obj.left}
//                 y={obj.top}
//                 width={obj.width}
//                 height={obj.height}
//                 rotation={obj.rotate || 0}
//                 opacity={obj.opacity}
//                 draggable={editable}
//                 onClick={editable ? (e) => { e.cancelBubble = true; onSelect(obj.id); } : undefined}
//                 onTap={editable ? (e) => { e.cancelBubble = true; onSelect(obj.id); } : undefined}
//                 onDragEnd={editable ? (e) => onChange(obj.id, { left: e.target.x(), top: e.target.y() }) : undefined}
//                 onTransformEnd={editable ? (e) => {
//                   const node = e.target;
//                   const scaleX = node.scaleX();
//                   const scaleY = node.scaleY();
//                   node.scaleX(1);
//                   node.scaleY(1);
//                   onChange(obj.id, {
//                     left: node.x(),
//                     top: node.y(),
//                     width: Math.max(5, node.width() * scaleX),
//                     height: Math.max(5, node.height() * scaleY),
//                     rotate: node.rotation(),
//                   });
//                 } : undefined}
//               >
//                 {/* Rect, Image, Text всегда строго по width/height (0,0) */}
//                 <Rect
//                   x={0}
//                   y={0}
//                   width={obj.width}
//                   height={obj.height}
//                   fill={color}
//                   stroke={obj.stroke || '#444'}
//                   strokeWidth={obj.strokeWidth || 2}
//                   shadowColor={obj.shadowColor || '#111'}
//                   shadowBlur={obj.shadowBlur || 4}
//                   shadowOffsetX={obj.shadowOffsetX || 0}
//                   shadowOffsetY={obj.shadowOffsetY || 0}
//                   cornerRadius={10}
//                 />
//                 {/* Фото, если есть src */}
//                 {obj.src ? (
//                   <URLImage
//                     key={obj.id}
//                     src={obj.src}
//                     x={0}
//                     y={0}
//                     width={obj.width}
//                     height={obj.height}
//                     flipX={!!obj.flipX}
//                   />
//                 ) : (
//                   <Text
//                     text={String(obj.numberImage)}
//                     fontSize={fontSize}
//                     fill={textColor}
//                     fontStyle="bold"
//                     align="center"
//                     verticalAlign="middle"
//                     width={obj.width}
//                     height={obj.height}
//                     x={0}
//                     y={0}
//                   />
//                 )}
//               </Group>
//             );
//           }
//           // Остальные типы объектов
//           const commonProps = {
//             key: obj.id,
//             id: `object-${obj.id}`,
//             x: obj.left,
//             y: obj.top,
//             width: obj.width,
//             height: obj.height,
//             rotation: obj.rotate || 0,
//             opacity: obj.opacity,
//             draggable: editable,
//             onClick: editable ? (e) => { e.cancelBubble = true; onSelect(obj.id); } : undefined,
//             onTap: editable ? (e) => { e.cancelBubble = true; onSelect(obj.id); } : undefined,
//             onDragEnd: editable ? (e) => onChange(obj.id, { left: e.target.x(), top: e.target.y() }) : undefined,
//             onTransformEnd: editable ? (e) => {
//               const node = e.target;
//               const scaleX = node.scaleX();
//               const scaleY = node.scaleY();
//               node.scaleX(1);
//               node.scaleY(1);
//               onChange(obj.id, {
//                 left: node.x(),
//                 top: node.y(),
//                 width: Math.max(5, node.width() * scaleX),
//                 height: Math.max(5, node.height() * scaleY),
//                 rotate: node.rotation(),
//               });
//             } : undefined,
//             stroke: obj.stroke || '#444',
//             strokeWidth: obj.strokeWidth || 2,
//             shadowColor: obj.shadowColor || '#111',
//             shadowBlur: obj.shadowBlur || 4,
//             shadowOffsetX: obj.shadowOffsetX || 0,
//             shadowOffsetY: obj.shadowOffsetY || 0,
//             fill: obj.fill || '#333',
//           };
//           switch (obj.type) {
//             case 'rectangle':
//               return <Rect {...commonProps} cornerRadius={10} />;
//             case 'circle':
//               return <Circle {...commonProps} radius={obj.width / 2} width={undefined} height={undefined} />;
//             case 'star':
//               return <Star {...commonProps} numPoints={obj.spikes || 5} innerRadius={obj.width / 4} outerRadius={obj.width / 2} width={undefined} height={undefined} />;
//             case 'polygon':
//               return <RegularPolygon {...commonProps} sides={obj.sides || 6} radius={obj.width / 2} width={undefined} height={undefined} />;
//             case 'triangle':
//               return <RegularPolygon {...commonProps} sides={3} radius={obj.width / 2} width={undefined} height={undefined} />;
//             case 'line':
//               return <Line {...commonProps} points={[0, obj.height / 2, obj.width, obj.height / 2]} />;
//             case 'image':
//               const { key, ...restProps } = commonProps;
//               return <URLImage key={obj.id} {...restProps} src={obj.src} flipX={!!obj.flipX} />;
//             default:
//               return null;
//           }
//         })}
//         {selectedId && editable && (
//           <Transformer
//             ref={trRef}
//             boundBoxFunc={(oldBox, newBox) => {
//               // limit resize
//               if (newBox.width < 5 || newBox.height < 5) {
//                 return oldBox;
//               }
//               return newBox;
//             }}
//             rotateEnabled={true}
//             enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
//           />
//         )}
//       </Layer>
//     </Stage>
//   );
// });

// export default KonvaCanvas; 


import React, { useRef, useEffect, forwardRef } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Star,
  RegularPolygon,
  Line,
  Image as KonvaImage,
  Transformer,
  Group,
  Text,
} from 'react-konva';
import useImage from 'use-image';

// Цвета и контраст
const numberColors = [
  '#FF3B30', // 1 - красный
  '#007AFF', // 2 - синий
  '#34C759', // 3 - зелёный
  '#FF9500', // 4 - оранжевый
  '#AF52DE', // 5 - фиолетовый
  '#FFCC00', // 6 - жёлтый
  '#5AC8FA', // 7 - голубой
  '#FF2D55', // 8 - розовый
  '#5856D6', // 9 - индиго
  '#4CD964', // 10 - лаймовый
];


function getContrastYIQ(hexcolor) {
  hexcolor = hexcolor.replace('#', '');
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000' : '#fff';
}

function URLImage({ src, flipX = false, ...props }) {
  const [image] = useImage(src, 'anonymous');
  return (
    <KonvaImage
      image={image}
      scaleX={flipX ? -1 : 1}
      x={flipX ? (props.x || 0) + (props.width || 0) : props.x}
      {...props}
    />
  );
}



// const KonvaCanvas = forwardRef(function KonvaCanvas(
//   {
//     width,
//     height,
//     objects,
//     selectedId,
//     onSelect,
//     onChange,
//     onStageClick,
//     backgroundColor = '#222',
//     chromokey,
//     reference,
//     showDottedLine = false,
//     scale = 1,
//     editable = true,
//   },
//   ref
// ) {
//   const trRef = useRef();
//   const layerRef = useRef();

//   useEffect(() => {
//     if (trRef.current && selectedId) {
//       const node = layerRef.current.findOne(`#object-${selectedId}`);
//       if (node) {
//         trRef.current.nodes([node]);
//         trRef.current.getLayer().batchDraw();
//       }
//     }
//   }, [selectedId, objects]);

//   const DottedLines = () => (
//     <>
//       <Line
//         points={[width / 2, 0, width / 2, height]}
//         stroke="rgba(200,200,200,0.3)"
//         strokeWidth={2}
//         dash={[20, 10]}
//       />
//       <Line
//         points={[0, height / 2, width, height / 2]}
//         stroke="rgba(200,200,200,0.3)"
//         strokeWidth={2}
//         dash={[20, 10]}
//       />
//     </>
//   );

//   const sortedObjects = [...objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

//   return (
//     <Stage
//       width={width}
//       height={height}
//       onMouseDown={onStageClick}
//       ref={ref}
//       style={{
//         background: backgroundColor,
//         transform: `scale(${scale})`,
//         transformOrigin: 'top left',
//         // borderRadius: 12,
//         // boxShadow: '0 0 8px #111',
//         // border: '2px solid #333',
//       }}
//     >
//       <Layer ref={layerRef}>
//         {/* Фон — фото reference */}
//         {reference && (
//           <URLImage src={reference} x={0} y={0} width={width} height={height} />
//         )}

//         {showDottedLine && <DottedLines />}

//         {sortedObjects.map((obj) => {
//           const commonProps = {
//             key: obj.id,
//             id: `object-${obj.id}`,
//             x: obj.left,
//             y: obj.top,
//             rotation: obj.rotate || 0,
//             opacity: obj.opacity,
//             draggable: editable,
//             onClick: editable ? (e) => { e.cancelBubble = true; onSelect(obj.id); } : undefined,
//             onTap: editable ? (e) => { e.cancelBubble = true; onSelect(obj.id); } : undefined,
//             onDragEnd: editable ? (e) => onChange(obj.id, { left: e.target.x(), top: e.target.y() }) : undefined,
//             onTransformEnd: editable ? (e) => {
//               const node = e.target;
//               const scaleX = node.scaleX();
//               const scaleY = node.scaleY();
//               node.scaleX(1);
//               node.scaleY(1);
//               onChange(obj.id, {
//                 left: node.x(),
//                 top: node.y(),
//                 width: Math.max(5, node.width() * scaleX),
//                 height: Math.max(5, node.height() * scaleY),
//                 rotate: node.rotation(),
//               });
//             } : undefined,
//             stroke: obj.stroke || '#444',
//             strokeWidth: obj.strokeWidth || 2,
//             shadowColor: obj.shadowColor || '#111',
//             shadowBlur: obj.shadowBlur || 4,
//             shadowOffsetX: obj.shadowOffsetX || 0,
//             shadowOffsetY: obj.shadowOffsetY || 0,
//             fill: obj.fill || '#333',
//           };

//           // Цветной номер
//           if (obj.numberImage >= 1 && obj.numberImage <= 10) {
//             const color = numberColors[obj.numberImage - 1];
//             const fontSize = Math.min(obj.width, obj.height) * 0.6;
//             const textColor = getContrastYIQ(color);

//             return (
//               <Group {...commonProps} width={obj.width} height={obj.height}>
//                 <Rect
//                   width={obj.width}
//                   height={obj.height}
//                   fill={color}
//                   stroke={obj.stroke || '#444'}
//                   strokeWidth={obj.strokeWidth || 2}
//                   shadowColor={obj.shadowColor || '#111'}
//                   shadowBlur={obj.shadowBlur || 4}
//                   shadowOffsetX={obj.shadowOffsetX || 0}
//                   shadowOffsetY={obj.shadowOffsetY || 0}
//                   cornerRadius={10}
//                 />
//                 {obj.src ? (
//                   <URLImage
//                     src={obj.src}
//                     x={0}
//                     y={0}
//                     width={obj.width}
//                     height={obj.height}
//                     flipX={!!obj.flipX}
//                   />
//                 ) : (
//                   <Text
//                     text={String(obj.numberImage)}
//                     fontSize={fontSize}
//                     fill={textColor}
//                     fontStyle="bold"
//                     align="center"
//                     verticalAlign="middle"
//                     width={obj.width}
//                     height={obj.height}
//                     x={0}
//                     y={0}
//                   />
//                 )}
//               </Group>
//             );
//           }

//           // Обычные фигуры
//           switch (obj.type) {
//             case 'rectangle':
//               return <Rect {...commonProps} width={obj.width} height={obj.height} cornerRadius={10} />;
//             case 'circle':
//               return <Circle {...commonProps} radius={obj.width / 2} />;
//             case 'star':
//               return (
//                 <Star
//                   {...commonProps}
//                   numPoints={obj.spikes || 5}
//                   innerRadius={obj.width / 4}
//                   outerRadius={obj.width / 2}
//                 />
//               );
//             case 'polygon':
//               return <RegularPolygon {...commonProps} sides={obj.sides || 6} radius={obj.width / 2} />;
//             case 'triangle':
//               return <RegularPolygon {...commonProps} sides={3} radius={obj.width / 2} />;
//             case 'line':
//               return <Line {...commonProps} points={[0, obj.height / 2, obj.width, obj.height / 2]} />;
//             case 'image':
//               return (
//                 <URLImage
//                   {...commonProps}
//                   width={obj.width}
//                   height={obj.height}
//                   src={obj.src}
//                   flipX={!!obj.flipX}
//                 />
//               );
//             default:
//               return null;
//           }
//         })}

//         {/* Трансформер */}
//         {selectedId && editable && (
//           <Transformer
//             ref={trRef}
//             boundBoxFunc={(oldBox, newBox) => {
//               if (newBox.width < 5 || newBox.height < 5) return oldBox;
//               return newBox;
//             }}
//             rotateEnabled
//             enabledAnchors={[
//               'top-left', 'top-right',
//               'bottom-left', 'bottom-right',
//               'middle-left', 'middle-right',
//               'top-center', 'bottom-center',
//             ]}
//           />
//         )}
//       </Layer>
//     </Stage>
//   );
// });

// export default KonvaCanvas;

const KonvaCanvas = forwardRef(function KonvaCanvas(
  {
    width,
    height,
    objects,
    selectedId,
    onSelect,
    onChange,
    onStageClick,
    backgroundColor = '#222',
    chromokey,
    reference,
    showDottedLine = false,
    scale = 1,
    editable = true,
    hideNumbers = false,               // 🔹 новое
    forceReferenceVisible = false,    // 🔹 новое
  },
  ref
) {
  const trRef = useRef();
  const layerRef = useRef();

  useEffect(() => {
    if (trRef.current && selectedId) {
      const node = layerRef.current.findOne(`#object-${selectedId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId, objects]);

  const DottedLines = () => (
    <>
      <Line
        points={[width / 2, 0, width / 2, height]}
        stroke="rgba(200,200,200,0.3)"
        strokeWidth={2}
        dash={[20, 10]}
      />
      <Line
        points={[0, height / 2, width, height / 2]}
        stroke="rgba(200,200,200,0.3)"
        strokeWidth={2}
        dash={[20, 10]}
      />
    </>
  );

  const sortedObjects = [...objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={onStageClick}
      ref={ref}
      style={{
        background: backgroundColor,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <Layer ref={layerRef}>
        {/* Reference (фон) */}
        {reference && (
          <URLImage src={reference?.src} x={0} y={0} width={width} height={height} />
        )}

        {showDottedLine && <DottedLines />}

        {sortedObjects.map((obj) => {
          const commonProps = {
            key: obj.id,
            id: `object-${obj.id}`,
            x: obj.left,
            y: obj.top,
            rotation: obj.rotate || 0,
            opacity: obj.opacity,
            draggable: editable,
            onClick: editable ? (e) => { e.cancelBubble = true; onSelect(obj.id); } : undefined,
            onTap: editable ? (e) => { e.cancelBubble = true; onSelect(obj.id); } : undefined,
            onDragEnd: editable ? (e) => onChange(obj.id, { left: e.target.x(), top: e.target.y() }) : undefined,
            onTransformEnd: editable ? (e) => {
              const node = e.target;
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              node.scaleX(1);
              node.scaleY(1);
              onChange(obj.id, {
                left: node.x(),
                top: node.y(),
                width: Math.max(5, node.width() * scaleX),
                height: Math.max(5, node.height() * scaleY),
                rotate: node.rotation(),
              });
            } : undefined,
            stroke: obj.stroke || '#444',
            strokeWidth: obj.strokeWidth || 2,
            shadowColor: obj.shadowColor || '#111',
            shadowBlur: obj.shadowBlur || 4,
            shadowOffsetX: obj.shadowOffsetX || 0,
            shadowOffsetY: obj.shadowOffsetY || 0,
            fill: obj.fill || '#333',
          };

          if (obj.numberImage >= 1 && obj.numberImage <= 10) {
            const color = numberColors[obj.numberImage - 1];
            const fontSize = Math.min(obj.width, obj.height) * 0.6;
            const textColor = getContrastYIQ(color);

            return (
              <Group {...commonProps} width={obj.width} height={obj.height}>
                <Rect
                  width={obj.width}
                  height={obj.height}
                  fill={reference && forceReferenceVisible ? '' : color}
                  stroke={obj.stroke || '#444'}
                  strokeWidth={obj.strokeWidth || 2}
                  shadowColor={obj.shadowColor || '#111'}
                  shadowBlur={obj.shadowBlur || 4}
                  shadowOffsetX={obj.shadowOffsetX || 0}
                  shadowOffsetY={obj.shadowOffsetY || 0}
                  cornerRadius={10}
                />
                {reference && forceReferenceVisible ? (
                  <URLImage
                    src={reference?.src}
                    x={0}
                    y={0}
                    width={obj.width}
                    height={obj.height}
                    flipX={!!obj.flipX}
                  />
                ) : obj.src ? (
                  <URLImage
                    src={obj.src}
                    x={0}
                    y={0}
                    width={obj.width}
                    height={obj.height}
                    flipX={!!obj.flipX}
                  />
                ) : (
                  !hideNumbers && (
                    <Group
                      x={obj.flipX ? obj.width : 0}
                      scaleX={obj.flipX ? -1 : 1}
                    >
                      <Text
                        text={String(obj.numberImage)}
                        fontSize={fontSize}
                        fill={textColor}
                        fontStyle="bold"
                        align="center"
                        verticalAlign="middle"
                        width={obj.width}
                        height={obj.height}
                        x={0}
                        y={0}
                      />
                    </Group>
                  )
                )}
              </Group>
            );
          }

          switch (obj.type) {
            case 'rectangle':
              return <Rect {...commonProps} width={obj.width} height={obj.height} cornerRadius={10} />;
            case 'circle':
              return <Circle {...commonProps} radius={obj.width / 2} />;
            case 'star':
              return (
                <Star
                  {...commonProps}
                  numPoints={obj.spikes || 5}
                  innerRadius={obj.width / 4}
                  outerRadius={obj.width / 2}
                />
              );
            case 'polygon':
              return <RegularPolygon {...commonProps} sides={obj.sides || 6} radius={obj.width / 2} />;
            case 'triangle':
              return <RegularPolygon {...commonProps} sides={3} radius={obj.width / 2} />;
            case 'line':
              return <Line {...commonProps} points={[0, obj.height / 2, obj.width, obj.height / 2]} />;
            case 'image':
              return (
                <URLImage
                  {...commonProps}
                  width={obj.width}
                  height={obj.height}
                  src={obj.src}
                  flipX={!!obj.flipX}
                />
              );
            default:
              return null;
          }
        })}

        {selectedId && editable && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
            rotateEnabled
            enabledAnchors={[
              'top-left', 'top-right',
              'bottom-left', 'bottom-right',
              'middle-left', 'middle-right',
              'top-center', 'bottom-center',
            ]}
          />
        )}
      </Layer>
    </Stage>
  );
});

export default KonvaCanvas;