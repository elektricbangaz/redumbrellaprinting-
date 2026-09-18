export type PrintZoneId =
  | "full-front"
  | "left-chest"
  | "right-chest"
  | "full-back"
  | "upper-back";

export type PrintZoneConfig = {
  id: PrintZoneId;
  label: string;
  side: "front" | "back";
  x: number;
  y: number;
  width: number;
  height: number;
  projectionScale: [number, number];
  projectionOffset: [number, number];
};

export type GarmentModelConfig = {
  slug: string;
  modelUrl?: string;
  fallbackImage: string;
  scale?: number;
  rotation?: [number, number, number];
  printScale?: [number, number];
  frontOffset?: number;
  printZones?: PrintZoneConfig[];
};

const TEE_ZONES: PrintZoneConfig[] = [
  {
    id: "full-front",
    label: "Full Front",
    side: "front",
    x: 22,
    y: 27,
    width: 56,
    height: 49,
    projectionScale: [0.38, 0.46],
    projectionOffset: [0, -0.07],
  },
  {
    id: "left-chest",
    label: "Left Chest",
    side: "front",
    x: 54,
    y: 29,
    width: 20,
    height: 18,
    projectionScale: [0.16, 0.16],
    projectionOffset: [0.18, 0.18],
  },
  {
    id: "right-chest",
    label: "Right Chest",
    side: "front",
    x: 26,
    y: 29,
    width: 20,
    height: 18,
    projectionScale: [0.16, 0.16],
    projectionOffset: [-0.18, 0.18],
  },
  {
    id: "full-back",
    label: "Full Back",
    side: "back",
    x: 22,
    y: 25,
    width: 56,
    height: 51,
    projectionScale: [0.38, 0.46],
    projectionOffset: [0, -0.06],
  },
  {
    id: "upper-back",
    label: "Upper Back",
    side: "back",
    x: 31,
    y: 24,
    width: 38,
    height: 18,
    projectionScale: [0.28, 0.16],
    projectionOffset: [0, 0.2],
  },
];

export const GARMENT_MODELS: Record<string, GarmentModelConfig> = {
  "standard-t-shirt": {
    slug: "standard-t-shirt",
    modelUrl: "/mockups/Tshirt.glb",
    fallbackImage: "https://res.cloudinary.com/crtuavbs/image/upload/v1789409906/Tshirt.png",
    printScale: [0.38, 0.46],
    frontOffset: 0.012,
    printZones: TEE_ZONES,
  },
  "polo-shirt": {
    slug: "polo-shirt",
    modelUrl: "/mockups/Polo%20Tshirt.glb",
    fallbackImage: "https://res.cloudinary.com/crtuavbs/image/upload/v1789409906/Polo_Tshirt.png",
    printZones: TEE_ZONES,
  },
  "pullover-hoodie": {
    slug: "pullover-hoodie",
    fallbackImage: "/mockups/hoodie-black.webp",
    printZones: TEE_ZONES,
  },
};
