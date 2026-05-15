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
const NUMISTA_API_KEY = 'K4wnbBBwy4a4VuXpWZbbloWTmdz5HrMlpU7TX608'; // Ch83szgfRoMbUDK1sG3iaF31C5rFCwbSM5pKaZnW
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 днів

// Вилучаємо старі хардкодні квері, бо тепер ми тягнемо все через issuers
const TARGET_ISSUERS = ['autriche-habsbourg', 'autriche', 'hongrie'];

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
  const cachedAt = Date.now();

  // Зберігаємо монети прямо в meta-документі (1 read = весь каталог)
  // Firestore limit: 1MB per document. Перевіряємо розмір.
  const inlinePayload = JSON.stringify(coins);
  const inlineSizeKB = Buffer.byteLength(inlinePayload, 'utf8') / 1024;

  if (inlineSizeKB < 900) {
    // Влазить в 1MB — зберігаємо inline
    await db.collection(COL_CATALOG_META).doc(CATALOG_KEY).set({
      coins,
      coinIds: coins.map(c => String(c.id)),
      cachedAt,
      expiresAt,
      count: coins.length,
      inline: true,
    });
    console.log(`[CoinService] ✅ Збережено ${coins.length} монет у Firestore inline (${inlineSizeKB.toFixed(0)}KB).`);
  } else {
    // Занадто великий — зберігаємо окремо (fallback)
    await db.collection(COL_CATALOG_META).doc(CATALOG_KEY).set({
      coinIds: coins.map(c => String(c.id)),
      cachedAt,
      expiresAt,
      count: coins.length,
      inline: false,
    });

    const BATCH_SIZE = 400;
    for (let i = 0; i < coins.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = coins.slice(i, i + BATCH_SIZE);
      for (const coin of chunk) {
        const ref = db.collection(COL_COINS).doc(String(coin.id));
        batch.set(ref, { ...JSON.parse(JSON.stringify(coin)), cachedAt });
      }
      await batch.commit();
    }
    console.log(`[CoinService] ✅ Збережено ${coins.length} монет у Firestore (окремі документи, ${inlineSizeKB.toFixed(0)}KB).`);
  }
}

async function loadCoinsFromFirestore(coinIds: string[]): Promise<CoinType[]> {
  const db = getAdminDb();
  // db.getAll() — один мережевий запит для всіх документів (замість N/30 послідовних)
  const refs = coinIds.map(id => db.collection(COL_COINS).doc(id));
  const snaps = await db.getAll(...refs);
  return snaps.filter(s => s.exists).map(s => s.data() as CoinType);
}

async function checkCache(): Promise<{ coinIds: string[]; coins?: CoinType[] } | null> {
  try {
    const db = getAdminDb();
    const snap = await db.collection(COL_CATALOG_META).doc(CATALOG_KEY).get();
    if (!snap.exists) return null;
    const meta = snap.data()!;
    if (Date.now() > meta.expiresAt) return null;
    console.log(`[CoinService] Кеш актуальний (${meta.count} монет, inline=${meta.inline}).`);
    if (meta.inline && Array.isArray(meta.coins) && meta.coins.length > 0) {
      return { coinIds: meta.coinIds as string[], coins: meta.coins as CoinType[] };
    }
    return { coinIds: meta.coinIds as string[] };
  } catch (err) {
    console.error('[CoinService] checkCache error:', err);
    return null;
  }
}

// --- Numista API з пагінацією та нормалізацією ---

