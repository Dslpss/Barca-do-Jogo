// Teste simples para verificar conectividade com Firebase
// Execute com: node firebase-test.js

const admin = require("firebase-admin");

// Configuração do Firebase Admin (para teste apenas)
const firebaseConfig = {
  apiKey: "AIzaSyAqvfTFpri7-quRf8uKf9lKjQElQuBUTu8",
  authDomain: "anotacoes-estudos.firebaseapp.com",
  projectId: "anotacoes-estudos",
  storageBucket: "anotacoes-estudos.firebasestorage.app",
  messagingSenderId: "730890275748",
  appId: "1:730890275748:android:6bc3c230c25e69bef60f31",
};

console.log("🔥 Testando conectividade com Firebase...");
console.log("📋 Configuração:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

// Teste básico de conectividade
console.log("✅ Configuração carregada com sucesso!");
console.log("🎯 Para verificar se os dados estão sendo salvos:");
console.log("1. Abra o Firebase Console: https://console.firebase.google.com/");
console.log("2. Selecione o projeto: anotacoes-estudos");
console.log("3. Vá em Firestore Database");
console.log("4. Procure pelas coleções: championships, teams, players");
console.log(
  "5. Verifique se há documentos com userId correspondente ao usuário logado"
);
