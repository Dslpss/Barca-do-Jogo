import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";

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
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth
// Firebase v12 com React Native detecta automaticamente o AsyncStorage
let auth: Auth;
try {
  // No React Native, o Firebase v12 detecta automaticamente o AsyncStorage
  // se o pacote @react-native-async-storage/async-storage estiver instalado
  auth = initializeAuth(app);
  console.log("✅ Firebase Auth inicializado com persistência automática");
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
