import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 웹 서버(https 또는 localhost)에서 실행될 때 PWA 서비스 워커를 즉시 등록
// (viteSingleFile 인라인 번들에서는 load 이벤트가 이미 지나갔을 수 있으므로 즉시 호출)
if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')
) {
  const registerSw = () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .catch((err) => {
        console.warn('Service Worker registration skipped:', err);
      });
  };
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', registerSw);
  } else {
    registerSw();
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
