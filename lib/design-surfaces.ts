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

export function editorSideForSurface(id: DesignSurfaceId): "front" | "back" {
  return sideForSurface(id) === "back" ? "back" : "front";
}

export function emptySurfaceDesign(): SurfaceDesignState {
  return {};
}

export function defaultSurfaceIdForPreviewMode(
  previewMode?: "apparel3d" | "cylinder3d" | "flat" | "vehicle"
): DesignSurfaceId {
  if (previewMode === "cylinder3d") return "full-wrap";
  if (previewMode === "flat" || previewMode === "vehicle") return "custom";
  return "full-front";
}

export function surfaceStateFromLegacy(design: DesignSides): SurfaceDesignState {
  const surfaces: SurfaceDesignState = {};
  if (design.front.length) surfaces["full-front"] = design.front;
  if (design.back.length) surfaces["full-back"] = design.back;
  return surfaces;
}

/**
 * Compatibility projection for legacy consumers that still expect front/back arrays.
 * All garment surfaces are retained by flattening them into their visual side.
 */
export function legacyDesignFromSurfaces(surfaces: SurfaceDesignState): DesignSides {
  const front: DesignLayer[] = [];
  const back: DesignLayer[] = [];

  for (const surface of DESIGN_SURFACES) {
    const layers = surfaces[surface.id] ?? [];
    if (!layers.length) continue;
    if (surface.side === "back") back.push(...layers);
    else if (surface.side === "front" || surface.side === "wrap" || surface.side === "custom") front.push(...layers);
  }

  return { front, back };
}

/**
 * Projection used by a single-surface renderer. Only the active placement is
 * projected so a left-chest design is not accidentally stamped into Full Front.
 */
export function legacyDesignForActiveSurface(
  surfaces: SurfaceDesignState,
  activeSurfaceId: DesignSurfaceId
): DesignSides {
  const activeSide = editorSideForSurface(activeSurfaceId);
  const activeLayers = surfaces[activeSurfaceId] ?? [];
  return activeSide === "back"
    ? { front: [], back: activeLayers }
    : { front: activeLayers, back: [] };
}

export function layersForSurface(surfaces: SurfaceDesignState, surfaceId: DesignSurfaceId) {
  return surfaces[surfaceId] ?? [];
}

export function updateSurfaceLayers(
  surfaces: SurfaceDesignState,
  surfaceId: DesignSurfaceId,
  updater: (layers: DesignLayer[]) => DesignLayer[]
): SurfaceDesignState {
  const nextLayers = updater(surfaces[surfaceId] ?? []);
  const next = { ...surfaces };
  if (nextLayers.length) next[surfaceId] = nextLayers;
  else delete next[surfaceId];
  return next;
}

export function mapSurfaceLayers(
  surfaces: SurfaceDesignState,
  mapper: (layer: DesignLayer, surfaceId: DesignSurfaceId) => DesignLayer
): SurfaceDesignState {
  const next: SurfaceDesignState = {};
  for (const surface of DESIGN_SURFACES) {
    const layers = surfaces[surface.id];
    if (!layers?.length) continue;
    next[surface.id] = layers.map((layer) => mapper(layer, surface.id));
  }
  return next;
}

export function hasDesignOnSide(surfaces: SurfaceDesignState, side: "front" | "back") {
  return DESIGN_SURFACES.some(
    (surface) => surface.side === side && (surfaces[surface.id]?.length ?? 0) > 0
  );
}

export function populatedSurfaceIds(surfaces: SurfaceDesignState): DesignSurfaceId[] {
  return DESIGN_SURFACES
    .filter((surface) => (surfaces[surface.id]?.length ?? 0) > 0)
    .map((surface) => surface.id);
}
