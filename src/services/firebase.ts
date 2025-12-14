import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Defensive check for Vercel deployment debugging
const missingKeys = Object.entries(firebaseConfig).filter(([, value]) => !value);
if (missingKeys.length > 0) {
    console.error(`Missing Firebase Environment Variables: ${missingKeys.map(([k]) => k).join(', ')}`);
    console.error("If you are running on Vercel, make sure you have added these keys in Project Settings > Environment Variables.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
