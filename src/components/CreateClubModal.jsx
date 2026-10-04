import React, { useState } from 'react';
import { X, PlusCircle, Building2 } from 'lucide-react';

export default function CreateClubModal({ onClose, onCreateClub }) {
  const [clubName, setClubName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clubName.trim()) {
      alert('동호회 이름을 입력해 주세요.');
      return;
    }
    onCreateClub(clubName.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="var(--accent-primary)" />
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: '900' }}>
              새 동호회 생성
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={28} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '15px' }}>
              동호회 (모임) 이름
            </label>
            <input
              type="text"
              placeholder="예: 화목 탁구 동호회"
              value={clubName}
              onChange={e => setClubName(e.target.value)}
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
            <PlusCircle size={22} />
            <span>동호회 만들기</span>
          </button>
        </form>
      </div>
    </div>
  );
}
