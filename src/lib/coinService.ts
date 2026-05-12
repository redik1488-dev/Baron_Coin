// lib/coinService.ts
/**
 * CoinService — Сервіс кешування: API → Firestore → клієнт
 *
 * АРХІТЕКТУРНЕ РІШЕННЯ: Нормалізація даних відбувається ТУТ, в сервісному шарі.
 * Функція `normalizeRawCoin` конвертує будь-які поліморфні поля Numista API
 * (string | object) в чисті string, гарантуючи, що до UI завжди доходять
 * суворо типізовані дані, що відповідають інтерфейсу CoinType.
 */

import { getAdminDb } from './firebaseAdmin';
import { CoinType, NumistaRawCoin, NumistaSearchResponse, Rarity } from '@/types/coin';

const NUMISTA_API_BASE = 'https://api.numista.com/api/v3';
const NUMISTA_API_KEY = 'EsJUn2czABaelIdhfK4iBTcbDNBbSV8zQgdH8l6G';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 днів

const AH_ISSUERS = new Set(['autriche', 'autriche-habsbourg', 'hongrie', 'hungary']);

const AH_QUERIES: Array<{ q: string; count: number }> = [
  // === Австро-Угорська монархія (1792–1918) ===
  { q: 'Francis II 1800', count: 50 },
  { q: 'Franz II thaler', count: 50 },
  { q: 'Francis II kreuzer', count: 50 },
  { q: 'Ferdinand I 1840', count: 50 },
  { q: 'Ferdinand I 1845', count: 50 },
  { q: 'Franz Joseph florin', count: 50 },
  { q: 'kreuzer Franz Joseph', count: 50 },
  { q: 'corona Austria', count: 50 },
  { q: 'heller Austria', count: 50 },
  { q: 'filler Hungary', count: 50 },
  { q: 'ducat Franz Joseph', count: 50 },
  { q: '10 heller 1916', count: 50 },
  { q: '20 heller 1916', count: 50 },
  { q: 'Charles I filler', count: 50 },
  // === Австрійська монархія Габсбургів (1526–1792) ===
  { q: 'Maria Theresa thaler', count: 50 },
  { q: 'Maria Theresa kreuzer', count: 50 },
  { q: 'Leopold I Austria', count: 50 },
  { q: 'Leopold I thaler', count: 50 },
  { q: 'Charles VI Austria', count: 50 },
  { q: 'Karl VI Austria', count: 50 },
  { q: 'Joseph II Austria', count: 50 },
  { q: 'Joseph II kreuzer', count: 50 },
  { q: 'Leopold II Austria', count: 50 },
  { q: 'Rudolf II Austria', count: 50 },
  { q: 'Rudolf II thaler', count: 50 },
  { q: 'Ferdinand I Habsburg', count: 50 },
  { q: 'Maximilian II Austria', count: 50 },
  { q: 'Ferdinand II Austria', count: 50 },
  { q: 'Ferdinand III Austria', count: 50 },
  { q: 'Joseph I Austria', count: 50 },
];

const COL_COINS = 'coins';
const COL_CATALOG_META = 'coin_catalog_meta';
const CATALOG_KEY = 'habsburg-austria-full-v1'; // оновлений ключ для розширеного каталогу

// --- Утиліти ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Ядро нормалізації: перетворює будь-яке поліморфне поле Numista
 * (string | object | null | undefined) на чистий string.
 */
function toStr(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null && 'text' in val) {
    return String((val as Record<string, unknown>).text ?? '');
  }
  return String(val);
}

/**
 * Нормалізує «сирий» об'єкт монети з Numista API
 * у суворо типізований CoinType.
 * Виклик цієї функції — єдине місце в кодовій базі,
 * де обробляються поліморфні типи.
 */
function normalizeRawCoin(raw: NumistaRawCoin): Omit<CoinType, 'rarity' | 'ruler'> {
  const valueCurrency = raw.value?.currency?.name
    ? { name: raw.value.currency.name }
    : undefined;

  return {
    id: raw.id,
    title: toStr(raw.title) || 'Unknown',
    min_year: raw.min_year,
    max_year: raw.max_year,
    issuer: raw.issuer
      ? { name: raw.issuer.name ?? '', code: raw.issuer.code }
      : undefined,
    composition: toStr(raw.composition) || undefined,
    type: toStr(raw.type) || undefined,
    series: toStr(raw.series) || undefined,
    image: raw.image,
    obverse_thumbnail: raw.obverse_thumbnail,
    reverse_thumbnail: raw.reverse_thumbnail,
    value: raw.value
      ? {
        text: toStr(raw.value.text) || undefined,
        numeric: raw.value.numeric,
        currency: valueCurrency,
      }
      : undefined,
    weight: raw.weight,
    size: raw.size,
    shape: toStr(raw.shape) || undefined,
    edge: toStr(raw.edge) || undefined,
    demonetized: raw.demonetized,
    tags: raw.tags,
    category: raw.category,
  };
}

