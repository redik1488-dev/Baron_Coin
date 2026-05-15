import { getAdminDb } from './src/lib/firebaseAdmin';

async function run() {
  const db = getAdminDb();
  const snap = await db.collection('coin_catalog_meta').doc('habsburg-austria-full-v1').get();
  const data = snap.data();
  if (data && data.coins) {
    const mule = data.coins.find(c => c.title.includes('Mule'));
    console.log(JSON.stringify(mule, null, 2));
  }
}
run();
