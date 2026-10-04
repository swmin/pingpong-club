import React, { useRef } from 'react';
import { Type, Volume2, VolumeX, RefreshCw, Download, Upload, FileCode } from 'lucide-react';

export default function SeniorFontControls({
  fontScale,
  setFontScale,
  ttsEnabled,
  setTtsEnabled,
  onResetLeague,
  onExportEmbeddedHTML,
  onExportJSON,
  onImportJSON,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (onImportJSON) {
      onImportJSON(e);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="senior-controls-bar">
      {/* Font Size Selector */}
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

      {/* Action Shortcuts & Backup/Restore */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Export Pre-populated HTML for OneDrive & Smartphone */}
        <button
          className="btn-secondary"
          onClick={onExportEmbeddedHTML}
          title="현재 브라우저에 누적된 모임 히스토리가 기본 저장된 HTML 파일 내보내기 (원드라이브/휴대폰용)"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', borderColor: 'var(--accent-success)', padding: '8px 12px', fontWeight: '800' }}
        >
          <FileCode size={18} />
          <span>📂 데이터 포함 HTML 저장 (원드라이브용)</span>
        </button>

        {/* Export JSON Backup */}
        <button
          className="btn-secondary"
          onClick={onExportJSON}
          title="전체 모임 데이터를 JSON 백업 파일로 저장"
          style={{ padding: '8px 12px' }}
        >
          <Download size={18} />
          <span>백업 (.json)</span>
        </button>

        {/* Import JSON Backup */}
        <button
          className="btn-secondary"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          title="JSON 백업 파일에서 모임 데이터 불러오기"
          style={{ padding: '8px 12px' }}
        >
          <Upload size={18} />
          <span>복원 (.json)</span>
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* TTS Toggle */}
        <button
          className="btn-secondary"
          onClick={() => setTtsEnabled(!ttsEnabled)}
          title="음성 안내 켜기/끄기"
          style={{ padding: '8px 12px' }}
        >
          {ttsEnabled ? <Volume2 size={18} color="var(--accent-success)" /> : <VolumeX size={18} color="var(--text-muted)" />}
          <span>음성 {ttsEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Reset League */}
        <button
          className="btn-secondary"
          onClick={onResetLeague}
          style={{ color: 'var(--accent-danger)', padding: '8px 12px' }}
        >
          <RefreshCw size={18} />
          <span>초기화</span>
        </button>
      </div>
    </div>
  );
}
