import {
  Championship,
  Group,
  Match,
  Team,
  GoalScorer,
} from "../types/championship";

// Pequeno utilitário para clonar data segura
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Gerar partidas da fase de grupos (apenas ida por padrão; respeita flag do campeonato)
export function generateGroupStageMatchesPure(
  championship: Championship
): Match[] {
  if (!championship.groups || championship.groups.length === 0) {
    throw new Error("Campeonato não possui grupos definidos");
  }
  const matches: Match[] = [];
  let matchId = 0;
  const hasReturnMatches =
    championship.groupStageSettings?.hasReturnMatches ?? false;

  championship.groups.forEach((group) => {
    if (group.teamIds.length < 2) return;
    for (let i = 0; i < group.teamIds.length; i++) {
      for (let j = i + 1; j < group.teamIds.length; j++) {
        const homeTeam = group.teamIds[i];
        const awayTeam = group.teamIds[j];
        matches.push({
          id: `group_${Date.now()}_${matchId++}`,
          homeTeam,
          awayTeam,
          played: false,
          homeGoalScorers: [],
          awayGoalScorers: [],
          round: 1,
          matchOrder: matchId,
        });
        if (hasReturnMatches) {
          matches.push({
            id: `group_${Date.now()}_${matchId++}`,
            homeTeam: awayTeam,
            awayTeam: homeTeam,
            played: false,
            homeGoalScorers: [],
            awayGoalScorers: [],
            round: 2,
            matchOrder: matchId,
          });
        }
      }
    }
  });
  return matches;
}

// Critérios de desempate do regulamento
export function getGroupStandingsPure(championship: Championship): {
  [groupId: string]: {
    group: Group;
    standings: Array<{
      teamId: string;
      matches: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
      points: number;
    }>;
  };
} {
  if (!championship.groups) return {};
  const out: any = {};
  championship.groups.forEach((group) => {
    const standings = group.teamIds.map((teamId) => {
      const s = {
        teamId,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };
      (championship.matches || [])
        .filter((m) => m.played)
        .forEach((m) => {
          const isHome = m.homeTeam === teamId;
          const isAway = m.awayTeam === teamId;
          const bothInGroup =
            group.teamIds.includes(m.homeTeam) &&
            group.teamIds.includes(m.awayTeam);
          if ((isHome || isAway) && bothInGroup) {
            s.matches++;
            const hs = m.homeScore || 0;
            const as = m.awayScore || 0;
            if (isHome) {
              s.goalsFor += hs;
              s.goalsAgainst += as;
              if (hs > as) {
                s.wins++;
                s.points += 3;
              } else if (hs === as) {
                s.draws++;
                s.points += 1;
              } else {
                s.losses++;
              }
            } else {
              s.goalsFor += as;
              s.goalsAgainst += hs;
              if (as > hs) {
                s.wins++;
                s.points += 3;
              } else if (as === hs) {
                s.draws++;
                s.points += 1;
              } else {
                s.losses++;
              }
            }
          }
        });
      s.goalDifference = s.goalsFor - s.goalsAgainst;
      return s;
    });

    const getTeamCards = (teamId: string) => {
      let yellow = 0,
        red = 0;
      (championship.matches || [])
        .filter((m) => m.played)
        .forEach((m) => {
          const count = (sc?: GoalScorer[]) =>
            (sc || []).forEach((x) => {
              if (x.yellowCard) yellow++;
              if (x.redCard) red++;
            });
          if (m.homeTeam === teamId) count(m.homeGoalScorers);
          if (m.awayTeam === teamId) count(m.awayGoalScorers);
        });
      return { yellow, red };
    };

    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      if (a.goalsAgainst !== b.goalsAgainst)
        return a.goalsAgainst - b.goalsAgainst;
      if (a.losses !== b.losses) return a.losses - b.losses;
      const aC = getTeamCards(a.teamId);
      const bC = getTeamCards(b.teamId);
      if (aC.red !== bC.red) return aC.red - bC.red;
      if (aC.yellow !== bC.yellow) return aC.yellow - bC.yellow;
      return Math.random() < 0.5 ? -1 : 1;
    });

    out[group.id] = { group, standings };
  });
  return out;
}

