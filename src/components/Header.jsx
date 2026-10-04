import React, { useState } from 'react';
import { Trophy, Share2, Download, Calendar, Users, HelpCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';
import confetti from 'canvas-confetti';

export default function Header({ leagueTitle, setLeagueTitle, playersCount, completedMatchesCount, totalMatchesCount, onOpenHelp }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Export Table as Image / PDF
  const handleExportPDF = async () => {
    const element = document.getElementById('export-area');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`${leagueTitle || '탁구풀리그'}_결과.pdf`);

      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
      alert('PDF 저장 중 오류가 발생했습니다.');
    }
  };

  // Copy KakaoTalk Summary
  const handleCopyKakaoText = () => {
    const text = `🏓 [${leagueTitle}] 리그전 결과 🏓\n` +
      `• 참가선수: ${playersCount}명\n` +
      `• 진행상황: ${completedMatchesCount} / ${totalMatchesCount} 경기 완료\n` +
      `• 웹 대진표 주소: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    alert('카카오톡으로 공유할 텍스트가 복사되었습니다! 카톡에 붙여넣기(Ctrl+V) 하세요.');
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

        {/* Share & Help Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleCopyKakaoText} title="카톡으로 결과 전달">
            <Share2 size={18} color="var(--accent-success)" />
            <span>카톡 공유</span>
          </button>
          <button className="btn-secondary" onClick={handleExportPDF} title="PDF 파일 다운로드">
            <Download size={18} color="var(--accent-primary)" />
            <span>PDF 저장</span>
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
