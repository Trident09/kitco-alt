"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PublicUser {
  uid: string;
  displayName: string;
  photoURL: string;
  profilePublic: boolean;
}

interface PublicList {
  id: string;
  name: string;
  description: string;
}

export default function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [lists, setLists] = useState<PublicList[]>([]);
  const [status, setStatus] = useState<"loading" | "notfound" | "private" | "ok">("loading");

  useEffect(() => {
    const load = async () => {
      // Find user by displayName
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("displayName", "==", username), limit(1))
      );
      if (usersSnap.empty) { setStatus("notfound"); return; }

      const userDoc = usersSnap.docs[0];
      const userData = userDoc.data() as PublicUser;
      userData.uid = userDoc.id;

      if (!userData.profilePublic) { setStatus("private"); return; }

      setProfileUser(userData);

      const listsSnap = await getDocs(
        query(collection(db, "users", userDoc.id, "lists"), where("isPublic", "==", true))
      );
      setLists(listsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicList)));
      setStatus("ok");
    };
    load();
  }, [username]);

  if (status === "loading") return null;

  if (status === "notfound" || status === "private") {
    return (
      <main className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center" style={{ color: "var(--muted)" }}>
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-lg">This profile is private or doesn&apos;t exist.</p>
          <Link href="/" className="mt-4 inline-block text-sm hover:underline" style={{ color: "var(--purple-light)" }}>
            Go to Shelfie
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-10">
        {profileUser?.photoURL && (
          <Image
            src={profileUser.photoURL}
            alt={profileUser.displayName}
            width={56}
            height={56}
            className="rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {profileUser?.displayName}&apos;s Shelves
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {lists.length} public {lists.length === 1 ? "shelf" : "shelves"}
          </p>
        </div>
      </div>

      {/* Lists */}
      {lists.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No public shelves yet.</p>
      ) : (
        <div className="grid gap-4">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/u/${username}/${list.id}`}
              className="block rounded-xl p-5 transition-colors"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h2 className="font-semibold" style={{ color: "var(--text)" }}>{list.name}</h2>
              {list.description && (
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{list.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
