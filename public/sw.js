// 탁구 풀리그 스코어보드 PWA Service Worker
// - 온라인일 때는 최신 버전을 우선 가져와 캐시를 갱신(Network-First)하므로 UI/UX 수정 시 자동 업데이트됩니다.
// - 오프라인일 때는 캐시된 앱을 반환하여 인터넷 없이도 100% 실행됩니다.

const CACHE_NAME = 'pingpong-pwa-v1';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 외부 도메인(PeerJS 시그널링 등) 요청은 서비스 워커를 거치지 않음
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          return (await caches.match('./index.html')) || (await caches.match('./'));
        }
        return Response.error();
      })
  );
});
