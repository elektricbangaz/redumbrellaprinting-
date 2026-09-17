import type { DesignSides } from "@/lib/designer-types";
import type { SupplyMode } from "@/lib/designer-pricing";

export type DecorationMethod =
  | "heat-transfer"
  | "embroidery"
  | "dtf"
  | "screen-print"
  | "uv-sticker"
  | "laser-engraving";

export type DesignSurfaceId =
  | "full-front"
  | "left-chest"
  | "right-chest"
  | "full-back"
  | "upper-back"
  | "left-sleeve"
  | "right-sleeve"
  | "hem-tail"
  | "full-wrap"
  | "custom";

export type DesignDocumentV1 = {
  schemaVersion: 1;
  updatedAt: number;
  productId: string;
  productSlug: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  side: "front" | "back";
  surfaceId: DesignSurfaceId;
  supplyMode: SupplyMode;
  decorationMethod: DecorationMethod;
  design: DesignSides;
  pricingSnapshot?: unknown;
};

export function createDesignDocument(input: Omit<DesignDocumentV1, "schemaVersion" | "updatedAt">): DesignDocumentV1 {
  return {
    schemaVersion: 1,
    updatedAt: Date.now(),
    ...input,
  };
}
