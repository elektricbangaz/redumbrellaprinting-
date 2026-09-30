export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  basePrice: number; // cents
  colors: string[];
  sizes: string[];
  images: string[];
  quoteOnly?: boolean;
  previewMode?: "apparel3d" | "cylinder3d" | "flat" | "vehicle";
};

const quote = (
  id: string,
  name: string,
  slug: string,
  category: string,
  description: string,
  image: string,
  sizes: string[],
  previewMode: CatalogProduct["previewMode"] = "flat",
  colors: string[] = ["Custom"],
): CatalogProduct => ({
  id, name, slug, category, description, basePrice: 0, colors, sizes,
  images: [image], quoteOnly: true, previewMode,
});

export const CORE_CATALOG: CatalogProduct[] = [
  {
    id: "catalog-standard-tshirt",
    name: "Standard T-Shirt",
    slug: "standard-t-shirt",
    category: "T-Shirts",
    description: "Classic printable crew-neck T-shirt for custom artwork, teams, events and merchandise.",
    basePrice: 250000,
    colors: ["White", "Black", "Red", "Navy"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    images: ["/mockups/plain-white-shirt.webp"],
    previewMode: "apparel3d",
  },
  {
    id: "catalog-polo-shirt",
    name: "Polo Shirt",
    slug: "polo-shirt",
    category: "Polo Shirts",
    description: "Professional polo shirt for staff uniforms, corporate branding and embroidered or printed artwork.",
    basePrice: 300000,
    colors: ["White", "Black", "Navy", "Red"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    images: ["https://res.cloudinary.com/crtuavbs/image/upload/v1789409906/Polo_Tshirt.png"],
    previewMode: "apparel3d",
  },
  quote("catalog-hoodie","Pullover Hoodie","pullover-hoodie","Hoodies","Pullover hoodie ready for custom front or back artwork.","/mockups/category-apparel.webp",["S","M","L","XL","2XL"],"apparel3d",["Black","White","Grey","Navy","Red"]),
  quote("catalog-cap","Trucker Cap","trucker-cap","Caps & Headwear","Structured cap for embroidered, transfer or printed branding.","/mockups/category-apparel.webp",["One Size"],"flat",["White","Black","Red","Navy"]),
  quote("catalog-mug","Custom Mug","custom-mug","Mugs & Drinkware","Full-wrap ceramic mug preview with artwork placed around the printable cylinder.","/mockups/category-promotional.webp",["11oz","15oz"],"cylinder3d",["White","Black"]),
  quote("catalog-bottle","Branded Bottle","branded-bottle","Mugs & Drinkware","Branded drinkware for corporate, event and promotional use.","/mockups/category-promotional.webp",["500ml","750ml"],"cylinder3d",["White","Black","Gold"]),
  quote("catalog-tumbler","Custom Tumbler","custom-tumbler","Mugs & Drinkware","Reusable tumbler branding for staff, events and promotional campaigns.","/mockups/category-promotional.webp",["20oz","30oz"],"cylinder3d",["White","Black","Silver"]),
  quote("catalog-pillow","Custom Pillowcase","custom-pillowcase","Promotional Items","Printed pillowcase for corporate, event, décor and branded merchandise use.","/mockups/category-promotional.webp",["16x16","18x18","20x20"]),
  quote("catalog-business-cards","Business Cards","business-cards","Business Print","Business cards with production-selected stock, finish and quantity.","/mockups/category-banners.webp",["3.5x2"]),
  quote("catalog-flyers","Flyers & Posters","flyers-posters","Banners & Prints","Flyers and posters for promotions, events, menus and campaigns.","/mockups/category-banners.webp",["5.5x8.5","8.5x11","11x17","12x18","18x24","24x36"]),
  quote("catalog-brochures","Brochures","brochures","Business Print","Bi-fold and tri-fold brochures with stock and finishing selected at quote.","/mockups/category-banners.webp",["Letter Tri-Fold","Letter Bi-Fold","Custom"]),
  quote("catalog-stickers","Stickers & Labels","stickers-labels","Promotional Items","Custom die-cut, kiss-cut and sheet labels for products, packaging and promotions.","/mockups/category-promotional.webp",["Custom"]),
  quote("catalog-tickets","Event Tickets","event-tickets","Business Print","Numbered or standard event tickets with optional perforation and finishing.","/mockups/category-banners.webp",["Custom"]),
  quote("catalog-door-hangers","Door Hangers","door-hangers","Business Print","Custom door hangers for hospitality, real estate, promotions and property use.","/mockups/category-banners.webp",["Standard","Custom"]),
  quote("catalog-tablecloth","Spandex Tablecloth","spandex-tablecloth","Signs & Displays","Custom printed fitted spandex tablecloths for booths, activations and events.","/mockups/category-signage.webp",["4ft table","6ft table","8ft table"]),
  quote("catalog-signage","Custom Signage","custom-signage","Signs & Displays","Acrylic, LED, routed and display signage configured visually and finalized by production quote.","/mockups/website-renders/custom-signage.webp",["12x12","12x18","18x24","24x24","24x36","36x36","36x48","48x48","48x60","48x72","48x84","48x96"]),
  quote("catalog-acrylic-wall","Acrylic Photo Wall","acrylic-photo-wall","Signs & Displays","Acrylic photo-wall and LED-housing builds for events, retail and branded installations.","/mockups/category-signage.webp",["Custom"]),
  quote("catalog-routed-sign","Routed Sign","routed-sign","Signs & Displays","Dimensional routed signage with material, paint, mounting and lighting options.","/mockups/category-signage.webp",["Custom"]),
  quote("catalog-vehicle","Vehicle Graphics","vehicle-graphics","Vehicle Graphics","Fleet wraps, decals and branded vehicle graphics configured visually then priced to vehicle and coverage.","/mockups/vehicle-graphics-mockup.png",["Cargo Van - Side","Cargo Van - Rear","Sedan - Side","SUV - Side"],"vehicle"),
  quote("catalog-banner","Banners & Large Format","banners-large-format","Banners & Prints","Dimension-accurate vinyl banners, posters, signs and step-and-repeat graphics.","/mockups/category-banners.webp",["24x36 A-Frame","12x12 Poster/Sign","12x18 Poster/Sign","18x24 Poster/Sign","24x24 Poster/Sign","24x36 Poster/Sign","36x36 Poster/Sign","36x48 Poster/Sign","48x48 Poster/Sign","48x60 Poster/Sign","48x72 Poster/Sign","48x84 Poster/Sign","48x96 Poster/Sign","96x96 Step & Repeat","120x96 Step & Repeat"]),
];
