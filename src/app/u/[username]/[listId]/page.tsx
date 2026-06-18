"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Item {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  description: string;
  price: string;
  order: number;
}

interface ListMeta {
  name: string;
  description: string;
  isPublic: boolean;
}

export default function PublicListPage({
  params,
}: {
  params: Promise<{ username: string; listId: string }>;
}) {
  const { username, listId } = use(params);
  const [listMeta, setListMeta] = useState<ListMeta | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<"loading" | "notfound" | "ok">("loading");

  useEffect(() => {
    const load = async () => {
      // Resolve username → uid
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("displayName", "==", username), limit(1))
      );
      if (usersSnap.empty) { setStatus("notfound"); return; }

      const uid = usersSnap.docs[0].id;
      const listSnap = await getDoc(doc(db, "users", uid, "lists", listId));

      if (!listSnap.exists() || !listSnap.data()?.isPublic) {
        setStatus("notfound");
        return;
      }

      setListMeta(listSnap.data() as ListMeta);

      const itemsSnap = await getDocs(
        query(collection(db, "users", uid, "lists", listId, "items"))
      );
      const sorted = itemsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Item))
        .sort((a, b) => a.order - b.order);
      setItems(sorted);
      setStatus("ok");
    };
    load();
  }, [username, listId]);

  if (status === "loading") return null;

  if (status === "notfound") {
    return (
      <main className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center" style={{ color: "var(--muted)" }}>
          <p className="text-4xl mb-4">🔒</p>
          <p>This shelf is private or doesn&apos;t exist.</p>
          <Link href="/" className="mt-4 inline-block text-sm hover:underline" style={{ color: "var(--purple-light)" }}>
            Go to Shelfie
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      {/* Back */}
      <Link href={`/u/${username}`} className="text-sm mb-6 inline-block hover:underline" style={{ color: "var(--muted)" }}>
        ← {username}&apos;s shelves
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{listMeta?.name}</h1>
        {listMeta?.description && (
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{listMeta.description}</p>
        )}
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Nothing here yet.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl p-4 flex gap-4 items-start"
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
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline"
                    style={{ color: "var(--purple-light)" }}
                  >
                    {item.name}
                  </a>
                ) : (
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{item.name}</span>
                )}
                {item.price && (
                  <span className="ml-2 text-sm" style={{ color: "var(--muted)" }}>{item.price}</span>
                )}
                {item.description && (
                  <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Branding */}
      <div className="mt-12 text-center">
        <Link href="/" className="text-sm" style={{ color: "var(--muted)" }}>
          Made with <span style={{ color: "var(--purple-light)" }}>Shelfie</span>
        </Link>
      </div>
    </main>
  );
}
