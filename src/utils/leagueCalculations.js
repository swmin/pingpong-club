/**
 * Table Tennis Round-Robin (Full League) Calculation Engine
 * Supports standard Berger schedule generation and exact tie-breaking logic:
 * 1. Match Wins (전체 승수)
 * 2. Head-to-Head for 2-way ties (2인 동률 시 승자승)
 * 3. Head-to-Head Set Ratio for 3+-way ties (3인 이상 동률 시 상호 세트 득실율)
 * 4. Overall Set Ratio & Set Difference fallback
 */

// Generate Round Robin Schedule using Berger/Circle Method
export function generateSchedule(players) {
  const n = players.length;
  if (n < 2) return [];

  const playerIds = players.map(p => p.id);
  const isOdd = n % 2 !== 0;
  const list = [...playerIds];
  if (isOdd) {
    list.push(null); // Dummy player for bye
  }

  const numPlayers = list.length;
  const numRounds = numPlayers - 1;
  const half = numPlayers / 2;

  const matches = [];
  let matchId = 1;

  const playerIndices = list.map((_, i) => i);

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const p1Index = playerIndices[i];
      const p2Index = playerIndices[numPlayers - 1 - i];

      const p1 = list[p1Index];
      const p2 = list[p2Index];

      if (p1 !== null && p2 !== null) {
        matches.push({
          id: `M_${p1}_${p2}`,
          orderNumber: matchId++,
          round: round + 1,
          playerAId: p1,
          playerBId: p2,
          playerASets: 0,
          playerBSets: 0,
          status: 'pending', // 'pending' | 'completed' | 'forfeit'
          winnerId: null,
        });
      }
    }

    // Rotate array keeping index 0 fixed
    playerIndices.splice(1, 0, playerIndices.pop());
  }

  return matches;
}

