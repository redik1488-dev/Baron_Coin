// lib/coinService.ts
/**
 * CoinService — Сервіс кешування: API → Firestore → клієнт
 * Оновлено для повної пагінації та отримання деталей.
 */

import { getAdminDb } from './firebaseAdmin';
import { CoinType, NumistaSearchResponse, Rarity } from '@/types/coin';

const NUMISTA_API_BASE = 'https://api.numista.com/api/v3';
const NUMISTA_API_KEY  = 'Ch83szgfRoMbUDK1sG3iaF31C5rFCwbSM5pKaZnW';
const CACHE_TTL_MS     = 7 * 24 * 60 * 60 * 1000; // 7 днів

const AH_ISSUERS = new Set(['autriche', 'autriche-habsbourg', 'hongrie', 'hungary']);

// Залишаємо специфічні запити, але тепер будемо тягнути всі сторінки
const AH_QUERIES: Array<{ q: string; count: number }> = [
  { q: 'Francis II 1800', count: 50 },
  { q: 'Franz II thaler', count: 50 },
  { q: 'Francis II kreuzer', count: 50 },
  { q: 'Ferdinand I 1840', count: 50 },
  { q: 'Ferdinand I 1845', count: 50 },
  { q: 'Franz Joseph florin',   count: 50 },
  { q: 'kreuzer Franz Joseph',  count: 50 },
  { q: 'corona Austria',        count: 50 },
  { q: 'heller Austria',        count: 50 },
  { q: 'filler Hungary',        count: 50 },
  { q: 'ducat Franz Joseph',    count: 50 },
  { q: '10 heller 1916',        count: 50 },
  { q: '20 heller 1916',        count: 50 },
  { q: 'Charles I filler',      count: 50 },
];

const COL_COINS       = 'coins';
const COL_CATALOG_META = 'coin_catalog_meta';
const CATALOG_KEY      = 'austro-hungarian-rulers-v4'; // Оновлений ключ для нового повного кешу

// --- Допоміжні функції ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function determineRuler(year: number, title: string): string {
  const t = title.toLowerCase();
  if (t.includes('karl') || t.includes('charles') || (year >= 1916 && year <= 1918)) {
    return 'Карл I (1916–1918)';
  }
  if (t.includes('franz joseph') || t.includes('francis joseph') || (year >= 1848 && year <= 1916)) {
    return 'Франц Йосиф I (1848–1916)';
  }
  if (t.includes('ferdinand i') || (year >= 1835 && year < 1848)) {
    return 'Фердинанд I (1835–1848)';
  }
  if (t.includes('franz ii') || t.includes('francis ii') || (year >= 1792 && year < 1835)) {
    return 'Франц II (1792–1835)';
  }
  return 'Інші / Невідомо';
}

function deriveRarity(coin: CoinType): Rarity {
  const title = (coin.title || '').toLowerCase();

  if (title.includes('essai') || title.includes('pattern') ||
      title.includes('proof') || title.includes('specimen') ||
      title.includes('restrike')) {
    return 'unique';
  }
  if (title.includes('ducat') || title.includes('sovrano')) {
    return 'very_rare';
  }
  if (title.includes('thaler') || title.includes('gulden')) {
    return 'rare';
  }
  if (title.includes('florin') || title.includes('corona') || title.includes('krone')) {
    return 'uncommon';
  }
  return 'common';
}

// --- Firestore операції ---

async function saveCatalogToFirestore(coins: CoinType[]): Promise<void> {
  const db = getAdminDb();
  const expiresAt = Date.now() + CACHE_TTL_MS;

  await db.collection(COL_CATALOG_META).doc(CATALOG_KEY).set({
    coinIds:  coins.map(c => String(c.id)),
    cachedAt: Date.now(),
    expiresAt,
    count:    coins.length,
  });

  const BATCH_SIZE = 400;
  for (let i = 0; i < coins.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = coins.slice(i, i + BATCH_SIZE);
    for (const coin of chunk) {
      const ref = db.collection(COL_COINS).doc(String(coin.id));
      const cleanCoin = JSON.parse(JSON.stringify(coin));
      batch.set(ref, { ...cleanCoin, cachedAt: Date.now() });
    }
    await batch.commit();
  }

  console.log(`[CoinService] ✅ Збережено ${coins.length} монет у Firestore.`);
}

