export type TextLayer = {
  id: string;
  type: "text";
  x: number;
  y: number;
  rotation: number;
  content: string;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  color: string;
  fontSize: number;
  widthPct?: number;
};

export type ImageLayer = {
  id: string;
  type: "image";
  x: number;
  y: number;
  rotation: number;
  src: string;
  widthPct: number;
};

export type DesignLayer = TextLayer | ImageLayer;

export type DesignSurfaceKey =
  | "front"
  | "back"
  | "fullFront"
  | "leftChest"
  | "rightChest"
  | "fullBack"
  | "upperBack"
  | "fullWrap";

export type DesignSides = Partial<Record<DesignSurfaceKey, DesignLayer[]>> & {
  front: DesignLayer[];
  back: DesignLayer[];
};

export const DESIGN_SURFACE_OPTIONS: { id: DesignSurfaceKey; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "fullFront", label: "Full Front" },
  { id: "leftChest", label: "Left Chest" },
  { id: "rightChest", label: "Right Chest" },
  { id: "back", label: "Back" },
  { id: "fullBack", label: "Full Back" },
  { id: "upperBack", label: "Upper Back" },
  { id: "fullWrap", label: "Full Wrap" },
];

export function createDefaultDesignState(): DesignSides {
  return {
    front: [],
    back: [],
    fullFront: [],
    leftChest: [],
    rightChest: [],
    fullBack: [],
    upperBack: [],
    fullWrap: [],
  };
}

export const STARTER_FONT_OPTIONS = [
  "Montserrat",
  "Oswald",
  "Roboto",
  "Poppins",
  "Bebas Neue",
  "Archivo Black",
  "Playfair Display",
  "Lobster",
];
