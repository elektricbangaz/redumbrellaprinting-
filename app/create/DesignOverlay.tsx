"use client";

import { Copy, RotateCw, Trash2 } from "lucide-react";
import { useRef } from "react";
import type { DesignLayer } from "@/lib/designer-types";

type Props = {
  layers: DesignLayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<DesignLayer>) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  renderMode?: "visual" | "controls";
};

export function DesignOverlay({
  layers,
  selectedId,
  onSelect,
  onChange,
  onDelete,
  onDuplicate,
  renderMode = "visual",
}: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  function beginMove(e: React.PointerEvent, layer: DesignLayer) {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    onSelect(layer.id);
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = layer.x;
    const initialY = layer.y;
    const widthPct = layer.type === "image" ? layer.widthPct : (layer.widthPct ?? 34);
    const halfW = Math.max(4, Math.min(46, widthPct / 2));

    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      onChange(layer.id, {
        x: Math.max(halfW, Math.min(100 - halfW, initialX + dx)),
        y: Math.max(6, Math.min(94, initialY + dy)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  }

  function beginResize(e: React.PointerEvent, layer: DesignLayer) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(layer.id);
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const startX = e.clientX;
    const initialWidth = layer.type === "image" ? layer.widthPct : (layer.widthPct ?? 34);
    const initialFont = layer.type === "text" ? layer.fontSize : 0;

    const move = (ev: PointerEvent) => {
      const delta = ((ev.clientX - startX) / rect.width) * 100;
      const maxWidth = Math.max(10, Math.min(80, 2 * Math.min(layer.x, 100 - layer.x)));
      const nextWidth = Math.max(8, Math.min(maxWidth, initialWidth + delta));
      if (layer.type === "text") {
        const scale = nextWidth / Math.max(1, initialWidth);
        onChange(layer.id, {
          widthPct: nextWidth,
          fontSize: Math.max(10, Math.min(160, initialFont * scale)),
        } as Partial<DesignLayer>);
      } else {
        onChange(layer.id, { widthPct: nextWidth } as Partial<DesignLayer>);
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  }

  function beginRotate(e: React.PointerEvent, layer: DesignLayer) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(layer.id);
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const cx = rect.left + (layer.x / 100) * rect.width;
    const cy = rect.top + (layer.y / 100) * rect.height;

    const move = (ev: PointerEvent) => {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI + 90;
      onChange(layer.id, { rotation: angle });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  }

  return (
    <div ref={surfaceRef} className="live-design-surface" onPointerDown={() => onSelect(null)}>
      <div className="live-design-safe-zone" />
      {layers.map((layer) => {
        const widthPct = layer.type === "image" ? layer.widthPct : (layer.widthPct ?? 34);
        const selected = selectedId === layer.id;
        return (
          <div
            key={layer.id}
            className={`live-layer ${selected ? "selected" : ""} ${renderMode === "controls" ? "controls-only" : ""}`}
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              width: `${widthPct}%`,
              transform: `translate(-50%,-50%) rotate(${layer.rotation}deg)`,
            }}
            onPointerDown={(e) => beginMove(e, layer)}
          >
            {layer.type === "image" ? (
              <img src={layer.src} alt="Artwork" draggable={false} />
            ) : (
              <div
                className="live-text-layer"
                style={{
                  color: layer.color,
                  fontFamily: `"${layer.fontFamily}", sans-serif`,
                  fontWeight: layer.bold ? 800 : 500,
                  fontStyle: layer.italic ? "italic" : "normal",
                  textAlign: layer.align,
                  fontSize: `${Math.max(11, layer.fontSize * 0.72)}px`,
                }}
              >
                {layer.content}
              </div>
            )}

            {selected && (
              <>
                <button
                  type="button"
                  className="live-corner live-delete"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onDelete?.(layer.id); }}
                  aria-label="Delete layer"
                >
                  <Trash2 />
                </button>
                <button
                  type="button"
                  className="live-corner live-duplicate"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onDuplicate?.(layer.id); }}
                  aria-label="Duplicate layer"
                >
                  <Copy />
                </button>
                <button
                  type="button"
                  className="live-corner live-resize"
                  onPointerDown={(e) => beginResize(e, layer)}
                  aria-label="Resize layer"
                />
                <button
                  type="button"
                  className="live-corner live-rotate"
                  onPointerDown={(e) => beginRotate(e, layer)}
                  aria-label="Rotate layer"
                >
                  <RotateCw />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
