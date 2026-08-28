'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RefreshCw, Move } from '@/lib/icons';

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

export interface CropState {
  x: number;
  y: number;
  zoom: number;
}

export function parsePosition(position: string | null | undefined): { x: number; y: number } {
  if (!position) return { x: 50, y: 50 };
  if (position === 'center') return { x: 50, y: 50 };
  const parts = position.split(/\s+/);
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  return { x: Number.isFinite(x) ? x : 50, y: Number.isFinite(y) ? y : 50 };
}

export function positionToCss(position: string | null | undefined): string {
  const { x, y } = parsePosition(position);
  return `${x}% ${y}%`;
}

export default function PhotoCropEditor({
  src,
  initialPosition,
  initialZoom,
  onChange,
  size = 280,
}: {
  src: string;
  initialPosition?: string | null;
  initialZoom?: number | null;
  onChange?: (position: string, zoom: number) => void;
  size?: number;
}) {
  const [crop, setCrop] = useState<CropState>(() => ({
    ...parsePosition(initialPosition),
    zoom: initialZoom && initialZoom > 0 ? initialZoom : 1,
  }));
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; cx: number; cy: number } | null>(null);

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCrop({
      ...parsePosition(initialPosition),
      zoom: initialZoom && initialZoom > 0 ? initialZoom : 1,
    });
  }, [initialPosition, initialZoom]);

  const emit = useCallback((next: CropState) => {
    onChange?.(`${next.x.toFixed(1)}% ${next.y.toFixed(1)}%`, next.zoom);
  }, [onChange]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, cx: crop.x, cy: crop.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const pctPerPx = 100 / (size * crop.zoom);
    const next = {
      x: clamp(dragRef.current.cx + dx * pctPerPx, 0, 100),
      y: clamp(dragRef.current.cy + dy * pctPerPx, 0, 100),
      zoom: crop.zoom,
    };
    setCrop(next);
    emit(next);
  };

  const onPointerUp = () => { dragRef.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const zoom = clamp(crop.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const next = { ...crop, zoom };
    setCrop(next);
    emit(next);
  };

  const setZoom = (zoom: number) => {
    const next = { ...crop, zoom: clamp(zoom, MIN_ZOOM, MAX_ZOOM) };
    setCrop(next);
    emit(next);
  };

  const reset = () => {
    const next = { x: 50, y: 50, zoom: 1 };
    setCrop(next);
    emit(next);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Circular crop area */}
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        className="relative rounded-full overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
        style={{ width: size, height: size, border: '3px solid #E85D04', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
        title="Drag to pan · Scroll to zoom"
      >
        <img
          src={src}
          alt="crop preview"
          draggable={false}
          className="w-full h-full object-cover"
          style={{
            objectPosition: `${crop.x}% ${crop.y}%`,
            transform: `scale(${crop.zoom})`,
            transformOrigin: `${crop.x}% ${crop.y}%`,
            pointerEvents: 'none',
          }}
        />
        {/* Scanlines overlay */}
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
      </div>

      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
        <Move size={13} /> Drag to move · Scroll to zoom · {Math.round(crop.zoom * 100)}%
      </p>

      {/* Zoom controls */}
      <div className="flex items-center gap-2 mt-3 w-full max-w-[260px]">
        <button onClick={() => setZoom(crop.zoom - 0.5)} className="p-1.5 rounded-lg transition hover:bg-gray-100 text-gray-600" title="Zoom out">
          <ZoomOut size={16} />
        </button>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.1}
          value={crop.zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="flex-1"
          style={{ accentColor: '#E85D04' }}
        />
        <button onClick={() => setZoom(crop.zoom + 0.5)} className="p-1.5 rounded-lg transition hover:bg-gray-100 text-gray-600" title="Zoom in">
          <ZoomIn size={16} />
        </button>
        <button onClick={reset} className="p-1.5 rounded-lg transition hover:bg-gray-100 text-gray-600 ml-1" title="Reset crop">
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}