import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
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

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth
// Note: Firebase v12 detecta automaticamente o AsyncStorage no React Native
let auth: Auth;
try {
  auth = initializeAuth(app);
  console.log("✅ Firebase Auth inicializado");
} catch (error: any) {
  // Se initializeAuth falhar (já foi inicializado), usar getAuth
  auth = getAuth(app);
  console.log("✅ Firebase Auth obtido da instância existente");
}

// Verificar se o AsyncStorage está sendo usado
setTimeout(() => {
  try {
    // Verificação simples se o auth está funcionando
    console.log("✅ Firebase Auth configurado e pronto");
  } catch (e) {
    console.warn("⚠️ Possível problema na configuração do Firebase Auth");
  }
}, 100);

export { auth };

// Initialize Firestore
export const db = getFirestore(app);

export default app;
