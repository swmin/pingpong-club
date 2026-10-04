import React, { useState } from 'react';
import { X, Check, Trash2, Plus, Building2, Search } from 'lucide-react';

export default function ClubSelectModal({
  clubs,
  activeClubId,
  onSelectClub,
  onOpenCreateModal,
  onDeleteClub,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClubs = clubs.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={24} color="var(--accent-primary)" />
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: '900' }}>
              동호회 선택 및 관리 ({clubs.length}개)
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={28} />
          </button>
        </div>

        {/* Search & Create Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="동호회 이름 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 38px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '14px',
              }}
            />
          </div>
          <button
            className="btn-primary"
            onClick={() => { onClose(); onOpenCreateModal(); }}
            style={{ width: 'auto', padding: '10px 16px', fontSize: '14px' }}
          >
            <Plus size={18} />
            <span>새 동호회</span>
          </button>
        </div>

        {/* Club List scrollable */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {filteredClubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              검색된 동호회가 없습니다.
            </div>
          ) : (
            filteredClubs.map((club) => {
              const isActive = club.id === activeClubId;
              const completedCount = club.matches ? club.matches.filter(m => m.status === 'completed' || m.status === 'forfeit').length : 0;
              const totalMatches = club.matches ? club.matches.length : 0;

              return (
                <div
                  key={club.id}
                  onClick={() => { onSelectClub(club.id); onClose(); }}
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
                        {club.name}
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
                          <Check size={12} /> 현재 선택됨
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      참가선수: {club.players ? club.players.length : 0}명 | 진행: {completedCount}/{totalMatches} 경기 완료
                    </div>
                  </div>

                  {clubs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`'${club.name}' 동호회를 삭제하시겠습니까?`)) {
                          onDeleteClub(club.id);
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
                      title="동호회 삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
