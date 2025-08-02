import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../config/firebaseConfig";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
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

  useEffect(() => {
    // Verificar se há dados de autenticação salvos localmente
    const checkStoredAuth = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("userEmail");
        const storedPassword = await AsyncStorage.getItem("userPassword");

        if (storedEmail && storedPassword) {
          // Tentar fazer login silencioso
          await signInWithEmailAndPassword(auth, storedEmail, storedPassword);
        }
      } catch (error) {
        // Se falhar, limpar dados armazenados
        await AsyncStorage.multiRemove(["userEmail", "userPassword"]);
      }
    };

    checkStoredAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
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
      // Limpar dados salvos
      await AsyncStorage.multiRemove(["userEmail", "userPassword"]);
      await firebaseSignOut(auth);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
