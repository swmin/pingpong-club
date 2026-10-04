import React from 'react';
import { Trophy, HelpCircle, AlertCircle } from 'lucide-react';

export default function RankingTable({ rankings, tieBreakerExplanations, onOpenTieBreakerModal }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      marginTop: '24px',
      boxShadow: 'var(--shadow-main)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trophy size={24} color="#f59e0b" />
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: '900' }}>
            🏆 실시간 대회 순위표
          </h2>
        </div>

        {tieBreakerExplanations.length > 0 && (
          <button
            className="btn-secondary"
            onClick={onOpenTieBreakerModal}
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: '#f59e0b', padding: '6px 14px' }}
          >
            <AlertCircle size={18} />
            <span>동률 처리 내역 ({tieBreakerExplanations.length}건)</span>
          </button>
        )}
      </div>

      {/* Standings Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '14px' }}>
              <th style={{ padding: '12px 8px', width: '60px' }}>순위</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>선수 이름</th>
              <th style={{ padding: '12px 8px' }}>경기수</th>
              <th style={{ padding: '12px 8px' }}>승 / 패</th>
              <th style={{ padding: '12px 8px' }}>득세트 / 실세트</th>
              <th style={{ padding: '12px 8px' }}>세트 득실차</th>
              <th style={{ padding: '12px 8px' }}>세트 득실율</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>순위 결정 사유</th>
            </tr>
          </thead>

          <tbody>
            {rankings.map((st) => (
              <tr
                key={st.id}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: st.rank === 1 ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                  fontWeight: st.rank <= 3 ? '800' : '600',
                  fontSize: 'var(--font-base)',
                }}
              >
                {/* Rank Badge */}
                <td style={{ padding: '12px 8px' }}>
                  {st.rank === 1 ? <span className="rank-badge rank-1">🥇 1</span> :
                   st.rank === 2 ? <span className="rank-badge rank-2">🥈 2</span> :
                   st.rank === 3 ? <span className="rank-badge rank-3">🥉 3</span> :
                   <span className="rank-badge rank-other">{st.rank}</span>}
                </td>

                {/* Name & Division */}
                <td style={{ padding: '12px 8px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: st.player.avatarColor }} />
                    <span style={{ fontSize: 'var(--font-lg)', fontWeight: '800' }}>{st.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--accent-primary)', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      {st.division}
                    </span>
                  </div>
                </td>

                <td style={{ padding: '12px 8px' }}>{st.matchesPlayed}전</td>

                <td style={{ padding: '12px 8px' }}>
                  <span style={{ color: 'var(--accent-success)', fontWeight: '800' }}>{st.wins}승</span>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{st.losses}패</span>
                </td>

                <td style={{ padding: '12px 8px' }}>
                  {st.setsWon}득 / {st.setsLost}실
                </td>

                <td style={{ padding: '12px 8px', color: st.setDiff > 0 ? 'var(--accent-success)' : st.setDiff < 0 ? 'var(--accent-danger)' : 'inherit' }}>
                  {st.setDiff > 0 ? `+${st.setDiff}` : st.setDiff}
                </td>

                <td style={{ padding: '12px 8px', fontFamily: 'Outfit, monospace' }}>
                  {st.setRatio.toFixed(2)}
                </td>

                <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {st.tieReason || '승수 반영'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
