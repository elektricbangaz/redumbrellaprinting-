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
};

export const CORE_CATALOG: CatalogProduct[] = [
  {
    id: "catalog-standard-tshirt",
    name: "Standard T-Shirt",
    slug: "standard-t-shirt",
    category: "T-Shirts",
    description: "Classic printable crew-neck T-shirt for custom artwork, teams, events and merchandise.",
    basePrice: 1800,
    colors: ["White", "Black", "Red", "Navy"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    images: ["https://res.cloudinary.com/crtuavbs/image/upload/v1789409906/Tshirt.png"],
  },
  {
    id: "catalog-polo-shirt",
    name: "Polo Shirt",
    slug: "polo-shirt",
    category: "Polo Shirts",
    description: "Professional polo shirt for staff uniforms, corporate branding and embroidered or printed artwork.",
    basePrice: 2800,
    colors: ["White", "Black", "Navy", "Red"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    images: ["https://res.cloudinary.com/crtuavbs/image/upload/v1789409906/Polo_Tshirt.png"],
  },
  {
    id: "catalog-hoodie",
    name: "Pullover Hoodie",
    slug: "pullover-hoodie",
    category: "Hoodies",
    description: "Pullover hoodie ready for custom front or back artwork.",
    basePrice: 4800,
    colors: ["Black", "White", "Grey"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    images: ["/mockups/hoodie-black.webp"],
  },
  {
    id: "catalog-bottle",
    name: "Branded Bottle",
    slug: "branded-bottle",
    category: "Promotional Items",
    description: "Branded drinkware for corporate, event and promotional use.",
    basePrice: 2500,
    colors: ["White", "Black", "Gold"],
    sizes: ["Standard"],
    images: ["/mockups/category-promotional.webp"],
  },
  {
    id: "catalog-signage",
    name: "Custom Signage",
    slug: "custom-signage",
    category: "Signs & Displays",
    description: "Acrylic, LED, routed and display signage configured in Create and finalized by production quote.",
    basePrice: 0,
    colors: ["Custom"],
    sizes: ["Custom"],
    images: ["/mockups/category-signage.webp"],
    quoteOnly: true,
  },
  {
    id: "catalog-vehicle",
    name: "Vehicle Graphics",
    slug: "vehicle-graphics",
    category: "Vehicle Graphics",
    description: "Fleet wraps, decals and branded vehicle graphics configured visually then priced to vehicle and coverage.",
    basePrice: 0,
    colors: ["Custom"],
    sizes: ["Vehicle-specific"],
    images: ["/mockups/category-vehicle.webp"],
    quoteOnly: true,
  },
  {
    id: "catalog-banner",
    name: "Banners & Large Format",
    slug: "banners-large-format",
    category: "Banners & Prints",
    description: "Vinyl banners, mesh, posters and large-format print configured in Create and finalized by quote.",
    basePrice: 0,
    colors: ["Custom"],
    sizes: ["Custom"],
    images: ["/mockups/category-banners.webp"],
    quoteOnly: true,
  },
];
