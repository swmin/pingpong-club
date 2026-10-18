import { useState, useRef, useEffect } from 'react';
import Peer from 'peerjs';
import { randomDigits } from '../utils/syncMerge';

// 서버 없는 P2P 실시간 동기화 (WebRTC / PeerJS)
// - 방장(host): 4자리 방 번호로 Peer를 열고, 참가자(guest)들의 점수를 모아 전원에게 스냅샷을 방송합니다.
// - 참가자(guest): 방 번호로 방장에 접속해 점수를 보내고, 방장의 스냅샷을 받아 화면에 반영합니다.
// - 연결 중개(시그널링)에만 PeerJS 공개 브로커를 잠깐 사용하고, 점수 데이터는 폰 대 폰으로 직접 전송됩니다.

const PEER_PREFIX = 'ppclub-';
const CLIENT_ID_KEY = 'pingpong_client_id';

// 4G/5G 모바일 데이터 및 Wi-Fi 간 NAT 통과율을 높이기 위한 다중 STUN 서버 설정
const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ],
  },
};

const getClientId = () => {
  try {
    let id = window.localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    if (!getClientId.mem) getClientId.mem = `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    return getClientId.mem;
  }
};

const safeSend = (conn, msg) => {
  try {
    if (conn && conn.open) {
      conn.send(msg);
      return true;
    }
  } catch (e) {
    console.warn('P2P send failed', e);
  }
  return false;
};

/**
 * handlers:
 *  - onMatches(matches)                        [host] 참가자/관리자가 보낸 경기 점수 반영
 *  - onRoster(players, masterRoster)           [host] 관리자가 보낸 선수 명단 반영
 *  - onSnapshot(snapshot, isFirst)             [guest] 방장 스냅샷 반영
 *  - getLocalMatches(target)                   [guest] 재접속 시 내 폰의 경기 점수 전달
 * snapshot: [host] 현재 방 모임 상태 { clubId, clubName, masterRoster, session }
 */
export default function useRoomSync({ snapshot, handlers }) {
  const [role, setRole] = useState('none'); // 'none' | 'host' | 'guest'
  const [status, setStatus] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [participants, setParticipants] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [target, setTarget] = useState(null);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState('');

  const handlersRef = useRef(handlers);
  const snapshotRef = useRef(snapshot);
  const peerRef = useRef(null);
  const connRef = useRef(null); // guest -> host connection
  const hostConnsRef = useRef(new Map()); // clientId -> { conn, name, online }
  const adminsRef = useRef(new Set());
  const pinRef = useRef('');
  const codeRef = useRef('');
  const roleRef = useRef('none');
  const guestRef = useRef({ code: '', name: '', target: null });
  const welcomeTimerRef = useRef(null);

  const snapshotJson = snapshot ? JSON.stringify(snapshot) : '';

  useEffect(() => {
    handlersRef.current = handlers;
    snapshotRef.current = snapshot;
  });

  // ---------- 공통 ----------
  const teardown = () => {
    clearTimeout(welcomeTimerRef.current);
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch (e) { console.warn(e); }
    }
    peerRef.current = null;
    connRef.current = null;
    hostConnsRef.current = new Map();
    adminsRef.current = new Set();
    guestRef.current = { code: '', name: '', target: null };
    roleRef.current = 'none';
    setRole('none');
    setStatus('idle');
    setCode('');
    setPin('');
    setParticipants([]);
    setIsAdmin(false);
    setTarget(null);
    setError('');
    setPinError('');
  };

  // ---------- 방장(host) ----------
  const pushParticipants = () => {
    const list = [...hostConnsRef.current.entries()].map(([clientId, c]) => ({
      clientId,
      name: c.name,
      online: c.online,
      isAdmin: adminsRef.current.has(clientId),
    }));
    setParticipants(list);
    hostConnsRef.current.forEach((c) => {
      if (c.online) safeSend(c.conn, { type: 'participants', list });
    });
  };

  const handleHostMsg = (conn, msg) => {
    if (!msg || typeof msg !== 'object') return;
    const cid = conn.__clientId;

    if (msg.type === 'hello') {
      const clientId = String(msg.clientId || conn.peer);
      const prev = hostConnsRef.current.get(clientId);
      if (prev && prev.conn !== conn) {
        try { prev.conn.close(); } catch (e) { console.warn(e); }
      }
      conn.__clientId = clientId;
      hostConnsRef.current.set(clientId, { conn, name: String(msg.name || '참가자').slice(0, 20), online: true });
      if (Array.isArray(msg.matches) && msg.matches.length > 0) {
        handlersRef.current.onMatches(msg.matches);
      }
      safeSend(conn, { type: 'welcome', snapshot: snapshotRef.current, isAdmin: adminsRef.current.has(clientId) });
      pushParticipants();
      return;
    }
    if (!cid) return;

    if (msg.type === 'score' && msg.match) {
      handlersRef.current.onMatches([msg.match]);
    } else if (msg.type === 'roster') {
      if (adminsRef.current.has(cid)) {
        handlersRef.current.onRoster(
          Array.isArray(msg.players) ? msg.players : null,
          Array.isArray(msg.masterRoster) ? msg.masterRoster : null
        );
      }
    } else if (msg.type === 'pin') {
      if (String(msg.pin) === pinRef.current) {
        adminsRef.current.add(cid);
        safeSend(conn, { type: 'role', isAdmin: true });
        pushParticipants();
      } else {
        safeSend(conn, { type: 'pin-result', ok: false });
      }
    }
  };

  const openHostPeer = (roomCode, attempt) => {
    const peer = new Peer(PEER_PREFIX + roomCode, PEER_CONFIG);
    peerRef.current = peer;
    codeRef.current = roomCode;
    peer.on('open', () => setStatus('connected'));
    peer.on('connection', (conn) => {
      conn.on('data', (msg) => handleHostMsg(conn, msg));
      conn.on('close', () => {
        const id = conn.__clientId;
        const entry = id && hostConnsRef.current.get(id);
        if (entry && entry.conn === conn) {
          entry.online = false;
          pushParticipants();
        }
      });
    });
    peer.on('disconnected', () => {
      setStatus('reconnecting');
      try { peer.reconnect(); } catch (e) { console.warn(e); }
    });
    peer.on('error', (err) => {
      if (err.type === 'unavailable-id' && attempt < 5) {
        try { peer.destroy(); } catch (e) { console.warn(e); }
        const nextCode = randomDigits(4);
        setCode(nextCode);
        openHostPeer(nextCode, attempt + 1);
      } else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
        setStatus('reconnecting');
      } else if (err.type !== 'peer-unavailable') {
        setError('방을 만들 수 없습니다. 인터넷 연결을 확인해 주세요.');
        setStatus('error');
      }
    });
  };

  const startHost = () => {
    teardown();
    const newCode = randomDigits(4);
    const newPin = randomDigits(4);
    pinRef.current = newPin;
    roleRef.current = 'host';
    setRole('host');
    setCode(newCode);
    setPin(newPin);
    setStatus('connecting');
    openHostPeer(newCode, 0);
  };

  const setAdmin = (clientId, value) => {
    if (value) adminsRef.current.add(clientId);
    else adminsRef.current.delete(clientId);
    const entry = hostConnsRef.current.get(clientId);
    if (entry) safeSend(entry.conn, { type: 'role', isAdmin: value });
    pushParticipants();
  };

  // 방장: 상태가 바뀔 때마다 전원에게 스냅샷 방송
  useEffect(() => {
    if (role !== 'host' || !snapshotJson) return;
    hostConnsRef.current.forEach((c) => {
      if (c.online) safeSend(c.conn, { type: 'snapshot', snapshot: snapshotRef.current });
    });
  }, [role, snapshotJson]);

  // ---------- 참가자(guest) ----------
  const handleGuestMsg = (msg) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'welcome') {
      clearTimeout(welcomeTimerRef.current);
      const isFirst = !guestRef.current.target;
      const s = msg.snapshot;
      if (s && s.session) {
        guestRef.current.target = { clubId: s.clubId, sessionId: s.session.id };
        setTarget(guestRef.current.target);
        handlersRef.current.onSnapshot(s, isFirst);
      }
      setIsAdmin(!!msg.isAdmin);
      setError('');
      setStatus('connected');
    } else if (msg.type === 'snapshot') {
      if (msg.snapshot && msg.snapshot.session) handlersRef.current.onSnapshot(msg.snapshot, false);
    } else if (msg.type === 'role') {
      setIsAdmin(!!msg.isAdmin);
      setPinError('');
    } else if (msg.type === 'pin-result' && !msg.ok) {
      setPinError('관리자 번호가 맞지 않습니다.');
    } else if (msg.type === 'participants') {
      setParticipants(Array.isArray(msg.list) ? msg.list : []);
    }
  };

  const connectGuest = () => {
    const { code: roomCode, name } = guestRef.current;
    if (!roomCode) return;
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch (e) { console.warn(e); }
    }
    const peer = new Peer(PEER_CONFIG);
    peerRef.current = peer;
    peer.on('open', () => {
      const conn = peer.connect(PEER_PREFIX + roomCode, { reliable: true });
      connRef.current = conn;
      conn.on('open', () => {
        const localMatches = handlersRef.current.getLocalMatches(guestRef.current.target) || [];
        safeSend(conn, { type: 'hello', clientId: getClientId(), name, matches: localMatches });
      });
      conn.on('data', handleGuestMsg);
      conn.on('close', () => {
        if (roleRef.current === 'guest') setStatus('reconnecting');
      });
      clearTimeout(welcomeTimerRef.current);
      welcomeTimerRef.current = setTimeout(() => {
        if (roleRef.current === 'guest' && !guestRef.current.target) {
          setError('방에 연결하지 못했습니다. 방 번호를 확인해 주세요.');
          setStatus('error');
        }
      }, 12000);
    });
    peer.on('error', (err) => {
      if (roleRef.current !== 'guest') return;
      if (err.type === 'peer-unavailable') {
        if (!guestRef.current.target) {
          setError('해당 방 번호를 찾을 수 없습니다. 번호를 다시 확인해 주세요.');
          setStatus('error');
        } else {
          setStatus('reconnecting');
        }
      } else {
        setStatus('reconnecting');
      }
    });
  };

  const join = (roomCode, name) => {
    teardown();
    roleRef.current = 'guest';
    guestRef.current = { code: roomCode, name: name || '참가자', target: null };
    setRole('guest');
    setCode(roomCode);
    setStatus('connecting');
    connectGuest();
  };

  const sendScore = (match) => safeSend(connRef.current, { type: 'score', match });
  const sendRoster = (players, masterRoster) =>
    safeSend(connRef.current, { type: 'roster', players, masterRoster });
  const sendPin = (value) => {
    setPinError('');
    return safeSend(connRef.current, { type: 'pin', pin: value });
  };

  // ---------- 화면 복귀/네트워크 복구 시 자동 재연결 ----------
  useEffect(() => {
    const recover = () => {
      if (document.hidden) return;
      if (roleRef.current === 'guest') {
        const conn = connRef.current;
        if (!conn || !conn.open) connectGuest();
      } else if (roleRef.current === 'host' && peerRef.current) {
        const peer = peerRef.current;
        if (peer.destroyed) openHostPeer(codeRef.current, 0);
        else if (peer.disconnected) {
          try { peer.reconnect(); } catch (e) { console.warn(e); }
        }
      }
    };
    document.addEventListener('visibilitychange', recover);
    window.addEventListener('online', recover);
    const timer = setInterval(() => {
      if (document.hidden) return;
      if (roleRef.current === 'guest' && guestRef.current.target) {
        const conn = connRef.current;
        if (!conn || !conn.open) connectGuest();
      } else if (roleRef.current === 'host' && peerRef.current && peerRef.current.disconnected) {
        try { peerRef.current.reconnect(); } catch (e) { console.warn(e); }
      }
    }, 6000);
    return () => {
      document.removeEventListener('visibilitychange', recover);
      window.removeEventListener('online', recover);
      clearInterval(timer);
    };
  }, []);

  // 언마운트 시 정리
  useEffect(() => () => {
    clearTimeout(welcomeTimerRef.current);
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch (e) { console.warn(e); }
    }
  }, []);

  return {
    role,
    status,
    code,
    pin,
    participants,
    isAdmin,
    target,
    error,
    pinError,
    startHost,
    join,
    leave: teardown,
    setAdmin,
    sendScore,
    sendRoster,
    sendPin,
  };
}
