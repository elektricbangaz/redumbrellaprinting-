export type SupplyMode = "red-umbrella" | "customer";

export type DesignerPricingInput = {
  productSlug: string;
  quantity: number;
  size: string;
  printZoneId?: string;
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
};

function bannerSqFt(size: string) {
  const match = size.match(/(\\d+)\\s*[x×]\\s*(\\d+)/i);
  if (!match) return null;
  const widthIn = Number(match[1]);
  const heightIn = Number(match[2]);
  if (!widthIn || !heightIn) return null;
  return (widthIn * heightIn) / 144;
}

export function calculateDesignerPrice(input: DesignerPricingInput): DesignerPriceResult {
  const qty = Math.max(1, input.quantity);

  if (input.productSlug === "standard-t-shirt") {
    const bothSides = input.hasFrontDesign && input.hasBackDesign;
    if (bothSides) {
      const unitPrice = input.supplyMode === "red-umbrella" ? 2800 : 1800;
      return { quoteOnly: false, unitPrice, total: unitPrice * qty,
        label: input.supplyMode === "red-umbrella" ? "Retail · garment included" : "Retail · customer garment",
        note: "Full front & back print." };
    }
    const singleLocation = ["left-chest", "right-chest", "full-front", "upper-back", "full-back"].includes(input.printZoneId || "");
    if (singleLocation) {
      const unitPrice = input.supplyMode === "red-umbrella" ? 2500 : 1500;
      return { quoteOnly: false, unitPrice, total: unitPrice * qty,
        label: input.supplyMode === "red-umbrella" ? "Retail · garment included" : "Retail · customer garment",
        note: "Single-location print estimate." };
    }
    const unitPrice = input.supplyMode === "red-umbrella" ? 2000 : 700;
    return { quoteOnly: false, unitPrice, total: unitPrice * qty,
      label: input.supplyMode === "red-umbrella" ? "Retail · garment included" : "Retail · customer garment",
      note: "Pocket-logo print estimate." };
  }

  if (input.productSlug === "polo-shirt") {
    if (input.supplyMode === "customer") return { quoteOnly: true, label: "Custom quote", note: "Customer-supplied polo pricing depends on decoration method and artwork." };
    return { quoteOnly: false, unitPrice: 3000, total: 3000 * qty, label: "Retail · garment included",
      note: "Based on the listed polo embroidery stitch price; digitization may be additional for a new logo." };
  }

  if (input.productSlug === "banners-large-format") {
    const sqft = bannerSqFt(input.size);
    if (!sqft) return { quoteOnly: true, label: "Custom quote" };
    const unitPrice = Math.round(sqft * 800);
    return { quoteOnly: false, unitPrice, total: unitPrice * qty, label: sqft.toFixed(1) + " sq ft × J$800", note: "Retail banner print estimate." };
  }

  if (input.productSlug === "custom-mug" || input.productSlug === "branded-bottle") {
    const brandingRate = qty > 50 ? 400 : qty >= 12 ? 600 : 800;
    return { quoteOnly: true, label: "Branding from J$" + brandingRate.toLocaleString() + " each", note: "Artwork application rate only; blank mug/bottle cost is quoted separately." };
  }

  if (input.productSlug === "vehicle-graphics") return { quoteOnly: true, label: "Custom quote", note: "Vehicle vinyl is priced by square footage and installation coverage." };
  if (input.productSlug === "custom-signage") return { quoteOnly: true, label: "Custom quote", note: "Final price depends on material, dimensions, mounting and finishing." };
  if (input.productSlug === "pullover-hoodie") return { quoteOnly: true, label: "Custom quote", note: "Hoodie pricing is not listed in the current price sheet." };
  return { quoteOnly: true, label: "Custom quote" };
}