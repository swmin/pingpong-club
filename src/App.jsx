import React, { useState, useEffect } from 'react';
import { generateSchedule, calculateRankings, calculateCumulativeRankings } from './utils/leagueCalculations';

import SeniorFontControls from './components/SeniorFontControls';
import Header from './components/Header';
import PlayerManager from './components/PlayerManager';
import MatrixGridView from './components/MatrixGridView';
import ScheduleView from './components/ScheduleView';
import RankingTable from './components/RankingTable';
import ScoreModal from './components/ScoreModal';
import TieBreakerExplainer from './components/TieBreakerExplainer';
import CreateClubModal from './components/CreateClubModal';
import ClubSelectModal from './components/ClubSelectModal';
import CreateSessionModal from './components/CreateSessionModal';
import SessionSelectModal from './components/SessionSelectModal';
import PlayerDrawView from './components/PlayerDrawView';

import { Grid, Calendar, Users } from 'lucide-react';

// Release storage namespace (independent of old dev/test data keys)
const STORAGE_CLUBS_KEY = 'pingpong_release_v1_clubs';
const STORAGE_ACTIVE_KEY = 'pingpong_release_v1_active_club';

// Safe localStorage helper with in-memory fallback for Android WebViews / Galaxy Tab file:// Security Restrictions
const memoryStorage = {};
const safeGetItem = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn('localStorage getItem blocked on this context, using memory fallback', e);
  }
  return memoryStorage[key] || null;
};

const safeSetItem = (key, value) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch (e) {
    console.warn('localStorage setItem blocked on this context, using memory fallback', e);
  }
  memoryStorage[key] = value;
};

