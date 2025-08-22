// Declaração mínima para compatibilidade com TypeScript
// Resolve a importação `import { getReactNativePersistence } from 'firebase/auth/react-native'`

declare module "firebase/auth/react-native" {
  // Tipo minimalista: retorna 'any' para evitar dependência rígida de tipos
  export function getReactNativePersistence(storage: any): any;
}
