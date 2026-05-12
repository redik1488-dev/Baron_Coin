// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCJa12iw-mxJSae_ncgJzRvTpdSYDarqu4",
  authDomain: "baroncoin-12ee7.firebaseapp.com",
  projectId: "baroncoin-12ee7",
  storageBucket: "baroncoin-12ee7.firebasestorage.app",
  messagingSenderId: "493028023435",
  appId: "1:493028023435:web:8e52fb549c8552bfbc888e"
};

// Prevent re-initialization on hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
