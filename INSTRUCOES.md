# Instruções para o desenvolvimento do aplicativo de sorteio de times

## Objetivo

Criar um aplicativo Android usando Expo Go e TypeScript que realiza sorteios de times, jogadores e cores de coletes, funcionando 100% offline e utilizando o armazenamento local do dispositivo.

## Funcionalidades principais

1. **Sorteio de Times**

   - Permitir ao usuário cadastrar jogadores.
   - Definir quantidade de times.
   - Sortear jogadores entre os times.

2. **Sorteio de Jogadores**

   - Sortear jogadores individualmente para tarefas ou funções.

3. **Sorteio de Cores de Coletes**

   - Sortear cores para cada time ou jogador.
   - Permitir personalizar as cores disponíveis.

4. **Armazenamento Offline**
   - Utilizar armazenamento local (AsyncStorage ou equivalente) para salvar dados dos jogadores, times e configurações.
   - Garantir que todas as funcionalidades funcionem sem conexão com a internet.

## Requisitos Técnicos

- Expo Go
- TypeScript
- React Native
- AsyncStorage (ou alternativa offline)

## Telas sugeridas

1. Tela de cadastro de jogadores
2. Tela de configuração de sorteio (quantidade de times, cores, etc.)
3. Tela de resultado do sorteio
4. Tela de histórico de sorteios

## Passos para desenvolvimento

1. Inicializar projeto Expo com TypeScript
2. Implementar tela de cadastro de jogadores
3. Implementar tela de configuração de sorteio
4. Implementar lógica de sorteio de times, jogadores e cores
5. Implementar armazenamento offline
6. Testar funcionamento offline
7. Refinar UI/UX
8. Documentar e revisar

## Observações

- O app deve ser simples, intuitivo e rápido.
- Priorizar funcionamento offline.
- Garantir persistência dos dados entre sessões.

---

Use este arquivo como guia para manter o foco durante o desenvolvimento.
