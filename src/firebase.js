import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC_1k4hgxfRA-xWBugwmDyBjo36CndptYI",
  authDomain: "agenda-medica-59e54.firebaseapp.com",
  projectId: "agenda-medica-59e54",
  storageBucket: "agenda-medica-59e54.firebasestorage.app",
  messagingSenderId: "1075304404862",
  appId: "1:1075304404862:web:6490145d0d32c454f2052f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
