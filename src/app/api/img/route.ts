// src/app/api/img/route.ts
// Проксі для зображень Numista — обходить hotlink-захист CDN

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url param', { status: 400 });
  }

  // Дозволяємо тільки домени Numista
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  const allowed = ['en.numista.com', 'numista.com', 'www.numista.com'];
  if (!allowed.includes(parsed.hostname)) {
    return new NextResponse('Forbidden domain', { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        // Відправляємо Referer від імені numista.com щоб обійти hotlink-захист
        Referer: 'https://en.numista.com/',
        'User-Agent': 'Mozilla/5.0 (compatible; BaronCoin/1.0)',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Кешуємо 7 днів на CDN і 1 день на клієнті
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    });
  } catch {
    return new NextResponse('Fetch failed', { status: 502 });
  }
}
