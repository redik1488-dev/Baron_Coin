// app/api/coins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CoinService } from '@/lib/coinService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const shouldRefresh = req.nextUrl.searchParams.get('refresh') === 'true';

  try {
    let coins: any[] = [];
    let rulerCounts: Record<string, number> | undefined;

    if (shouldRefresh) {
      coins = await CoinService.refreshCache();
    } else {
      const result = await CoinService.getCatalog();
      coins = result.coins;
      rulerCounts = result.rulerCounts;
    }

    return NextResponse.json({
      coins,
      rulerCounts,
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
