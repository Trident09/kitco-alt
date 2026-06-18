"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

interface Item {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  description: string;
  price: string;
  order: number;
}

interface ShelfList {
  name: string;
  description: string;
  isPublic: boolean;
}

export default function ListDetail({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();

  const [list, setList] = useState<ShelfList | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // item form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // editing list meta
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaName, setMetaName] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid, "lists", listId)).then((snap) => {
      if (!snap.exists()) { router.replace("/dashboard"); return; }
      const data = snap.data() as ShelfList;
      setList(data);
      setMetaName(data.name);
      setMetaDesc(data.description);
    });
  }, [user, listId, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "lists", listId, "items"),
      orderBy("order", "asc")
    );
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item)));
    });
  }, [user, listId]);

  const resetForm = () => {
    setName(""); setUrl(""); setDescription(""); setPrice(""); setImageUrl("");
    setShowForm(false);
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);

    await addDoc(collection(db, "users", user.uid, "lists", listId, "items"), {
      name: name.trim(),
      url: url.trim(),
      imageUrl: imageUrl.trim(),
      description: description.trim(),
      price: price.trim(),
      order: items.length,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "users", user.uid, "lists", listId), {
      updatedAt: serverTimestamp(),
    });

    resetForm();
    setSaving(false);
  };

  const deleteItem = async (item: Item) => {
    if (!user || !confirm("Remove this item?")) return;
    await deleteDoc(doc(db, "users", user.uid, "lists", listId, "items", item.id));
  };

  const togglePublic = async () => {
    if (!user || !list) return;
    const next = !list.isPublic;
    await updateDoc(doc(db, "users", user.uid, "lists", listId), { isPublic: next });
    setList((l) => l ? { ...l, isPublic: next } : l);
  };

  const saveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !metaName.trim()) return;
    await updateDoc(doc(db, "users", user.uid, "lists", listId), {
      name: metaName.trim(),
      description: metaDesc.trim(),
      updatedAt: serverTimestamp(),
    });
    setList((l) => l ? { ...l, name: metaName.trim(), description: metaDesc.trim() } : l);
    setEditingMeta(false);
  };

  if (loading || !user || !list) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <Link href="/dashboard" className="text-sm mb-6 inline-block hover:underline" style={{ color: "var(--muted)" }}>
          ← My Shelves
        </Link>

        {/* List header */}
        {editingMeta ? (
          <form onSubmit={saveMeta} className="mb-8 flex flex-col gap-3">
            <input
              value={metaName}
              onChange={(e) => setMetaName(e.target.value)}
              required
              className="text-2xl font-bold bg-transparent border-b outline-none pb-1"
              style={{ color: "var(--text)", borderColor: "var(--purple)" }}
            />
            <textarea
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              rows={2}
              className="text-sm bg-transparent border-b outline-none resize-none pb-1"
              style={{ color: "var(--muted)", borderColor: "var(--border)" }}
            />
            <div className="flex gap-2">
              <button type="submit" className="text-sm px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: "var(--purple)", color: "#fff" }}>Save</button>
              <button type="button" onClick={() => setEditingMeta(false)} className="text-sm px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: "var(--border)", color: "var(--text)" }}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{list.name}</h1>
              {list.description && <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{list.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={togglePublic}
                className="text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: "var(--border)", color: list.isPublic ? "var(--purple-light)" : "var(--muted)" }}
              >
                {list.isPublic ? "🌐 Public" : "🔒 Private"}
              </button>
              <button
                onClick={() => setEditingMeta(true)}
                className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                style={{ background: "var(--border)", color: "var(--text)" }}
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Add item button */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90"
            style={{ background: "var(--purple)", color: "#fff" }}
          >
            {showForm ? "Cancel" : "+ Add Item"}
          </button>
        </div>

        {/* Add item form */}
        {showForm && (
          <form
            onSubmit={addItem}
            className="rounded-xl p-5 mb-6 flex flex-col gap-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <input
              type="text"
              placeholder="Item name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <input
              type="url"
              placeholder="Product URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <input
              type="text"
              placeholder="Price (e.g. $49)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <input
              type="url"
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            {imageUrl && (
              <Image src={imageUrl} alt="preview" width={80} height={80} className="rounded-lg object-cover" unoptimized />
            )}
            <button
              type="submit"
              disabled={saving}
              className="self-end px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--purple)", color: "#fff" }}
            >
              {saving ? "Saving…" : "Add Item"}
            </button>
          </form>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--muted)" }}>
            <p className="text-4xl mb-4">🛋️</p>
            <p>Nothing on this shelf yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group rounded-xl p-4 flex gap-4 items-start"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={72}
                    height={72}
                    className="rounded-lg object-cover shrink-0"
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-[72px] h-[72px] rounded-lg shrink-0 flex items-center justify-center text-2xl"
                    style={{ background: "var(--border)" }}
                  >
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "var(--purple-light)" }}>
                          {item.name}
                        </a>
                      ) : (
                        <span className="font-semibold" style={{ color: "var(--text)" }}>{item.name}</span>
                      )}
                      {item.price && <span className="ml-2 text-sm" style={{ color: "var(--muted)" }}>{item.price}</span>}
                    </div>
                    <button
                      onClick={() => deleteItem(item)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-sm cursor-pointer shrink-0"
                      style={{ color: "var(--muted)" }}
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                  {item.description && <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
