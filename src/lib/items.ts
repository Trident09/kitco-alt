import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp,
  Timestamp, writeBatch, getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import type { StashItem } from "@/types";

function toItem(id: string, data: Record<string, unknown>): StashItem {
  const ts = (v: unknown) =>
    v instanceof Timestamp ? v.toMillis() : typeof v === "number" ? v : Date.now();
  return {
    id,
    listId: data.listId as string,
    uid: data.uid as string,
    name: (data.name as string) ?? "",
    url: (data.url as string) ?? "",
    image: (data.image as string) ?? "",
    price: (data.price as string) ?? "",
    description: (data.description as string) ?? "",
    notes: (data.notes as string) ?? "",
    tags: (data.tags as string[]) ?? [],
    purchased: (data.purchased as boolean) ?? false,
    order: (data.order as number) ?? 0,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
}

export function subscribeItems(listId: string, cb: (items: StashItem[]) => void) {
  const q = query(collection(db, "items"), where("listId", "==", listId));
  let lastCount = -1;
  return onSnapshot(q, (snap) => {
    const items = snap.docs
      .map((d) => toItem(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.order - b.order);
    cb(items);
    // Only update itemCount once writes are confirmed, to avoid premature counts
    if (!snap.metadata.hasPendingWrites && items.length !== lastCount) {
      lastCount = items.length;
      updateDoc(doc(db, "lists", listId), { itemCount: items.length }).catch(() => {});
    }
  }, (err) => {
    console.error("[subscribeItems] error:", err);
  });
}

export type ItemInput = Omit<StashItem, "id" | "createdAt" | "updatedAt" | "order"> & {
  purchased?: boolean;
};

export async function createItem(input: ItemInput, order: number): Promise<string> {
  const ref = await addDoc(collection(db, "items"), {
    ...input,
    purchased: input.purchased ?? false,
    order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateItem(id: string, patch: Partial<Omit<StashItem, "id" | "uid" | "listId" | "createdAt">>) {
  await updateDoc(doc(db, "items", id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteItem(id: string) {
  await deleteDoc(doc(db, "items", id));
}

export async function deleteItemsByList(listId: string) {
  const q = query(collection(db, "items"), where("listId", "==", listId));
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function reorderItems(items: { id: string; order: number }[]) {
  const batch = writeBatch(db);
  items.forEach(({ id, order }) =>
    batch.update(doc(db, "items", id), { order })
  );
  await batch.commit();
}
