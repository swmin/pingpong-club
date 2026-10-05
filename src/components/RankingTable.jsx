import React, { useState } from 'react';
import { Trophy, AlertCircle, BarChart3 } from 'lucide-react';

export default function RankingTable({
  rankings = [],
  cumulativeRankings = [],
  tieBreakerExplanations = [],
  cumulativeTieBreakerExplanations = [],
  onOpenTieBreakerModal,
  clubName = '동호회',
  sessionsCount = 1,
}) {
  const [activeTab, setActiveTab] = useState('session'); // 'session' | 'cumulative'

  const renderTableRows = (list) => {
    if (!list || list.length === 0) {
      return (
        <tr>
          <td colSpan={8} style={{ padding: '30px', color: 'var(--text-muted)' }}>
            기록된 경기 데이터가 없습니다.
          </td>
        </tr>
      );
    }

    return list.map((st) => (
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
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: st.player?.avatarColor || '#3b82f6' }} />
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
          {st.setRatio ? st.setRatio.toFixed(2) : '0.00'}
        </td>

        <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)' }}>
          {st.tieReason || '승수 반영'}
        </td>
      </tr>
    ));
  };

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Horizontal Tab Switcher Bar */}
      <div data-html2canvas-ignore="true" style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className="tab-btn"
          type="button"
          onClick={() => setActiveTab('session')}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '12px 16px',
            fontSize: 'var(--font-base)',
            fontWeight: '800',
            backgroundColor: activeTab === 'session' ? 'var(--accent-primary)' : 'var(--bg-card)',
            color: activeTab === 'session' ? '#0f172a' : 'var(--text-main)',
            border: `2px solid ${activeTab === 'session' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: activeTab === 'session' ? '0 4px 14px rgba(56, 189, 248, 0.35)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Trophy size={18} />
          <span>🏆 오늘 모임 실시간 순위표</span>
        </button>

        <button
          className="tab-btn"
          type="button"
          onClick={() => setActiveTab('cumulative')}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '12px 16px',
            fontSize: 'var(--font-base)',
            fontWeight: '800',
            backgroundColor: activeTab === 'cumulative' ? '#f59e0b' : 'var(--bg-card)',
            color: activeTab === 'cumulative' ? '#0f172a' : 'var(--text-main)',
            border: `2px solid ${activeTab === 'cumulative' ? '#f59e0b' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: activeTab === 'cumulative' ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <BarChart3 size={18} />
          <span>📊 동호회 통산 누적 순위표 ({sessionsCount}개 모임 합산)</span>
        </button>
      </div>

      {/* Tab Content 1: Today's Meeting Real-time Standings */}
      {activeTab === 'session' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          boxShadow: 'var(--shadow-main)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={24} color="var(--accent-primary)" />
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: '900', color: 'var(--text-main)' }}>
                🏆 오늘 모임 실시간 순위표
              </h3>
            </div>

            {tieBreakerExplanations && tieBreakerExplanations.length > 0 && (
              <button
                className="btn-secondary"
                type="button"
                onClick={onOpenTieBreakerModal}
                data-html2canvas-ignore="true"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: '#f59e0b', padding: '6px 14px' }}
              >
                <AlertCircle size={18} />
                <span>동률 처리 내역 ({tieBreakerExplanations.length}건)</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            📌 오늘의 모임 진행 경기 결과를 바탕으로 실시간 산출된 순위입니다.
          </div>

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
                {renderTableRows(rankings)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: All-time Cumulative Career Standings */}
      {activeTab === 'cumulative' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          boxShadow: 'var(--shadow-main)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={24} color="#f59e0b" />
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: '900', color: '#f59e0b' }}>
                📊 [{clubName}] 동호회 통산 누적 순위표 ({sessionsCount}개 모임 합산)
              </h3>
            </div>
          </div>

          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            📌 <strong>[{clubName}]</strong> 동호회의 전체 {sessionsCount}개 모임 기록을 합산한 <strong>통산 누적 순위표</strong>입니다. (다른 동호회와 합산되지 않음)
          </div>

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
                {renderTableRows(cumulativeRankings)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
