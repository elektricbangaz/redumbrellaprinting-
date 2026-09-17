import type { DecorationMethod } from "@/lib/design-document";

export type DecorationMethodOption = {
  id: DecorationMethod;
  label: string;
  description: string;
};

export const DECORATION_METHODS: Record<DecorationMethod, DecorationMethodOption> = {
  "heat-transfer": {
    id: "heat-transfer",
    label: "Heat Transfer",
    description: "Applied transfer for suitable apparel and flat products.",
  },
  embroidery: {
    id: "embroidery",
    label: "Embroidery",
    description: "Stitched decoration for garments and suitable textiles.",
  },
  dtf: {
    id: "dtf",
    label: "DTF",
    description: "Direct-to-film transfer for detailed full-colour apparel artwork.",
  },
  "screen-print": {
    id: "screen-print",
    label: "Screen Print",
    description: "Screen-printed artwork for suitable garment quantities and designs.",
  },
  "uv-sticker": {
    id: "uv-sticker",
    label: "UV Sticker",
    description: "UV-applied sticker/transfer for suitable rigid promotional surfaces.",
  },
  "laser-engraving": {
    id: "laser-engraving",
    label: "Laser Engraving",
    description: "Permanent engraved branding for compatible items, including suitable metallic products.",
  },
};

const APPAREL_METHODS: DecorationMethod[] = ["dtf", "heat-transfer", "screen-print", "embroidery"];
const PROMO_METHODS: DecorationMethod[] = ["uv-sticker", "laser-engraving", "heat-transfer"];

export function decorationMethodsForProduct(productSlug: string): DecorationMethodOption[] {
  let ids: DecorationMethod[];
  if (["standard-t-shirt", "polo-shirt", "pullover-hoodie"].includes(productSlug)) ids = APPAREL_METHODS;
  else if (["custom-mug", "branded-bottle"].includes(productSlug)) ids = PROMO_METHODS;
  else ids = ["heat-transfer", "dtf", "screen-print", "uv-sticker", "laser-engraving"];
  return ids.map((id) => DECORATION_METHODS[id]);
}

export function defaultDecorationMethod(productSlug: string): DecorationMethod {
  if (productSlug === "polo-shirt") return "embroidery";
  if (["custom-mug", "branded-bottle"].includes(productSlug)) return "uv-sticker";
  return "dtf";
}
