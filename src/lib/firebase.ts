import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCTyrQWbVNEbPWp56GVadbhXmlB9oq2-b0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ncqc-a787e.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://ncqc-a787e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ncqc-a787e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ncqc-a787e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "993561414605",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:993561414605:web:6af92e502eff77f8235284",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-HVTEQJV87N"
};

let appInstance: FirebaseApp;
let dbInstance: Database;
let firestoreInstance: Firestore;
let authInstance: Auth;

try {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  dbInstance = getDatabase(appInstance);
  firestoreInstance = getFirestore(appInstance);
  authInstance = getAuth(appInstance);
} catch (e) {
  console.warn("Firebase initialization notice:", e);
}

export const app = appInstance!;
export const rtdb = dbInstance!;
export const db = firestoreInstance!;
export const firestore = firestoreInstance!;
export const auth = authInstance!;

