E2E Grupos (Harness)

Resumo

- Simulador puro (sem Firebase/React Native) para validar fase de grupos (apenas ida), critérios de desempate, cruzamento fixo das quartas, semifinal por sorteio e final.

Como rodar

1. Instale ts-node caso não esteja no projeto: npm i -D ts-node
2. Execute o script:
   npm run test:e2e:grupos

O que valida

- Geração de 24 jogos de grupos (4 grupos × 6 jogos cada) quando "apenas ida".
- Classificação por pontos, vitórias, saldo, gols pró, menos gols sofridos, menos derrotas, menos vermelhos, menos amarelos, sorteio.
- Quartas: 1A×2B, 1B×2A, 1C×2D, 1D×2C, com mandante = 1º do grupo.
- Semifinais: pares definidos por sorteio entre os 4 classificados.
- Final: gerada a partir dos vencedores das semis.

Notas

- Não persiste nada; é um runner em memória com base em tipos e funções puras em src/utils/e2eLogic.ts.
  \*\*\* End Patch