async function loadCoinsFromFirestore(coinIds: string[]): Promise<CoinType[]> {
  const db = getAdminDb();
  const CHUNK = 30;
  const result: CoinType[] = [];

  for (let i = 0; i < coinIds.length; i += CHUNK) {
    const chunk = coinIds.slice(i, i + CHUNK);
    const snaps = await Promise.all(
      chunk.map(id => db.collection(COL_COINS).doc(id).get())
    );
    for (const snap of snaps) {
      if (snap.exists) result.push(snap.data() as CoinType);
    }
  }
  return result;
}

async function checkCache(): Promise<string[] | null> {
  try {
    const db   = getAdminDb();
    const snap = await db.collection(COL_CATALOG_META).doc(CATALOG_KEY).get();

    if (!snap.exists) return null;

    const meta = snap.data()!;
    if (Date.now() > meta.expiresAt) return null;

    console.log(`[CoinService] Кеш актуальний (${meta.count} монет).`);
    return meta.coinIds as string[];
  } catch (err) {
    console.error('[CoinService] checkCache error:', err);
    return null;
  }
}

// --- Numista API з пагінацією та отриманням деталей ---

async function fetchFromNumista(): Promise<CoinType[]> {
  console.log('[CoinService] Початок завантаження бази з Numista API...');

  const allCoinsMap = new Map<string, CoinType>();

  // 1. Отримуємо базовий список з усіх сторінок
  for (const { q, count } of AH_QUERIES) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = new URL(`${NUMISTA_API_BASE}/types`);
        url.searchParams.set('q', q);
        url.searchParams.set('count', String(count));
        url.searchParams.set('page', String(page));
        url.searchParams.set('lang', 'en');

        const res = await fetch(url.toString(), {
          headers: { 'Numista-API-Key': NUMISTA_API_KEY },
          signal: AbortSignal.timeout(15_000),
        });

        if (res.status === 429) {
          console.warn(`[CoinService] Rate limit (429). Чекаємо 5 секунд...`);
          await delay(5000);
          continue; // повторюємо спробу для цієї ж сторінки
        }

        if (!res.ok) {
          console.error(`[CoinService] HTTP Error ${res.status} для запиту: ${q}`);
          break; // виходимо з циклу сторінок для цього запиту
        }

        const data: NumistaSearchResponse = await res.json();
        const types = data.types || [];
        
        if (types.length === 0) {
          hasMore = false;
          break;
        }

        for (const coin of types) {
          const id = String(coin.id);
          const issuerCode = (coin.issuer?.code || '').toLowerCase();
          const year = coin.min_year || 0;

          const isAH =
            AH_ISSUERS.has(issuerCode) ||
            issuerCode.includes('autriche') ||
            issuerCode.includes('habsbourg') ||
            issuerCode.includes('hongrie') ||
            issuerCode.includes('hungary');
            
          const isCorrectPeriod = year >= 1792 && year <= 1918;
          const isCoinCategory = coin.category === 'coin';

          if (!allCoinsMap.has(id) && isAH && isCorrectPeriod && isCoinCategory) {
            allCoinsMap.set(id, {
              ...coin,
              rarity: deriveRarity(coin),
              ruler: determineRuler(year, coin.title || '')
            });
          }
        }

        console.log(`[CoinService] "${q}" Сторінка ${page} завантажена. Значення: ${types.length}`);
        page++;
        await delay(1000); // 1 сек затримка між сторінками
        
      } catch (err) {
        console.error(`[CoinService] Помилка запиту "${q}" сторінка ${page}:`, err);
        break;
      }
    }
  }

  const baseCoins = Array.from(allCoinsMap.values());
  console.log(`[CoinService] Зібрано базовий масив з ${baseCoins.length} монет. Починаю завантаження деталей (метал, вага)...`);

  // 2. Отримуємо деталі для вирішення проблеми "Невідомий метал"
  const detailedCoins: CoinType[] = [];
  let fetchedCount = 0;

  for (const baseCoin of baseCoins) {
    try {
      // Якщо в монеті вже є текст композиції, можемо пропустити, 
      // але базовий пошук його не повертає, тому запитуємо майже всі
      const url = `${NUMISTA_API_BASE}/types/${baseCoin.id}?lang=en`;
      
      const res = await fetch(url, {
        headers: { 'Numista-API-Key': NUMISTA_API_KEY },
      });

      if (res.status === 429) {
        console.warn(`[CoinService] Rate limit (429) при завантаженні деталей ID ${baseCoin.id}. Чекаємо 5 сек...`);
        await delay(5000);
        // Тут можна додати повторну спробу, але для спрощення поки просто зачекаємо
        detailedCoins.push(baseCoin); // зберігаємо хоча б базові дані
        continue;
      }

      if (res.ok) {
        const fullData: CoinType = await res.json();
        // Об'єднуємо отримані дані
        detailedCoins.push({
          ...baseCoin,
          composition: fullData.composition?.text || fullData.composition || baseCoin.composition,
          weight: fullData.weight || baseCoin.weight,
          size: fullData.size || baseCoin.size,
        });
        fetchedCount++;
        
        if (fetchedCount % 10 === 0) {
          console.log(`[CoinService] Завантажено деталей: ${fetchedCount} / ${baseCoins.length}`);
        }
      } else {
        detailedCoins.push(baseCoin);
      }

      await delay(1000); // 1 секунда затримка для захисту від 429
    } catch (err) {
      console.error(`[CoinService] Помилка завантаження деталей ID ${baseCoin.id}:`, err);
      detailedCoins.push(baseCoin); // fall back to base data
    }
  }

  console.log(`[CoinService] Деталі успішно завантажені!`);
  return detailedCoins;
}

