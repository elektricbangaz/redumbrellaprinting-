"use client";

import type { DesignSides } from "@/lib/designer-types";
import type { PrintZoneId } from "@/lib/garment-models";
import type { SupplyMode } from "@/lib/designer-pricing";
import type { DecorationMethod } from "@/lib/design-document";
import {
  surfaceStateFromLegacy,
  type DesignSurfaceId,
  type SurfaceDesignState,
} from "@/lib/design-surfaces";

export type DesignerDraft = {
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

export async function saveDesignerDraft(draft: DesignerDraft) {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const value: DesignerDraft = {
    ...draft,
    activeSurfaceId: draft.activeSurfaceId ?? draft.printZoneId,
    surfaces: draft.surfaces ?? surfaceStateFromLegacy(draft.design),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadDesignerDraft() {
  if (typeof indexedDB === "undefined") return null as DesignerDraft | null;
  const db = await openDb();
  const result = await new Promise<DesignerDraft | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(KEY);
    request.onsuccess = () => {
      const draft = (request.result as DesignerDraft | undefined) ?? null;
      if (!draft) return resolve(null);
      resolve({
        ...draft,
        activeSurfaceId: draft.activeSurfaceId ?? draft.printZoneId,
        surfaces: draft.surfaces ?? surfaceStateFromLegacy(draft.design),
      });
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
