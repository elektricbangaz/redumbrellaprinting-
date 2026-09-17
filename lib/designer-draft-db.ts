"use client";

import type { DesignSides } from "@/lib/designer-types";
import type { PrintZoneId } from "@/lib/garment-models";
import type { SupplyMode } from "@/lib/designer-pricing";

export type DesignerDraft = {
  version: 1;
  savedAt: number;
  productId: string;
  color: string;
  customColor: string;
  size: string;
  quantity: number;
  side: "front" | "back";
  design: DesignSides;
  printZoneId: PrintZoneId;
  supplyMode: SupplyMode;
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
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(draft, KEY);
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
    request.onsuccess = () => resolve((request.result as DesignerDraft | undefined) ?? null);
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
