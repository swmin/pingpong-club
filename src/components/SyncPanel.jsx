import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { X, Radio, ScanLine, Crown, LogOut, Users, Wifi, WifiOff, Lock } from 'lucide-react';

// 방 번호를 QR에 담을 문자열 (웹 주소로 열었으면 링크, 파일로 열었으면 PPCLUB:번호)
export const buildJoinPayload = (code) => {
  if (typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)) {
    return `${window.location.origin}${window.location.pathname}?room=${code}`;
  }
  return `PPCLUB:${code}`;
};

// QR/입력 문자열에서 4자리 방 번호 추출
export const parseRoomCode = (text) => {
  if (!text) return '';
  const m = String(text).match(/room=(\d{4})/) || String(text).match(/PPCLUB:(\d{4})/i) || String(text).match(/^\s*(\d{4})\s*$/);
  return m ? m[1] : '';
};

const statusLabel = {
  idle: '연결 안 됨',
  connecting: '연결 중...',
  connected: '연결됨',
  reconnecting: '재연결 중...',
  error: '연결 오류',
};

function QrScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const detectedRef = useRef(onDetected);
  const [msg, setMsg] = useState('카메라를 켜는 중...');

  useEffect(() => {
    detectedRef.current = onDetected;
  });

  useEffect(() => {
    let stream;
    let raf;
    let stopped = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const tick = () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(img.data, img.width, img.height);
        if (result) {
          const code = parseRoomCode(result.data);
          if (code) {
            detectedRef.current(code);
            return;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setMsg('방장 화면의 QR코드를 비춰 주세요.');
        raf = requestAnimationFrame(tick);
      } catch (e) {
        console.warn(e);
        setMsg('카메라를 사용할 수 없습니다. 방 번호 4자리를 직접 입력해 주세요.');
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ marginTop: '12px' }}>
      <video ref={videoRef} playsInline muted style={{ width: '100%', borderRadius: '12px', backgroundColor: '#000', maxHeight: '300px', objectFit: 'cover' }} />
      <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '700' }}>{msg}</div>
      <button className="btn-secondary" style={{ marginTop: '8px' }} onClick={onClose}>스캔 닫기</button>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: 'var(--radius-md)',
  border: '2px solid var(--border-color)',
  backgroundColor: 'var(--bg-main)',
  color: 'var(--text-main)',
  fontSize: 'var(--font-lg)',
  fontWeight: '800',
};

