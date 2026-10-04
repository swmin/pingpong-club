import React, { useState } from 'react';
import { Users, UserPlus, Check, Plus, Edit2, Trash2, Shield, UserCheck, Search } from 'lucide-react';

const DIVISIONS = ['선수부', '1부', '2부', '3부', '4부', '5부', '6부', '7부', '8부', '9부', '10부', '11부', '12부', '13부'];
const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b',
  '#06b6d4', '#6366f1', '#84cc16', '#f43f5e', '#a855f7'
];

export default function PlayerManager({
  masterRoster,
  onUpdateMasterRoster,
  activeParticipants,
  onToggleParticipant,
  onUpdateParticipantDivision,
  onGenerateNewSchedule,
}) {
  const [activeRosterTab, setActiveRosterTab] = useState('club'); // 'club' | 'guest' | 'manage'
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [newName, setNewName] = useState('');
  const [newDivision, setNewDivision] = useState('7부');
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDivision, setEditDivision] = useState('7부');
  const [editCategory, setEditCategory] = useState('club');

  // Active participant IDs set
  const participantIds = new Set(activeParticipants.map(p => p.id));

  // Add new player to Master Roster & check them in
  const handleAddMasterPlayer = (category) => {
    if (!newName.trim()) {
      alert('선수 이름을 입력해 주세요.');
      return;
    }

    const nextId = `p_${Date.now()}`;
    const colorIndex = masterRoster.length % AVATAR_COLORS.length;

    const newMasterPlayer = {
      id: nextId,
      name: newName.trim(),
      category: category, // 'club' | 'guest'
      currentDivision: newDivision,
      avatarColor: AVATAR_COLORS[colorIndex],
    };

    const updatedRoster = [...masterRoster, newMasterPlayer];
    onUpdateMasterRoster(updatedRoster);

    // Auto check-in for today's meeting
    onToggleParticipant(newMasterPlayer);

    setNewName('');
  };

  // Update existing player in Master Roster
  const handleSaveMasterEdit = (id) => {
    const updatedRoster = masterRoster.map(p => {
      if (p.id === id) {
        return {
          ...p,
          name: editName.trim() || p.name,
          currentDivision: editDivision,
          category: editCategory,
        };
      }
      return p;
    });

    onUpdateMasterRoster(updatedRoster);
    setEditingPlayerId(null);
  };

  // Remove player from Master Roster
  const handleDeleteMasterPlayer = (id) => {
    if (confirm('이 선수를 목록에서 완전히 삭제하시겠습니까?')) {
      const updatedRoster = masterRoster.filter(p => p.id !== id);
      onUpdateMasterRoster(updatedRoster);
    }
  };

  // Club & Guest lists
  const clubMembers = masterRoster.filter(p => p.category === 'club' && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const guestMembers = masterRoster.filter(p => p.category === 'guest' && p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      marginBottom: '20px',
      boxShadow: 'var(--shadow-main)'
    }}>
      {/* Top Bar: Today's Participant Count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={22} color="var(--accent-primary)" />
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: '800' }}>
            🏆 오늘의 참가 선수 ({activeParticipants.length}명)
          </h3>
        </div>

        <button
          className="btn-secondary"
          onClick={() => setIsOpen(!isOpen)}
          style={{ padding: '8px 14px', fontSize: '14px', fontWeight: '800', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
        >
          <UserCheck size={18} />
          <span>{isOpen ? '명단 접기 ▲' : '선수 선택/등록 메뉴 ▼'}</span>
        </button>
      </div>

      {/* 1. Today's Checked-in Participant Badges View */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
        {activeParticipants.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '10px 0' }}>
            ⚠️ 출전 선수가 선택되지 않았습니다. 아래 메뉴에서 출전할 선수를 선택해 주세요.
          </div>
        ) : (
          activeParticipants.map((p, idx) => (
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
                backgroundColor: p.avatarColor || '#3b82f6',
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

              {/* Editable Division Badge for TODAY's meeting date! */}
              <select
                value={p.division}
                onChange={(e) => onUpdateParticipantDivision(p.id, e.target.value)}
                style={{
                  fontSize: '12px',
                  fontWeight: '800',
                  color: 'var(--accent-primary)',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                title="클릭하여 오늘 모임의 부수 수동 변경 (과거 모임 데이터는 유지됨)"
              >
                {DIVISIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {p.category === 'guest' && (
                <span style={{ fontSize: '11px', color: 'var(--accent-purple)', backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>
                  게스트
                </span>
              )}

              {isOpen && (
                <Trash2
                  size={15}
                  color="var(--accent-danger)"
                  style={{ cursor: 'pointer', marginLeft: '2px' }}
                  onClick={() => onToggleParticipant(p)}
                  title="오늘 명단에서 제외"
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* 2. Expanded 3-Tab Player Selection & Roster Management Section */}
      {isOpen && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              className="tab-btn"
              onClick={() => setActiveRosterTab('club')}
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '15px',
                backgroundColor: activeRosterTab === 'club' ? 'var(--accent-primary)' : 'var(--bg-main)',
                color: activeRosterTab === 'club' ? '#0f172a' : 'var(--text-main)',
                fontWeight: '800',
              }}
            >
              🏢 동호회 선수 ({masterRoster.filter(p => p.category === 'club').length}명)
            </button>

            <button
              className="tab-btn"
              onClick={() => setActiveRosterTab('guest')}
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '15px',
                backgroundColor: activeRosterTab === 'guest' ? 'var(--accent-purple)' : 'var(--bg-main)',
                color: activeRosterTab === 'guest' ? 'white' : 'var(--text-main)',
                fontWeight: '800',
              }}
            >
              ⭐ Guest 선수 ({masterRoster.filter(p => p.category === 'guest').length}명)
            </button>

            <button
              className="tab-btn"
              onClick={() => setActiveRosterTab('manage')}
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '15px',
                backgroundColor: activeRosterTab === 'manage' ? 'var(--accent-warning)' : 'var(--bg-main)',
                color: activeRosterTab === 'manage' ? '#0f172a' : 'var(--text-main)',
                fontWeight: '800',
              }}
            >
              ⚙️ 선수 추가/관리
            </button>
          </div>

          {/* TAB 1: 동호회 선수 (Club Members) */}
          {activeRosterTab === 'club' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  💡 선수를 클릭하면 **오늘의 참가 선수 명단**에 추가/제외됩니다.
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="이름 검색..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Club Members Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {clubMembers.map(p => {
                  const isChecked = participantIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => onToggleParticipant(p)}
                      style={{
                        backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-main)',
                        border: `2px solid ${isChecked ? 'var(--accent-success)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: 'var(--font-base)', color: isChecked ? 'var(--accent-success)' : 'var(--text-main)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--accent-primary)', margin: '2px 0' }}>
                        {p.currentDivision}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: isChecked ? 'var(--accent-success)' : 'var(--text-muted)',
                        backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isChecked ? <Check size={12} /> : <Plus size={12} />}
                        {isChecked ? '참가 중' : '선택'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inline Form to Add New Club Member */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: '800', alignSelf: 'center', fontSize: '14px' }}>➕ 신규 동호회 선수 등록:</span>
                <input
                  type="text"
                  placeholder="이름 (예: 홍길동)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ flex: 1, minWidth: '120px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                />
                <select
                  value={newDivision}
                  onChange={e => setNewDivision(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '700' }}
                >
                  {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button
                  className="btn-primary"
                  onClick={() => handleAddMasterPlayer('club')}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}
                >
                  <UserPlus size={16} /> 등록 & 참가
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Guest 선수 (Guest Players) */}
          {activeRosterTab === 'guest' && (
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                💡 방문 게스트 선수를 선택하여 오늘의 참가 명단에 포함시킬 수 있습니다.
              </div>

              {/* Guest Members Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {guestMembers.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontSize: '14px', padding: '14px 0' }}>
                    등록된 Guest 선수가 없습니다. 아래 입력창에서 게스트를 추가해 보세요!
                  </div>
                ) : (
                  guestMembers.map(p => {
                    const isChecked = participantIds.has(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => onToggleParticipant(p)}
                        style={{
                          backgroundColor: isChecked ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-main)',
                          border: `2px solid ${isChecked ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ fontWeight: '800', fontSize: 'var(--font-base)', color: isChecked ? 'var(--accent-purple)' : 'var(--text-main)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--accent-primary)', margin: '2px 0' }}>
                          {p.currentDivision}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: isChecked ? 'var(--accent-purple)' : 'var(--text-muted)',
                          backgroundColor: isChecked ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.05)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isChecked ? <Check size={12} /> : <Plus size={12} />}
                          {isChecked ? '참가 중' : '선택'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inline Form to Add New Guest Member */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: '800', alignSelf: 'center', fontSize: '14px' }}>➕ 신규 Guest 선수 등록:</span>
                <input
                  type="text"
                  placeholder="게스트 이름 (예: 이게스트)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ flex: 1, minWidth: '120px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                />
                <select
                  value={newDivision}
                  onChange={e => setNewDivision(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '700' }}
                >
                  {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button
                  className="btn-primary"
                  onClick={() => handleAddMasterPlayer('guest')}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', backgroundColor: 'var(--accent-purple)' }}
                >
                  <UserPlus size={16} /> 게스트 등록 & 참가
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 선수 추가/관리 (Roster Management) */}
          {activeRosterTab === 'manage' && (
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                ⚙️ 전체 선수 DB 관리 (신규 선수 등록, 이름 수정, 기본 부수 변경, 동호회/게스트 구분 변경, 삭제)
              </div>

              {/* Inline Add New Player Form for TAB 3 */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <span style={{ fontWeight: '800', alignSelf: 'center', fontSize: '14px' }}>➕ 신규 선수 추가:</span>
                <input
                  type="text"
                  placeholder="선수 이름"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ flex: 1, minWidth: '120px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                />
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '700' }}
                >
                  <option value="club">동호회 선수</option>
                  <option value="guest">Guest 선수</option>
                </select>
                <select
                  value={newDivision}
                  onChange={e => setNewDivision(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: '700' }}
                >
                  {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button
                  className="btn-primary"
                  onClick={() => handleAddMasterPlayer(editCategory || 'club')}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', backgroundColor: 'var(--accent-warning)', color: '#0f172a' }}
                >
                  <UserPlus size={16} /> 선수 추가
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', fontSize: '14px', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>이름</th>
                      <th style={{ padding: '10px' }}>구분</th>
                      <th style={{ padding: '10px' }}>기본 부수</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterRoster.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px', fontWeight: '800' }}>
                          {editingPlayerId === p.id ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--accent-primary)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                            />
                          ) : (
                            <span>{p.name}</span>
                          )}
                        </td>

                        <td style={{ padding: '10px' }}>
                          {editingPlayerId === p.id ? (
                            <select
                              value={editCategory}
                              onChange={e => setEditCategory(e.target.value)}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--accent-primary)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                            >
                              <option value="club">동호회 선수</option>
                              <option value="guest">Guest 선수</option>
                            </select>
                          ) : (
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: p.category === 'guest' ? 'var(--accent-purple)' : 'var(--accent-primary)',
                              backgroundColor: p.category === 'guest' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}>
                              {p.category === 'guest' ? 'Guest' : '동호회'}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '10px' }}>
                          {editingPlayerId === p.id ? (
                            <select
                              value={editDivision}
                              onChange={e => setEditDivision(e.target.value)}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--accent-primary)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700' }}
                            >
                              {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          ) : (
                            <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{p.currentDivision}</span>
                          )}
                        </td>

                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          {editingPlayerId === p.id ? (
                            <button
                              className="btn-primary"
                              onClick={() => handleSaveMasterEdit(p.id)}
                              style={{ padding: '4px 12px', fontSize: '13px', width: 'auto', display: 'inline-flex' }}
                            >
                              저장
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                className="btn-secondary"
                                onClick={() => {
                                  setEditingPlayerId(p.id);
                                  setEditName(p.name);
                                  setEditDivision(p.currentDivision);
                                  setEditCategory(p.category || 'club');
                                }}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                <Edit2 size={14} /> 수정
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={() => handleDeleteMasterPlayer(p.id)}
                                style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--accent-danger)' }}
                              >
                                <Trash2 size={14} /> 삭제
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
