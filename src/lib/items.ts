import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp,
  Timestamp, writeBatch,
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
    // sync itemCount back to the list doc when it changes
    if (items.length !== lastCount) {
      lastCount = items.length;
      updateDoc(doc(db, "lists", listId), { itemCount: items.length }).catch(() => {});
    }
  });
}

export type ItemInput = Omit<StashItem, "id" | "createdAt" | "updatedAt" | "order">;

export async function createItem(input: ItemInput, order: number): Promise<string> {
  const ref = await addDoc(collection(db, "items"), {
    ...input,
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

export async function reorderItems(items: { id: string; order: number }[]) {
  const batch = writeBatch(db);
  items.forEach(({ id, order }) =>
    batch.update(doc(db, "items", id), { order })
  );
  await batch.commit();
}
