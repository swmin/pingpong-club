import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * 선수별 펼치기 대진표 (좌우 스크롤 없이 위아래 스크롤만 사용)
 * - 격자표/순서별 보기와 같은 matches 데이터를 읽고, 같은 점수 입력 창(onSelectMatchCell)을 사용하므로
 *   어느 화면에서 점수를 입력해도 모든 보기에 즉시 반영됩니다.
 */
export default function PlayerDrawView({ players, matches, rankingsMap, onSelectMatchCell }) {
  const [openIds, setOpenIds] = useState(() => new Set());

  if (!players || players.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontStyle: 'italic', fontSize: '15px' }}>
        📋 오늘의 출전 선수가 아직 선택되지 않았습니다. 위의 <strong>[선수 선택/등록 메뉴]</strong>에서 출전할 선수를 선택해 주세요.
      </div>
    );
  }

  // 두 선수 사이의 경기 찾기 (A/B 순서 무관)
  const findMatch = (idA, idB) =>
    matches.find(
      m => (m.playerAId === idA && m.playerBId === idB) || (m.playerAId === idB && m.playerBId === idA)
    );

  const isFinished = m => m && (m.status === 'completed' || m.status === 'forfeit');

  const toggle = id => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOpen = openIds.size === players.length;
  const doneCount = matches.filter(isFinished).length;
  const totalCount = matches.length;
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="player-draw">
      <div className="player-draw-summary">
        <span>진행 {doneCount} / {totalCount} 경기 완료</span>
        <button
          type="button"
          className="player-draw-linkbtn"
          onClick={() => setOpenIds(allOpen ? new Set() : new Set(players.map(p => p.id)))}
        >
          {allOpen ? '모두 접기' : '모두 펼치기'}
        </button>
      </div>
      <div className="player-draw-progress"><div style={{ width: `${percent}%` }} /></div>

      {players.map((p, idx) => {
        const stats = rankingsMap[p.id] || {};
        const rank = stats.rank;
        const open = openIds.has(p.id);
        const opponents = players.filter(q => q.id !== p.id);
        const pendingCount = opponents.filter(q => !isFinished(findMatch(p.id, q.id))).length;

        return (
          <div key={p.id} className={`player-draw-card ${open ? 'open' : ''}`}>
            <button type="button" className="player-draw-head" onClick={() => toggle(p.id)} aria-expanded={open}>
              <span className="player-draw-num" style={{ backgroundColor: p.avatarColor || '#3b82f6' }}>{idx + 1}</span>
              <span className="player-draw-name">
                {p.name}
                {p.division && <span className="player-draw-chip">{p.division}</span>}
                {p.category === 'guest' && <span className="player-draw-chip guest">게스트</span>}
              </span>
              <span className="player-draw-record">
                {stats.wins !== undefined ? (
                  <>
                    <b style={{ color: 'var(--accent-success)' }}>{stats.wins}승</b>{' '}
                    <span style={{ color: 'var(--text-muted)' }}>{stats.losses}패</span>
                  </>
                ) : '-'}
              </span>
              <span className={`player-draw-rank ${rank === 1 ? 'first' : ''}`}>{rank ? `${rank}위` : '-'}</span>
              {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {!open && pendingCount > 0 && (
              <div className="player-draw-pending">남은 경기 {pendingCount}개</div>
            )}

            {open && opponents.map((q) => {
              const m = findMatch(p.id, q.id);
              if (!m) return null;
              const isA = m.playerAId === p.id;
              const mine = isA ? m.playerASets : m.playerBSets;
              const theirs = isA ? m.playerBSets : m.playerASets;
              const oppNo = players.findIndex(x => x.id === q.id) + 1;

              return (
                <div key={q.id} className="player-draw-row">
                  <span className="player-draw-opp">
                    <small>vs</small> {q.name} <small>({oppNo}번)</small>
                  </span>

                  {m.status === 'completed' && (
                    <>
                      <span className="player-draw-score">{mine} : {theirs}</span>
                      <span className={`player-draw-pill ${m.winnerId === p.id ? 'win' : 'loss'}`}>
                        {m.winnerId === p.id ? '승' : '패'}
                      </span>
                      <button type="button" className="player-draw-editbtn" onClick={() => onSelectMatchCell(m)}>수정</button>
                    </>
                  )}

                  {m.status === 'forfeit' && (
                    <>
                      <span className="player-draw-score" style={{ color: 'var(--accent-purple)' }}>X</span>
                      <span className="player-draw-pill forfeit">기권</span>
                      <button type="button" className="player-draw-editbtn" onClick={() => onSelectMatchCell(m)}>수정</button>
                    </>
                  )}

                  {m.status !== 'completed' && m.status !== 'forfeit' && (
                    <button type="button" className="player-draw-inbtn" onClick={() => onSelectMatchCell(m)}>점수 입력</button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
