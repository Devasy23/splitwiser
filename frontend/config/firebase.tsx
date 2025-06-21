import * as Google from 'expo-auth-session/providers/google';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Web client ID from your Firebase project
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID';

// Initialize Firebase
const firebaseConfig = {
  // Firebase config is automatically loaded from google-services.json
  // for Android builds through the Expo config in app.json
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function useGoogleAuth() {
  const { googleLogin } = useAuth();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true);
      const { id_token } = response.params;
      
      // Function to sign in with Google
      const signInWithGoogle = async () => {
        try {
          // For client-side verification (optional, as we'll verify on the backend)
          const credential = GoogleAuthProvider.credential(id_token);
          await signInWithCredential(auth, credential);
          
          // Send the ID token to your backend
          await googleLogin(id_token);
          setError(null);
        } catch (err: any) {
          setError(err.message || 'Failed to sign in with Google');
          console.error('Google sign-in error:', err);
        } finally {
          setLoading(false);
        }
      };

      signInWithGoogle();
    }
  }, [response, googleLogin]);

  return { 
    promptAsync, 
    loading, 
    error,
    request 
  };
}
