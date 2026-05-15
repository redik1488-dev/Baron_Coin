import { getAdminDb } from './src/lib/firebaseAdmin';

async function run() {
  const db = getAdminDb();
  const snap = await db.collection('coin_catalog_meta').get();
  snap.forEach(doc => console.log(doc.id, doc.data().count));
}
run();
