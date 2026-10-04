import React, { useState } from 'react';
import { X, CalendarPlus, Calendar } from 'lucide-react';

export default function CreateSessionModal({ onClose, onCreateSession, clubName }) {
  // Helper to format today's date YYYY-MM-DD
  const getTodayISO = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [sessionDate, setSessionDate] = useState(getTodayISO());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sessionDate) {
      alert('모임 날짜를 선택해 주세요.');
      return;
    }
    onCreateSession(sessionDate);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarPlus size={24} color="var(--accent-primary)" />
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: '900' }}>
              새 모임(날짜) 페이지 생성
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={28} />
          </button>
        </div>

        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          📌 <strong>[{clubName}]</strong> 동호회의 새로운 모임 날짜 페이지를 생성합니다. 기존 과거 모임 기록은 그대로 안전하게 저장 보존됩니다.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '15px' }}>
              새 모임 날짜 선택
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--accent-primary)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: 'var(--font-lg)',
                fontWeight: '700',
              }}
            />
          </div>

          <button type="submit" className="btn-primary">
            <CalendarPlus size={22} />
            <span>새 모임 페이지 만들기</span>
          </button>
        </form>
      </div>
    </div>
  );
}