// --- Логіка визначення правителя та рідкості ---

function determineRuler(year: number, title: string): string {
  const t = title.toLowerCase();

  // === Австро-Угорська монархія ===
  if (t.includes('karl i') || t.includes('charles i') || (year >= 1916 && year <= 1918)) {
    return 'Карл I (1916–1918)';
  }
  if (t.includes('franz joseph') || t.includes('francis joseph') || (year >= 1848 && year <= 1916)) {
    return 'Франц Йосиф I (1848–1916)';
  }
  if ((t.includes('ferdinand') && year >= 1835 && year < 1848)) {
    return 'Фердинанд I (1835–1848)';
  }
  if (t.includes('franz ii') || t.includes('francis ii') || (year >= 1792 && year < 1835)) {
    return 'Франц II (1792–1835)';
  }

  // === Австрійська монархія Габсбургів ===
  if (t.includes('leopold ii') || (year >= 1790 && year < 1792)) {
    return 'Леопольд II (1790–1792)';
  }
  if (t.includes('joseph ii') || (year >= 1780 && year < 1790)) {
    return 'Йосип II (1780–1790)';
  }
  if (t.includes('maria theresa') || t.includes('maria theresia') || (year >= 1740 && year < 1780)) {
    return 'Марія Терезія (1740–1780)';
  }
  if (t.includes('charles vi') || t.includes('karl vi') || (year >= 1711 && year < 1740)) {
    return 'Карл VI (1711–1740)';
  }
  if (t.includes('joseph i') || (year >= 1705 && year < 1711)) {
    return 'Йосип I (1705–1711)';
  }
  if (t.includes('leopold i') || (year >= 1657 && year < 1705)) {
    return 'Леопольд I (1657–1705)';
  }
  if (t.includes('ferdinand iii') || (year >= 1637 && year < 1657)) {
    return 'Фердинанд III (1637–1657)';
  }
  if (t.includes('ferdinand ii') || (year >= 1619 && year < 1637)) {
    return 'Фердинанд II (1619–1637)';
  }
  if (t.includes('matthias') || (year >= 1612 && year < 1619)) {
    return 'Матіас (1612–1619)';
  }
  if (t.includes('rudolf ii') || (year >= 1576 && year < 1612)) {
    return 'Рудольф II (1576–1612)';
  }
  if (t.includes('maximilian') || (year >= 1564 && year < 1576)) {
    return 'Максиміліан II (1564–1576)';
  }
  if (t.includes('ferdinand i') || (year >= 1526 && year < 1564)) {
    return 'Фердинанд I Габсбург (1526–1564)';
  }
  return 'Інші / Невідомо';
}

function deriveRarity(title: string): Rarity {
  const t = title.toLowerCase();
  if (t.includes('essai') || t.includes('pattern') ||
    t.includes('proof') || t.includes('specimen') ||
    t.includes('restrike')) return 'unique';
  if (t.includes('ducat') || t.includes('sovrano')) return 'very_rare';
  if (t.includes('thaler') || t.includes('gulden')) return 'rare';
  if (t.includes('florin') || t.includes('corona') || t.includes('krone')) return 'uncommon';
  return 'common';
}

/** Збирає нормалізований CoinType з базових і деталізованих даних */
function assembleCoin(base: CoinType, detail?: NumistaRawCoin): CoinType {
  if (!detail) return base;
  const normalized = normalizeRawCoin(detail);
  return {
    ...base,
    composition: normalized.composition || base.composition,
    weight: normalized.weight ?? base.weight,
    size: normalized.size ?? base.size,
    shape: normalized.shape || base.shape,
    edge: normalized.edge || base.edge,
  };
}

// --- Firestore ---

