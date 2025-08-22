import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env
    .EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID as string,
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistent storage for React Native
// Prefer initializeAuth + getReactNativePersistence to enable AsyncStorage persistence
let authInstance;
try {
  // Carregar getReactNativePersistence de forma dinâmica para evitar o erro do bundler
  // (Metro pode tentar resolver imports estáticos como 'firebase/auth/react-native').
  const requireFn: any = eval("require");
  const rnModule = requireFn("firebase/auth/react-native");
  const getReactNativePersistence: any = rnModule?.getReactNativePersistence;

  if (typeof getReactNativePersistence === "function") {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage as any),
    });
  } else {
    throw new Error("getReactNativePersistence não disponível");
  }
} catch (err) {
  // Fallback para getAuth caso initializeAuth ou a persistência não estejam disponíveis
  console.warn(
    "initializeAuth com ReactNativePersistence não está disponível, usando getAuth como fallback:",
    err
  );
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Initialize Firestore
export const db = getFirestore(app);

export default app;
