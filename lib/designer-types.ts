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

export type DesignSides = {
  front: DesignLayer[];
  back: DesignLayer[];
};

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
