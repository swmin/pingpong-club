import React, { useState } from 'react';
import { Trophy, Download, Calendar, Users, HelpCircle, PlusCircle, Building2, Edit3 } from 'lucide-react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

export default function Header({
  leagueTitle,
  setLeagueTitle,
  meetingDate,
  setMeetingDate,
  playersCount,
  completedMatchesCount,
  totalMatchesCount,
  onOpenHelp,
  onOpenCreateModal,
  onOpenSelectModal,
  clubsCount,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);

  // Helper to format Korean date without duplicate "일" bug: e.g. "2026년 10월 4일 (일)"
  const getFormattedKoreanDate = (dateString) => {
    let d = new Date(dateString);
    if (isNaN(d.getTime())) {
      d = new Date(); // Fallback to current date if invalid
    }
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekdayStr = weekdays[d.getDay()];

    return `${year}년 ${month}월 ${day}일 (${weekdayStr})`;
  };

  // Helper to get YYYY-MM-DD
  const getTodayISO = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const currentDateValue = meetingDate || getTodayISO();

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

      // Filename: <동호회 만날 날짜>_<동호회이름>_결과.png
      const cleanTitle = (leagueTitle || '탁구리그').replace(/[\/\\:*?"<>|]/g, '_');
      const filename = `${currentDateValue}_${cleanTitle}_결과.png`;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                    gap: '6px'
                  }}
                  title="클릭하여 동호회 이름 수정"
                >
                  {leagueTitle}
                  <span data-html2canvas-ignore="true" style={{ fontSize: '13px', color: 'var(--accent-primary)', fontWeight: '600' }}>[수정]</span>
                </h1>
              )}

              {/* Create Club & Select Club Buttons next to Club Name */}
              <div data-html2canvas-ignore="true" style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn-secondary"
                  onClick={onOpenCreateModal}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--accent-primary)',
                    borderColor: 'var(--accent-primary)',
                  }}
                  title="새로운 동호회 생성 팝업 열기"
                >
                  <PlusCircle size={15} />
                  <span>동호회 생성</span>
                </button>

                <button
                  className="btn-secondary"
                  onClick={onOpenSelectModal}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                  title="등록된 동호회 목록 보기 및 전환"
                >
                  <Building2 size={15} />
                  <span>동호회 목록 ({clubsCount}개) ▼</span>
                </button>
              </div>
            </div>

            {/* Date and Participant info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px', flexWrap: 'wrap' }}>
              {/* Meeting Date Display & Manual Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} color="var(--accent-primary)" />
                {isEditingDate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="date"
                      value={currentDateValue}
                      onChange={e => {
                        if (e.target.value) setMeetingDate(e.target.value);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') setIsEditingDate(false);
                      }}
                      onBlur={() => {
                        // Small timeout to allow button click if tapped
                        setTimeout(() => setIsEditingDate(false), 150);
                      }}
                      autoFocus
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '2px solid var(--accent-primary)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontSize: '14px',
                        fontWeight: '700',
                      }}
                    />
                    <button
                      onClick={() => setIsEditingDate(false)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--accent-success)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '800',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      확인
                    </button>
                  </div>
                ) : (
                  <span
                    onClick={() => setIsEditingDate(true)}
                    style={{
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="클릭하여 날짜 수동 수정 (기본값: 오늘 날짜)"
                  >
                    {getFormattedKoreanDate(currentDateValue)}
                    <span data-html2canvas-ignore="true" style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '600' }}>[날짜변경]</span>
                  </span>
                )}
              </div>

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
