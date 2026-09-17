import type { DesignLayer, DesignSides } from "@/lib/designer-types";

export type DesignSurfaceId =
  | "full-front"
  | "left-chest"
  | "right-chest"
  | "full-back"
  | "upper-back"
  | "left-sleeve"
  | "right-sleeve"
  | "hem-tail"
  | "full-wrap"
  | "custom";

export type SurfaceSide = "front" | "back" | "wrap" | "custom";

export type DesignSurfaceDefinition = {
  id: DesignSurfaceId;
  label: string;
  side: SurfaceSide;
  supportsGarments?: boolean;
  supportsCylinders?: boolean;
  supportsFlatProducts?: boolean;
};

export type SurfaceDesignState = Partial<Record<DesignSurfaceId, DesignLayer[]>>;

export const DESIGN_SURFACES: DesignSurfaceDefinition[] = [
  { id: "full-front", label: "Full Front", side: "front", supportsGarments: true },
  { id: "left-chest", label: "Left Chest", side: "front", supportsGarments: true },
  { id: "right-chest", label: "Right Chest", side: "front", supportsGarments: true },
  { id: "full-back", label: "Full Back", side: "back", supportsGarments: true },
  { id: "upper-back", label: "Upper Back", side: "back", supportsGarments: true },
  { id: "left-sleeve", label: "Left Sleeve", side: "front", supportsGarments: true },
  { id: "right-sleeve", label: "Right Sleeve", side: "front", supportsGarments: true },
  { id: "hem-tail", label: "Hem / Tail", side: "front", supportsGarments: true },
  { id: "full-wrap", label: "Full Wrap", side: "wrap", supportsCylinders: true },
  { id: "custom", label: "Custom Surface", side: "custom", supportsFlatProducts: true },
];

const BY_ID = new Map(DESIGN_SURFACES.map((surface) => [surface.id, surface] as const));

export function getSurfaceDefinition(id: DesignSurfaceId) {
  return BY_ID.get(id);
}

export function sideForSurface(id: DesignSurfaceId): SurfaceSide {
  return BY_ID.get(id)?.side ?? "custom";
}

export function emptySurfaceDesign(): SurfaceDesignState {
  return {};
}

export function surfaceStateFromLegacy(design: DesignSides): SurfaceDesignState {
  const surfaces: SurfaceDesignState = {};
  if (design.front.length) surfaces["full-front"] = design.front;
  if (design.back.length) surfaces["full-back"] = design.back;
  return surfaces;
}

export function legacyDesignFromSurfaces(
  surfaces: SurfaceDesignState,
  activeSurfaceId: DesignSurfaceId = "full-front"
): DesignSides {
  const activeSide = sideForSurface(activeSurfaceId);
  const activeLayers = surfaces[activeSurfaceId] ?? [];

  return {
    front:
      activeSide === "front"
        ? activeLayers
        : surfaces["full-front"] ?? surfaces["left-chest"] ?? surfaces["right-chest"] ?? [],
    back:
      activeSide === "back"
        ? activeLayers
        : surfaces["full-back"] ?? surfaces["upper-back"] ?? [],
  };
}

export function layersForSurface(surfaces: SurfaceDesignState, surfaceId: DesignSurfaceId) {
  return surfaces[surfaceId] ?? [];
}

export function updateSurfaceLayers(
  surfaces: SurfaceDesignState,
  surfaceId: DesignSurfaceId,
  updater: (layers: DesignLayer[]) => DesignLayer[]
): SurfaceDesignState {
  return {
    ...surfaces,
    [surfaceId]: updater(surfaces[surfaceId] ?? []),
  };
}

export function hasDesignOnSide(surfaces: SurfaceDesignState, side: "front" | "back") {
  return DESIGN_SURFACES.some(
    (surface) => surface.side === side && (surfaces[surface.id]?.length ?? 0) > 0
  );
}
