import { getAdminDb } from './src/lib/firebaseAdmin';

async function run() {
  const db = getAdminDb();
  const collections = await db.listCollections();
  for (const col of collections) {
    console.log(`Collection: ${col.id}`);
    const snap = await col.get();
    snap.forEach(doc => {
      const data = doc.data();
      let summary = '';
      if (data.coins) summary += ` inline_coins=${data.coins.length}`;
      if (data.count) summary += ` count=${data.count}`;
      console.log(`  Doc: ${doc.id} ${summary}`);
    });
  }
}
run();
