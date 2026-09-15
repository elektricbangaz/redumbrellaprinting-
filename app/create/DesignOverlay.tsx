"use client";

import { useRef } from "react";
import type { DesignLayer } from "@/lib/designer-types";

type Props = {
  layers: DesignLayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<DesignLayer>) => void;
};

export function DesignOverlay({ layers, selectedId, onSelect, onChange }: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  function beginMove(e: React.PointerEvent, layer: DesignLayer) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(layer.id);
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = layer.x;
    const initialY = layer.y;

    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      onChange(layer.id, {
        x: Math.max(0, Math.min(100, initialX + dx)),
        y: Math.max(0, Math.min(100, initialY + dy)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function beginResize(e: React.PointerEvent, layer: DesignLayer) {
    e.preventDefault();
    e.stopPropagation();
    onSelect(layer.id);
    const surface = surfaceRef.current;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const startX = e.clientX;
    const initial = layer.type === "image" ? layer.widthPct : (layer.widthPct ?? 34);

    const move = (ev: PointerEvent) => {
      const delta = ((ev.clientX - startX) / rect.width) * 100;
      onChange(layer.id, { widthPct: Math.max(8, Math.min(94, initial + delta)) } as Partial<DesignLayer>);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
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
    window.addEventListener("pointerup", up);
  }

  return (
    <div ref={surfaceRef} className="live-design-surface" onPointerDown={() => onSelect(null)}>
      <div className="live-design-safe-zone" />
      {layers.map((layer) => {
        const widthPct = layer.type === "image" ? layer.widthPct : (layer.widthPct ?? 34);
        return (
          <div
            key={layer.id}
            className={`live-layer ${selectedId === layer.id ? "selected" : ""}`}
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
                  fontSize: `${Math.max(14, layer.fontSize * 0.75)}px`,
                }}
              >
                {layer.content}
              </div>
            )}
            {selectedId === layer.id && (
              <>
                <button
                  type="button"
                  className="live-handle live-resize"
                  onPointerDown={(e) => beginResize(e, layer)}
                  aria-label="Resize layer"
                />
                <button
                  type="button"
                  className="live-handle live-rotate"
                  onPointerDown={(e) => beginRotate(e, layer)}
                  aria-label="Rotate layer"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
