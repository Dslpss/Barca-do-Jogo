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
}

export interface Championship {
  id: string;
  name: string;
  type: "pontos_corridos" | "mata_mata" | "grupos";
  status: "criado" | "em_andamento" | "finalizado";
  teams: Team[];
  matches: Match[];
  createdAt: string;
  updatedAt: string;
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
