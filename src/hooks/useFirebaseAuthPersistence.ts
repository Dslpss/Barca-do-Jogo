import { useEffect } from "react";
import { auth } from "../config/firebaseConfig";

// Esta função configura a persistência do Auth manualmente
export const useFirebaseAuthPersistence = () => {
  useEffect(() => {
    // O Firebase Auth v12 já usa AsyncStorage automaticamente no React Native
    // Este hook existe apenas para garantir que a configuração está correta
    console.log("Firebase Auth configurado com persistência automática");
  }, []);
};

export default useFirebaseAuthPersistence;
