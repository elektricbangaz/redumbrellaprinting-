export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  basePrice: number;
  colors: string[];
  sizes: string[];
  images: string[];
};

export const fallbackProducts: StoreProduct[] = [
  {
    id: "fallback-standard-t-shirt",
    name: "Standard T-Shirt",
    slug: "standard-t-shirt",
    category: "Apparel",
    description: "Classic custom T-shirt for single orders, teams, brands and events.",
    basePrice: 1800,
    colors: ["White","Black","Grey","Navy","Red"],
    sizes: ["S","M","L","XL","2XL"],
    images: ["/mockups/plain-white-shirt.webp"],
  },
  {
    id: "fallback-pullover-hoodie",
    name: "Pullover Hoodie",
    slug: "pullover-hoodie",
    category: "Apparel",
    description: "Heavyweight hoodie ready for screen print, transfer or branded artwork.",
    basePrice: 4500,
    colors: ["Black","White","Grey"],
    sizes: ["S","M","L","XL","2XL"],
    images: ["/mockups/category-apparel.webp"],
  },
  {
    id: "fallback-promotional-bottle",
    name: "Custom Bottle",
    slug: "custom-bottle",
    category: "Promotional Items",
    description: "Branded drinkware for corporate, event and promotional use.",
    basePrice: 2200,
    colors: ["White","Black","Gold"],
    sizes: ["Standard"],
    images: ["/mockups/category-promotional.webp"],
  },
  {
    id: "fallback-signage",
    name: "Business Signage",
    slug: "business-signage",
    category: "Signs & Displays",
    description: "Commercial signage and display production. Complex sizes are quoted.",
    basePrice: 0,
    colors: ["Custom"],
    sizes: ["Custom"],
    images: ["/mockups/category-signage.webp"],
  },
];

export async function getStoreProducts() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.product.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
    if (!rows.length) return fallbackProducts;
    const overrides: Record<string,string> = {
      "standard-t-shirt": "/mockups/plain-white-shirt.webp",
      "pullover-hoodie": "/mockups/category-apparel.webp",
      "trucker-cap": "/mockups/category-apparel.webp",
    };
    return rows.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      description: p.description || "",
      basePrice: p.basePrice,
      colors: p.colors as string[],
      sizes: p.sizes as string[],
      images: [overrides[p.slug] || (p.images as string[])[0] || "/mockups/plain-white-shirt.webp"],
    }));
  } catch (error) {
    console.error("Store catalog fallback active:", error);
    return fallbackProducts;
  }
}
