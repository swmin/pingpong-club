import React, { useState } from 'react';
import { Trophy, Download, Calendar, Users, HelpCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

export default function Header({ leagueTitle, setLeagueTitle, playersCount, completedMatchesCount, totalMatchesCount, onOpenHelp }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Export Header (Title, Date), Player List, Matrix Grid, Leaderboard as PNG Image
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
        {/* Title & Date Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: 'var(--accent-primary)',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)'
          }}>
            <Trophy size={30} />
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
                title="클릭하여 모임 이름 수정"
              >
                {leagueTitle}
                <span data-html2canvas-ignore="true" style={{ fontSize: '13px', color: 'var(--accent-primary)', fontWeight: '600' }}>[수정]</span>
              </h1>
            )}

            {/* Date and Participant info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700', color: 'var(--text-main)' }}>
                <Calendar size={16} color="var(--accent-primary)" /> {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={16} /> 참가자 {playersCount}명 ({completedMatchesCount}/${totalMatchesCount} 경기 완료)
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons (ignored during html2canvas capture) */}
        <div data-html2canvas-ignore="true" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={handleSavePNG}
            title="모임이름 + 날짜 + 선수명단 + 종이대진표 + 순위표를 PNG 이미지로 저장"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', borderColor: 'var(--accent-success)', padding: '10px 16px', fontWeight: '800' }}
          >
            <Download size={20} />
            <span>결과저장</span>
          </button>
          <button
            className="btn-secondary"
            onClick={onOpenHelp}
            style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)', borderColor: 'var(--accent-purple)', padding: '10px 16px' }}
          >
            <HelpCircle size={20} />
            <span>동률 규칙 설명</span>
          </button>
        </div>
      </div>
    </header>
  );
}
