"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

interface ShelfList {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: { seconds: number } | null;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [lists, setLists] = useState<ShelfList[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "lists"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShelfList)));
    });
    return unsub;
  }, [user]);

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setCreating(true);
    await addDoc(collection(db, "users", user.uid, "lists"), {
      name: name.trim(),
      description: desc.trim(),
      isPublic: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setName("");
    setDesc("");
    setShowForm(false);
    setCreating(false);
  };

  const deleteList = async (listId: string) => {
    if (!user || !confirm("Delete this shelf?")) return;
    await deleteDoc(doc(db, "users", user.uid, "lists", listId));
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              My Shelves
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {lists.length} {lists.length === 1 ? "shelf" : "shelves"}
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-lg font-medium cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "var(--purple)", color: "#fff" }}
          >
            {showForm ? "Cancel" : "+ New Shelf"}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form
            onSubmit={createList}
            className="rounded-xl p-5 mb-6 flex flex-col gap-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <input
              type="text"
              placeholder="Shelf name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
            <textarea
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none focus:ring-1"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
            <button
              type="submit"
              disabled={creating}
              className="self-end px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--purple)", color: "#fff" }}
            >
              {creating ? "Creating…" : "Create Shelf"}
            </button>
          </form>
        )}

        {/* List grid */}
        {lists.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--muted)" }}>
            <p className="text-4xl mb-4">📦</p>
            <p>No shelves yet. Create your first one.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {lists.map((list) => (
              <div
                key={list.id}
                className="group rounded-xl p-5 flex items-center justify-between transition-colors"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <Link href={`/lists/${list.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold truncate" style={{ color: "var(--text)" }}>
                      {list.name}
                    </h2>
                    {list.isPublic && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: "var(--border)", color: "var(--purple-light)" }}
                      >
                        public
                      </span>
                    )}
                  </div>
                  {list.description && (
                    <p className="text-sm mt-1 truncate" style={{ color: "var(--muted)" }}>
                      {list.description}
                    </p>
                  )}
                </Link>
                <button
                  onClick={() => deleteList(list.id)}
                  className="ml-4 text-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ color: "var(--muted)" }}
                  aria-label="Delete shelf"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
