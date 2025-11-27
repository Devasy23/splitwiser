import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4Ny4BSh3q4fNEVBGyw2u_FvLaxXukB8U",
  authDomain: "splitwiser-25e34.firebaseapp.com",
  projectId: "splitwiser-25e34",
  storageBucket: "splitwiser-25e34.firebasestorage.app",
  messagingSenderId: "323312632683",
  appId: "1:323312632683:web:eef9ca7acc5c5a89ce422e",
  measurementId: "G-SDY9ZRV9V4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Sign in with Google popup
export const signInWithGoogle = async (): Promise<string> => {
  const result = await signInWithPopup(auth, googleProvider);
  // Get the ID token to send to your backend
  const idToken = await result.user.getIdToken();
  return idToken;
};

export { auth, googleProvider };

