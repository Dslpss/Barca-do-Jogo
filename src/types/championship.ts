// Tipos para o sistema de campeonatos

export interface Player {
  id: string;
  name: string;
  skill: number; // 1-5
  position: string;
  yellowCards: number;
  redCards: number;
  cpf?: string; // Campo opcional para CPF
}

export interface Team {
  id: string;
  name: string;
  color: string;
  players: Player[];
}

export interface GoalScorer {
  playerId: string;
  goals: number;
  yellowCard?: boolean;
  redCard?: boolean;
}

export interface Match {
  id: string;
  homeTeam: string; // Team ID
  awayTeam: string; // Team ID
  homeScore?: number;
  awayScore?: number;
  date?: string;
  played: boolean;
  homeGoalScorers?: GoalScorer[]; // Detailed goal and card info
  awayGoalScorers?: GoalScorer[]; // Detailed goal and card info
  round?: number; // Rodada/Dia do jogo
  matchOrder?: number; // Ordem do jogo na rodada
}

export interface MatchGenerationOptions {
  type: "manual";
  manualMatches: ManualMatch[]; // Confrontos selecionados manualmente (obrigatório)
}

export interface ManualMatch {
  homeTeamId: string;
  awayTeamId: string;
  round?: number;
}

export interface Championship {
  id: string;
  name: string;
  type: "pontos_corridos" | "mata_mata" | "grupos";
  status: "criado" | "em_andamento" | "pausado" | "finalizado";
  teams: Team[];
  matches: Match[];
  matchGenerationOptions?: MatchGenerationOptions; // Opções de geração de partidas
  createdAt: string;
  updatedAt: string;
  finishedAt?: string; // Data de finalização do campeonato
  userId?: string; // ID do usuário proprietário do campeonato
}

export interface ChampionshipStats {
  teamStats: {
    [teamId: string]: {
      matches: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
      points: number;
    };
  };
  playerStats: {
    [playerId: string]: {
      matches: number;
      goals: number;
      yellowCards: number;
      redCards: number;
    };
  };
}
