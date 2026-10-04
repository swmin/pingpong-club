import React from 'react';
import { Type, Volume2, VolumeX, RefreshCw } from 'lucide-react';

export default function SeniorFontControls({
  fontScale,
  setFontScale,
  ttsEnabled,
  setTtsEnabled,
  onResetLeague,
}) {
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

      {/* Action Shortcuts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* TTS Toggle */}
        <button
          className="btn-secondary"
          onClick={() => setTtsEnabled(!ttsEnabled)}
          title="음성 안내 켜기/끄기"
          style={{ padding: '8px 12px' }}
        >
          {ttsEnabled ? <Volume2 size={18} color="var(--accent-success)" /> : <VolumeX size={18} color="var(--text-muted)" />}
          <span>음성 안내 {ttsEnabled ? 'ON' : 'OFF'}</span>
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
