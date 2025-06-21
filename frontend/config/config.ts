// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);

export { analytics, app };
export default app;