export default function SyncPanel({ sync, onClose, initialCode }) {
  const [joinCode, setJoinCode] = useState(initialCode || '');
  const [joinName, setJoinName] = useState(() => {
    try { return window.localStorage.getItem('pingpong_sync_name') || ''; } catch { return ''; }
  });
  const [scanning, setScanning] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    if (sync.role === 'host' && sync.code) {
      QRCode.toDataURL(buildJoinPayload(sync.code), { margin: 1, width: 240 })
        .then(setQrUrl)
        .catch(() => setQrUrl(''));
    }
  }, [sync.role, sync.code]);

  const doJoin = (code) => {
    const c = parseRoomCode(code);
    if (!c) {
      alert('방 번호 4자리를 입력해 주세요.');
      return;
    }
    const name = joinName.trim() || '참가자';
    try { window.localStorage.setItem('pingpong_sync_name', name); } catch { /* ignore */ }
    sync.join(c, name);
  };

  const connected = sync.status === 'connected';
  const StatusIcon = connected ? Wifi : WifiOff;

  const sectionStyle = {
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: '14px',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={24} color="var(--accent-primary)" />
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: '900' }}>함께 입력하기 (실시간 동기화)</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} aria-label="닫기">
            <X size={28} />
          </button>
        </div>

        {/* ===== 방에 연결되지 않은 상태 ===== */}
        {sync.role === 'none' && (
          <>
            <div style={sectionStyle}>
              <div style={{ fontWeight: '900', marginBottom: '6px' }}>📡 방 만들기 (방장)</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                현재 화면의 오늘 모임을 다른 회원 폰과 실시간으로 함께 입력합니다.
              </div>
              <button className="btn-primary" onClick={sync.startHost}>
                <Radio size={20} />
                <span>방 만들기</span>
              </button>
            </div>

            <div style={sectionStyle}>
              <div style={{ fontWeight: '900', marginBottom: '10px' }}>🙋 방 참가하기 (도우미)</div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>내 이름</label>
              <input style={{ ...inputStyle, marginBottom: '10px' }} type="text" placeholder="예: 김철수" value={joinName} onChange={(e) => setJoinName(e.target.value)} />
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>방 번호 (4자리)</label>
              <input
                style={{ ...inputStyle, letterSpacing: '8px', textAlign: 'center', marginBottom: '10px' }}
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="0000"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => doJoin(joinCode)}>
                  <Users size={20} />
                  <span>참가</span>
                </button>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setScanning(!scanning)}>
                  <ScanLine size={20} />
                  <span>QR 스캔</span>
                </button>
              </div>
              {scanning && (
                <QrScanner
                  onDetected={(code) => {
                    setScanning(false);
                    setJoinCode(code);
                    doJoin(code);
                  }}
                  onClose={() => setScanning(false)}
                />
              )}
            </div>
          </>
        )}

        {/* ===== 방장 화면 ===== */}
        {sync.role === 'host' && (
          <>
            <div style={{ ...sectionStyle, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontWeight: '800', color: connected ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                <StatusIcon size={18} />
                <span>{statusLabel[sync.status]}</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>방 번호</div>
              <div style={{ fontSize: '56px', fontWeight: '900', letterSpacing: '10px', color: 'var(--accent-primary)' }}>{sync.code}</div>
              {qrUrl && <img src={qrUrl} alt="방 참가 QR코드" style={{ width: '200px', height: '200px', borderRadius: '8px', backgroundColor: '#fff', padding: '6px' }} />}
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                도우미는 [함께 입력하기] → 방 번호 입력 또는 QR 스캔
              </div>
              <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: '800' }}>
                <Lock size={14} style={{ verticalAlign: '-2px' }} /> 관리자 번호: <span style={{ fontSize: '20px', letterSpacing: '3px', color: 'var(--accent-warning, #f59e0b)' }}>{sync.pin}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                (이 번호를 아는 도우미만 선수 명단을 바꿀 수 있습니다)
              </div>
              {sync.error && <div style={{ color: 'var(--accent-danger)', fontWeight: '700', marginTop: '8px' }}>{sync.error}</div>}
            </div>

            <div style={sectionStyle}>
              <div style={{ fontWeight: '900', marginBottom: '8px' }}>👥 접속자 ({sync.participants.filter((p) => p.online).length}명 접속 중)</div>
              {sync.participants.length === 0 && (
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>아직 접속한 도우미가 없습니다.</div>
              )}
              {sync.participants.map((p) => (
                <div key={p.clientId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 0', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: '800', opacity: p.online ? 1 : 0.5 }}>
                    {p.isAdmin ? '👑 ' : '👤 '}{p.name}
                    {!p.online && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> (연결 끊김)</span>}
                  </div>
                  <button
                    className={p.isAdmin ? 'btn-secondary' : 'btn-primary'}
                    style={{ padding: '6px 12px', fontSize: '14px' }}
                    onClick={() => sync.setAdmin(p.clientId, !p.isAdmin)}
                  >
                    <Crown size={16} />
                    <span>{p.isAdmin ? '관리자 해제' : '관리자 주기'}</span>
                  </button>
                </div>
              ))}
            </div>

            <button className="btn-secondary" style={{ color: 'var(--accent-danger)' }} onClick={() => { if (confirm('방을 닫으면 도우미들과의 동기화가 끊어집니다. (입력된 점수는 모두 남습니다)\n방을 닫을까요?')) sync.leave(); }}>
              <LogOut size={18} />
              <span>방 닫기</span>
            </button>
          </>
        )}

        {/* ===== 참가자 화면 ===== */}
        {sync.role === 'guest' && (
          <>
            <div style={{ ...sectionStyle, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontWeight: '800', color: connected ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                <StatusIcon size={18} />
                <span>방 {sync.code} · {statusLabel[sync.status]}</span>
              </div>
              <div style={{ marginTop: '8px', fontWeight: '800' }}>
                {sync.isAdmin ? '👑 관리자 (선수 명단 변경 가능)' : '✏️ 점수 입력 전용'}
              </div>
              {sync.error && <div style={{ color: 'var(--accent-danger)', fontWeight: '700', marginTop: '8px' }}>{sync.error}</div>}
              {sync.status === 'reconnecting' && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  연결이 끊겼습니다. 자동으로 다시 연결하며, 그동안 입력한 점수는 재연결 시 함께 합쳐집니다.
                </div>
              )}
            </div>

            {!sync.isAdmin && connected && (
              <div style={sectionStyle}>
                <div style={{ fontWeight: '900', marginBottom: '6px' }}>🔒 관리자 번호로 잠금 해제</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  방장 화면의 관리자 번호를 입력하면 선수 명단을 변경할 수 있습니다.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={{ ...inputStyle, textAlign: 'center', letterSpacing: '6px' }}
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="관리자 번호"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                  <button className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={() => sync.sendPin(pinInput)}>확인</button>
                </div>
                {sync.pinError && <div style={{ color: 'var(--accent-danger)', fontWeight: '700', marginTop: '6px' }}>{sync.pinError}</div>}
              </div>
            )}

            {sync.participants.length > 0 && (
              <div style={sectionStyle}>
                <div style={{ fontWeight: '900', marginBottom: '6px' }}>👥 함께 입력 중인 사람</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  {sync.participants.filter((p) => p.online).map((p) => `${p.isAdmin ? '👑' : ''}${p.name}`).join(', ') || '-'}
                </div>
              </div>
            )}

            <button className="btn-secondary" style={{ color: 'var(--accent-danger)' }} onClick={sync.leave}>
              <LogOut size={18} />
              <span>방 나가기</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
