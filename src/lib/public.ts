import { doc, getDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { StashList, StashItem } from "@/types";

function ts(v: unknown) {
  return v instanceof Timestamp ? v.toMillis() : typeof v === "number" ? v : Date.now();
}

export async function getPublicList(listId: string): Promise<StashList | null> {
  const snap = await getDoc(doc(db, "lists", listId));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (!d.isPublic) return null;
  return {
    id: snap.id,
    uid: d.uid,
    name: d.name,
    description: d.description ?? "",
    isPublic: d.isPublic,
    createdAt: ts(d.createdAt),
    updatedAt: ts(d.updatedAt),
    itemCount: d.itemCount ?? 0,
    tagOrder: (d.tagOrder as string[]) ?? [],
    cover: (d.cover as string) ?? "",
  };
}

export async function getPublicItems(listId: string): Promise<StashItem[]> {
  const q = query(collection(db, "items"), where("listId", "==", listId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        listId: data.listId,
        uid: data.uid,
        name: data.name ?? "",
        url: data.url ?? "",
        image: data.image ?? "",
        price: data.price ?? "",
        description: data.description ?? "",
        notes: data.notes ?? "",
        tags: data.tags ?? [],
        purchased: data.purchased ?? false,
        order: data.order ?? 0,
        createdAt: ts(data.createdAt),
        updatedAt: ts(data.updatedAt),
      } as StashItem;
    })
    .sort((a, b) => a.order - b.order);
}
