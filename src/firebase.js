import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyDGcmVD7_4GnHSIwAN2LYy9hTJoUEE8dE4",
  authDomain:        "evoke-cmo-agent2.firebaseapp.com",
  projectId:         "evoke-cmo-agent2",
  storageBucket:     "evoke-cmo-agent2.firebasestorage.app",
  messagingSenderId: "899012406813",
  appId:             "1:899012406813:web:0a6b7e0292f2c39126a0f4",
  measurementId:     "G-XRPP8CJYH2"
};

// ── keep everything below exactly as it is ──
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const twitterProvider = new TwitterAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

export { signInWithPopup };
