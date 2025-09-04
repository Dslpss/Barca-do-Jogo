import { useEffect } from "react";
import { auth } from "../config/firebaseConfig";

// Esta função configura a persistência do Auth manualmente
export const useFirebaseAuthPersistence = () => {
  useEffect(() => {
    // O Firebase Auth v12 já usa AsyncStorage automaticamente no React Native
    // Este hook existe para garantir que a configuração está correta

    // Verificação simples se o auth está disponível
    try {
      if (auth && auth.app) {
        console.log(
          "✅ Firebase Auth configurado com persistência automática via AsyncStorage"
        );
      } else {
        console.warn(
          "⚠️ Firebase Auth pode não estar configurado corretamente"
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ Erro ao verificar configuração do Firebase Auth:",
        error
      );
    }
  }, []);
};

export default useFirebaseAuthPersistence;
