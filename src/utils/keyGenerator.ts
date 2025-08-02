let keyCounter = 0;

/**
 * Gera uma key única para componentes React
 * Combina timestamp, contador sequencial e string aleatória
 */
export function generateUniqueKey(prefix: string = "key"): string {
  keyCounter++;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${keyCounter}-${random}`;
}

/**
 * Gera um ID único para objetos de dados
 * Similar ao generateUniqueKey mas otimizado para IDs de dados
 *
 * Formato: timestamp-contador-random
 * Isto garante que mesmo com chamadas em sequência, os IDs serão únicos
 */
export function generateUniqueId(): string {
  keyCounter++;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  return `${timestamp}${keyCounter}${random}`;
}

/**
 * Reseta o contador (útil para testes)
 */
export function resetKeyCounter(): void {
  keyCounter = 0;
}
