import {
  Championship,
  Team,
  Group,
  Match,
  GoalScorer,
} from "../src/types/championship";
import {
  generateGroupStageMatchesPure,
  getGroupStandingsPure,
  generateKnockoutFromGroupsPure,
  generateNextKnockoutRoundFromGroupsPure,
} from "../src/utils/e2eLogic";

type Assertion = { ok: boolean; message: string };
const assert = (cond: boolean, msg: string): Assertion => ({
  ok: !!cond,
  message: (cond ? "✅ " : "❌ ") + msg,
});

function makeTeam(id: number, name: string): Team {
  return { id: `T${id}`, name, color: "#888", players: [] };
}

function nowIso() {
  return new Date().toISOString();
}

// Simular gols/cartões para embutir critérios de desempate
function scorer(goals: number = 0, yellow = 0, red = 0): GoalScorer[] {
  const arr: GoalScorer[] = [];
  if (goals <= 0 && yellow === 0 && red === 0) return arr;
  // Usamos um jogador fictício com contadores agregados distribuídos em itens
  for (let i = 0; i < goals; i++) arr.push({ playerId: `P${i + 1}`, goals: 1 });
  for (let i = 0; i < yellow; i++)
    arr.push({ playerId: `Y${i + 1}`, goals: 0, yellowCard: true });
  for (let i = 0; i < red; i++)
    arr.push({ playerId: `R${i + 1}`, goals: 0, redCard: true });
  return arr;
}

function createChampionship16(): Championship {
  const teams: Team[] = [];
  for (let i = 1; i <= 16; i++) teams.push(makeTeam(i, `Time ${i}`));
  const groups: Group[] = ["A", "B", "C", "D"].map((letter, gi) => ({
    id: `grupo_${letter}`,
    name: `Grupo ${letter}`,
    teamIds: teams.slice(gi * 4, gi * 4 + 4).map((t) => t.id),
  }));

  const now = nowIso();
  const ch: Championship = {
    id: "CH1",
    name: "E2E Teste Grupos",
    type: "grupos",
    status: "criado",
    teams,
    matches: [],
    groups,
    currentPhase: "grupos",
    groupStageSettings: { hasReturnMatches: false },
    createdAt: now,
    updatedAt: now,
  };
  return ch;
}

function simulateGroupMatches(ch: Championship) {
  // Gera jogos e depois marca todos como jogados, inserindo resultados controlados
  const groupMatches = generateGroupStageMatchesPure(ch);
  ch.matches.push(...groupMatches);

  // Para cada grupo, crie alguns empates e use cartões para desempate
  const byTeam: Record<string, { goalsFor: number; goalsAgainst: number }> = {};
  const setPlayed = (
    m: Match,
    hs: number,
    as: number,
    hy = 0,
    hr = 0,
    ay = 0,
    ar = 0
  ) => {
    m.played = true;
    m.homeScore = hs;
    m.awayScore = as;
    m.date = nowIso();
    m.homeGoalScorers = scorer(hs, hy, hr);
    m.awayGoalScorers = scorer(as, ay, ar);
    byTeam[m.homeTeam] = byTeam[m.homeTeam] || { goalsFor: 0, goalsAgainst: 0 };
    byTeam[m.awayTeam] = byTeam[m.awayTeam] || { goalsFor: 0, goalsAgainst: 0 };
    byTeam[m.homeTeam].goalsFor += hs;
    byTeam[m.homeTeam].goalsAgainst += as;
    byTeam[m.awayTeam].goalsFor += as;
    byTeam[m.awayTeam].goalsAgainst += hs;
  };

  // Estratégia simples: fazer Time 1 e 2 liderarem no Grupo A, etc.
  const groups = ch.groups!;
  for (const g of groups) {
    const gMatches = ch.matches.filter(
      (m) => g.teamIds.includes(m.homeTeam) && g.teamIds.includes(m.awayTeam)
    );
    // Sortivamente defina placares previsíveis
    const [t1, t2, t3, t4] = g.teamIds;
    // Forçar 1º e 2º com melhores campanhas, mas criar um empate em pontos entre 2º e 3º desempatado por cartões
    gMatches.forEach((m) => {
      const pair = `${m.homeTeam}-${m.awayTeam}`;
      if (pair.includes(t1) && pair.includes(t2)) {
        setPlayed(m, 2, 1);
      } else if (pair.includes(t1) && pair.includes(t3)) {
        setPlayed(m, 3, 0);
      } else if (pair.includes(t1) && pair.includes(t4)) {
        setPlayed(m, 1, 0);
      } else if (pair.includes(t2) && pair.includes(t3)) {
        setPlayed(m, 1, 0);
      } else if (pair.includes(t2) && pair.includes(t4)) {
        setPlayed(m, 0, 0, 0, 0, 1, 0); /* empate; visitante leva 1 amarelo */
      } else if (pair.includes(t3) && pair.includes(t4)) {
        setPlayed(m, 2, 2, 0, 0, 2, 0); /* empate; visitante 2 amarelos */
      } else {
        setPlayed(m, 1, 1);
      }
    });
  }
}

