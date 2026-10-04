import React from 'react';

export default function MatrixGridView({ players, matches, rankingsMap, onSelectMatchCell }) {
  // Build lookup map for matrix cell: matrixMap[p1Id][p2Id] = matchObj
  const matrixMap = {};
  players.forEach(p1 => {
    matrixMap[p1.id] = {};
    players.forEach(p2 => {
      matrixMap[p1.id][p2.id] = null;
    });
  });

  matches.forEach(m => {
    if (matrixMap[m.playerAId] && matrixMap[m.playerAId][m.playerBId] !== undefined) {
      matrixMap[m.playerAId][m.playerBId] = m;
    }
    if (matrixMap[m.playerBId] && matrixMap[m.playerBId][m.playerAId] !== undefined) {
      matrixMap[m.playerBId][m.playerAId] = m;
    }
  });

  return (
    <div className="matrix-container" id="export-area">
      <table className="matrix-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>#</th>
            <th style={{ width: '100px', textAlign: 'left', paddingLeft: '12px' }}>이름</th>
            {players.map((p, idx) => (
              <th key={p.id} style={{ minWidth: '55px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{idx + 1}</div>
                <div>{p.name}</div>
              </th>
            ))}
            <th style={{ width: '80px', backgroundColor: 'rgba(56, 189, 248, 0.1)' }}>경기 승패</th>
            <th style={{ width: '80px', backgroundColor: 'rgba(56, 189, 248, 0.1)' }}>세트 득실</th>
            <th style={{ width: '75px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>순위</th>
          </tr>
        </thead>

        <tbody>
          {players.map((rowPlayer, rowIdx) => {
            const playerStats = rankingsMap[rowPlayer.id] || {};
            const rank = playerStats.rank || '-';

            return (
              <tr key={rowPlayer.id}>
                {/* Row Index */}
                <td style={{ fontWeight: '800', color: 'var(--text-muted)' }}>{rowIdx + 1}</td>

                {/* Player Name */}
                <td style={{ textAlign: 'left', paddingLeft: '12px', fontWeight: '800' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: rowPlayer.avatarColor,
                      display: 'inline-block'
                    }} />
                    <span>{rowPlayer.name}</span>
                  </div>
                </td>

                {/* Grid Cells for Opponents */}
                {players.map((colPlayer) => {
                  // Diagonal Cell (Self vs Self)
                  if (rowPlayer.id === colPlayer.id) {
                    return (
                      <td key={colPlayer.id} className="cell-blocked">
                        <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>✕</span>
                      </td>
                    );
                  }

                  const match = matrixMap[rowPlayer.id][colPlayer.id];
                  if (!match) {
                    return <td key={colPlayer.id} className="cell-empty">-</td>;
                  }

                  const isRowPlayerA = match.playerAId === rowPlayer.id;
                  const rowSets = isRowPlayerA ? match.playerASets : match.playerBSets;
                  const colSets = isRowPlayerA ? match.playerBSets : match.playerASets;

                  if (match.status === 'forfeit') {
                    return (
                      <td
                        key={colPlayer.id}
                        className="matrix-cell cell-forfeit"
                        onClick={() => onSelectMatchCell(match)}
                        title="기권/미경기 (클릭하여 수정)"
                      >
                        <span className="score-badge" style={{ color: 'var(--accent-purple)' }}>X</span>
                      </td>
                    );
                  }

                  if (match.status === 'completed') {
                    const isWin = match.winnerId === rowPlayer.id;
                    return (
                      <td
                        key={colPlayer.id}
                        className={`matrix-cell ${isWin ? 'cell-win' : 'cell-loss'}`}
                        onClick={() => onSelectMatchCell(match)}
                        title={`${rowPlayer.name} ${rowSets} : ${colSets} ${colPlayer.name} (클릭하여 수정)`}
                      >
                        <span className={`score-badge ${isWin ? 'badge-win' : 'badge-loss'}`}>
                          {rowSets}
                        </span>
                      </td>
                    );
                  }

                  // Pending match
                  return (
                    <td
                      key={colPlayer.id}
                      className="matrix-cell cell-empty"
                      onClick={() => onSelectMatchCell(match)}
                      title="클릭하여 점수 입력"
                    >
                      <span style={{ fontSize: '13px', opacity: 0.6 }}>입력</span>
                    </td>
                  );
                })}

                {/* Summary Columns */}
                {/* 1. Match W/L */}
                <td style={{ fontWeight: '800', backgroundColor: 'rgba(56, 189, 248, 0.05)' }}>
                  {playerStats.wins !== undefined ? (
                    <span>
                      <strong style={{ color: 'var(--accent-success)' }}>{playerStats.wins}승</strong>{' '}
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{playerStats.losses}패</span>
                    </span>
                  ) : '-'}
                </td>

                {/* 2. Set Difference */}
                <td style={{ fontWeight: '700', fontSize: '14px', backgroundColor: 'rgba(56, 189, 248, 0.05)' }}>
                  {playerStats.setsWon !== undefined ? (
                    <div style={{ lineHeight: '1.2' }}>
                      <div>{playerStats.setsWon}득 {playerStats.setsLost}실</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ({playerStats.setDiff >= 0 ? `+${playerStats.setDiff}` : playerStats.setDiff})
                      </div>
                    </div>
                  ) : '-'}
                </td>

                {/* 3. Rank Badge */}
                <td style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
                  {rank === 1 ? <span className="rank-badge rank-1">🥇 1</span> :
                   rank === 2 ? <span className="rank-badge rank-2">🥈 2</span> :
                   rank === 3 ? <span className="rank-badge rank-3">🥉 3</span> :
                   <span style={{ fontWeight: '800', fontSize: 'var(--font-lg)' }}>{rank}위</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