async function fetchFromNumista(): Promise<CoinType[]> {
  console.log('[CoinService] Початок масового завантаження бази з Numista API (1526-1918)...');
  const allCoinsMap = new Map<string, CoinType>();

  // Крок 1: базовий список для кожного емітента
  for (const issuer of TARGET_ISSUERS) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = new URL(`${NUMISTA_API_BASE}/types`);
        url.searchParams.set('issuer', issuer);
        url.searchParams.set('count', '50');
        url.searchParams.set('page', String(page));
        url.searchParams.set('lang', 'en');

        const res = await fetch(url.toString(), {
          headers: { 'Numista-API-Key': NUMISTA_API_KEY },
          signal: AbortSignal.timeout(20_000),
        });

        if (res.status === 429) {
          console.warn(`[CoinService] Rate limit (429) на ${issuer}. Чекаємо 5 сек...`);
          await delay(5000);
          continue;
        }
        if (!res.ok) {
          console.error(`[CoinService] HTTP ${res.status} для ${issuer}`);
          break;
        }

        const data: NumistaSearchResponse = await res.json();
        const types = data.types || [];

        if (types.length === 0) { hasMore = false; break; }

        for (const raw of types) {
          const id = String(raw.id);
          const year = raw.min_year || 0;
          const isCorrectPeriod = year >= 1526 && year <= 1918;
          const isCoinCategory = raw.category === 'coin';

          // Якщо монета підходить, додаємо до загального списку
          if (!allCoinsMap.has(id) && isCorrectPeriod && isCoinCategory) {
            const normalized = normalizeRawCoin(raw);
            allCoinsMap.set(id, {
              ...normalized,
              rarity: deriveRarity(normalized.title),
              ruler: determineRuler(year, normalized.title),
            });
          }
        }

        console.log(`[CoinService] [${issuer}] Сторінка ${page} завантажена. Знайдено нових монет: ${types.length}`);
        page++;
        await delay(250); // Легка затримка щоб не дратувати API

      } catch (err) {
        console.error(`[CoinService] Помилка запиту [${issuer}] сторінка ${page}:`, err);
        break;
      }
    }
  }

  // Відкидаємо ті, де рік не визначився або не збігся з правителями
  const relevantCoins = Array.from(allCoinsMap.values()).filter(c => c.ruler && c.ruler !== 'Інші / Невідомо');
  console.log(`[CoinService] Зібрано ${relevantCoins.length} цільових монет. Починаю швидке завантаження деталей...`);

  // Крок 2: деталі (метал, вага, розмір) з паралельними запитами
  const detailedCoins: CoinType[] = [];
  let fetchedCount = 0;
  
  // Обробляємо по 5 монет одночасно (щоб обійти швидке завантаження без 429)
  const CONCURRENCY = 5;
  
  for (let i = 0; i < relevantCoins.length; i += CONCURRENCY) {
    const chunk = relevantCoins.slice(i, i + CONCURRENCY);
    const promises = chunk.map(async (baseCoin) => {
      let retryCount = 0;
      while (retryCount < 3) {
        try {
          const res = await fetch(`${NUMISTA_API_BASE}/types/${baseCoin.id}?lang=en`, {
            headers: { 'Numista-API-Key': NUMISTA_API_KEY },
          });

          if (res.status === 429) {
            await delay(3000 + Math.random() * 2000); // Backoff
            retryCount++;
            continue;
          }

          if (res.ok) {
            const rawDetail: NumistaRawCoin = await res.json();
            return assembleCoin(baseCoin, rawDetail);
          }
          break; // 404 etc
        } catch (err) {
          await delay(2000);
          retryCount++;
        }
      }
      return baseCoin; // Якщо не вдалося, повертаємо хоча б базову інфу
    });

    const results = await Promise.all(promises);
    detailedCoins.push(...results);
    fetchedCount += results.length;
    
    if (fetchedCount % 100 === 0 || fetchedCount === relevantCoins.length) {
      console.log(`[CoinService] Завантажено деталей: ${fetchedCount} / ${relevantCoins.length} (${((fetchedCount/relevantCoins.length)*100).toFixed(1)}%)`);
    }
    
    await delay(300); // 300ms пауза між батчами
  }

  console.log(`[CoinService] ✅ Всі деталі успішно завантажені! Всього монет: ${detailedCoins.length}`);
  return detailedCoins;
}

// --- Public API ---

export class CoinService {
  static async getCatalog(): Promise<CoinType[]> {
    const cached = await checkCache();
    if (cached) {
      // Якщо є inline coins — повертаємо одразу (1 Firestore read!)
      if (cached.coins && cached.coins.length > 0) {
        console.log(`[CoinService] ✅ Повернуто ${cached.coins.length} монет з inline кешу (1 read).`);
        return cached.coins;
      }
      // Fallback: читаємо окремі документи через getAll()
      if (cached.coinIds && cached.coinIds.length > 0) {
        const coins = await loadCoinsFromFirestore(cached.coinIds);
        if (coins.length > 0) {
          console.log(`[CoinService] ✅ Повернуто ${coins.length} монет з Firestore (getAll).`);
          return coins;
        }
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
