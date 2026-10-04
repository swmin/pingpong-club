import React from 'react';
import { X, ShieldAlert, Award, Info } from 'lucide-react';

export default function TieBreakerExplainer({ explanations, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} color="#f59e0b" />
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: '900' }}>
              동률(동승률) 처리 규정 & 적용 내역
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={28} />
          </button>
        </div>

        {/* Paper Sheet Rule Reference */}
        <div style={{
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid var(--accent-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '20px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <div style={{ fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={16} /> 대진표 하단 표준 동률 처리 규정
          </div>
          <div>※ <strong>2명(팀)</strong>의 경기 승패가 동일할 경우 → <strong>승자승(Head-to-Head)</strong>으로 결정</div>
          <div>※ <strong>3명(팀) 이상</strong>의 경기 승패가 동일할 경우 → <strong>해당 선수(팀)들의 세트 득실율</strong>로 결정</div>
        </div>

        {/* Active Explanations */}
        {explanations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            현재 동승률(동률)로 경합 중인 선수가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {explanations.map((exp, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}
              >
                <div style={{ fontWeight: '800', color: 'var(--accent-warning)', marginBottom: '6px' }}>
                  🔹 {exp.wins}승 동률 ({exp.players.join(', ')})
                </div>
                <div style={{ fontSize: '14px', whiteSpace: 'pre-line', color: 'var(--text-main)' }}>
                  {exp.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
