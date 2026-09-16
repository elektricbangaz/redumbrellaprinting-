export type GarmentModelConfig = {
  slug: string;
  modelUrl?: string;
  fallbackImage: string;
  scale?: number;
  rotation?: [number, number, number];
  printScale?: [number, number];
  frontOffset?: number;
};

export const GARMENT_MODELS: Record<string, GarmentModelConfig> = {
  "standard-t-shirt": {
    slug: "standard-t-shirt",
    modelUrl: "https://raw.githubusercontent.com/AvatarParzival/3d/main/Models/shirt.glb",
    fallbackImage: "https://res.cloudinary.com/crtuavbs/image/upload/v1789409906/Tshirt.png",
    printScale: [0.38, 0.46],
    frontOffset: 0.012,
  },
  "polo-shirt": {
    slug: "polo-shirt",
    fallbackImage: "https://res.cloudinary.com/crtuavbs/image/upload/v1789409906/Polo_Tshirt.png",
  },
  "pullover-hoodie": {
    slug: "pullover-hoodie",
    fallbackImage: "/mockups/hoodie-black.webp",
  },
};