export default function App() {
  // Multi-Club States
  const [clubs, setClubs] = useState([]);
  const [activeClubId, setActiveClubId] = useState('');

  // Modals Toggle
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [isSelectClubOpen, setIsSelectClubOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isSelectSessionOpen, setIsSelectSessionOpen] = useState(false);
  const [isTieBreakerOpen, setIsTieBreakerOpen] = useState(false);

  // Active View & Score Modal
  // 'player' | 'schedule' | 'grid' — 좁은 화면(폰 세로)은 선수별 보기, 넓은 화면은 격자표를 기본으로 사용
  const [activeTab, setActiveTab] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 700px)').matches
      ? 'player'
      : 'grid'
  );
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Senior Accessibility States
  const [fontScale, setFontScale] = useState(1.0); // Default font scale: 보통 (1.0)
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Helper to format today's date YYYY-MM-DD
  const getTodayISO = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Initialize dataset & handle migration to multi-club & multi-session
  useEffect(() => {
    // Release build: use a dedicated storage namespace so that any previous
    // development/test data (tt_clubs_data_v2, v3 ...) is never loaded.
    const savedClubs = safeGetItem(STORAGE_CLUBS_KEY);
    const savedActiveId = safeGetItem(STORAGE_ACTIVE_KEY);

    if (savedClubs) {
      try {
        const parsedClubs = JSON.parse(savedClubs);
        if (Array.isArray(parsedClubs) && parsedClubs.length > 0) {
          // Ensure sessions exist in each club and strip any legacy sample name
          const sanitizedClubs = parsedClubs.map(club => {
            const clubName = club.name || '';
            const masterRoster = club.masterRoster || [];
            let sessions = club.sessions;

            if (!Array.isArray(sessions) || sessions.length === 0) {
              const defaultSession = {
                id: `s_${Date.now()}`,
                date: club.meetingDate || getTodayISO(),
                players: [],
                matches: [],
                createdAt: Date.now(),
              };
              sessions = [defaultSession];
            }

            return {
              ...club,
              name: clubName,
              masterRoster,
              sessions,
              activeSessionId: club.activeSessionId && sessions.some(s => s.id === club.activeSessionId) ? club.activeSessionId : sessions[0].id,
            };
          });

          setClubs(sanitizedClubs);
          setActiveClubId(savedActiveId && sanitizedClubs.some(c => c.id === savedActiveId) ? savedActiveId : sanitizedClubs[0].id);
          return;
        }
      } catch (e) {
        console.error('Failed to parse v3 multi-clubs data', e);
      }
    }

    // Check if embedded initial data exists (from exported pre-populated HTML)
    if (window.INITIAL_EMBEDDED_DATA && Array.isArray(window.INITIAL_EMBEDDED_DATA.clubs) && window.INITIAL_EMBEDDED_DATA.clubs.length > 0) {
      const embeddedClubs = window.INITIAL_EMBEDDED_DATA.clubs;
      const embeddedActiveId = window.INITIAL_EMBEDDED_DATA.activeClubId;
      setClubs(embeddedClubs);
      setActiveClubId(embeddedActiveId && embeddedClubs.some(c => c.id === embeddedActiveId) ? embeddedActiveId : embeddedClubs[0].id);
      return;
    }

    // Default Clean Initial Club & Session for Release
    const initialSession = {
      id: 's_default',
      date: getTodayISO(),
      players: [],
      matches: [],
      createdAt: Date.now(),
    };

    const initialClub = {
      id: 'c_default',
      name: '',
      masterRoster: [],
      activeSessionId: initialSession.id,
      sessions: [initialSession],
      createdAt: Date.now(),
    };

    setClubs([initialClub]);
    setActiveClubId(initialClub.id);
  }, []);

  // Sync clubs & active ID to localstorage
  useEffect(() => {
    if (clubs.length > 0) {
      safeSetItem(STORAGE_CLUBS_KEY, JSON.stringify(clubs));
      if (activeClubId) {
        safeSetItem(STORAGE_ACTIVE_KEY, activeClubId);
      }
    }
  }, [clubs, activeClubId]);

  // Factory reset: clears club name, today's participants, player rosters,
  // all clubs and all meeting histories -> clean first-run state.
  const handleFactoryReset = () => {
    if (!confirm('⚠️ 모든 데이터(동호회 목록, 모임 히스토리, 선수 명단, 점수 기록)를 완전히 삭제하고 처음 설치한 상태로 되돌립니다.\n\n필요하면 먼저 [백업 (.json)]을 해 두세요.\n\n정말 전체 초기화하시겠습니까?')) return;
    const now = Date.now();
    const freshSession = { id: `s_${now}`, date: getTodayISO(), players: [], matches: [], createdAt: now };
    const freshClub = { id: `c_${now}`, name: '', masterRoster: [], activeSessionId: freshSession.id, sessions: [freshSession], createdAt: now };
    setClubs([freshClub]);
    setActiveClubId(freshClub.id);
    setSelectedMatch(null);
    alert('✅ 전체 초기화가 완료되었습니다.');
  };

  // Apply font scale to root DOM
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontScale);
    document.documentElement.setAttribute('data-theme', 'dark');
  }, [fontScale]);

  // Get current active club
  const activeClub = clubs.find(c => c.id === activeClubId) || clubs[0] || {
    id: 'c_fallback',
    name: '',
    masterRoster: [],
    sessions: [],
  };

  const sessions = activeClub.sessions || [];
  const activeSession = sessions.find(s => s.id === activeClub.activeSessionId) || sessions[0] || {
    id: 's_fallback',
    date: getTodayISO(),
    players: [],
    matches: [],
  };

  const players = activeSession.players || [];
  const matches = activeSession.matches || [];
  const meetingDate = activeSession.date || getTodayISO();
  const leagueTitle = activeClub.name !== undefined ? activeClub.name : '';

  const masterRoster = activeClub.masterRoster || [];

  // Helper to update active club
  const updateActiveClub = (updater) => {
    setClubs(prevClubs =>
      prevClubs.map(c => {
        if (c.id === activeClub.id) {
          return typeof updater === 'function' ? updater(c) : { ...c, ...updater };
        }
        return c;
      })
    );
  };

  // Helper to update active session inside active club
  const updateActiveSession = (sessionUpdater) => {
    updateActiveClub(club => {
      const updatedSessions = (club.sessions || []).map(s => {
        if (s.id === activeSession.id) {
          return typeof sessionUpdater === 'function' ? sessionUpdater(s) : { ...s, ...sessionUpdater };
        }
        return s;
      });
      return { ...club, sessions: updatedSessions };
    });
  };

  // 1) Create New Club (Resets all rosters & active players to empty)
  const handleCreateClub = (name) => {
    const newClubId = `c_${Date.now()}`;
    const firstSession = {
      id: `s_${Date.now()}`,
      date: getTodayISO(),
      players: [],
      matches: [],
      createdAt: Date.now(),
    };

    const newClub = {
      id: newClubId,
      name,
      masterRoster: [], // Completely reset roster for newly created club
      activeSessionId: firstSession.id,
      sessions: [firstSession],
      createdAt: Date.now(),
    };

    setClubs(prev => [...prev, newClub]);
    setActiveClubId(newClubId);
  };

  // 2) Create New Meeting Session (Resets Today's Participants to empty, preserves master roster)
  const handleCreateSession = (newDate) => {
    const newSessionId = `s_${Date.now()}`;

    const newSession = {
      id: newSessionId,
      date: newDate,
      players: [], // Reset today's participants to empty
      matches: [],
      createdAt: Date.now(),
    };

    updateActiveClub(club => ({
      ...club,
      sessions: [newSession, ...(club.sessions || [])],
      activeSessionId: newSessionId,
    }));
  };

  // Select Meeting Session (Date Page)
  const handleSelectSession = (sessionId) => {
    updateActiveClub({ activeSessionId: sessionId });
  };

  // Delete Meeting Session
  const handleDeleteSession = (sessionId) => {
    if (sessions.length <= 1) {
      alert('동호회에는 최소 1개의 모임 날짜 페이지가 존재해야 합니다.');
      return;
    }
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    const newActiveId = activeSession.id === sessionId ? updatedSessions[0].id : activeSession.id;

    updateActiveClub({
      sessions: updatedSessions,
      activeSessionId: newActiveId,
    });
  };

  // Update date of active session
  const setMeetingDate = (newDate) => {
    updateActiveSession({ date: newDate });
  };

  // Select Club
  const handleSelectClub = (id) => {
    setActiveClubId(id);
  };

  // Delete Club
  const handleDeleteClub = (id) => {
    if (clubs.length <= 1) {
      alert('최소 1개의 동호회가 존재해야 합니다.');
      return;
    }
    const updatedClubs = clubs.filter(c => c.id !== id);
    setClubs(updatedClubs);
    if (activeClubId === id) {
      setActiveClubId(updatedClubs[0].id);
    }
  };

  // Update Master Roster
  const handleUpdateMasterRoster = (newRoster) => {
    updateActiveClub({ masterRoster: newRoster });
  };

  // Toggle Participant Check-in for CURRENT ACTIVE SESSION ONLY
  const handleToggleParticipant = (player) => {
    const isCurrentlyChecked = players.some(p => p.id === player.id);
    let updatedParticipants;
    if (isCurrentlyChecked) {
      updatedParticipants = players.filter(p => p.id !== player.id);
    } else {
      const newParticipant = {
        id: player.id,
        name: player.name,
        division: player.currentDivision || player.division || '7부',
        avatarColor: player.avatarColor || '#3b82f6',
        category: player.category || 'club',
      };
      updatedParticipants = [...players, newParticipant];
    }
    const newMatches = generateSchedule(updatedParticipants, matches);
    updateActiveSession({ players: updatedParticipants, matches: newMatches });
  };

  // Update division for CURRENT ACTIVE SESSION ONLY (Historic Preservation!)
  const handleUpdateParticipantDivision = (playerId, newDivision) => {
    const updatedParticipants = players.map(p => {
      if (p.id === playerId) {
        return { ...p, division: newDivision };
      }
      return p;
    });
    updateActiveSession({ players: updatedParticipants });
  };

  // Rename Club Title
  const setLeagueTitle = (newName) => {
    updateActiveClub({ name: newName });
  };

  // Generate schedule for active session (preserving scores)
  const handleGenerateNewSchedule = (newPlayers) => {
    const newMatches = generateSchedule(newPlayers, matches);
    updateActiveSession({ players: newPlayers, matches: newMatches });
  };

  // Reset active session schedule
  const handleResetLeague = () => {
    if (confirm(`'${meetingDate}' 모임의 현재 경기 기록을 모두 초기화하고 새 대진표를 만드시겠습니까?`)) {
      const freshMatches = generateSchedule(players, []);
      updateActiveSession({ matches: freshMatches });
    }
  };

  // 1) Export HTML containing embedded current data (for OneDrive / Smartphone / Tablet)
  const handleExportEmbeddedHTML = () => {
    const dataPayload = {
      clubs,
      activeClubId,
      exportedAt: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(dataPayload);
    let htmlContent = '<!doctype html>\n' + document.documentElement.outerHTML;

    // Replace or insert embedded script tag
    const embeddedScriptRegex = /<script id="embedded-data">[\s\S]*?<\/script>/gi;
    const newScriptTag = `<script id="embedded-data">\n  window.INITIAL_EMBEDDED_DATA = ${jsonStr};\n</script>`;

    if (embeddedScriptRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(embeddedScriptRegex, newScriptTag);
    } else if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${newScriptTag}\n</head>`);
    } else {
      htmlContent = newScriptTag + '\n' + htmlContent;
    }

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pingpong-club-scoreboard.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`🎉 현재 동호회의 전체 ${sessions.length}개 모임 데이터가 내장된 pingpong-club-scoreboard.html 파일이 다운로드되었습니다!\n\n이 다운로드된 파일(pingpong-club-scoreboard.html)을 원드라이브(OneDrive)에 올리신 후 휴대폰이나 갤럭시탭에서 열면 복원 절차 없이 6회차 기록이 그대로 바로 나타납니다.`);
  };

  // 2) Export JSON Backup File
  const handleExportJSON = () => {
    const dataPayload = {
      clubs,
      activeClubId,
      exportedAt: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(dataPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (leagueTitle || 'pingpong').replace(/[\/\\:*?"<>|]/g, '_');
    link.download = `${meetingDate}_${cleanTitle}_백업.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3) Import JSON Backup File
  const handleImportJSON = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && Array.isArray(parsed.clubs) && parsed.clubs.length > 0) {
          setClubs(parsed.clubs);
          if (parsed.activeClubId) {
            setActiveClubId(parsed.activeClubId);
          }
          alert('✅ 백업 파일의 모임 데이터가 성공적으로 복원되었습니다!');
        } else {
          alert('⚠️ 백업 파일 형식이 올바르지 않습니다.');
        }
      } catch (err) {
        console.error(err);
        alert('❌ 백업 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  // Save match score from ScoreModal
  const handleSaveScore = (updatedMatch) => {
    const nextMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    updateActiveSession({ matches: nextMatches });
    setSelectedMatch(null);
  };

  // Calculate live rankings & tie-breakers for active session
  const { rankings, tieBreakerExplanations } = calculateRankings(players, matches);

  // Calculate cumulative all-time career rankings for active club
  const cumulativeResult = calculateCumulativeRankings(masterRoster, activeClub.sessions || []);

  // Map of ranking by player id for quick matrix header display
  const rankingsMap = {};
  rankings.forEach(r => { rankingsMap[r.id] = r; });

  const completedCount = matches.filter(m => m.status === 'completed' || m.status === 'forfeit').length;

  return (
    <div className="app-container">
      {/* Top Senior Accessibility Control Bar */}
      <SeniorFontControls
        fontScale={fontScale}
        setFontScale={setFontScale}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        onResetLeague={handleResetLeague}
        onExportEmbeddedHTML={handleExportEmbeddedHTML}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onFactoryReset={handleFactoryReset}
      />

      {/* Export Target Container (Captured when clicking 결과저장) */}
      <div id="export-area" style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'var(--bg-main)' }}>
        {/* 맨 위: 모임 이름 & 모임 날짜 헤더 */}
        <Header
          leagueTitle={leagueTitle}
          setLeagueTitle={setLeagueTitle}
          meetingDate={meetingDate}
          setMeetingDate={setMeetingDate}
          playersCount={players.length}
          completedMatchesCount={completedCount}
          totalMatchesCount={matches.length}
          onOpenHelp={() => setIsTieBreakerOpen(true)}
          onOpenCreateModal={() => setIsCreateClubOpen(true)}
          onOpenSelectModal={() => setIsSelectClubOpen(true)}
          onOpenCreateSessionModal={() => setIsCreateSessionOpen(true)}
          onOpenSelectSessionModal={() => setIsSelectSessionOpen(true)}
          clubsCount={clubs.length}
          sessionsCount={sessions.length}
        />

        {/* 1) 3개 카테고리 (동호회/Guest/선수관리) 기반 참가 선수 명단 */}
        <PlayerManager
          masterRoster={masterRoster}
          onUpdateMasterRoster={handleUpdateMasterRoster}
          activeParticipants={players}
          onToggleParticipant={handleToggleParticipant}
          onUpdateParticipantDivision={handleUpdateParticipantDivision}
          onGenerateNewSchedule={handleGenerateNewSchedule}
        />

        {/* View Tabs */}
        <div className="view-tabs" data-html2canvas-ignore="true">
          <button
            className={`tab-btn ${activeTab === 'player' ? 'active' : ''}`}
            onClick={() => setActiveTab('player')}
          >
            <Users size={22} />
            <span>선수별 보기</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar size={22} />
            <span>경기 순서별</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
            onClick={() => setActiveTab('grid')}
          >
            <Grid size={22} />
            <span>격자표</span>
          </button>
        </div>

        {/* 2) 대진표 보기: 선수별(세로 스크롤만) / 경기 순서별 / 종이 대진표(격자표) */}
        {activeTab === 'grid' ? (
          <MatrixGridView
            players={players}
            matches={matches}
            rankingsMap={rankingsMap}
            onSelectMatchCell={setSelectedMatch}
          />
        ) : (
          <>
            <div data-capture-hide="true">
              {activeTab === 'player' ? (
                <PlayerDrawView
                  players={players}
                  matches={matches}
                  rankingsMap={rankingsMap}
                  onSelectMatchCell={setSelectedMatch}
                />
              ) : (
                <ScheduleView
                  players={players}
                  matches={matches}
                  rankingsMap={rankingsMap}
                  onSelectMatchCell={setSelectedMatch}
                />
              )}
            </div>
            {/* 결과 이미지 저장 시에만 보이는 격자표 (화면에는 숨김) */}
            <div data-capture-show="true" style={{ display: 'none' }}>
              <MatrixGridView
                players={players}
                matches={matches}
                rankingsMap={rankingsMap}
                onSelectMatchCell={setSelectedMatch}
              />
            </div>
          </>
        )}

        {/* 3) 실시간 대회 순위표 & 동호회 통산 누적 순위표 */}
        <RankingTable
          rankings={rankings}
          tieBreakerExplanations={tieBreakerExplanations}
          cumulativeRankings={cumulativeResult.rankings}
          cumulativeTieBreakerExplanations={cumulativeResult.tieBreakerExplanations}
          clubName={leagueTitle}
          sessionsCount={sessions.length}
          lastSessionDate={sessions[0]?.date || meetingDate}
          onOpenTieBreakerModal={() => setIsTieBreakerOpen(true)}
        />
      </div>

      {/* Score Input Modal */}
      {selectedMatch && (
        <ScoreModal
          match={selectedMatch}
          players={players}
          onClose={() => setSelectedMatch(null)}
          onSaveScore={handleSaveScore}
          ttsEnabled={ttsEnabled}
        />
      )}

      {/* Create Club Modal Popup */}
      {isCreateClubOpen && (
        <CreateClubModal
          onClose={() => setIsCreateClubOpen(false)}
          onCreateClub={handleCreateClub}
        />
      )}

      {/* Select & Manage Clubs Modal Popup */}
      {isSelectClubOpen && (
        <ClubSelectModal
          clubs={clubs}
          activeClubId={activeClubId}
          onSelectClub={handleSelectClub}
          onOpenCreateModal={() => setIsCreateClubOpen(true)}
          onDeleteClub={handleDeleteClub}
          onClose={() => setIsSelectClubOpen(false)}
        />
      )}

      {/* Create Meeting Session (Date Page) Modal Popup */}
      {isCreateSessionOpen && (
        <CreateSessionModal
          onClose={() => setIsCreateSessionOpen(false)}
          onCreateSession={handleCreateSession}
          clubName={leagueTitle}
        />
      )}

      {/* Select & Manage Sessions (Date Pages) Modal Popup */}
      {isSelectSessionOpen && (
        <SessionSelectModal
          sessions={sessions}
          activeSessionId={activeSession.id}
          onSelectSession={handleSelectSession}
          onOpenCreateSessionModal={() => setIsCreateSessionOpen(true)}
          onDeleteSession={handleDeleteSession}
          onClose={() => setIsSelectSessionOpen(false)}
          clubName={leagueTitle}
        />
      )}

      {/* Tie Breaker Rules Modal */}
      {isTieBreakerOpen && (
        <TieBreakerExplainer
          explanations={tieBreakerExplanations}
          onClose={() => setIsTieBreakerOpen(false)}
        />
      )}
    </div>
  );
}
