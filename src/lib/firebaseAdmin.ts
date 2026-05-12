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
      let serviceAccount: any = null;

      if (fs.existsSync(serviceAccountPath)) {
        console.log('[FirebaseAdmin] Знайдено service-account.json, ініціалізація з файлу...');
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.log('[FirebaseAdmin] Знайдено FIREBASE_SERVICE_ACCOUNT змінну оточення, ініціалізація з Env...');
        try {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (err) {
          console.error('[FirebaseAdmin] Помилка парсингу FIREBASE_SERVICE_ACCOUNT:', err);
        }
      }

      if (serviceAccount) {
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || 'baroncoin-12ee7',
        });
      } else {
        console.warn('[FirebaseAdmin] УВАГА: Не знайдено ні service-account.json, ні FIREBASE_SERVICE_ACCOUNT! Запис у Firestore може не працювати.');
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
