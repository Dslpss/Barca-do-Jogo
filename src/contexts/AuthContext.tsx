import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { auth } from "../config/firebaseConfig";
import useFirebaseAuthPersistence from "../hooks/useFirebaseAuthPersistence";
import { useConnectivity } from "../hooks/useConnectivity";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  isOffline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const { forceCheck } = useConnectivity();

  // Configurar persistência do Firebase Auth
  useFirebaseAuthPersistence();

  useEffect(() => {
    // Forçar checagem de conectividade ao inicializar o provedor
    try {
      forceCheck();
    } catch (err) {
      console.warn("Erro ao forçar checagem de conectividade:", err);
    }
    // Monitorar conectividade
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    // Verificar se há dados de autenticação salvos localmente
    const checkStoredAuth = async () => {
      try {
        // Primeiro, verificar se há dados de usuário salvos localmente (modo offline)
        const storedUserData = await AsyncStorage.getItem("userData");
        const storedEmail = await AsyncStorage.getItem("userEmail");
        const storedPassword = await AsyncStorage.getItem("userPassword");

        // Verificar conectividade
        const netInfo = await NetInfo.fetch();
        const isConnected = netInfo.isConnected;

        if (isConnected && storedEmail && storedPassword) {
          // Online: tentar fazer login silencioso
          try {
            const result = await signInWithEmailAndPassword(
              auth,
              storedEmail,
              storedPassword
            );
            // Salvar dados do usuário para uso offline
            const userData = {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              lastLogin: new Date().toISOString(),
            };
            await AsyncStorage.setItem("userData", JSON.stringify(userData));
          } catch (error) {
            console.log("Erro no login silencioso:", error);
            // Se falhar online, tentar usar dados offline
            if (storedUserData) {
              const userData = JSON.parse(storedUserData);
              // Criar objeto user-like para modo offline
              const offlineUser = {
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName,
                phoneNumber: null,
                photoURL: null,
                providerId: "offline",
                emailVerified: true,
                isAnonymous: false,
                metadata: {},
                providerData: [],
                refreshToken: "",
                tenantId: null,
                delete: async () => {},
                getIdToken: async () => "",
                getIdTokenResult: async () => ({} as any),
                reload: async () => {},
                toJSON: () => ({}),
              } as User;
              // Expor usuário offline em memória para serviços que achem necessário
              (globalThis as any).offlineUser = offlineUser;
              setUser(offlineUser);
              console.log("Usando autenticação offline");
            } else {
              // Limpar dados inválidos
              await AsyncStorage.multiRemove([
                "userEmail",
                "userPassword",
                "userData",
              ]);
            }
          }
        } else if (!isConnected && storedUserData) {
          // Offline: usar dados salvos localmente
          const userData = JSON.parse(storedUserData);
          const offlineUser = {
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            phoneNumber: null,
            photoURL: null,
            providerId: "offline",
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: "",
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => "",
            getIdTokenResult: async () => ({} as any),
            reload: async () => {},
            toJSON: () => ({}),
          } as User;
          (globalThis as any).offlineUser = offlineUser;
          setUser(offlineUser);
          console.log("Modo offline: usuário autenticado localmente");
        }
      } catch (error) {
        console.log("Erro na verificação de autenticação:", error);
      } finally {
        setLoading(false);
      }
    };

    checkStoredAuth();

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          // Salvar dados do usuário para uso offline
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            lastLogin: new Date().toISOString(),
          };
          await AsyncStorage.setItem("userData", JSON.stringify(userData));
        }
        setUser(user);
        if (!user) {
          try {
            delete (globalThis as any).offlineUser;
          } catch (e) {}
        }
        setLoading(false);
      },
      (error) => {
        console.log("Erro no onAuthStateChanged:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeNetInfo();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      // Verificar conectividade antes de tentar fazer login
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error(
          "Sem conexão com a internet. Verifique sua conectividade."
        );
      }

      const result = await signInWithEmailAndPassword(auth, email, password);

      // Salvar credenciais para persistência
      await AsyncStorage.setItem("userEmail", email);
      await AsyncStorage.setItem("userPassword", password);
    } catch (error: any) {
      let errorMessage = "Erro ao fazer login";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Usuário não encontrado";
          break;
        case "auth/wrong-password":
          errorMessage = "Senha incorreta";
          break;
        case "auth/invalid-email":
          errorMessage = "E-mail inválido";
          break;
        case "auth/too-many-requests":
          errorMessage = "Muitas tentativas. Tente novamente mais tarde";
          break;
        default:
          errorMessage = "Erro ao fazer login. Verifique suas credenciais";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      // Limpar todos os dados salvos (incluindo dados offline)
      await AsyncStorage.multiRemove(["userEmail", "userPassword", "userData"]);

      // Verificar conectividade antes de tentar logout online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await firebaseSignOut(auth);
      } else {
        // Modo offline: apenas limpar estado local
        setUser(null);
        try {
          delete (globalThis as any).offlineUser;
        } catch (e) {}
      }
    } catch (error) {
      setError("Erro ao fazer logout");
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    error,
    isOffline,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
