import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Download, CheckCircle2, Copy, Check, Share2 } from 'lucide-react';

const DEFAULT_WEB_URL = 'https://swmin.github.io/pingpong-club/';

export default function PwaInstallModal({ pwa, onClose }) {
  const isHttp =
    typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol);
  const currentUrl = isHttp
    ? `${window.location.origin}${window.location.pathname}`
    : DEFAULT_WEB_URL;

  const [shareUrl, setShareUrl] = useState(currentUrl);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareUrl.trim()) return;
    QRCode.toDataURL(shareUrl.trim(), { margin: 1, width: 220 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [shareUrl]);

  const handleInstallClick = async () => {
    const res = await pwa.triggerInstall();
    if (res === 'accepted') {
      onClose();
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(`아래 주소를 복사해 주세요:\n${shareUrl}`);
    }
  };

  const boxStyle = {
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: '14px',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={24} color="var(--accent-primary)" />
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: '900' }}>
              앱 설치 및 회원 공유 (PWA)
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            aria-label="닫기"
          >
            <X size={28} />
          </button>
        </div>

        {/* 1. 현재 기기 설치 상태 / 원클릭 설치 버튼 */}
        <div style={boxStyle}>
          {pwa.isInstalled ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--accent-success)',
                fontWeight: '800',
                fontSize: '15px',
              }}
            >
              <CheckCircle2 size={22} />
              <span>이 기기에는 이미 앱으로 설치되어 실행 중입니다!</span>
            </div>
          ) : pwa.canPrompt ? (
            <>
              <div style={{ fontWeight: '900', marginBottom: '6px', fontSize: '16px' }}>
                📲 원터치 앱 설치 준비 완료
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  marginBottom: '12px',
                  lineHeight: 1.5,
                }}
              >
                아래 버튼을 누르면 스마트폰·태블릿 홈 화면과 앱 서랍에{' '}
                <strong style={{ color: 'var(--text-main)' }}>탁구스코어</strong> 전용 앱이
                바로 설치됩니다.
              </div>
              <button className="btn-primary" onClick={handleInstallClick}>
                <Download size={20} />
                <span>이 기기에 앱 바로 설치하기</span>
              </button>
            </>
          ) : (
            <>
              <div style={{ fontWeight: '900', marginBottom: '8px', fontSize: '15px' }}>
                📲 스마트폰·태블릿에 앱으로 설치하는 방법
              </div>
              {!isHttp && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    marginBottom: '10px',
                    color: 'var(--text-main)',
                  }}
                >
                  💡 현재 로컬 HTML 파일(<code>file://</code>)로 열려 있습니다. 아래{' '}
                  <strong>웹앱 주소</strong>로 접속하면 크롬·삼성 인터넷에서 정식 앱 아이콘으로
                  설치할 수 있습니다.
                </div>
              )}
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.65,
                }}
              >
                <div>
                  • <strong style={{ color: 'var(--text-main)' }}>갤럭시 크롬(Chrome)</strong>:
                  우측 상단 <strong>[ ⋮ ]</strong> 메뉴 ➔{' '}
                  <strong style={{ color: 'var(--accent-primary)' }}>
                    [홈 화면에 추가]
                  </strong>{' '}
                  또는 <strong style={{ color: 'var(--accent-primary)' }}>[앱 설치]</strong>
                </div>
                <div style={{ marginTop: '4px' }}>
                  • <strong style={{ color: 'var(--text-main)' }}>삼성 인터넷</strong>: 하단{' '}
                  <strong>[ ≡ ]</strong> 메뉴 ➔ <strong>[현재 페이지 추가]</strong> ➔{' '}
                  <strong style={{ color: 'var(--accent-primary)' }}>[홈 화면]</strong>
                </div>
                <div style={{ marginTop: '4px' }}>
                  • <strong style={{ color: 'var(--text-main)' }}>아이폰/아이패드(Safari)</strong>
                  : 하단 <strong>[공유]</strong> 버튼 ➔{' '}
                  <strong style={{ color: 'var(--accent-primary)' }}>
                    [홈 화면에 추가]
                  </strong>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 2. 동호회 회원 폰에 앱 설치 QR코드로 공유하기 */}
        <div style={{ ...boxStyle, textAlign: 'center', marginBottom: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: '900',
              fontSize: '15px',
              marginBottom: '6px',
            }}
          >
            <Share2 size={18} color="var(--accent-primary)" />
            <span>다른 회원 폰에 앱 설치해 주기 (QR 스캔)</span>
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '10px',
            }}
          >
            회원분들 스마트폰 기본 카메라로 아래 QR코드를 비추면 웹앱이 바로 열리고 설치할 수
            있습니다.
          </div>

          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="앱 설치 QR코드"
              style={{
                width: '190px',
                height: '190px',
                borderRadius: '10px',
                backgroundColor: '#fff',
                padding: '6px',
                marginBottom: '10px',
              }}
            />
          )}

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              value={shareUrl}
              onChange={(e) => setShareUrl(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: '700',
              }}
            />
            <button
              className="btn-secondary"
              onClick={handleCopyUrl}
              style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}
            >
              {copied ? <Check size={16} color="var(--accent-success)" /> : <Copy size={16} />}
              <span>{copied ? '복사됨' : '주소 복사'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
