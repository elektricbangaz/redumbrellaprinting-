export type SupplyMode = "red-umbrella" | "customer";

export type DesignerPricingInput = {
  productSlug: string;
  quantity: number;
  size: string;
  printZoneId?: string;
  surfaceIds?: string[];
  decorationMethod?: string;
  hasFrontDesign: boolean;
  hasBackDesign: boolean;
  supplyMode: SupplyMode;
};

export type DesignerPriceResult = {
  quoteOnly: boolean;
  unitPrice?: number;
  total?: number;
  label: string;
  note?: string;
  factors?: string[];
};

function bannerSqFt(size: string) {
  const match = size.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  const widthIn = Number(match[1]);
  const heightIn = Number(match[2]);
  if (!widthIn || !heightIn) return null;
  return (widthIn * heightIn) / 144;
}

function methodLabel(value?: string) {
  return (value || "standard print").replaceAll("-", " ");
}

function apparelPrice(input: DesignerPricingInput): DesignerPriceResult {
  const qty = Math.max(1, input.quantity);
  const surfaces = new Set(input.surfaceIds?.length ? input.surfaceIds : [input.printZoneId].filter(Boolean) as string[]);
  const front = input.hasFrontDesign || [...surfaces].some((id) => ["full-front", "left-chest", "right-chest", "left-sleeve", "right-sleeve", "hem-tail"].includes(id));
  const back = input.hasBackDesign || [...surfaces].some((id) => ["full-back", "upper-back"].includes(id));
  const locations = Math.max(1, surfaces.size || Number(front) + Number(back));
  const method = input.decorationMethod || "dtf";

  if (method === "screen-print") {
    return { quoteOnly: true, label: "Production quote", note: "Screen print pricing depends on colour count, screens/setup and run quantity.", factors: [methodLabel(method), `${qty} units`, `${locations} placement${locations === 1 ? "" : "s"}`] };
  }
  if (method === "embroidery" && input.productSlug !== "polo-shirt") {
    return { quoteOnly: true, label: "Production quote", note: "Embroidery is priced from stitch count, digitization and placement size.", factors: [methodLabel(method), `${qty} units`, `${locations} placement${locations === 1 ? "" : "s"}`] };
  }

  if (input.productSlug === "polo-shirt") {
    if (input.supplyMode === "customer") {
      return { quoteOnly: true, label: "Production quote", note: "Customer-supplied polo pricing depends on artwork, stitch/print method and garment suitability.", factors: [methodLabel(method), `${qty} units`] };
    }
    const unitPrice = 300000;
    return { quoteOnly: false, unitPrice, total: unitPrice * qty, label: "Retail · garment included", note: method === "embroidery" ? "Listed polo embroidery rate; new-logo digitization can be added at review." : "Listed polo decoration estimate.", factors: [methodLabel(method), `${qty} units`] };
  }

  if (input.productSlug === "standard-t-shirt") {
    const suppliedByUs = input.supplyMode === "red-umbrella";
    const twoSided = front && back;
    const compactPlacement = locations === 1 && [...surfaces].every((id) => ["left-chest", "right-chest", "left-sleeve", "right-sleeve", "hem-tail"].includes(id));
    const unitPrice = twoSided
      ? (suppliedByUs ? 280000 : 180000)
      : compactPlacement
        ? (suppliedByUs ? 200000 : 70000)
        : (suppliedByUs ? 250000 : 150000);
    return {
      quoteOnly: false,
      unitPrice,
      total: unitPrice * qty,
      label: suppliedByUs ? "Retail · garment included" : "Retail · customer garment",
      note: twoSided ? "Front-and-back decoration estimate." : compactPlacement ? "Small-placement decoration estimate." : "Single primary-location decoration estimate.",
      factors: [methodLabel(method), `${qty} units`, suppliedByUs ? "Red Umbrella garment" : "Customer garment", `${locations} placement${locations === 1 ? "" : "s"}`],
    };
  }

  return { quoteOnly: true, label: "Production quote", note: "This apparel configuration requires production review.", factors: [methodLabel(method), `${qty} units`, `${locations} placement${locations === 1 ? "" : "s"}`] };
}

export function calculateDesignerPrice(input: DesignerPricingInput): DesignerPriceResult {
  const qty = Math.max(1, input.quantity);

  if (["standard-t-shirt", "polo-shirt", "pullover-hoodie", "trucker-cap"].includes(input.productSlug)) {
    return apparelPrice(input);
  }

  if (input.productSlug === "banners-large-format") {
    const sqft = bannerSqFt(input.size);
    if (!sqft) return { quoteOnly: true, label: "Production quote", note: "Enter a measurable width × height before banner pricing can be calculated." };
    const unitPrice = Math.round(sqft * 800 * 100);
    return { quoteOnly: false, unitPrice, total: unitPrice * qty, label: `${sqft.toFixed(1)} sq ft × J$800`, note: "Banner print estimate before special finishing or installation.", factors: [`${sqft.toFixed(2)} sq ft each`, `${qty} units`] };
  }

  if (["custom-mug", "branded-bottle", "custom-tumbler"].includes(input.productSlug)) {
    const brandingRate = qty > 50 ? 400 : qty >= 12 ? 600 : 800;
    return { quoteOnly: true, label: `Branding from J$${brandingRate.toLocaleString()} each`, note: "Artwork application rate is known; blank item cost and method-specific setup must be confirmed before checkout.", factors: [methodLabel(input.decorationMethod), `${qty} units`] };
  }

  if (input.productSlug === "vehicle-graphics") return { quoteOnly: true, label: "Production quote", note: "Vehicle graphics are priced by measured coverage, vinyl type, print/lamination and installation." };
  if (["custom-signage", "acrylic-photo-wall", "routed-sign"].includes(input.productSlug)) return { quoteOnly: true, label: "Production quote", note: "Signage pricing requires material, dimensions, routing/lighting, mounting and finishing." };
  if (["business-cards", "flyers-posters", "brochures", "event-tickets", "door-hangers", "stickers-labels", "spandex-tablecloth", "custom-pillowcase"].includes(input.productSlug)) {
    return { quoteOnly: true, label: "Production quote", note: "Commercial print pricing requires stock/media, finished size, quantity, sides/colour and finishing selections." };
  }
  return { quoteOnly: true, label: "Production quote", note: "This configuration requires production review before a final price is committed." };
}
