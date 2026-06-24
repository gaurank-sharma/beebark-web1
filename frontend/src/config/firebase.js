import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase web config (all public). Phone sign-in is enabled only when these
// are provided via env vars — otherwise the phone option stays hidden.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

export const FIREBASE_ENABLED = !!firebaseConfig.apiKey;

let authInstance = null;

export const getFirebaseAuth = () => {
  if (!FIREBASE_ENABLED) return null;
  if (!authInstance) {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  }
  return authInstance;
};