async function saveCatalogToFirestore(coins: CoinType[]): Promise<void> {
  const db = getAdminDb();
  const expiresAt = Date.now() + CACHE_TTL_MS;

  await db.collection(COL_CATALOG_META).doc(CATALOG_KEY).set({
    coinIds: coins.map(c => String(c.id)),
    cachedAt: Date.now(),
    expiresAt,
    count: coins.length,
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
    const snaps = await Promise.all(chunk.map(id => db.collection(COL_COINS).doc(id).get()));
    for (const snap of snaps) {
      if (snap.exists) result.push(snap.data() as CoinType);
    }
  }
  return result;
}

async function checkCache(): Promise<string[] | null> {
  try {
    const db = getAdminDb();
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

// --- Numista API з пагінацією та нормалізацією ---

async function fetchFromNumista(): Promise<CoinType[]> {
  console.log('[CoinService] Початок завантаження бази з Numista API...');

  const allCoinsMap = new Map<string, CoinType>();

  // Крок 1: базовий список
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
          console.warn(`[CoinService] Rate limit (429). Чекаємо 5 сек...`);
          await delay(5000);
          continue;
        }
        if (!res.ok) {
          console.error(`[CoinService] HTTP ${res.status} для \"${q}\"`);
          break;
        }

        const data: NumistaSearchResponse = await res.json();
        const types = data.types || [];

        if (types.length === 0) { hasMore = false; break; }

        for (const raw of types) {
          const id = String(raw.id);
          const issuerCode = (raw.issuer?.code || '').toLowerCase();
          const year = raw.min_year || 0;

          const isAH = AH_ISSUERS.has(issuerCode) ||
            issuerCode.includes('autriche') ||
            issuerCode.includes('habsbourg') ||
            issuerCode.includes('hongrie') ||
            issuerCode.includes('hungary');

          const isCorrectPeriod = year >= 1526 && year <= 1918;
          const isCoinCategory = raw.category === 'coin';

          if (!allCoinsMap.has(id) && isAH && isCorrectPeriod && isCoinCategory) {
            // --- НОРМАЛІЗАЦІЯ ТУТ ---
            const normalized = normalizeRawCoin(raw);
            allCoinsMap.set(id, {
              ...normalized,
              rarity: deriveRarity(normalized.title),
              ruler: determineRuler(year, normalized.title),
            });
          }
        }

        console.log(`[CoinService] "${q}" Сторінка ${page} завантажена. Значення: ${types.length}`);
        page++;
        await delay(1000);

      } catch (err) {
        console.error(`[CoinService] Помилка запиту "${q}" сторінка ${page}:`, err);
        break;
      }
    }
  }

  const baseCoins = Array.from(allCoinsMap.values());
  console.log(`[CoinService] Зібрано ${baseCoins.length} монет. Починаю завантаження деталей...`);

  // Крок 2: деталі (метал, вага, розмір)
  const detailedCoins: CoinType[] = [];
  let fetchedCount = 0;

  for (const baseCoin of baseCoins) {
    try {
      const res = await fetch(`${NUMISTA_API_BASE}/types/${baseCoin.id}?lang=en`, {
        headers: { 'Numista-API-Key': NUMISTA_API_KEY },
      });

      if (res.status === 429) {
        console.warn(`[CoinService] Rate limit при деталях ID ${baseCoin.id}. Чекаємо 5 сек...`);
        await delay(5000);
        detailedCoins.push(baseCoin);
        continue;
      }

      if (res.ok) {
        const rawDetail: NumistaRawCoin = await res.json();
        // assembleCoin нормалізує detail і мерджить з baseCoin
        detailedCoins.push(assembleCoin(baseCoin, rawDetail));
        fetchedCount++;
        if (fetchedCount % 10 === 0) {
          console.log(`[CoinService] Завантажено деталей: ${fetchedCount} / ${baseCoins.length}`);
        }
      } else {
        detailedCoins.push(baseCoin);
      }

      await delay(1000);
    } catch (err) {
      console.error(`[CoinService] Помилка деталей ID ${baseCoin.id}:`, err);
      detailedCoins.push(baseCoin);
    }
  }

  console.log(`[CoinService] Деталі успішно завантажені!`);
  return detailedCoins;
}

// --- Public API ---

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
      const db = getAdminDb();
      const snap = await db.collection(COL_COINS).doc(id).get();
      if (snap.exists) return snap.data() as CoinType;
    } catch { }

    try {
      const res = await fetch(`${NUMISTA_API_BASE}/types/${id}?lang=en`, {
        headers: { 'Numista-API-Key': NUMISTA_API_KEY },
      });
      if (!res.ok) return null;
      const raw: NumistaRawCoin = await res.json();
      const normalized = normalizeRawCoin(raw);
      const coin: CoinType = {
        ...normalized,
        rarity: deriveRarity(normalized.title),
        cachedAt: Date.now(),
      };
      const db = getAdminDb();
      await db.collection(COL_COINS).doc(id).set(JSON.parse(JSON.stringify(coin)));
      return coin;
    } catch {
      return null;
    }
  }
}
