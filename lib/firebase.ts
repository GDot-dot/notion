
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * 🍓 請替換為您的 Firebase 配置 🍓
 */
const firebaseConfig = {
  apiKey: "AIzaSyApdW3VyiDJc9kJhvl6KC2IB4Q7HX6jBGM",
  authDomain: "notion-35f2a.firebaseapp.com",
  projectId: "notion-35f2a",
  storageBucket: "notion-35f2a.firebasestorage.app",
  messagingSenderId: "83841265274",
  appId: "1:83841265274:web:40300f10e24f9f25add5c3",
  measurementId: "G-4D3LMLMZ0Q"
};

export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();
