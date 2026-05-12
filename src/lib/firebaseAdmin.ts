// lib/firebaseAdmin.ts
/**
 * Firebase Admin SDK для серверного використання (Next.js API routes).
 * Web SDK (firebase/firestore) не підходить для Node.js серверного середовища
 * через несумісність gRPC транспорту.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let adminApp: App;
let adminDb: Firestore;

function getAdminApp(): App {
  if (!adminApp) {
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0];
    } else {
      const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        console.log('[FirebaseAdmin] Знайдено service-account.json, ініціалізація з ключем...');
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: 'baroncoin-12ee7',
        });
      } else {
        console.warn('[FirebaseAdmin] УВАГА: service-account.json не знайдено! Запис у Firestore може завершитись помилкою.');
        adminApp = initializeApp({
          projectId: 'baroncoin-12ee7',
        });
      }
    }
  }
  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
    adminDb.settings({ ignoreUndefinedProperties: true });
  }
  return adminDb;
}
