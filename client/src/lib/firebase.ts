import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDsYo9nuRK5cAhnVAUPLrZhumLohsw_MXQ",
  authDomain: "blog-abe64.firebaseapp.com",
  projectId: "blog-abe64",
  storageBucket: "blog-abe64.firebasestorage.app",
  messagingSenderId: "895923440924",
  appId: "1:895923440924:web:8a70e2b124e3be6edc3ed9",
  measurementId: "G-XMQBHMTH1S"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  signInWithRedirect(auth, googleProvider);
};

export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error) {
    console.error("Auth redirect error:", error);
    return null;
  }
};

export const signOutUser = () => {
  return signOut(auth);
};

export { app, analytics };
