// firebaseConfig.ts or firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Import getAuth for authentication
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID // Only if you enabled Google Analytics
};
console.log('Env check:', process.env);

// Validate required configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const;
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
console.log('Firebase configuration:', firebaseConfig);
// Check if any required keys are missing
console.log('Checking Firebase configuration for missing keys...',missingKeys);
if (missingKeys.length > 0){
  throw new Error(`Missing Firebase configuration keys: ${missingKeys.join(', ')}`);
}
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
