import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Ensure auth state persists across reloads
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // ignore persistence errors and fall back to default
  });
}

if (typeof window !== "undefined") {
  const originalConsoleError = console.error;

  console.error = (...args) => {
    const message = args?.[0];
    const obj = args?.[1];

    const isFirebaseInternalError =
      typeof message === "string" &&
      message.includes("INTERNAL ASSERTION FAILED");

    const isEmptyAuthError =
      typeof message === "string" &&
      message.includes("Auth error:") &&
      (obj === undefined ||
        (typeof obj === "object" && Object.keys(obj).length === 0));

    if (isFirebaseInternalError || isEmptyAuthError) return;

    originalConsoleError(...args);
  };
}
