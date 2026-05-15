import { getAdminDb } from './src/lib/firebaseAdmin';

async function run() {
  const db = getAdminDb();
  const snap = await db.collection('coins').get();
  const coins = snap.docs.map(doc => doc.data());
  
  await db.collection('coin_catalog_meta').doc('habsburg-austria-full-v1').set({
    coins,
    coinIds: coins.map(c => String(c.id)),
    cachedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    count: coins.length,
    inline: true,
  });
  console.log(`✅ Відновлено ${coins.length} монет у головний кеш!`);
}
run();
