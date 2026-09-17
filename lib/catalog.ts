export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  basePrice: number;
  colors: string[];
  sizes: string[];
  images: string[];
  quoteOnly?: boolean;
  previewMode?: "apparel3d" | "cylinder3d" | "flat" | "vehicle";
};

export const CORE_CATALOG: CatalogProduct[] = [
  {
    id: "catalog-standard-tshirt",
    name: "Standard T-Shirt",
    slug: "standard-t-shirt",
    category: "T-Shirts",
    description: "Classic printable crew-neck T-shirt for custom artwork, teams, events and merchandise.",
    basePrice: 2500,
    colors: ["White", "Black", "Red", "Navy"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    images: ["https://res.cloudinary.com/crtuavbs/image/upload/v1789409906/Tshirt.png"],
    previewMode: "apparel3d",
  },
  {
    id: "catalog-polo-shirt",
    name: "Polo Shirt",
    slug: "polo-shirt",
    category: "Polo Shirts",
    description: "Professional polo shirt for staff uniforms, corporate branding and embroidered or printed artwork.",
    basePrice: 3000,
    colors: ["White", "Black", "Navy", "Red"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    images: ["https://res.cloudinary.com/crtuavbs/image/upload/v1789409906/Polo_Tshirt.png"],
    previewMode: "flat",
  },
  {
    id: "catalog-hoodie",
    name: "Pullover Hoodie",
    slug: "pullover-hoodie",
    category: "Hoodies",
    description: "Pullover hoodie ready for custom front or back artwork.",
    basePrice: 0,
    colors: ["Black", "White", "Grey", "Navy", "Red"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    images: ["/mockups/category-apparel.webp"],
    quoteOnly: true,
    previewMode: "flat",
  },
  {
    id: "catalog-mug",
    name: "Custom Mug",
    slug: "custom-mug",
    category: "Mugs & Drinkware",
    description: "Full-wrap ceramic mug preview with artwork placed around the printable cylinder.",
    basePrice: 0,
    colors: ["White", "Black"],
    sizes: ["11oz", "15oz"],
    images: ["/mockups/category-promotional.webp"],
    quoteOnly: true,
    previewMode: "cylinder3d",
  },
  {
    id: "catalog-bottle",
    name: "Branded Bottle",
    slug: "branded-bottle",
    category: "Promotional Items",
    description: "Branded drinkware for corporate, event and promotional use.",
    basePrice: 0,
    colors: ["White", "Black", "Gold"],
    sizes: ["500ml", "750ml"],
    images: ["/mockups/category-promotional.webp"],
    quoteOnly: true,
    previewMode: "cylinder3d",
  },
  {
    id: "catalog-signage",
    name: "Custom Signage",
    slug: "custom-signage",
    category: "Signs & Displays",
    description: "Acrylic, LED, routed and display signage configured visually and finalized by production quote.",
    basePrice: 0,
    colors: ["Custom"],
    sizes: ["12x12", "12x18", "18x24", "24x24", "24x36", "36x36", "36x48", "48x48", "48x60", "48x72", "48x84", "48x96"],
    images: ["/mockups/category-signage.webp"],
    quoteOnly: true,
    previewMode: "flat",
  },
  {
    id: "catalog-vehicle",
    name: "Vehicle Graphics",
    slug: "vehicle-graphics",
    category: "Vehicle Graphics",
    description: "Fleet wraps, decals and branded vehicle graphics configured visually then priced to vehicle and coverage.",
    basePrice: 0,
    colors: ["Custom"],
    sizes: ["Cargo Van - Side", "Cargo Van - Rear", "Sedan - Side", "SUV - Side"],
    images: ["/mockups/category-vehicle.webp"],
    quoteOnly: true,
    previewMode: "vehicle",
  },
  {
    id: "catalog-banner",
    name: "Banners & Large Format",
    slug: "banners-large-format",
    category: "Banners & Prints",
    description: "Dimension-accurate vinyl banners, posters, signs and step-and-repeat graphics.",
    basePrice: 0,
    colors: ["Custom"],
    sizes: [
      "24x36 A-Frame",
      "12x12 Poster/Sign",
      "12x18 Poster/Sign",
      "18x24 Poster/Sign",
      "24x24 Poster/Sign",
      "24x36 Poster/Sign",
      "36x36 Poster/Sign",
      "36x48 Poster/Sign",
      "48x48 Poster/Sign",
      "48x60 Poster/Sign",
      "48x72 Poster/Sign",
      "48x84 Poster/Sign",
      "48x96 Poster/Sign",
      "96x96 Step & Repeat",
      "120x96 Step & Repeat"
    ],
    images: ["/mockups/category-banners.webp"],
    quoteOnly: true,
    previewMode: "flat",
  },
];
