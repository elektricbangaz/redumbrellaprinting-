"use client";

import type { DesignSides } from "@/lib/designer-types";
import type { PrintZoneId } from "@/lib/garment-models";
import type { SupplyMode } from "@/lib/designer-pricing";
import type { DecorationMethod } from "@/lib/design-document";
import {
  editorSideForSurface,
  surfaceStateFromLegacy,
  type DesignSurfaceId,
  type SurfaceDesignState,
} from "@/lib/design-surfaces";

export type DesignerDraftV2 = {
  version: 2;
  savedAt: number;
  productId: string;
  productSlug?: string;
  productName?: string;
  color: string;
  customColor: string;
  size: string;
  quantity: number;
  activeSurfaceId: DesignSurfaceId;
  surfaces: SurfaceDesignState;
  supplyMode: SupplyMode;
  decorationMethod?: DecorationMethod;
};

type DesignerDraftV1 = {
  version: 1;
  savedAt: number;
  productId: string;
  productSlug?: string;
  productName?: string;
  color: string;
  customColor: string;
  size: string;
  quantity: number;
  side: "front" | "back";
  design: DesignSides;
  printZoneId: PrintZoneId;
  supplyMode: SupplyMode;
  decorationMethod?: DecorationMethod;
  activeSurfaceId?: DesignSurfaceId;
  surfaces?: SurfaceDesignState;
};

export type DesignerDraft = DesignerDraftV2;

const DB_NAME = "red-umbrella-design-lab";
const DB_VERSION = 1;
const STORE = "drafts";
const KEY = "active";

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function migrateDraft(value: DesignerDraftV1 | DesignerDraftV2): DesignerDraftV2 {
  if (value.version === 2) return value;

  const activeSurfaceId = value.activeSurfaceId ?? value.printZoneId ?? (value.side === "back" ? "full-back" : "full-front");
  return {
    version: 2,
    savedAt: value.savedAt,
    productId: value.productId,
    productSlug: value.productSlug,
    productName: value.productName,
    color: value.color,
    customColor: value.customColor,
    size: value.size,
    quantity: Math.max(1, value.quantity || 1),
    activeSurfaceId,
    surfaces: value.surfaces ?? surfaceStateFromLegacy(value.design ?? { front: [], back: [] }),
    supplyMode: value.supplyMode ?? "red-umbrella",
    decorationMethod: value.decorationMethod,
  };
}

export async function saveDesignerDraft(draft: DesignerDraftV2) {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(draft, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadDesignerDraft() {
  if (typeof indexedDB === "undefined") return null as DesignerDraftV2 | null;
  const db = await openDb();
  const result = await new Promise<DesignerDraftV2 | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(KEY);
    request.onsuccess = () => {
      const raw = request.result as DesignerDraftV1 | DesignerDraftV2 | undefined;
      resolve(raw ? migrateDraft(raw) : null);
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}

export async function clearDesignerDraft() {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function legacySideFromDraft(draft: DesignerDraftV2): "front" | "back" {
  return editorSideForSurface(draft.activeSurfaceId);
}