export class CoinService {
  static async getCatalog(): Promise<CoinType[]> {
    const cachedIds = await checkCache();

    if (cachedIds && cachedIds.length > 0) {
      const coins = await loadCoinsFromFirestore(cachedIds);
      if (coins.length > 0) {
        console.log(`[CoinService] ✅ Повернуто ${coins.length} монет з Firestore.`);
        return coins;
      }
    }

    const coins = await fetchFromNumista();

    if (coins.length > 0) {
      await saveCatalogToFirestore(coins).catch(err =>
        console.error('[CoinService] Помилка збереження в Firestore:', err)
      );
    }

    return coins;
  }

  static async refreshCache(): Promise<CoinType[]> {
    const coins = await fetchFromNumista();
    if (coins.length > 0) {
      await saveCatalogToFirestore(coins).catch(console.error);
    }
    return coins;
  }

  static async getCoinById(id: string): Promise<CoinType | null> {
    try {
      const db   = getAdminDb();
      const snap = await db.collection(COL_COINS).doc(id).get();
      if (snap.exists) return snap.data() as CoinType;
    } catch (err) {}

    try {
      const res = await fetch(`${NUMISTA_API_BASE}/types/${id}?lang=en`, {
        headers: { 'Numista-API-Key': NUMISTA_API_KEY },
      });
      if (!res.ok) return null;
      const coinData: CoinType = await res.json();
      const coin = { 
        ...coinData, 
        rarity: deriveRarity(coinData),
        composition: typeof coinData.composition === 'object' ? (coinData.composition as any).text : coinData.composition, 
        cachedAt: Date.now() 
      };
      
      const db = getAdminDb();
      await db.collection(COL_COINS).doc(id).set(coin);
      return coin;
    } catch {
      return null;
    }
  }
}
