// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_WEB_API_KEY,
  authDomain: "eisc-meet-87ac0.firebaseapp.com",
  projectId: "eisc-meet-87ac0",
  storageBucket: "eisc-meet-87ac0.appspot.com",
  messagingSenderId: "477359963459",
  appId: "1:477359963459:web:93aa6b90125cac3cf2c3f6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
