import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { StashList } from "@/types";

function toList(id: string, data: Record<string, unknown>): StashList {
  const ts = (v: unknown) =>
    v instanceof Timestamp ? v.toMillis() : typeof v === "number" ? v : Date.now();
  return {
    id,
    uid: data.uid as string,
    name: data.name as string,
    description: (data.description as string) ?? "",
    isPublic: (data.isPublic as boolean) ?? false,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
    itemCount: (data.itemCount as number) ?? 0,
  };
}

export function subscribeLists(uid: string, cb: (lists: StashList[]) => void) {
  const q = query(collection(db, "lists"), where("uid", "==", uid));
  return onSnapshot(q, (snap) => {
    const lists = snap.docs
      .map((d) => toList(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt - a.createdAt);
    cb(lists);
  });
}

export async function createList(uid: string, name: string): Promise<string> {
  const ref = await addDoc(collection(db, "lists"), {
    uid,
    name,
    description: "",
    isPublic: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    itemCount: 0,
  });
  return ref.id;
}

export async function updateList(id: string, patch: Partial<Pick<StashList, "name" | "description" | "isPublic">>) {
  await updateDoc(doc(db, "lists", id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteList(id: string) {
  await deleteDoc(doc(db, "lists", id));
}
