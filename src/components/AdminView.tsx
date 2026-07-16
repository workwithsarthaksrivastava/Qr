import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from 'qrcode.react';
import { SpreadData, AlbumSettings, ThemeType, PageData, PageLayout, ImageTransform } from '../types';
import { getBlobUrl } from '../lib/db';
import { 
  Plus, Trash2, Image as ImageIcon, Music, ArrowLeft, MoveUp, MoveDown, 
  LayoutTemplate, LayoutGrid, Rows2, Columns2, QrCode, RotateCw, 
  FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Check, X, RefreshCw,
  Compass
} from 'lucide-react';
import { TemplateGallery } from './TemplateGallery';

const getTransformStyle = (tf?: Partial<ImageTransform>) => {
  if (!tf) return {};
  const scale = tf.scale !== undefined ? tf.scale : 1;
  const scaleX = tf.flipH ? -scale : scale;
  const scaleY = tf.flipV ? -scale : scale;
  return {
    transform: `translate(${tf.translateX || 0}%, ${tf.translateY || 0}%) rotate(${tf.rotate || 0}deg) scale(${scaleX || 1}, ${scaleY || 1})`,
  };
};

const PageEditor = ({ page, onChange, label, orientation }: { page?: PageData, onChange: (page: PageData) => void, label: string, orientation?: 'landscape' | 'portrait' }) => {
  const safePage = page || { layout: '1', images: [null] };
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);
  const [tempTransform, setTempTransform] = useState<ImageTransform>({
    scale: 1,
    rotate: 0,
    translateX: 0,
    translateY: 0,
    flipH: false,
    flipV: false
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialTranslate, setInitialTranslate] = useState({ x: 0, y: 0 });

  // Freeform Canvas State variables
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeCanvasAction, setActiveCanvasAction] = useState<'move' | 'resize' | 'rotate' | null>(null);
  const [canvasActionIndex, setCanvasActionIndex] = useState<number | null>(null);
  const [canvasStartCoords, setCanvasStartCoords] = useState({ x: 0, y: 0 });
  const [canvasStartTransform, setCanvasStartTransform] = useState({ x: 10, y: 15, width: 35, height: 35 });
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const newImages = [...safePage.images];
    newImages[index] = file;
    
    const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
    while (newTransforms.length < newImages.length) {
      newTransforms.push({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false });
    }
    newTransforms[index] = { 
      ...newTransforms[index],
      scale: 1, 
      rotate: 0, 
      translateX: 0, 
      translateY: 0, 
      flipH: false, 
      flipV: false 
    };
    
    onChange({ ...safePage, images: newImages, transforms: newTransforms });
  };
  
  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newImages = [...safePage.images];
    newImages[index] = null;
    
    const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
    if (newTransforms[index]) {
      newTransforms[index] = { 
        ...newTransforms[index],
        scale: 1, 
        rotate: 0, 
        translateX: 0, 
        translateY: 0, 
        flipH: false, 
        flipV: false 
      };
    }
    onChange({ ...safePage, images: newImages, transforms: newTransforms });
  };

  const handleLayoutChange = (layout: PageLayout) => {
    if (layout === 'free') {
      const newImages = safePage.images.length > 0 ? [...safePage.images] : [null];
      const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
      while (newTransforms.length < newImages.length) {
        newTransforms.push({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false });
      }
      newTransforms.forEach((tf, idx) => {
        if (tf.x === undefined) tf.x = (idx * 15) % 60 + 10;
        if (tf.y === undefined) tf.y = (idx * 15) % 50 + 15;
        if (tf.width === undefined) tf.width = 35;
        if (tf.height === undefined) tf.height = 35;
        if (tf.zIndex === undefined) tf.zIndex = idx + 1;
      });
      onChange({ 
        layout, 
        images: newImages,
        transforms: newTransforms
      });
      setSelectedImageIndex(0);
      return;
    }

    const count = layout === '1' ? 1 : layout === '3' ? 3 : layout === '4' ? 4 : 2;
    const newImages = [...safePage.images];
    while (newImages.length < count) newImages.push(null);
    
    const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
    while (newTransforms.length < count) {
      newTransforms.push({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false });
    }
    
    onChange({ 
      layout, 
      images: newImages.slice(0, count),
      transforms: newTransforms.slice(0, count)
    });
  };

  const updateTempTransform = (newValues: Partial<ImageTransform>) => {
    setTempTransform(prev => ({ ...prev, ...newValues }));
  };

  const openEditModal = (index: number) => {
    const current = safePage.transforms?.[index] || {
      scale: 1,
      rotate: 0,
      translateX: 0,
      translateY: 0,
      flipH: false,
      flipV: false
    };
    setTempTransform(current);
    setActiveEditIndex(index);
  };

  const saveTransform = () => {
    if (activeEditIndex === null) return;
    const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
    while (newTransforms.length < safePage.images.length) {
      newTransforms.push({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false });
    }
    newTransforms[activeEditIndex] = tempTransform;
    onChange({ ...safePage, transforms: newTransforms });
    setActiveEditIndex(null);
  };

  // Drag-to-pan implementation
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialTranslate({ x: tempTransform.translateX, y: tempTransform.translateY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    const containerSize = 250;
    const pctX = (dx / containerSize) * 100;
    const pctY = (dy / containerSize) * 100;
    
    updateTempTransform({
      translateX: Math.round(initialTranslate.x + pctX),
      translateY: Math.round(initialTranslate.y + pctY)
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setInitialTranslate({ x: tempTransform.translateX, y: tempTransform.translateY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    
    const containerSize = 250;
    const pctX = (dx / containerSize) * 100;
    const pctY = (dy / containerSize) * 100;
    
    updateTempTransform({
      translateX: Math.round(initialTranslate.x + pctX),
      translateY: Math.round(initialTranslate.y + pctY)
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.05 : -0.05;
    const newScale = Math.min(Math.max(tempTransform.scale + zoomFactor, 0.5), 5);
    updateTempTransform({ scale: parseFloat(newScale.toFixed(2)) });
  };

  // Freeform Canvas Action handlers
  const handleCanvasActionStart = (
    index: number,
    action: 'move' | 'resize' | 'rotate',
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.stopPropagation();
    setSelectedImageIndex(index);
    setActiveCanvasAction(action);
    setCanvasActionIndex(index);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setCanvasStartCoords({ x: clientX, y: clientY });
    
    const tf: Partial<ImageTransform> = safePage.transforms?.[index] || {};
    const initialX = tf.x !== undefined ? tf.x : (index * 15) % 60 + 10;
    const initialY = tf.y !== undefined ? tf.y : (index * 15) % 50 + 15;
    const initialWidth = tf.width !== undefined ? tf.width : 35;
    const initialHeight = tf.height !== undefined ? tf.height : 35;
    
    setCanvasStartTransform({
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: initialHeight
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!activeCanvasAction || canvasActionIndex === null || !canvasRef.current) return;
    
    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const dx_px = clientX - canvasStartCoords.x;
    const dy_px = clientY - canvasStartCoords.y;
    
    const dx_pct = (dx_px / rect.width) * 100;
    const dy_pct = (dy_px / rect.height) * 100;
    
    const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
    while (newTransforms.length < safePage.images.length) {
      newTransforms.push({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false });
    }
    
    if (activeCanvasAction === 'move') {
      const newX = Math.max(0, Math.min(100 - canvasStartTransform.width, canvasStartTransform.x + dx_pct));
      const newY = Math.max(0, Math.min(100 - canvasStartTransform.height, canvasStartTransform.y + dy_pct));
      newTransforms[canvasActionIndex] = {
        ...newTransforms[canvasActionIndex],
        x: Math.round(newX),
        y: Math.round(newY)
      };
    } else if (activeCanvasAction === 'resize') {
      const newWidth = Math.max(10, Math.min(100 - canvasStartTransform.x, canvasStartTransform.width + dx_pct));
      const newHeight = Math.max(10, Math.min(100 - canvasStartTransform.y, canvasStartTransform.height + dy_pct));
      newTransforms[canvasActionIndex] = {
        ...newTransforms[canvasActionIndex],
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      };
    } else if (activeCanvasAction === 'rotate') {
      const element = document.getElementById(`canvas-item-${canvasActionIndex}`);
      if (element) {
        const itemRect = element.getBoundingClientRect();
        const centerX = itemRect.left + itemRect.width / 2;
        const centerY = itemRect.top + itemRect.height / 2;
        
        const rad = Math.atan2(clientY - centerY, clientX - centerX);
        let deg = rad * (180 / Math.PI);
        
        // Add 90 degrees so that dragging straight up (12 o'clock relative to center) is 0 degrees
        deg = (deg + 90) % 360;
        if (deg < 0) deg += 360;
        
        newTransforms[canvasActionIndex] = {
          ...newTransforms[canvasActionIndex],
          canvasRotate: Math.round(deg)
        };
      }
    }
    
    onChange({
      ...safePage,
      transforms: newTransforms
    });
  };

  const handleCanvasMouseUp = () => {
    setActiveCanvasAction(null);
    setCanvasActionIndex(null);
  };

  const addImageToCanvas = () => {
    const newImages = [...safePage.images, null];
    const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
    const idx = newImages.length - 1;
    const defaultTf = {
      scale: 1,
      rotate: 0,
      translateX: 0,
      translateY: 0,
      flipH: false,
      flipV: false,
      x: (idx * 15) % 60 + 10,
      y: (idx * 15) % 50 + 15,
      width: 35,
      height: 35,
      zIndex: Math.max(...newTransforms.map(t => t.zIndex || 1), 0) + 1
    };
    newTransforms.push(defaultTf);
    onChange({
      ...safePage,
      images: newImages,
      transforms: newTransforms
    });
    setSelectedImageIndex(idx);
  };

  const removeImageFromCanvas = (idx: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const newImages = safePage.images.filter((_, i) => i !== idx);
    const newTransforms = safePage.transforms ? safePage.transforms.filter((_, i) => i !== idx) : [];
    onChange({
      ...safePage,
      images: newImages,
      transforms: newTransforms
    });
    setSelectedImageIndex(newImages.length > 0 ? 0 : null);
  };

  const adjustZIndex = (idx: number, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
    while (newTransforms.length < safePage.images.length) {
      newTransforms.push({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false });
    }
    const currentZ = newTransforms[idx].zIndex !== undefined ? newTransforms[idx].zIndex : 1;
    newTransforms[idx] = {
      ...newTransforms[idx],
      zIndex: direction === 'up' ? currentZ + 1 : Math.max(1, currentZ - 1)
    };
    onChange({
      ...safePage,
      transforms: newTransforms
    });
  };

  const layoutOptions: { id: PageLayout; icon: React.ReactNode; label: string }[] = [
    { id: '1', icon: <div className="w-4 h-4 border-2 border-gray-400 rounded-sm"></div>, label: 'Single' },
    { id: '2-v', icon: <Rows2 size={16} />, label: 'Split Vertical' },
    { id: '2-h', icon: <Columns2 size={16} />, label: 'Split Horizontal' },
    { id: '3', icon: <LayoutTemplate size={16} />, label: 'Three Grid' },
    { id: '4', icon: <LayoutGrid size={16} />, label: 'Four Grid' },
    { id: 'free', icon: <span className="font-semibold text-[10px] uppercase tracking-wider px-1 text-indigo-600 border border-indigo-200 bg-indigo-50 rounded" title="Freeform Canvas">Canvas</span>, label: 'Freeform Canvas' }
  ];

  const activeSelectedIdx = safePage.layout === 'free' && selectedImageIndex === null && safePage.images.length > 0 ? 0 : selectedImageIndex;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-600">{label}</label>
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
          {layoutOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleLayoutChange(opt.id)}
              className={`p-1.5 rounded-md transition-colors ${safePage.layout === opt.id ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </div>
      
      {safePage.layout === 'free' ? (
        <div className="space-y-3">
          {/* Canvas box */}
          <div 
            ref={canvasRef}
            className={`relative w-full ${orientation === 'portrait' ? 'aspect-[3/4] max-w-[285px]' : 'aspect-[4/3] max-w-[450px]'} mx-auto bg-zinc-900 overflow-hidden rounded-xl border-2 border-dashed border-gray-200 select-none cursor-default`}
            onMouseMove={handleCanvasMouseMove}
            onTouchMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onTouchEnd={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            {/* Grid helpers */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-[0.03]">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="border border-white"></div>
              ))}
            </div>

            {safePage.images.map((img, index) => {
              const tf: Partial<ImageTransform> = safePage.transforms?.[index] || {};
              const x = tf.x !== undefined ? tf.x : (index * 15) % 60 + 10;
              const y = tf.y !== undefined ? tf.y : (index * 15) % 50 + 15;
              const w = tf.width !== undefined ? tf.width : 35;
              const h = tf.height !== undefined ? tf.height : 35;
              const z = tf.zIndex !== undefined ? tf.zIndex : 1;
              const isSelected = activeSelectedIdx === index;

              return (
                <div 
                  id={`canvas-item-${index}`}
                  key={index}
                  className={`absolute rounded-md overflow-visible group/item ${isSelected ? 'ring-2 ring-indigo-500 shadow-xl' : 'hover:ring-2 hover:ring-indigo-300 shadow-md'}`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${w}%`,
                    height: `${h}%`,
                    zIndex: z,
                    transform: `rotate(${tf.canvasRotate || 0}deg)`,
                    cursor: activeCanvasAction === 'move' && canvasActionIndex === index ? 'grabbing' : 'grab'
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index); }}
                  onMouseDown={(e) => handleCanvasActionStart(index, 'move', e)}
                  onTouchStart={(e) => handleCanvasActionStart(index, 'move', e)}
                >
                  {img ? (
                    <div className="w-full h-full relative overflow-hidden bg-zinc-800 rounded-md">
                      <img 
                        src={getBlobUrl(img)!} 
                        alt="" 
                        className="w-full h-full object-cover origin-center pointer-events-none"
                        style={getTransformStyle(tf)}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-zinc-800 border border-dashed border-white/20 flex flex-col items-center justify-center text-white/50 gap-1 rounded-md p-2 relative">
                      <ImageIcon size={20} className="opacity-75" />
                      <span className="text-[10px] text-center font-medium leading-tight">Add Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageChange(index, e)} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* If selected, render handlers */}
                  {isSelected && (
                    <>
                      {/* Rotate Handle */}
                      <div 
                        className="absolute top-[-24px] left-1/2 -translate-x-1/2 flex flex-col items-center z-20 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleCanvasActionStart(index, 'rotate', e)}
                        onTouchStart={(e) => handleCanvasActionStart(index, 'rotate', e)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-0.5 h-2.5 bg-indigo-500"></div>
                        <div className="w-4.5 h-4.5 bg-indigo-600 rounded-full border border-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                          <RotateCw size={9} className="text-white" />
                        </div>
                      </div>

                      {/* Resize Handle */}
                      <div 
                        className="absolute bottom-[-6px] right-[-6px] w-4.5 h-4.5 bg-indigo-600 rounded-full border border-white shadow-lg cursor-se-resize flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-20"
                        onMouseDown={(e) => handleCanvasActionStart(index, 'resize', e)}
                        onTouchStart={(e) => handleCanvasActionStart(index, 'resize', e)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>

                      {/* Info Badge */}
                      <div className="absolute bottom-[-26px] left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded shadow-md z-20 font-medium whitespace-nowrap pointer-events-none">
                        X: {x}% Y: {y}% ({w}x{h}) {tf.canvasRotate ? `| ${tf.canvasRotate}°` : ''}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {activeSelectedIdx !== null && activeSelectedIdx < safePage.images.length && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Width Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-600 font-medium">
                  <span>Frame Width</span>
                  <span className="font-mono text-indigo-600">{safePage.transforms?.[activeSelectedIdx]?.width !== undefined ? safePage.transforms?.[activeSelectedIdx]?.width : 35}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={safePage.transforms?.[activeSelectedIdx]?.width !== undefined ? safePage.transforms?.[activeSelectedIdx]?.width : 35}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
                    while (newTransforms.length < safePage.images.length) {
                      newTransforms.push({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false });
                    }
                    newTransforms[activeSelectedIdx] = {
                      ...newTransforms[activeSelectedIdx],
                      width: val
                    };
                    onChange({ ...safePage, transforms: newTransforms });
                  }}
                  className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Height Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-600 font-medium">
                  <span>Frame Height</span>
                  <span className="font-mono text-indigo-600">{safePage.transforms?.[activeSelectedIdx]?.height !== undefined ? safePage.transforms?.[activeSelectedIdx]?.height : 35}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={safePage.transforms?.[activeSelectedIdx]?.height !== undefined ? safePage.transforms?.[activeSelectedIdx]?.height : 35}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
                    while (newTransforms.length < safePage.images.length) {
                      newTransforms.push({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false });
                    }
                    newTransforms[activeSelectedIdx] = {
                      ...newTransforms[activeSelectedIdx],
                      height: val
                    };
                    onChange({ ...safePage, transforms: newTransforms });
                  }}
                  className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-gray-600 font-medium">
                  <span>Rotation (360°)</span>
                  <span className="font-mono text-indigo-600">{safePage.transforms?.[activeSelectedIdx]?.canvasRotate || 0}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={safePage.transforms?.[activeSelectedIdx]?.canvasRotate || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const newTransforms = safePage.transforms ? [...safePage.transforms] : [];
                    while (newTransforms.length < safePage.images.length) {
                      newTransforms.push({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false });
                    }
                    newTransforms[activeSelectedIdx] = {
                      ...newTransforms[activeSelectedIdx],
                      canvasRotate: val
                    };
                    onChange({ ...safePage, transforms: newTransforms });
                  }}
                  className="w-full accent-indigo-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Canvas controls toolbar */}
          <div className="flex flex-wrap gap-2 items-center bg-gray-50 border border-gray-200/60 p-2.5 rounded-xl">
            <button
              onClick={addImageToCanvas}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors rounded-lg text-xs font-semibold shadow-sm"
            >
              <Plus size={14} /> Add Image
            </button>

            {activeSelectedIdx !== null && activeSelectedIdx < safePage.images.length && (
              <>
                <div className="w-px h-5 bg-gray-200 mx-1"></div>
                
                <span className="text-[10px] text-gray-500 font-medium mr-1">
                  Photo #{activeSelectedIdx + 1}:
                </span>

                {safePage.images[activeSelectedIdx] ? (
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => openEditModal(activeSelectedIdx)}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                      title="Adjust rotate, zoom, flip"
                    >
                      <RotateCw size={13} /> Edit
                    </button>

                    <button
                      onClick={() => adjustZIndex(activeSelectedIdx, 'up')}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                      title="Bring to Front"
                    >
                      Bring Front
                    </button>

                    <button
                      onClick={() => adjustZIndex(activeSelectedIdx, 'down')}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                      title="Send to Back"
                    >
                      Send Back
                    </button>

                    <button
                      onClick={() => removeImageFromCanvas(activeSelectedIdx)}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
                      title="Delete photo frame"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5 items-center relative">
                    <button
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors relative"
                    >
                      <ImageIcon size={13} /> Choose Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageChange(activeSelectedIdx, e)} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                    </button>
                    
                    <button
                      onClick={() => removeImageFromCanvas(activeSelectedIdx)}
                      className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-medium transition-colors"
                    >
                      Remove Frame
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div 
          className={`grid gap-2 w-full ${orientation === 'portrait' ? 'aspect-[3/4] max-w-[285px]' : 'aspect-[4/3] max-w-[450px]'} mx-auto bg-gray-50/50 rounded-xl p-2 border-2 border-dashed ${safePage.images.some(img => img === null) ? 'border-gray-200' : 'border-transparent bg-gray-100'}`}
          style={{
            gridTemplateColumns: safePage.layout === '2-h' ? '1fr 1fr' : safePage.layout === '4' ? '1fr 1fr' : safePage.layout === '3' ? '2fr 1fr' : '1fr',
            gridTemplateRows: safePage.layout === '2-v' ? '1fr 1fr' : safePage.layout === '4' ? '1fr 1fr' : safePage.layout === '3' ? '1fr 1fr' : '1fr',
          }}
        >
          {safePage.images.map((img, index) => (
            <div 
              key={index} 
              className={`relative rounded-lg overflow-hidden bg-gray-100 hover:bg-gray-200 transition-colors group flex items-center justify-center
                ${safePage.layout === '1' ? 'row-span-1 col-span-1 h-full' : ''}
                ${safePage.layout === '2-h' ? 'col-span-1 h-full' : ''}
                ${safePage.layout === '2-v' ? 'row-span-1 w-full' : ''}
                ${safePage.layout === '3' ? (index === 0 ? 'col-span-1 row-span-2 h-full' : 'col-span-1 row-span-1 h-full') : ''}
                ${safePage.layout === '4' ? 'col-span-1 row-span-1 h-full' : ''}
              `}
            >
              {img ? (
                <div className="absolute inset-0 w-full h-full group">
                  <img 
                    src={getBlobUrl(img)!} 
                    alt={`Upload ${index + 1}`} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform origin-center" 
                    style={getTransformStyle(safePage.transforms?.[index])}
                  />
                  
                  {/* Visual Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(index);
                        }}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg transition-all transform hover:scale-105 flex items-center justify-center"
                        title="Adjust scale, rotation, and position"
                      >
                        <RotateCw size={16} />
                      </button>
                      
                      <button 
                        className="p-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 shadow-lg transition-all transform hover:scale-105 flex items-center justify-center relative"
                        title="Replace Photo"
                      >
                        <ImageIcon size={16} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageChange(index, e)} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          onClick={(e) => e.stopPropagation()}
                        />
                      </button>

                      <button 
                        onClick={(e) => handleRemoveImage(index, e)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg transition-all transform hover:scale-105 flex items-center justify-center"
                        title="Delete Photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <span className="text-[10px] text-white/95 font-medium bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm select-none">
                      Adjust Photo
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-gray-400 gap-1 pointer-events-none">
                    <ImageIcon size={24} />
                    <span className="text-xs font-medium">Add Photo</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageChange(index, e)} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0" 
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Premium adjustments modal overlay */}
      {activeEditIndex !== null && safePage.images[activeEditIndex] && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[96vh] md:max-h-[90vh] shadow-2xl flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Adjust Photo Orientation</h3>
                <p className="text-xs text-gray-500 mt-0.5">Drag to move, scroll to zoom, or use the controls below.</p>
              </div>
              <button 
                onClick={() => setActiveEditIndex(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable controls container */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Drag & zoom frame */}
              <div className="bg-zinc-900 p-4 rounded-xl flex items-center justify-center h-56 relative overflow-hidden select-none">
                <div 
                  className="w-56 h-40 rounded-lg border-2 border-dashed border-white/20 overflow-hidden relative bg-zinc-800 cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUpOrLeave}
                  onWheel={handleWheel}
                >
                  <img 
                    src={getBlobUrl(safePage.images[activeEditIndex])!} 
                    alt="Adjustment preview" 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none origin-center"
                    style={getTransformStyle(tempTransform)}
                  />
                  
                  {/* Drag / helper grid overlay lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-white"></div>
                    <div className="border-r border-white"></div>
                    <div></div>
                  </div>
                </div>
              </div>

              {/* Slider controls */}
              <div className="space-y-4">
                {/* Zoom slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span className="flex items-center gap-1"><ZoomIn size={14} /> Scale</span>
                    <span className="font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px]">{tempTransform.scale.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="5" 
                    step="0.05"
                    value={tempTransform.scale} 
                    onChange={(e) => updateTempTransform({ scale: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Rotate slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span className="flex items-center gap-1"><RotateCw size={14} /> Rotation</span>
                    <span className="font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px]">{tempTransform.rotate}°</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="range" 
                      min="-180" 
                      max="180" 
                      step="1"
                      value={tempTransform.rotate} 
                      onChange={(e) => updateTempTransform({ rotate: parseInt(e.target.value) })}
                      className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <button 
                      onClick={() => updateTempTransform({ rotate: (tempTransform.rotate + 90) % 360 })}
                      className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors flex items-center gap-1 text-[11px] font-medium whitespace-nowrap"
                      title="Rotate 90 degrees"
                    >
                      +90°
                    </button>
                  </div>
                </div>

                {/* Flip/mirror controls */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <button
                      onClick={() => updateTempTransform({ flipH: !tempTransform.flipH })}
                      className={`w-full py-2 border rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-2 ${tempTransform.flipH ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                    >
                      <FlipHorizontal size={14} /> Flip Horizontal
                    </button>
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => updateTempTransform({ flipV: !tempTransform.flipV })}
                      className={`w-full py-2 border rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-2 ${tempTransform.flipV ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                    >
                      <FlipVertical size={14} /> Flip Vertical
                    </button>
                  </div>
                </div>

                {/* Reset controls */}
                <button
                  onClick={() => setTempTransform({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false })}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-200 transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} /> Reset orientation & zoom
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
              <button 
                onClick={() => setActiveEditIndex(null)}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={saveTransform}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                <Check size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AdminViewProps {
  spreads: SpreadData[];
  settings: AlbumSettings;
  onSpreadsChange: (spreads: SpreadData[]) => void;
  onSettingsChange: (settings: AlbumSettings) => void;
  onClose: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ spreads, settings, onSpreadsChange, onSettingsChange, onClose }) => {
  const [showQR, setShowQR] = useState(false);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [tempCoverTransform, setTempCoverTransform] = useState<ImageTransform>({
    scale: 1,
    rotate: 0,
    translateX: 0,
    translateY: 0,
    flipH: false,
    flipV: false
  });
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [dragStartCover, setDragStartCover] = useState({ x: 0, y: 0 });
  const [initialTranslateCover, setInitialTranslateCover] = useState({ x: 0, y: 0 });

  const handleCoverMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingCover(true);
    setDragStartCover({ x: e.clientX, y: e.clientY });
    setInitialTranslateCover({
      x: tempCoverTransform.translateX || 0,
      y: tempCoverTransform.translateY || 0
    });
  };

  const handleCoverMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingCover) return;
    const dx = e.clientX - dragStartCover.x;
    const dy = e.clientY - dragStartCover.y;
    const containerSize = 250;
    const pctX = (dx / containerSize) * 100;
    const pctY = (dy / containerSize) * 100;
    setTempCoverTransform(prev => ({
      ...prev,
      translateX: Math.round(initialTranslateCover.x + pctX),
      translateY: Math.round(initialTranslateCover.y + pctY)
    }));
  };

  const handleCoverTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    setIsDraggingCover(true);
    setDragStartCover({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setInitialTranslateCover({
      x: tempCoverTransform.translateX || 0,
      y: tempCoverTransform.translateY || 0
    });
  };

  const handleCoverTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingCover || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - dragStartCover.x;
    const dy = e.touches[0].clientY - dragStartCover.y;
    const containerSize = 250;
    const pctX = (dx / containerSize) * 100;
    const pctY = (dy / containerSize) * 100;
    setTempCoverTransform(prev => ({
      ...prev,
      translateX: Math.round(initialTranslateCover.x + pctX),
      translateY: Math.round(initialTranslateCover.y + pctY)
    }));
  };

  const handleCoverWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.05 : -0.05;
    const newScale = Math.min(Math.max((tempCoverTransform.scale || 1) + zoomFactor, 0.5), 5);
    setTempCoverTransform(prev => ({
      ...prev,
      scale: parseFloat(newScale.toFixed(2))
    }));
  };

  const openCoverEdit = () => {
    setTempCoverTransform(settings.coverPhotoTransform || {
      scale: 1,
      rotate: 0,
      translateX: 0,
      translateY: 0,
      flipH: false,
      flipV: false
    });
    setIsEditingCover(true);
  };

  const saveCoverTransform = () => {
    onSettingsChange({
      ...settings,
      coverPhotoTransform: tempCoverTransform
    });
    setIsEditingCover(false);
  };

  const addSpread = () => {
    onSpreadsChange([...spreads, { 
      id: uuidv4(), 
      leftPage: { layout: '1', images: [null] }, 
      rightPage: { layout: '1', images: [null] } 
    }]);
  };

  const updateSpread = (id: string, updates: Partial<SpreadData>) => {
    onSpreadsChange(spreads.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSpread = (id: string) => {
    onSpreadsChange(spreads.filter(s => s.id !== id));
  };

  const moveSpread = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newSpreads = [...spreads];
      [newSpreads[index - 1], newSpreads[index]] = [newSpreads[index], newSpreads[index - 1]];
      onSpreadsChange(newSpreads);
    } else if (direction === 'down' && index < spreads.length - 1) {
      const newSpreads = [...spreads];
      [newSpreads[index + 1], newSpreads[index]] = [newSpreads[index], newSpreads[index + 1]];
      onSpreadsChange(newSpreads);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onSettingsChange({ ...settings, audioFile: file, audioName: file?.name || null });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onSettingsChange({ 
      ...settings, 
      coverPhoto: file,
      coverPhotoTransform: {
        scale: 1,
        rotate: 0,
        translateX: 0,
        translateY: 0,
        flipH: false,
        flipV: false
      }
    });
  };

  const removeCover = () => {
    onSettingsChange({ 
      ...settings, 
      coverPhoto: null,
      coverPhotoTransform: undefined
    });
  };

  const removeAudio = () => {
    onSettingsChange({ ...settings, audioFile: null, audioName: null });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-12 text-gray-800 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Album Administration</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowQR(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm font-medium w-fit">
              <QrCode size={18} /> Export QR
            </button>
            <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shadow-sm font-medium w-fit">
              <ArrowLeft size={18} /> Return to Album
            </button>
          </div>
        </div>

        {showQR && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-semibold mb-2">Scan to View</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Scan this QR code with your phone to open this album. Note: If your photos are not saved in a cloud database, they will only be visible on this current device.
              </p>
              <div className="bg-white p-4 inline-block rounded-xl border border-gray-200 shadow-inner mx-auto mb-6">
                <QRCodeSVG value={window.location.href} size={200} />
              </div>
              <button 
                onClick={() => setShowQR(false)} 
                className="w-full py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <TemplateGallery 
          currentTheme={settings.theme} 
          onSelectTheme={(theme) => onSettingsChange({ ...settings, theme })} 
        />

        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm mb-8">
           <h2 className="text-xl font-medium mb-4 text-gray-800 flex items-center gap-2">
              <Music className="text-amber-500" size={24} /> Global Album Audio
           </h2>
           <p className="text-gray-500 text-sm mb-6">Select a background song that will play on loop for the entire album.</p>
           
           <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors flex items-center gap-3">
              <Music size={20} className="text-gray-400" />
              <span className="text-sm text-gray-700 truncate font-medium flex-1">{settings.audioName || "No audio selected"}</span>
              {!settings.audioFile ? (
                <div className="relative overflow-hidden cursor-pointer">
                  <span className="text-sm text-amber-600 font-medium whitespace-nowrap">Upload Audio</span>
                  <input type="file" accept="audio/*" onChange={handleAudioChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              ) : (
                <button onClick={removeAudio} className="text-sm text-red-500 font-medium hover:text-red-700 z-10">Remove</button>
              )}
            </div>
            {settings.audioFile && (
              <audio src={getBlobUrl(settings.audioFile)!} controls className="h-12 w-full md:w-64 rounded-lg bg-gray-50" />
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm mb-8">
           <h2 className="text-xl font-medium mb-4 text-gray-800 flex items-center gap-2">
              <ImageIcon className="text-indigo-500" size={24} /> Album Cover Photo
           </h2>
           <p className="text-gray-500 text-sm mb-6">Select a cover photo for the album (optional).</p>
                   <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors flex items-center gap-3">
              <ImageIcon size={20} className="text-gray-400" />
              <span className="text-sm text-gray-700 truncate font-medium flex-1">{settings.coverPhoto ? "Cover photo uploaded" : "No cover photo selected"}</span>
              
              {!settings.coverPhoto ? (
                <div className="relative overflow-hidden cursor-pointer">
                  <span className="text-sm text-indigo-600 font-medium whitespace-nowrap">Upload Cover</span>
                  <input type="file" accept="image/*" onChange={handleCoverChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={openCoverEdit}
                    className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded"
                  >
                    <RotateCw size={12} /> Adjust Cover
                  </button>
                  <button onClick={removeCover} className="text-sm text-red-500 font-medium hover:text-red-700 z-10">Remove</button>
                </div>
              )}
            </div>
            {settings.coverPhoto && (
              <div className="h-16 w-16 md:w-24 md:h-24 rounded-lg bg-zinc-900 overflow-hidden border border-gray-200 relative">
                <img 
                  src={getBlobUrl(settings.coverPhoto)!} 
                  alt="Cover" 
                  className="absolute inset-0 w-full h-full object-cover origin-center pointer-events-none" 
                  style={getTransformStyle(settings.coverPhotoTransform)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm mb-8">
           <h2 className="text-xl font-medium mb-4 text-gray-800 flex items-center gap-2">
              <Compass className="text-emerald-500" size={24} /> Album Orientation
           </h2>
           <p className="text-gray-500 text-sm mb-6">Choose if you want a portrait album (perfect for portrait/phone screens) or a landscape album (classic wide book spread style).</p>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <button
               onClick={() => onSettingsChange({ ...settings, orientation: 'landscape' })}
               className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                 (settings.orientation || 'landscape') === 'landscape'
                   ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-1 ring-indigo-600'
                   : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
               }`}
             >
               <div className="w-16 h-12 border border-current rounded bg-white flex items-center justify-center shrink-0">
                 <div className="w-12 h-6 border border-current border-dashed rounded opacity-60"></div>
               </div>
               <div>
                 <div className="font-semibold text-sm">Landscape Album (Default)</div>
                 <div className="text-xs text-gray-500 mt-0.5">Classic wide book style. Excellent for desktop, tablets, and scenic landscape shots.</div>
               </div>
             </button>

             <button
               onClick={() => onSettingsChange({ ...settings, orientation: 'portrait' })}
               className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                 settings.orientation === 'portrait'
                   ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-1 ring-indigo-600'
                   : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
               }`}
             >
               <div className="w-12 h-16 border border-current rounded bg-white flex items-center justify-center shrink-0">
                 <div className="w-6 h-12 border border-current border-dashed rounded opacity-60"></div>
               </div>
               <div>
                 <div className="font-semibold text-sm">Portrait Album</div>
                 <div className="text-xs text-gray-500 mt-0.5">Vertical tall book style. Ideal for mobile views, vertical phone portraits, and close-up captures.</div>
               </div>
             </button>
           </div>
        </div>

        <div className="space-y-8">
          {spreads.map((spread, index) => (
            <div key={spread.id} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm relative group">
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <button onClick={() => moveSpread(index, 'up')} disabled={index === 0} className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
                  <MoveUp size={20} />
                </button>
                <button onClick={() => moveSpread(index, 'down')} disabled={index === spreads.length - 1} className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
                  <MoveDown size={20} />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <button onClick={() => removeSpread(spread.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
              
              <h2 className="text-2xl font-light mb-8 text-gray-800">
                Spread {index + 1} 
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PageEditor
                  label="Left Page"
                  page={spread.leftPage}
                  onChange={(page) => updateSpread(spread.id, { leftPage: page })}
                  orientation={settings.orientation}
                />
                <PageEditor
                  label="Right Page"
                  page={spread.rightPage}
                  onChange={(page) => updateSpread(spread.id, { rightPage: page })}
                  orientation={settings.orientation}
                />
              </div>
            </div>
          ))}
        </div>

        <button onClick={addSpread} className="mt-10 w-full py-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:text-gray-800 hover:border-gray-400 hover:bg-white transition-all flex items-center justify-center gap-3 font-medium text-lg">
          <Plus size={24} /> Add New Spread
        </button>
      </div>

      {/* Cover Photo adjustments modal overlay */}
      {isEditingCover && settings.coverPhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[96vh] md:max-h-[90vh] shadow-2xl flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Adjust Cover Photo</h3>
                <p className="text-xs text-gray-500 mt-0.5">Drag to move, scroll to zoom, or use the controls below.</p>
              </div>
              <button 
                onClick={() => setIsEditingCover(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable controls container */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Drag & zoom frame */}
              <div className="bg-zinc-900 p-4 rounded-xl flex items-center justify-center h-56 relative overflow-hidden select-none">
                <div 
                  className="w-56 h-40 rounded-lg border-2 border-dashed border-white/20 overflow-hidden relative bg-zinc-800 cursor-move"
                  onMouseDown={handleCoverMouseDown}
                  onMouseMove={handleCoverMouseMove}
                  onMouseUp={() => setIsDraggingCover(false)}
                  onMouseLeave={() => setIsDraggingCover(false)}
                  onTouchStart={handleCoverTouchStart}
                  onTouchMove={handleCoverTouchMove}
                  onTouchEnd={() => setIsDraggingCover(false)}
                  onWheel={handleCoverWheel}
                >
                  <img 
                    src={getBlobUrl(settings.coverPhoto)!} 
                    alt="Cover adjustment preview" 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none origin-center"
                    style={getTransformStyle(tempCoverTransform)}
                  />
                  
                  {/* Drag / helper grid overlay lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-white"></div>
                    <div className="border-r border-white"></div>
                    <div></div>
                  </div>
                </div>
              </div>

              {/* Slider controls */}
              <div className="space-y-4">
                {/* Zoom slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span className="flex items-center gap-1"><ZoomIn size={14} /> Scale</span>
                    <span className="font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px]">{tempCoverTransform.scale.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="5" 
                    step="0.05"
                    value={tempCoverTransform.scale} 
                    onChange={(e) => setTempCoverTransform(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Rotate slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span className="flex items-center gap-1"><RotateCw size={14} /> Rotation</span>
                    <span className="font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px]">{tempCoverTransform.rotate}°</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="range" 
                      min="-180" 
                      max="180" 
                      step="1"
                      value={tempCoverTransform.rotate} 
                      onChange={(e) => setTempCoverTransform(prev => ({ ...prev, rotate: parseInt(e.target.value) }))}
                      className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <button 
                      onClick={() => setTempCoverTransform(prev => ({ ...prev, rotate: (prev.rotate + 90) % 360 }))}
                      className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors flex items-center gap-1 text-[11px] font-medium whitespace-nowrap"
                      title="Rotate 90 degrees"
                    >
                      +90°
                    </button>
                  </div>
                </div>

                {/* Flip/mirror controls */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <button
                      onClick={() => setTempCoverTransform(prev => ({ ...prev, flipH: !prev.flipH }))}
                      className={`w-full py-2 border rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-2 ${tempCoverTransform.flipH ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                    >
                      <FlipHorizontal size={14} /> Flip Horizontal
                    </button>
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => setTempCoverTransform(prev => ({ ...prev, flipV: !prev.flipV }))}
                      className={`w-full py-2 border rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-2 ${tempCoverTransform.flipV ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                    >
                      <FlipVertical size={14} /> Flip Vertical
                    </button>
                  </div>
                </div>

                {/* Reset controls */}
                <button
                  onClick={() => setTempCoverTransform({ scale: 1, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false })}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-200 transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} /> Reset orientation & zoom
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
              <button 
                onClick={() => setIsEditingCover(false)}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={saveCoverTransform}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                <Check size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
