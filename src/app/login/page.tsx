"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function handleGoogleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider);
      router.replace("/dashboard");
    } catch (err) {
      console.error("Sign-in failed:", err);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — branding / feature highlights */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-14 border-r border-border">
        <Logo />

        <div className="space-y-10">
          <h2 className="text-4xl font-semibold leading-snug text-foreground">
            Everything you want to buy,<br />
            <span className="text-violet-400">organized in one place.</span>
          </h2>

          <ul className="space-y-5">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="mt-0.5 text-violet-500 text-xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{f.title}</p>
                  <p className="text-sm text-muted">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted">© 2026 Stashly. All rights reserved.</p>
      </div>

      {/* Right — sign in */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm flex flex-col gap-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden">
            <Logo />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted">Sign in to access your stashes.</p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border text-foreground text-sm font-medium hover:border-violet-500 hover:bg-surface-2 transition-all cursor-pointer"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-xs text-muted text-center leading-relaxed">
            By signing in, you agree to keep your stashes private unless you choose to share them.
          </p>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: "◈",
    title: "Multiple lists, any theme",
    desc: "Create separate lists for tech gear, travel essentials, home finds — anything.",
  },
  {
    icon: "⬡",
    title: "Rich product details",
    desc: "Save the URL, price, image, your notes — everything you need to decide later.",
  },
  {
    icon: "◎",
    title: "Private by default",
    desc: "Your lists are yours alone. Share only when you're ready.",
  },
  {
    icon: "⊹",
    title: "Drag to reorder",
    desc: "Arrange items exactly how you want them, your way.",
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm select-none">
        S
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">Stashly</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
