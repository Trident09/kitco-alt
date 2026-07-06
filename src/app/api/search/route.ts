import { NextRequest, NextResponse } from "next/server";

export interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
}

function displayUrl(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q?.trim()) return NextResponse.json({ results: [] });

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { results: [], error: "BRAVE_SEARCH_API_KEY is not set. Get a free key at https://brave.com/search/api/" },
      { status: 503 }
    );
  }

  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", q.trim());
    url.searchParams.set("count", "8");
    url.searchParams.set("search_lang", "en");
    url.searchParams.set("country", "IN");
    url.searchParams.set("safesearch", "moderate");

    const res = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[/api/search] Brave API error:", res.status, text);
      return NextResponse.json({ results: [], error: `Search API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();

    // Brave returns results under data.web.results
    const raw: Array<{
      title?: string;
      url?: string;
      meta_url?: { hostname?: string };
      description?: string;
    }> = data?.web?.results ?? [];

    const results: SearchResult[] = raw
      .filter((r) => r.url && r.title)
      .map((r) => ({
        title: r.title ?? "",
        url: r.url ?? "",
        displayUrl: r.meta_url?.hostname?.replace(/^www\./, "") ?? displayUrl(r.url ?? ""),
        snippet: r.description ?? "",
      }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[/api/search] error:", err);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
