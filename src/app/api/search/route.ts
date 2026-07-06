import { NextRequest, NextResponse } from "next/server";

export interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
  image?: string;
  price?: string;
  brand?: string;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q?.trim()) return NextResponse.json({ results: [] });

  try {
    const apiUrl = `https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(q.trim())}&type=product`;

    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Stashly/1.0",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 429) {
      return NextResponse.json({ results: [], error: "too_fast" }, { status: 429 });
    }

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();

    if (data.code === "TOO_FAST") {
      return NextResponse.json({ results: [], error: "too_fast" }, { status: 429 });
    }

    type UPCItem = {
      title?: string;
      description?: string;
      brand?: string;
      images?: string[];
      lowest_recorded_price?: number;
      highest_recorded_price?: number;
      offers?: Array<{ link?: string; domain?: string; merchant?: string; price?: number }>;
    };

    const items: UPCItem[] = data.items ?? [];

    const results: SearchResult[] = items
      .filter((item) => item.title)
      .slice(0, 8)
      .map((item) => {
        // Pick best offer link, fallback to upcitemdb search
        const offer = item.offers?.[0];
        const url = offer?.link ?? `https://www.google.com/search?q=${encodeURIComponent(item.title ?? "")}`;
        const domain = offer?.domain ?? "google.com";

        // Pick best price
        const price = offer?.price
          ? `$${offer.price}`
          : item.lowest_recorded_price
            ? `$${item.lowest_recorded_price}`
            : "";

        return {
          title: item.title ?? "",
          url,
          displayUrl: domain.replace(/^www\./, ""),
          snippet: item.description?.slice(0, 180) ?? "",
          image: item.images?.[0] ?? "",
          price,
          brand: item.brand ?? "",
        };
      });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[/api/search] error:", err);
    return NextResponse.json({ results: [] });
  }
}
