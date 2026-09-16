"use client";

import { DesignOverlay } from "./DesignOverlay";
import type { DesignLayer } from "@/lib/designer-types";
import { dimensionsFromLabel } from "@/lib/design-export";

export function FlatProductPreview(props:{
  productSlug:string;
  image:string;
  size:string;
  layers:DesignLayer[];
  selectedId:string|null;
  onSelect:(id:string|null)=>void;
  onChange:(id:string,patch:Partial<DesignLayer>)=>void;
  onDelete?:(id:string)=>void;
  onDuplicate?:(id:string)=>void;
}) {
  const {productSlug,image,size,layers,selectedId,onSelect,onChange,onDelete,onDuplicate}=props;
  const dims=dimensionsFromLabel(size);
  const ratio=dims?.aspectRatio || (productSlug==="vehicle-graphics" ? 2.2 : 1.5);
  const bounded=Math.max(0.55,Math.min(2.8,ratio));
  const blank=productSlug==="banners-large-format";

  return (
    <div className="flat-product-viewer">
      <div className={"flat-product-stage flat-"+productSlug+(blank ? " blank-production-surface" : "")} style={{aspectRatio:String(bounded)}}>
        {!blank && image ? <img src={image} alt="" className="flat-product-base" /> : null}
        <DesignOverlay layers={layers} selectedId={selectedId} onSelect={onSelect} onChange={onChange} onDelete={onDelete} onDuplicate={onDuplicate} />
      </div>
      <div className="flat-product-meta">
        <strong>{size}</strong>
        {dims && <span>{dims.width}" × {dims.height}"</span>}
      </div>
    </div>
  );
}
