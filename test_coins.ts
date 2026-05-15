import { getAdminDb } from './src/lib/firebaseAdmin';

async function run() {
  const db = getAdminDb();
  const snap = await db.collection('coins').get();
  console.log("Total coins in DB:", snap.size);
}
run();
