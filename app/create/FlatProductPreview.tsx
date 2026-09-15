"use client";

import { DesignOverlay } from "./DesignOverlay";
import type { DesignLayer } from "@/lib/designer-types";
import { dimensionsFromLabel } from "@/lib/design-export";

export function FlatProductPreview({
  productSlug,
  image,
  size,
  layers,
  selectedId,
  onSelect,
  onChange,
  onDelete,
  onDuplicate,
}: {
  productSlug: string;
  image: string;
  size: string;
  layers: DesignLayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<DesignLayer>) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}) {
  const dims = dimensionsFromLabel(size);
  const ratio = dims?.aspectRatio || (productSlug === "vehicle-graphics" ? 2.2 : 1.5);
  const bounded = Math.max(0.55, Math.min(2.8, ratio));
  const isBlankSurface = productSlug === "banners-large-format";

  return (
    <div className="flat-product-viewer">
      <div
        className={`flat-product-stage flat-${productSlug} ${isBlankSurface ? "blank-production-surface" : ""}`}
        style={{ aspectRatio: String(bounded) }}
      >
        {!isBlankSurface && image ? (
          <img
            src={image}
            alt=""
            className="flat-product-base"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement?.classList.add("image-fallback-surface");
            }}
          />
        ) : null}
        <DesignOverlay
          layers={layers}
          selectedId={selectedId}
          onSelect={onSelect}
          onChange={onChange}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      </div>
      <div className="flat-product-meta">
        <strong>{size}</strong>
        {dims && <span>{dims.width}" × {dims.height}"</span>}
      </div>
    </div>
  );
}
