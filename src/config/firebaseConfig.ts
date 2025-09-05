import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
  Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyAqvfTFpri7-quRf8uKf9lKjQElQuBUTu8",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "anotacoes-estudos.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "anotacoes-estudos",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "anotacoes-estudos.firebasestorage.app",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "730890275748",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    "1:730890275748:android:6bc3c230c25e69bef60f31",
};

// Validação das variáveis de ambiente com fallback para evitar crashes
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  console.warn(
    "Algumas configurações do Firebase não foram encontradas, usando valores padrão"
  );
}

// Initialize Firebase with error handling
let app: FirebaseApp;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase app inicializado");
  } else {
    app = getApps()[0];
    console.log("✅ Firebase app já estava inicializado");
  }
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase app:", error);
  throw error;
}

// Initialize Auth with error handling
let auth: Auth;
try {
  // Verificar se auth já foi inicializado
  try {
    auth = getAuth(app);
    console.log("✅ Firebase Auth obtido da instância existente");
  } catch (authError) {
    // Se getAuth falhar, tentar initializeAuth
    auth = initializeAuth(app);
    console.log("✅ Firebase Auth inicializado");
  }
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase Auth:", error);
  // Fallback para getAuth
  auth = getAuth(app);
  console.log("✅ Firebase Auth fallback executado");
}

export { auth };

// Initialize Firestore with error handling
let db: Firestore;
try {
  db = getFirestore(app);
  console.log("✅ Firestore inicializado");
} catch (error) {
  console.error("❌ Erro ao inicializar Firestore:", error);
  throw error;
}

export { db };

export default app;
