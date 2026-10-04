import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ScoreModal({ match, players, onClose, onSaveScore, ttsEnabled }) {
  if (!match) return null;

  const playersMap = {};
  players.forEach(p => { playersMap[p.id] = p; });

  const playerA = playersMap[match.playerAId] || { name: '선수 A' };
  const playerB = playersMap[match.playerBId] || { name: '선수 B' };

  const [scoreA, setScoreA] = useState(match.playerASets || 0);
  const [scoreB, setScoreB] = useState(match.playerBSets || 0);
  const [isForfeit, setIsForfeit] = useState(match.status === 'forfeit');

  useEffect(() => {
    setScoreA(match.playerASets || 0);
    setScoreB(match.playerBSets || 0);
    setIsForfeit(match.status === 'forfeit');
  }, [match]);

  const handleApplyPreset = (a, b) => {
    setScoreA(a);
    setScoreB(b);
    setIsForfeit(false);
  };

  const handleSave = () => {
    let winnerId = null;
    let status = 'completed';

    if (isForfeit) {
      status = 'forfeit';
      winnerId = null;
    } else {
      if (scoreA > scoreB) winnerId = playerA.id;
      else if (scoreB > scoreA) winnerId = playerB.id;
      else status = 'pending';
    }

    // TTS Audio announcement
    if (ttsEnabled && 'speechSynthesis' in window && !isForfeit && winnerId) {
      const winnerName = winnerId === playerA.id ? playerA.name : playerB.name;
      const text = `${playerA.name} 대 ${playerB.name}, ${scoreA} 대 ${scoreB}. ${winnerName} 선수 승리!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      window.speechSynthesis.speak(utterance);
    }

    onSaveScore({
      ...match,
      playerASets: scoreA,
      playerBSets: scoreB,
      status,
      winnerId,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: '900' }}>
            🏓 경기 점수 입력 (경기 #{match.orderNumber})
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={28} />
          </button>
        </div>

        {/* Players Score Counter Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
          {/* Player A Counter */}
          <div style={{ textAlign: 'center', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 'var(--font-xl)', fontWeight: '900', marginBottom: '8px', color: playerA.avatarColor }}>
              {playerA.name}
            </div>
            <div className="score-display-num">{scoreA}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px' }}>
              <button className="counter-btn btn-minus" onClick={() => setScoreA(Math.max(0, scoreA - 1))}>-</button>
              <button className="counter-btn btn-plus" onClick={() => setScoreA(scoreA + 1)}>+</button>
            </div>
          </div>

          <div style={{ fontSize: 'var(--font-2xl)', fontWeight: '900', color: 'var(--text-muted)' }}>
            :
          </div>

          {/* Player B Counter */}
          <div style={{ textAlign: 'center', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 'var(--font-xl)', fontWeight: '900', marginBottom: '8px', color: playerB.avatarColor }}>
              {playerB.name}
            </div>
            <div className="score-display-num">{scoreB}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px' }}>
              <button className="counter-btn btn-minus" onClick={() => setScoreB(Math.max(0, scoreB - 1))}>-</button>
              <button className="counter-btn btn-plus" onClick={() => setScoreB(scoreB + 1)}>+</button>
            </div>
          </div>
        </div>

        {/* Preset Quick Buttons */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
            ⚡ 원클릭 세트 스코어 완성 (어르신 추천):
          </div>
          <div className="preset-grid">
            <button className="preset-btn" onClick={() => handleApplyPreset(3, 0)}>3 : 0</button>
            <button className="preset-btn" onClick={() => handleApplyPreset(3, 1)}>3 : 1</button>
            <button className="preset-btn" onClick={() => handleApplyPreset(3, 2)}>3 : 2</button>
            <button className="preset-btn" onClick={() => handleApplyPreset(2, 3)}>2 : 3</button>
            <button className="preset-btn" onClick={() => handleApplyPreset(1, 3)}>1 : 3</button>
            <button className="preset-btn" onClick={() => handleApplyPreset(0, 3)}>0 : 3</button>
          </div>
        </div>

        {/* Forfeit Toggle */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            className="btn-secondary"
            onClick={() => setIsForfeit(!isForfeit)}
            style={{
              flex: 1,
              justifyContent: 'center',
              backgroundColor: isForfeit ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-main)',
              borderColor: isForfeit ? 'var(--accent-purple)' : 'var(--border-color)',
              color: isForfeit ? 'var(--accent-purple)' : 'var(--text-muted)'
            }}
          >
            <AlertTriangle size={18} />
            <span>기권 / 미경기 (X 표기) {isForfeit ? '설정됨' : ''}</span>
          </button>
        </div>

        {/* Save Button */}
        <button className="btn-primary" onClick={handleSave}>
          <CheckCircle size={24} />
          <span>점수 저장하기</span>
        </button>
      </div>
    </div>
  );
}
