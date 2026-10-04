import React, { useState } from 'react';
import { PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function ScheduleView({ players, matches, onSelectMatchCell }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  const playersMap = {};
  players.forEach(p => { playersMap[p.id] = p; });

  const filteredMatches = matches.filter(m => {
    if (filter === 'pending') return m.status === 'pending';
    if (filter === 'completed') return m.status === 'completed' || m.status === 'forfeit';
    return true;
  });

  return (
    <div>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'all', label: `전체 경기 (${matches.length})` },
          { key: 'pending', label: `대기 경기 (${matches.filter(m => m.status === 'pending').length})` },
          { key: 'completed', label: `완료 경기 (${matches.filter(m => m.status !== 'pending').length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="btn-secondary"
            style={{
              flex: 1,
              justifyContent: 'center',
              backgroundColor: filter === tab.key ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: filter === tab.key ? '#0f172a' : 'var(--text-main)',
              fontWeight: '800',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Match Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
        {filteredMatches.map((match) => {
          const pA = playersMap[match.playerAId] || { name: '선수A' };
          const pB = playersMap[match.playerBId] || { name: '선수B' };
          const isCompleted = match.status === 'completed';
          const isForfeit = match.status === 'forfeit';

          return (
            <div
              key={match.id}
              className={`schedule-card ${match.status === 'pending' ? 'active-match' : ''}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                {/* Round / Match Number */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <span>경기 #{match.orderNumber} (라운드 {match.round})</span>
                  {isCompleted && <span style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14} /> 완료</span>}
                  {isForfeit && <span style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> 기권</span>}
                  {!isCompleted && !isForfeit && <span style={{ color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> 대기중</span>}
                </div>

                {/* Match Players & Score */}
                <div className="match-players" style={{ marginTop: '6px' }}>
                  {/* Player A */}
                  <div style={{ flex: 1, textDecoration: isCompleted && match.winnerId !== pA.id ? 'line-through opacity(0.6)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: pA.avatarColor }} />
                      <span>{pA.name}</span>
                    </div>
                  </div>

                  {/* Score or VS */}
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: '900', color: isCompleted ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                    {isCompleted ? `${match.playerASets} : ${match.playerBSets}` :
                     isForfeit ? 'X' :
                     <span className="vs-badge">VS</span>}
                  </div>

                  {/* Player B */}
                  <div style={{ flex: 1, textAlign: 'right', textDecoration: isCompleted && match.winnerId !== pB.id ? 'line-through opacity(0.6)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span>{pB.name}</span>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: pB.avatarColor }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                className="btn-primary"
                onClick={() => onSelectMatchCell(match)}
                style={{
                  width: 'auto',
                  padding: '10px 16px',
                  fontSize: '14px',
                  backgroundColor: isCompleted ? 'var(--bg-main)' : 'var(--accent-success)',
                  color: isCompleted ? 'var(--text-main)' : 'white',
                  border: isCompleted ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <PlayCircle size={16} />
                <span>{isCompleted ? '수정' : '입력'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
