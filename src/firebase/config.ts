import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Configuration provided for ETECC Wiki
export const firebaseConfig = {
  apiKey: "AIzaSyBexPboymtW8_nX0olwQ4BNeBxpKtFPUGU",
  authDomain: "etecc-wiki.firebaseapp.com",
  projectId: "etecc-wiki",
  storageBucket: "etecc-wiki.firebasestorage.app",
  messagingSenderId: "985988051686",
  appId: "1:985988051686:web:7b6246c12b22262b9f4127"
};

// Initialize Firebase safely
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Enable offline persistence for Firestore if available in browser
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence enabled in another tab.');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Current browser does not support offline persistence.');
      }
    });
  } catch {
    // Ignore in dev/environments where IndexedDb might not be available
  }
}