function markAll(matches: Match[]) {
  matches.forEach((m) => {
    m.played = true;
    m.homeScore ??= 1;
    m.awayScore ??= 0;
    m.homeGoalScorers ??= [];
    m.awayGoalScorers ??= [];
  });
}

function main() {
  const results: Assertion[] = [];
  const ch = createChampionship16();

  // 1) Gerar fase de grupos (apenas ida)
  const gm = generateGroupStageMatchesPure(ch);
  results.push(
    assert(
      gm.length === 4 * ((4 * 3) / 2),
      `Gerou ${gm.length} jogos de grupos esperados (6 por grupo x 4 = 24)`
    )
  );
  ch.matches.push(...gm);

  // 2) Simular resultados com empates e cartões
  simulateGroupMatches(ch);
  const standings = getGroupStandingsPure(ch);
  results.push(
    assert(
      Object.keys(standings).length === 4,
      "Calculou classificação para 4 grupos"
    )
  );

  // 3) Verificar que há 2 classificados por grupo e critérios funcionando (pelo menos ordem estável)
  for (const gid of Object.keys(standings)) {
    const s = standings[gid].standings;
    results.push(assert(s.length === 4, `Grupo ${gid}: 4 times ranqueados`));
    // Garantir que primeiro tem pontos >= segundo e assim por diante
    for (let i = 1; i < s.length; i++) {
      const ok =
        s[i - 1].points > s[i].points || s[i - 1].points === s[i].points;
      results.push(
        assert(
          ok,
          `Grupo ${gid}: ordem por pontos/critério consistente na posição ${i}`
        )
      );
    }
  }

  // 4) Gerar quartas fixas
  const qf = generateKnockoutFromGroupsPure(ch);
  results.push(assert(qf.length === 4, "Quartas geradas (4 jogos)"));
  qf.forEach((m) => ch.matches.push(m));

  // 5) Resolver quartas e sortear semis
  markAll(qf);
  const sf = generateNextKnockoutRoundFromGroupsPure(ch);
  results.push(
    assert(sf.length === 2, "Semifinais geradas por sorteio (2 jogos)")
  );
  sf.forEach((m) => ch.matches.push(m));

  // 6) Resolver semis e gerar final
  markAll(sf);
  const fn = generateNextKnockoutRoundFromGroupsPure(ch);
  results.push(assert(fn.length === 1, "Final gerada (1 jogo)"));
  fn.forEach((m) => ch.matches.push(m));

  // 7) Resolver final
  markAll(fn);

  // Sumário
  const okCount = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok);
  console.log("\n=== E2E Grupos Resultado ===");
  results.forEach((r) => console.log(r.message));
  console.log(
    `\nTotal: ${results.length}, OK: ${okCount}, FALHAS: ${fail.length}`
  );
  if (fail.length > 0) {
    console.error("\nFalhas:");
    fail.forEach((f) => console.error(f.message));
    process.exit(1);
  }
}

main();
