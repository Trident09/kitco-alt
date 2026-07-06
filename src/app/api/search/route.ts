import { NextRequest, NextResponse } from "next/server";

export interface SearchResult {
  title: string;
  url: string;
  displayUrl: string;
  snippet: string;
}

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim();
}

/** Extract hostname for display (e.g. "amazon.in") */
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

  try {
    // DuckDuckGo HTML search — no API key needed
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=in-en`;

    const res = await fetch(ddgUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://duckduckgo.com/",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return NextResponse.json({ results: [] });

    const html = await res.text();
    const results: SearchResult[] = [];

    // DDG HTML result blocks are wrapped in <div class="result results_links...">
    // Each result has: .result__a (title+link), .result__url (display url), .result__snippet
    const resultBlockRe = /<div[^>]+class="[^"]*result[^"]*results_links[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    let blockMatch: RegExpExecArray | null;

    while ((blockMatch = resultBlockRe.exec(html)) !== null && results.length < 8) {
      const block = blockMatch[1];

      // Extract href from result__a
      const hrefMatch = block.match(/href="\/\/duckduckgo\.com\/l\/\?uddg=([^"&]+)/i)
        || block.match(/class="result__a"[^>]*href="([^"]+)"/i)
        || block.match(/href="([^"]+)"[^>]*class="result__a"/i);

      let url = "";
      if (hrefMatch) {
        const raw = hrefMatch[1];
        // DDG wraps URLs in a redirect — decode it
        url = raw.startsWith("http") ? raw : decodeURIComponent(raw);
      }

      // Extract title text
      const titleMatch = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/i);
      const title = titleMatch ? stripHtml(titleMatch[1]) : "";

      // Extract snippet
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i)
        || block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/span>/i);
      const snippet = snippetMatch ? stripHtml(snippetMatch[1]) : "";

      if (url && title && !url.includes("duckduckgo.com")) {
        results.push({
          title,
          url,
          displayUrl: displayUrl(url),
          snippet,
        });
      }
    }

    // Fallback: try a simpler regex if block parsing got nothing
    if (results.length === 0) {
      const simpleLinkRe = /class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m: RegExpExecArray | null;
      while ((m = simpleLinkRe.exec(html)) !== null && results.length < 8) {
        let url = m[1];
        if (url.startsWith("//duckduckgo.com/l/?uddg=")) {
          url = decodeURIComponent(url.replace("//duckduckgo.com/l/?uddg=", ""));
        }
        const title = stripHtml(m[2]);
        if (url.startsWith("http") && title && !url.includes("duckduckgo.com")) {
          results.push({ title, url, displayUrl: displayUrl(url), snippet: "" });
        }
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[/api/search] error:", err);
    return NextResponse.json({ results: [] });
  }
}
