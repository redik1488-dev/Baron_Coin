// app/api/coins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CoinService } from '@/lib/coinService';
import { CoinType } from '@/types/coin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── In-Memory кеш (module-level, живе поки живе Node.js процес) ─────────────
// Перший запит: ~1-3с (Firestore). Наступні: <10мс (з RAM).
interface MemCache {
  coins: CoinType[];
  source: 'cache' | 'api';
  fetchedAt: number;
}
let memCache: MemCache | null = null;
const MEM_TTL_MS = 30 * 60 * 1000; // 30 хвилин

export async function GET(req: NextRequest) {
  const shouldRefresh = req.nextUrl.searchParams.get('refresh') === 'true';

  try {
    let coins: CoinType[];
    let source: 'cache' | 'api';

    if (!shouldRefresh && memCache && Date.now() - memCache.fetchedAt < MEM_TTL_MS) {
      // ⚡ Миттєво з пам'яті
      console.log(`[API /coins] ⚡ In-memory cache hit (${memCache.coins.length} монет).`);
      coins = memCache.coins;
      source = memCache.source;
    } else if (shouldRefresh) {
      coins = await CoinService.refreshCache();
      source = 'api';
      memCache = { coins, source, fetchedAt: Date.now() };
    } else {
      coins = await CoinService.getCatalog();
      source = 'cache';
      memCache = { coins, source, fetchedAt: Date.now() };
    }

    return NextResponse.json({
      coins,
      count: coins.length,
      source,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        // Дозволяємо браузеру кешувати на 5 хвилин (stale-while-revalidate)
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('[API /coins]', err);
    return NextResponse.json(
      { error: 'Помилка завантаження монет', coins: [] },
      { status: 500 }
    );
  }
}
