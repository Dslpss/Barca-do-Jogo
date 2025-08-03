// Arquivo temporário para debugar o problema de estatísticas

/*
ANÁLISE DO PROBLEMA:

1. O problema pode estar na função calculateStats() no useChampionship.ts
2. A lógica de cálculo de pontos parece correta:
   - Vitória: 3 pontos (pontos corridos) ou 1 ponto (outros tipos)
   - Empate: 1 ponto (pontos corridos) ou 0 pontos (outros tipos)
   - Derrota: 0 pontos

3. Possíveis causas:
   a) As partidas não estão sendo marcadas como played = true
   b) Os dados não estão sendo persistidos corretamente
   c) Os dados estão sendo sobrescritos por cache antigo
   d) Há algum problema na lógica de verificação das partidas

4. Vamos implementar debug logs para identificar o problema
*/

export const debugCalculateStats = (championship: any) => {
  console.log("🔍 DEBUG: Iniciando cálculo de estatísticas");
  console.log("🎮 DEBUG: Campeonato:", championship?.name);
  console.log(
    "📊 DEBUG: Total de partidas:",
    championship?.matches?.length || 0
  );

  const playedMatches =
    championship?.matches?.filter((m: any) => m.played) || [];
  console.log("✅ DEBUG: Partidas jogadas:", playedMatches.length);

  playedMatches.forEach((match: any, index: number) => {
    console.log(`🎯 DEBUG: Partida ${index + 1}:`, {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      played: match.played,
    });
  });

  return playedMatches;
};
