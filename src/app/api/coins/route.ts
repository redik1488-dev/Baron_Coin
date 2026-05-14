// app/api/coins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CoinService } from '@/lib/coinService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const shouldRefresh = req.nextUrl.searchParams.get('refresh') === 'true';

  try {
    const coins = shouldRefresh
      ? await CoinService.refreshCache()
      : await CoinService.getCatalog();

    return NextResponse.json({
      coins,
      count: coins.length,
      source: shouldRefresh ? 'api' : 'cache',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API /coins]', err);
    return NextResponse.json(
      { error: 'Помилка завантаження монет', coins: [] },
      { status: 500 }
    );
  }
}
