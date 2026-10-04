import React from 'react';
import { X, Check, Trash2, Plus, Calendar, Clock } from 'lucide-react';

export default function SessionSelectModal({
  sessions,
  activeSessionId,
  onSelectSession,
  onOpenCreateSessionModal,
  onDeleteSession,
  onClose,
  clubName,
}) {
  // Helper to format Korean date
  const getFormattedKoreanDate = (dateString) => {
    let d = new Date(dateString);
    if (isNaN(d.getTime())) {
      d = new Date();
    }
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekdayStr = weekdays[d.getDay()];

    return `${year}년 ${month}월 ${day}일 (${weekdayStr})`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={24} color="var(--accent-primary)" />
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: '900' }}>
              모임 날짜별 히스토리 ({sessions.length}회차)
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={28} />
          </button>
        </div>

        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          📌 <strong>[{clubName}]</strong> 동호회의 과거 및 현재 모임 날짜 페이지를 선택하여 결과와 대진표를 확인하거나 새 날짜 페이지를 추가할 수 있습니다.
        </div>

        {/* Create New Session Bar */}
        <div style={{ marginBottom: '16px' }}>
          <button
            className="btn-primary"
            onClick={() => { onClose(); onOpenCreateSessionModal(); }}
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
          >
            <Plus size={20} />
            <span>새 모임(날짜) 페이지 추가 생성</span>
          </button>
        </div>

        {/* Sessions List scrollable */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const completedCount = session.matches ? session.matches.filter(m => m.status === 'completed' || m.status === 'forfeit').length : 0;
            const totalMatches = session.matches ? session.matches.length : 0;
            const playerCount = session.players ? session.players.length : 0;

            return (
              <div
                key={session.id}
                onClick={() => { onSelectSession(session.id); onClose(); }}
                style={{
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-main)',
                  border: `2px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--font-lg)', fontWeight: '800', color: isActive ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                      📅 {getFormattedKoreanDate(session.date)}
                    </span>
                    {isActive && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#0f172a',
                        backgroundColor: 'var(--accent-primary)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Check size={12} /> 현재 보는 중
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    참가선수: {playerCount}명 | 진행: {completedCount}/{totalMatches} 경기 완료
                  </div>
                </div>

                {sessions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`'${getFormattedKoreanDate(session.date)}' 모임 기록을 삭제하시겠습니까?`)) {
                        onDeleteSession(session.id);
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-danger)',
                      padding: '8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                    title="모임 기록 삭제"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
