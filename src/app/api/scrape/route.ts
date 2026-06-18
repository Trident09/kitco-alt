import { NextRequest, NextResponse } from "next/server";

function meta(html: string, ...patterns: RegExp[]): string {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({}, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Stashly/1.0; +https://stashly.app)" },
      signal: AbortSignal.timeout(6000),
    });
    const html = await res.text();

    const image =
      meta(html,
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
      );

    const name =
      meta(html,
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      );

    const description =
      meta(html,
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
      );

    // price — try common structured data patterns and meta tags
    const price =
      meta(html,
        /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']product:price:amount["']/i,
        /"price"\s*:\s*"([^"]+)"/i,
        /"price"\s*:\s*([\d.]+)/,
        /itemprop=["']price["'][^>]+content=["']([^"']+)["']/i,
      );

    const currency =
      meta(html,
        /<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']product:price:currency["']/i,
      );

    const priceFormatted = price
      ? currency ? `${currency} ${price}` : price
      : "";

    return NextResponse.json({
      name: name.replace(/\s*[\|\-–]\s*.*$/, "").trim(), // strip site name suffix
      image,
      description: description.slice(0, 300),
      price: priceFormatted,
    });
  } catch {
    return NextResponse.json({});
  }
}
