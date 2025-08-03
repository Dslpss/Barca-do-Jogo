import { registerRootComponent } from "expo";
import { LogBox } from "react-native";

import App from "./App";

// Configurar logs para desenvolvimento
if (__DEV__) {
  // Ignorar warnings específicos que são conhecidos
  LogBox.ignoreLogs([
    "Setting a timer",
    "AsyncStorage has been extracted from react-native",
    "Non-serializable values were found in the navigation state",
    "@firebase/auth: Auth (10.11.0)",
  ]);
}

// Capturar erros globais
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("Warning:")) {
    // Ignorar warnings específicos em produção
    return;
  }
  originalConsoleError(...args);
};

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
