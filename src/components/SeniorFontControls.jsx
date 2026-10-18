import React, { useRef, useState, useEffect } from 'react';
import { Type, Volume2, VolumeX, RefreshCw, Download, Upload, FileCode, Settings, ChevronRight, ChevronDown, AlertTriangle, Smartphone } from 'lucide-react';

export default function SeniorFontControls({
  fontScale,
  setFontScale,
  ttsEnabled,
  setTtsEnabled,
  onResetLeague,
  onExportEmbeddedHTML,
  onExportJSON,
  onImportJSON,
  onFactoryReset,
  pwa,
  onOpenPwaModal,
}) {
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Close dropdown when clicking/tapping outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
        setIsResetOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsResetOpen(false);
  };

  const runAndClose = (fn) => () => {
    closeMenu();
    if (fn) fn();
  };

  const handleFileChange = (e) => {
    if (onImportJSON) {
      onImportJSON(e);
      e.target.value = ''; // Reset file input
    }
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '11px 14px',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    color: 'var(--text-main)',
    fontSize: '14px',
    fontWeight: '700',
    textAlign: 'left',
    cursor: 'pointer',
  };

  const hover = {
    onMouseEnter: (e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; },
    onMouseLeave: (e) => { e.currentTarget.style.backgroundColor = 'transparent'; },
  };

  return (
    <div className="senior-controls-bar">
      {/* Font Size Selector (kept in place) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Type size={20} color="var(--accent-primary)" />
        <span style={{ fontWeight: '700', fontSize: '15px' }}>글자 크기:</span>
        <div className="senior-font-btns">
          <button
            className={`font-btn ${fontScale === 1 ? 'active' : ''}`}
            onClick={() => setFontScale(1)}
          >
            보통
          </button>
          <button
            className={`font-btn ${fontScale === 1.2 ? 'active' : ''}`}
            onClick={() => setFontScale(1.2)}
          >
            크게
          </button>
        </div>
      </div>

      {/* Settings & App Install Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {!pwa?.isInstalled && (
          <button
            className="btn-secondary"
            onClick={async () => {
              if (pwa?.canPrompt) {
                const res = await pwa.triggerInstall();
                if (res !== 'accepted' && onOpenPwaModal) onOpenPwaModal();
              } else if (onOpenPwaModal) {
                onOpenPwaModal();
              }
            }}
            style={{
              padding: '8px 14px',
              fontWeight: '900',
              backgroundColor: 'var(--accent-primary)',
              borderColor: 'var(--accent-primary)',
              color: '#ffffff',
            }}
          >
            <Smartphone size={18} />
            <span>📲 앱 설치</span>
          </button>
        )}

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            className="btn-secondary"
            onClick={() => { setIsMenuOpen(!isMenuOpen); setIsResetOpen(false); }}
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            style={{
              padding: '8px 14px',
              fontWeight: '800',
              borderColor: isMenuOpen ? 'var(--accent-primary)' : undefined,
              color: isMenuOpen ? 'var(--accent-primary)' : undefined,
            }}
          >
            <Settings size={18} />
            <span>설정</span>
            <ChevronDown size={16} style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 1000,
                minWidth: '280px',
                padding: '6px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
              }}
            >
              {/* 0) PWA App Install & Share QR */}
              <button
                role="menuitem"
                style={{ ...itemStyle, color: 'var(--accent-primary)' }}
                {...hover}
                onClick={runAndClose(onOpenPwaModal)}
                title="스마트폰/태블릿에 앱으로 설치하거나 회원에게 설치 QR코드 공유"
              >
                <Smartphone size={18} />
                <span>📲 앱 설치 및 회원 공유 (QR)</span>
              </button>

              {/* 1) Export Pre-populated HTML */}
              <button role="menuitem" style={{ ...itemStyle, color: 'var(--accent-success)' }} {...hover}
                onClick={runAndClose(onExportEmbeddedHTML)}
                title="현재 브라우저에 누적된 모임 히스토리가 기본 저장된 HTML 파일 내보내기 (원드라이브/휴대폰용)">
                <FileCode size={18} />
                <span>📂 데이터 포함 HTML 저장 (원드라이브용)</span>
              </button>

            {/* 2) Export JSON Backup */}
            <button role="menuitem" style={itemStyle} {...hover} onClick={runAndClose(onExportJSON)}
              title="전체 모임 데이터를 JSON 백업 파일로 저장">
              <Download size={18} />
              <span>백업 (.json)</span>
            </button>

            {/* 3) Import JSON Backup */}
            <button role="menuitem" style={itemStyle} {...hover}
              onClick={runAndClose(() => fileInputRef.current && fileInputRef.current.click())}
              title="JSON 백업 파일에서 모임 데이터 불러오기">
              <Upload size={18} />
              <span>복원 (.json)</span>
            </button>

            {/* 4) TTS Toggle (menu stays open so state change is visible) */}
            <button role="menuitem" style={itemStyle} {...hover} onClick={() => setTtsEnabled(!ttsEnabled)}
              title="음성 안내 켜기/끄기">
              {ttsEnabled ? <Volume2 size={18} color="var(--accent-success)" /> : <VolumeX size={18} color="var(--text-muted)" />}
              <span>음성 {ttsEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '6px 4px' }} />

            {/* Reset submenu (one level deeper to prevent accidental clicks) */}
            <button role="menuitem" aria-haspopup="true" aria-expanded={isResetOpen}
              style={{ ...itemStyle, color: 'var(--accent-danger)', justifyContent: 'space-between' }} {...hover}
              onClick={() => setIsResetOpen(!isResetOpen)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} />
                <span>초기화</span>
              </span>
              <ChevronRight size={16} style={{ transform: isResetOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }} />
            </button>

            {isResetOpen && (
              <div style={{
                margin: '4px 4px 2px 18px',
                padding: '4px',
                borderLeft: '2px solid rgba(239, 68, 68, 0.5)',
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                borderRadius: '0 8px 8px 0',
              }}>
                {/* 5) Reset current session matches */}
                <button role="menuitem" style={{ ...itemStyle, color: 'var(--accent-danger)' }} {...hover}
                  onClick={runAndClose(onResetLeague)}
                  title="현재 모임의 경기 기록만 초기화">
                  <RefreshCw size={18} />
                  <span>경기 초기화</span>
                </button>

                {/* 6) Factory reset */}
                <button role="menuitem"
                  style={{ ...itemStyle, color: '#fff', backgroundColor: 'var(--accent-danger)', marginTop: '4px' }}
                  onClick={runAndClose(onFactoryReset)}
                  title="동호회 목록, 모임 히스토리, 선수 명단, 점수 기록을 모두 삭제하고 처음 상태로 되돌리기">
                  <RefreshCw size={18} />
                  <span>전체 초기화</span>
                </button>
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        </div>
      </div>
    </div>
  );
}
