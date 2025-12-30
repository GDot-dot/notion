
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * 🍓 請填入您的 Firebase 配置 🍓
 * 由於我們已移除 Storage 模組，您不再需要升級付費方案。
 */
export const firebaseConfig = {
  apiKey: "AIzaSyApdW3VyiDJc9kJhvl6KC2IB4Q7HX6jBGM",
  authDomain: "notion-35f2a.firebaseapp.com",
  projectId: "notion-35f2a",
  storageBucket: "notion-35f2a.firebasestorage.app",
  messagingSenderId: "83841265274",
  appId: "1:83841265274:web:40300f10e24f9f25add5c3",
  measurementId: "G-4D3LMLMZ0Q""
};

export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "";
export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
// ❌ 已移除 Storage，確保不會觸發 Google Cloud 的付費方案提示
export const storage = null; 
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
