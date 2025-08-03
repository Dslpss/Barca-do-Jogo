// Exemplo de como usar as novas funcionalidades de geração de partidas
// Este arquivo serve como referência para implementar na interface

import React, { useState } from "react";
import { useChampionship } from "../hooks/useChampionship";
import { MatchGenerationOptions, ManualMatch } from "../types/championship";

export const MatchGenerationExample = () => {
  const {
    currentChampionship,
    generateMatches,
    getPossibleMatchups,
    getMatchesByRound,
  } = useChampionship();

  const [generationType, setGenerationType] = useState<"automatic" | "manual">(
    "automatic"
  );
  const [gamesPerDay, setGamesPerDay] = useState<number>(2);
  const [selectedMatches, setSelectedMatches] = useState<ManualMatch[]>([]);

  // Exemplo 1: Geração automática com jogos por dia
  const handleAutomaticGeneration = async () => {
    const options: MatchGenerationOptions = {
      type: "automatic",
      gamesPerDay: gamesPerDay,
    };

    try {
      await generateMatches(options);
      console.log("✅ Partidas geradas automaticamente!");
    } catch (error) {
      console.error("❌ Erro ao gerar partidas:", error);
    }
  };

  // Exemplo 2: Geração manual com confrontos selecionados
  const handleManualGeneration = async () => {
    if (selectedMatches.length === 0) {
      alert("Selecione pelo menos um confronto!");
      return;
    }

    const options: MatchGenerationOptions = {
      type: "manual",
      manualMatches: selectedMatches,
    };

    try {
      await generateMatches(options);
      console.log("✅ Partidas geradas manualmente!");
    } catch (error) {
      console.error("❌ Erro ao gerar partidas:", error);
    }
  };

  // Exemplo 3: Adicionar confronto manual
  const addManualMatch = (
    homeTeamId: string,
    awayTeamId: string,
    round: number = 1
  ) => {
    const newMatch: ManualMatch = {
      homeTeamId,
      awayTeamId,
      round,
    };
    setSelectedMatches([...selectedMatches, newMatch]);
  };

  // Exemplo 4: Obter confrontos possíveis
  const possibleMatchups = getPossibleMatchups();

  // Exemplo 5: Visualizar partidas por rodada
  const matchesByRound = getMatchesByRound();

  return (
    <div>
      <h2>🎮 Geração de Partidas</h2>

      {/* Seleção do tipo de geração */}
      <div>
        <h3>Tipo de Geração:</h3>
        <label>
          <input
            type="radio"
            value="automatic"
            checked={generationType === "automatic"}
            onChange={(e) => setGenerationType(e.target.value as "automatic")}
          />
          Automática
        </label>
        <label>
          <input
            type="radio"
            value="manual"
            checked={generationType === "manual"}
            onChange={(e) => setGenerationType(e.target.value as "manual")}
          />
          Manual
        </label>
      </div>

      {/* Opções para geração automática */}
      {generationType === "automatic" && (
        <div>
          <h3>⚽ Configurações Automáticas:</h3>
          <div>
            <label>
              Jogos por dia/rodada:
              <input
                type="number"
                min="1"
                max="10"
                value={gamesPerDay}
                onChange={(e) => setGamesPerDay(parseInt(e.target.value))}
              />
            </label>
          </div>
          <button onClick={handleAutomaticGeneration}>
            🤖 Gerar Automaticamente
          </button>
        </div>
      )}

      {/* Opções para geração manual */}
      {generationType === "manual" && (
        <div>
          <h3>🎯 Seleção Manual de Confrontos:</h3>

          <div>
            <h4>Confrontos Possíveis:</h4>
            {possibleMatchups.map((matchup, index) => (
              <div key={index}>
                <span>
                  {matchup.homeTeam.name} vs {matchup.awayTeam.name}
                </span>
                <button
                  onClick={() =>
                    addManualMatch(matchup.homeTeam.id, matchup.awayTeam.id)
                  }
                >
                  ➕ Adicionar
                </button>
              </div>
            ))}
          </div>

          <div>
            <h4>Confrontos Selecionados ({selectedMatches.length}):</h4>
            {selectedMatches.map((match, index) => {
              const homeTeam = currentChampionship?.teams.find(
                (t) => t.id === match.homeTeamId
              );
              const awayTeam = currentChampionship?.teams.find(
                (t) => t.id === match.awayTeamId
              );
              return (
                <div key={index}>
                  <span>
                    Rodada {match.round}: {homeTeam?.name} vs {awayTeam?.name}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedMatches(
                        selectedMatches.filter((_, i) => i !== index)
                      )
                    }
                  >
                    ❌ Remover
                  </button>
                </div>
              );
            })}
          </div>

          <button onClick={handleManualGeneration}>🎯 Gerar Manualmente</button>
        </div>
      )}

      {/* Visualização das partidas por rodada */}
      {Object.keys(matchesByRound).length > 0 && (
        <div>
          <h3>📅 Partidas por Rodada:</h3>
          {Object.entries(matchesByRound).map(([round, matches]) => (
            <div key={round}>
              <h4>
                🏁 Rodada {round} ({matches.length} jogos)
              </h4>
              {matches.map((match, index) => {
                const homeTeam = currentChampionship?.teams.find(
                  (t) => t.id === match.homeTeam
                );
                const awayTeam = currentChampionship?.teams.find(
                  (t) => t.id === match.awayTeam
                );
                return (
                  <div key={match.id}>
                    <span>
                      Jogo {match.matchOrder}: {homeTeam?.name} vs{" "}
                      {awayTeam?.name}
                    </span>
                    {match.played && (
                      <span>
                        {" "}
                        - {match.homeScore} x {match.awayScore}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* 

🎮 COMO USAR AS NOVAS FUNCIONALIDADES:

1. **GERAÇÃO AUTOMÁTICA COM JOGOS POR DIA:**
   ```typescript
   const options = {
     type: 'automatic',
     gamesPerDay: 3, // 3 jogos por rodada/dia
   };
   await generateMatches(options);
   ```

2. **GERAÇÃO MANUAL DE CONFRONTOS:**
   ```typescript
   const manualMatches = [
     { homeTeamId: 'team1', awayTeamId: 'team2', round: 1 },
     { homeTeamId: 'team3', awayTeamId: 'team4', round: 1 },
     { homeTeamId: 'team1', awayTeamId: 'team3', round: 2 },
   ];
   
   const options = {
     type: 'manual',
     manualMatches: manualMatches,
   };
   await generateMatches(options);
   ```

3. **OBTER CONFRONTOS POSSÍVEIS:**
   ```typescript
   const possibleMatchups = getPossibleMatchups();
   // Retorna: [{ homeTeam: Team, awayTeam: Team }, ...]
   ```

4. **VISUALIZAR PARTIDAS POR RODADA:**
   ```typescript
   const matchesByRound = getMatchesByRound();
   // Retorna: { 1: [Match, Match], 2: [Match], ... }
   ```

5. **ESTRUTURA DE DADOS DAS PARTIDAS:**
   ```typescript
   interface Match {
     id: string;
     homeTeam: string;
     awayTeam: string;
     round?: number;        // 🆕 Rodada/Dia do jogo
     matchOrder?: number;   // 🆕 Ordem do jogo na rodada
     played: boolean;
     homeScore?: number;
     awayScore?: number;
     // ... outros campos
   }
   ```

🚀 BENEFÍCIOS:

✅ **Controle de Jogos por Dia:** Evita sobrecarga de partidas
✅ **Seleção Manual:** Permite criar confrontos específicos
✅ **Organização por Rodadas:** Melhor visualização e planejamento
✅ **Flexibilidade:** Combina geração automática e manual
✅ **Compatibilidade:** Funciona com tipos existentes de campeonato

*/
