import type { SupplyMode } from "@/lib/designer-pricing";
import type { DesignSurfaceId, SurfaceDesignState } from "@/lib/design-surfaces";

export type DecorationMethod =
  | "heat-transfer"
  | "embroidery"
  | "dtf"
  | "screen-print"
  | "uv-sticker"
  | "laser-engraving";

export type DesignDocumentV2 = {
  schemaVersion: 2;
  updatedAt: number;
  productId: string;
  productSlug: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  activeSurfaceId: DesignSurfaceId;
  surfaces: SurfaceDesignState;
  supplyMode: SupplyMode;
  decorationMethod: DecorationMethod;
  pricingSnapshot?: unknown;
};

export type DesignDocument = DesignDocumentV2;

export function createDesignDocument(
  input: Omit<DesignDocumentV2, "schemaVersion" | "updatedAt">
): DesignDocumentV2 {
  return {
    schemaVersion: 2,
    updatedAt: Date.now(),
    ...input,
  };
}