// Cruzamento fixo das quartas a partir dos 2 primeiros de cada grupo (1A×2B, 1B×2A, 1C×2D, 1D×2C)
export function generateKnockoutFromGroupsPure(
  championship: Championship
): Match[] {
  if (!championship.groups || championship.groups.length === 0) {
    throw new Error("Não há grupos definidos");
  }
  const standings = getGroupStandingsPure(championship);
  const getLetter = (name: string) => {
    const m = name.match(/[A-D]/i);
    return m ? m[0].toUpperCase() : name.toUpperCase();
  };
  const top2: Record<string, string[]> = {};
  Object.values(standings).forEach(({ group, standings }) => {
    top2[getLetter(group.name)] = standings.slice(0, 2).map((s) => s.teamId);
  });
  const pairs: Array<[string, string]> = [];
  const a = top2["A"] || [];
  const b = top2["B"] || [];
  const c = top2["C"] || [];
  const d = top2["D"] || [];
  if (a.length >= 2 && b.length >= 2) {
    pairs.push([a[0], b[1]]);
    pairs.push([b[0], a[1]]);
  }
  if (c.length >= 2 && d.length >= 2) {
    pairs.push([c[0], d[1]]);
    pairs.push([d[0], c[1]]);
  }
  let matchId = 0;
  const matches: Match[] = [];
  pairs.forEach(([home, away], idx) => {
    matches.push({
      id: `knockout_qf_${Date.now()}_${matchId++}`,
      homeTeam: home,
      awayTeam: away,
      played: false,
      homeGoalScorers: [],
      awayGoalScorers: [],
      isKnockout: true,
      knockoutRound: 1,
      round: 1,
      matchOrder: idx + 1,
    });
  });
  return matches;
}

// Próximas fases no modo grupos: semifinal por sorteio, final dos vencedores
export function generateNextKnockoutRoundFromGroupsPure(
  championship: Championship
): Match[] {
  const ko = (championship.matches || []).filter(
    (m) => m.isKnockout || (m.id && m.id.includes("knockout_"))
  );
  if (ko.length === 0) return [];
  const maxRound = Math.max(...ko.map((m) => m.knockoutRound || 1));
  const current = ko.filter((m) => (m.knockoutRound || 1) === maxRound);
  const allPlayed = current.every((m) => m.played);
  if (!allPlayed) return [];
  const winners: string[] = [];
  current.forEach((m) => {
    const hs = m.homeScore || 0;
    const as = m.awayScore || 0;
    if (hs > as) winners.push(m.homeTeam);
    else if (as > hs) winners.push(m.awayTeam);
    else winners.push(m.homeTeam); // fallback
  });
  const newMatches: Match[] = [];
  let matchId = 0;
  if (maxRound === 1) {
    const shuffled = [...winners].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        newMatches.push({
          id: `knockout_sf_${Date.now()}_${matchId++}`,
          homeTeam: shuffled[i],
          awayTeam: shuffled[i + 1],
          played: false,
          homeGoalScorers: [],
          awayGoalScorers: [],
          isKnockout: true,
          knockoutRound: 2,
          round: 2,
          matchOrder: Math.floor(i / 2) + 1,
        });
      }
    }
    return newMatches;
  }
  if (maxRound === 2) {
    if (winners.length >= 2) {
      newMatches.push({
        id: `knockout_fn_${Date.now()}_${matchId++}`,
        homeTeam: winners[0],
        awayTeam: winners[1],
        played: false,
        homeGoalScorers: [],
        awayGoalScorers: [],
        isKnockout: true,
        knockoutRound: 3,
        round: 3,
        matchOrder: 1,
      });
    }
    return newMatches;
  }
  return [];
}
