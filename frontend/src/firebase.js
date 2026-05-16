import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7oDSFoi5A2_cTWNUYZM241W1bTRvg8WU",
  authDomain: "proman-56291.firebaseapp.com",
  projectId: "proman-56291",
  storageBucket: "proman-56291.firebasestorage.app",
  messagingSenderId: "225843681313",
  appId: "1:225843681313:web:1d40272a6daff524366b60",
  measurementId: "G-NE2V94QQE6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
