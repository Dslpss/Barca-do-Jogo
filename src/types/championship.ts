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
  eliminated?: boolean; // Para campeonatos mata-mata
  eliminatedInRound?: number; // Em qual rodada foi eliminado
  logo?: string; // URI da imagem do brasão/logo do time
}

export interface Group {
  id: string;
  name: string; // Ex: "Grupo A", "Grupo B"
  teamIds: string[];
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
  isKnockout?: boolean; // Indica se é uma partida de mata-mata
  knockoutRound?: number; // Rodada do mata-mata
}

export interface MatchGenerationOptions {
  type: "manual" | "configured" | "draw";
  manualMatches?: ManualMatch[]; // Confrontos selecionados manualmente (opcional)
  configuredOptions?: ConfiguredMatchOptions; // Configurações de geração (opcional)
  drawOptions?: DrawOptions; // Opções de sorteio manual (opcional)
}

export interface ConfiguredMatchOptions {
  totalRounds: number; // Número total de rodadas
  matchesPerTeam: number; // Número de partidas que cada time vai jogar
  matchDistribution: "equal" | "custom"; // Distribuição igual ou personalizada
  totalGames?: number; // Número total de jogos do campeonato (opcional)
  gameDistributionMode?: "auto" | "manual"; // Modo de distribuição: automático ou manual
  generationMode?: "complete" | "dynamic"; // Modo de geração: completo ou dinâmico
}

export interface ManualMatch {
  homeTeamId: string;
  awayTeamId: string;
  round?: number;
}

export interface DrawOptions {
  totalRounds: number; // Número total de rodadas
  totalMatches: number; // Número total de jogos a sortear
  drawMode: "random" | "balanced" | "seeded"; // Modo de sorteio
  allowSameTeamTwice: boolean; // Se permite o mesmo time jogar duas vezes na mesma rodada
  shuffleTeams: boolean; // Se deve embaralhar a ordem dos times
  groupBySkill: boolean; // Se deve agrupar times por nível de habilidade
}

export interface Championship {
  id: string;
  name: string;
  type: "pontos_corridos" | "mata_mata" | "grupos";
  status: "criado" | "em_andamento" | "pausado" | "finalizado";
  logo?: string; // URI da imagem do logo do campeonato (data URI base64)
  teams: Team[];
  matches: Match[];
  groups?: Group[]; // Grupos para campeonatos por fase de grupos
  currentPhase?: "grupos" | "mata_mata"; // Fase atual do campeonato (para tipo "grupos")
  matchGenerationOptions?: MatchGenerationOptions; // Opções de geração de partidas
  groupStageSettings?: {
    hasReturnMatches: boolean; // Se terá jogos de ida e volta na fase de grupos
  };
  champion?: string; // ID do time campeão (quando campeonato finalizado)
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
