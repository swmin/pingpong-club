import React, { useState } from 'react';
import { Trophy, Download, Calendar, Users, HelpCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

export default function Header({ leagueTitle, setLeagueTitle, playersCount, completedMatchesCount, totalMatchesCount, onOpenHelp }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Export 1) Player List, 2) Matrix Grid, 3) Leaderboard as single PNG Image
  const handleSavePNG = async () => {
    const element = document.getElementById('export-area');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
        logging: false,
      });

      // Format Date: YYYY-MM-DD
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Clean Title for Filename
      const cleanTitle = (leagueTitle || '탁구리그').replace(/[\/\\:*?"<>|]/g, '_');
      const filename = `${dateStr}_${cleanTitle}_결과.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
      console.error(e);
      alert('결과 이미지 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <header style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        {/* Title Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--accent-primary)',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)'
          }}>
            <Trophy size={28} />
          </div>

          <div>
            {isEditingTitle ? (
              <input
                type="text"
                value={leagueTitle}
                onChange={e => setLeagueTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '2px solid var(--accent-primary)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                }}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                style={{
                  fontSize: 'calc(var(--font-xl) * 1.1)',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                title="클릭하여 대회 제목 수정"
              >
                {leagueTitle}
                <span style={{ fontSize: '14px', color: 'var(--accent-primary)', fontWeight: '600' }}>[수정]</span>
              </h1>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={14} /> 참가자 {playersCount}명
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={handleSavePNG}
            title="선수명단 + 종이 대진표 + 실시간 순위표를 PNG 이미지로 저장"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}
          >
            <Download size={18} />
            <span>결과저장</span>
          </button>
          <button
            className="btn-secondary"
            onClick={onOpenHelp}
            style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}
          >
            <HelpCircle size={18} />
            <span>동률 규칙 설명</span>
          </button>
        </div>
      </div>
    </header>
  );
}
