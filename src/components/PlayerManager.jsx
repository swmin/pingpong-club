import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, Users } from 'lucide-react';

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b',
  '#06b6d4', '#6366f1', '#84cc16', '#f43f5e', '#a855f7'
];

export default function PlayerManager({ players, setPlayers, onGenerateNewSchedule }) {
  const [newName, setNewName] = useState('');
  const [newDivision, setNewDivision] = useState('7부');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newId = players.length > 0 ? Math.max(...players.map(p => p.id)) + 1 : 1;
    const colorIndex = (newId - 1) % AVATAR_COLORS.length;

    const newPlayer = {
      id: newId,
      name: newName.trim(),
      division: newDivision,
      avatarColor: AVATAR_COLORS[colorIndex],
    };

    const updated = [...players, newPlayer];
    setPlayers(updated);
    onGenerateNewSchedule(updated);
    setNewName('');
  };

  const handleRemovePlayer = (id) => {
    if (players.length <= 2) {
      alert('최소 2명의 선수가 필요합니다.');
      return;
    }
    if (confirm('이 선수를 목록에서 삭제하시겠습니까? (기존 대진표가 재구성됩니다)')) {
      const updated = players.filter(p => p.id !== id);
      setPlayers(updated);
      onGenerateNewSchedule(updated);
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      marginBottom: '20px',
      boxShadow: 'var(--shadow-main)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={22} color="var(--accent-primary)" />
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: '800' }}>
            참가 선수 명단 ({players.length}명)
          </h3>
        </div>
        <button
          className="btn-secondary"
          onClick={() => setIsOpen(!isOpen)}
          style={{ padding: '6px 12px', fontSize: '14px' }}
        >
          {isOpen ? '닫기 ▲' : '선수 추가/관리 ▼'}
        </button>
      </div>

      {/* Quick Player Badges horizontal view */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
        {players.map((p, idx) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '999px',
              fontWeight: '700',
              fontSize: 'var(--font-base)',
            }}
          >
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: p.avatarColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '900',
            }}>
              {idx + 1}
            </span>
            <span>{p.name}</span>
            <span style={{
              fontSize: '12px',
              color: 'var(--accent-primary)',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>
              {p.division}
            </span>

            {isOpen && (
              <Trash2
                size={16}
                color="var(--accent-danger)"
                style={{ cursor: 'pointer', marginLeft: '4px' }}
                onClick={() => handleRemovePlayer(p.id)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Expanded Add Form */}
      {isOpen && (
        <form onSubmit={handleAddPlayer} style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="선수 이름 입력 (예: 영실)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: 'var(--font-base)',
            }}
          />

          <select
            value={newDivision}
            onChange={e => setNewDivision(e.target.value)}
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: 'var(--font-base)',
              fontWeight: '700',
            }}
          >
            {['1부', '2부', '3부', '4부', '5부', '6부', '7부', '8부', '9부', '선수부'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '12px 24px', fontSize: 'var(--font-base)' }}>
            <UserPlus size={18} />
            <span>선수 등록</span>
          </button>
        </form>
      )}
    </div>
  );
}
