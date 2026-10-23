// Firebase configuration for Policía de la Diversión
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDGzfIAwgphWVEed84hVVwXgph6MHQ31mw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "policiadeladiversion.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "policiadeladiversion",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "policiadeladiversion.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "538842277779",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:538842277779:web:037276a53d7eae25d9ea66",
  measurementId: "G-762D6MPHZW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulators in development if configured
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
}

export default app;