// Calculate comprehensive statistics & rankings (for a single meeting or cumulative)
export function calculateRankings(players, matches) {
  if (!players || players.length === 0) return { rankings: [], tieBreakerExplanations: [] };

  // 1. Initial Stats map
  const statsMap = {};
  players.forEach(p => {
    statsMap[p.id] = {
      player: p,
      id: p.id,
      name: p.name,
      division: p.division || p.currentDivision || '7부',
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      setDiff: 0,
      setRatio: 0,
      rank: 0,
      tieReason: '',
    };
  });

  // Map of direct match results between any two players
  // directResults[p1Id][p2Id] = { mySets, oppSets, myWins, oppWins }
  const directResults = {};
  players.forEach(p1 => {
    directResults[p1.id] = {};
    players.forEach(p2 => {
      directResults[p1.id][p2.id] = { mySets: 0, oppSets: 0, myWins: 0, oppWins: 0 };
    });
  });

  // Process completed matches
  matches.forEach(m => {
    if (m.status !== 'completed' && m.status !== 'forfeit') return;

    const pA = statsMap[m.playerAId];
    const pB = statsMap[m.playerBId];
    if (!pA || !pB) return;

    pA.matchesPlayed += 1;
    pB.matchesPlayed += 1;

    pA.setsWon += m.playerASets;
    pA.setsLost += m.playerBSets;

    pB.setsWon += m.playerBSets;
    pB.setsLost += m.playerASets;

    const h2hA = directResults[m.playerAId][m.playerBId];
    const h2hB = directResults[m.playerBId][m.playerAId];

    if (h2hA && h2hB) {
      h2hA.mySets += m.playerASets;
      h2hA.oppSets += m.playerBSets;
      h2hB.mySets += m.playerBSets;
      h2hB.oppSets += m.playerASets;

      if (m.winnerId === pA.id) {
        pA.wins += 1;
        pB.losses += 1;
        h2hA.myWins += 1;
        h2hB.oppWins += 1;
      } else if (m.winnerId === pB.id) {
        pB.wins += 1;
        pA.losses += 1;
        h2hB.myWins += 1;
        h2hA.oppWins += 1;
      }
    }
  });

  // Compute total set diff & ratio
  Object.values(statsMap).forEach(st => {
    st.setDiff = st.setsWon - st.setsLost;
    st.setRatio = st.setsLost > 0 ? st.setsWon / st.setsLost : (st.setsWon > 0 ? st.setsWon * 100 : 0);
  });

  // Filter out players with 0 matches played if calculating cumulative stats
  const activeStatsList = Object.values(statsMap).filter(st => st.matchesPlayed > 0);

  // 2. Group players by Wins
  const winsGroups = {};
  activeStatsList.forEach(st => {
    if (!winsGroups[st.wins]) winsGroups[st.wins] = [];
    winsGroups[st.wins].push(st);
  });

  // Sort win group keys descending (most wins first)
  const sortedWinKeys = Object.keys(winsGroups).map(Number).sort((a, b) => b - a);

  const finalRankedList = [];
  const tieBreakerExplanations = [];

  sortedWinKeys.forEach(winCount => {
    const group = winsGroups[winCount];

    if (group.length === 1) {
      group[0].tieReason = '전체 경기 승수';
      finalRankedList.push(group[0]);
    } else if (group.length === 2) {
      // --- 2-WAY TIE: HEAD-TO-HEAD (승자승) ---
      const [p1, p2] = group;
      const h2h = directResults[p1.id][p2.id];

      if (h2h && (h2h.myWins > 0 || h2h.oppWins > 0)) {
        if (h2h.myWins > h2h.oppWins) {
          p1.tieReason = `승자승 (${p1.name} ${h2h.myWins}승 vs ${p2.name} ${h2h.oppWins}승)`;
          p2.tieReason = `승자승 (${p1.name} ${h2h.myWins}승 vs ${p2.name} ${h2h.oppWins}승)`;
          finalRankedList.push(p1, p2);
          tieBreakerExplanations.push({
            type: '2way',
            players: [p1.name, p2.name],
            wins: winCount,
            description: `${winCount}승 동률: ${p1.name}님이 ${p2.name}님과의 상대 전적(승자승 ${h2h.myWins}:${h2h.oppWins})에서 승리하여 상위 순위 지정`,
          });
        } else if (h2h.oppWins > h2h.myWins) {
          p1.tieReason = `승자승 (${p2.name} ${h2h.oppWins}승 vs ${p1.name} ${h2h.myWins}승)`;
          p2.tieReason = `승자승 (${p2.name} ${h2h.oppWins}승 vs ${p1.name} ${h2h.myWins}승)`;
          finalRankedList.push(p2, p1);
          tieBreakerExplanations.push({
            type: '2way',
            players: [p1.name, p2.name],
            wins: winCount,
            description: `${winCount}승 동률: ${p2.name}님이 ${p1.name}님과의 상대 전적(승자승 ${h2h.oppWins}:${h2h.myWins})에서 승리하여 상위 순위 지정`,
          });
        } else {
          // Equal H2H wins, fallback to H2H set ratio
          if (h2h.mySets !== h2h.oppSets) {
            if (h2h.mySets > h2h.oppSets) {
              finalRankedList.push(p1, p2);
            } else {
              finalRankedList.push(p2, p1);
            }
            group.forEach(g => (g.tieReason = '상대 전적 세트 득실율'));
          } else {
            // Fallback to overall set ratio
            if (p1.setRatio !== p2.setRatio) {
              group.sort((a, b) => b.setRatio - a.setRatio);
            } else {
              group.sort((a, b) => b.setDiff - a.setDiff);
            }
            group.forEach(g => (g.tieReason = '전체 세트 득실율'));
            finalRankedList.push(...group);
          }
        }
      } else {
        // Fallback to total set ratio
        if (p1.setRatio !== p2.setRatio) {
          group.sort((a, b) => b.setRatio - a.setRatio);
        } else {
          group.sort((a, b) => b.setDiff - a.setDiff);
        }
        group.forEach(g => (g.tieReason = '전체 세트 득실율'));
        finalRankedList.push(...group);
      }
    } else {
      // --- 3+-WAY TIE: SUBGROUP SET RATIO (해당 선수들 간의 세트 득실율) ---
      const subgroupStats = group.map(p => {
        let subWon = 0;
        let subLost = 0;

        group.forEach(otherP => {
          if (p.id === otherP.id) return;
          const matchRes = directResults[p.id][otherP.id];
          if (matchRes) {
            subWon += matchRes.mySets;
            subLost += matchRes.oppSets;
          }
        });

        const subRatio = subLost > 0 ? subWon / subLost : (subWon > 0 ? subWon * 1000 : 0);
        const subDiff = subWon - subLost;

        return {
          playerStat: p,
          subWon,
          subLost,
          subDiff,
          subRatio,
        };
      });

      // Sort subgroup by subRatio desc, then subDiff desc, then overall setRatio desc
      subgroupStats.sort((a, b) => {
        if (Math.abs(b.subRatio - a.subRatio) > 0.0001) return b.subRatio - a.subRatio;
        if (b.subDiff !== a.subDiff) return b.subDiff - a.subDiff;
        return b.playerStat.setRatio - a.playerStat.setRatio;
      });

      const names = group.map(g => g.name).join(', ');
      const explanationText = `${winCount}승 동률(${group.length}명: ${names}): 규정에 의거 해당 선수들 간 세트 득실율 적용\n` +
        subgroupStats.map(s => `  • ${s.playerStat.name}: ${s.subWon}득 ${s.subLost}실 (득실율: ${s.subRatio.toFixed(2)})`).join('\n');

      tieBreakerExplanations.push({
        type: '3way',
        players: group.map(g => g.name),
        wins: winCount,
        description: explanationText,
      });

      subgroupStats.forEach(s => {
        s.playerStat.tieReason = `상호 세트 득실율 (${s.subWon}:${s.subLost})`;
        finalRankedList.push(s.playerStat);
      });
    }
  });

  // Assign 1-indexed ranks
  finalRankedList.forEach((st, idx) => {
    st.rank = idx + 1;
  });

  return {
    rankings: finalRankedList,
    tieBreakerExplanations,
  };
}

// Calculate All-time Cumulative Career Rankings for a specific club's sessions ONLY
export function calculateCumulativeRankings(masterRoster, sessions) {
  if (!sessions || sessions.length === 0) return { rankings: [], tieBreakerExplanations: [] };

  // Collect all completed matches from all sessions of THIS club only
  const allMatches = [];
  sessions.forEach(session => {
    if (Array.isArray(session.matches)) {
      allMatches.push(...session.matches);
    }
  });

  // Build players array using master roster + any session participants
  const playerMap = {};
  if (masterRoster && Array.isArray(masterRoster)) {
    masterRoster.forEach(p => {
      playerMap[p.id] = {
        id: p.id,
        name: p.name,
        division: p.currentDivision || p.division || '7부',
        avatarColor: p.avatarColor || '#3b82f6',
        category: p.category || 'club',
      };
    });
  }

  // Ensure any player appearing in session matches is included
  sessions.forEach(session => {
    if (Array.isArray(session.players)) {
      session.players.forEach(p => {
        if (!playerMap[p.id]) {
          playerMap[p.id] = {
            id: p.id,
            name: p.name,
            division: p.division || '7부',
            avatarColor: p.avatarColor || '#3b82f6',
            category: p.category || 'club',
          };
        }
      });
    }
  });

  const allPlayers = Object.values(playerMap);
  return calculateRankings(allPlayers, allMatches);
}
