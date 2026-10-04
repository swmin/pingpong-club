import React, { useState, useEffect } from 'react';
import { PAPER_SAMPLE_PLAYERS, generatePaperSampleMatches } from './utils/sampleData';
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

import { Grid, Calendar } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'schedule'
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
    const savedClubs = localStorage.getItem('tt_clubs_data_v2');
    const savedActiveId = localStorage.getItem('tt_active_club_id');

    if (savedClubs) {
      try {
        const parsedClubs = JSON.parse(savedClubs);
        if (Array.isArray(parsedClubs) && parsedClubs.length > 0) {
          // Ensure sessions exist in each club
          const sanitizedClubs = parsedClubs.map(club => {
            const masterRoster = club.masterRoster || PAPER_SAMPLE_PLAYERS.map(p => ({ ...p, category: 'club', currentDivision: p.division || '7부' }));
            let sessions = club.sessions;

            if (!Array.isArray(sessions) || sessions.length === 0) {
              const defaultSession = {
                id: `s_${Date.now()}`,
                date: club.meetingDate || getTodayISO(),
                players: club.players || PAPER_SAMPLE_PLAYERS,
                matches: club.matches || generatePaperSampleMatches(PAPER_SAMPLE_PLAYERS),
                createdAt: Date.now(),
              };
              sessions = [defaultSession];
            }

            return {
              ...club,
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
        console.error('Failed to parse v2 multi-clubs data', e);
      }
    }

    // Default Club & Initial Session
    const initialSession = {
      id: 's_default',
      date: getTodayISO(),
      players: PAPER_SAMPLE_PLAYERS,
      matches: generatePaperSampleMatches(PAPER_SAMPLE_PLAYERS),
      createdAt: Date.now(),
    };

    const initialClub = {
      id: 'c_default',
      name: '정정회 (정정숙 회장, 정용호 총무)',
      masterRoster: PAPER_SAMPLE_PLAYERS.map(p => ({ ...p, category: 'club', currentDivision: p.division || '7부' })),
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
      localStorage.setItem('tt_clubs_data_v2', JSON.stringify(clubs));
      if (activeClubId) {
        localStorage.setItem('tt_active_club_id', activeClubId);
      }
    }
  }, [clubs, activeClubId]);

  // Apply font scale to root DOM
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontScale);
    document.documentElement.setAttribute('data-theme', 'dark');
  }, [fontScale]);

  // Get current active club
  const activeClub = clubs.find(c => c.id === activeClubId) || clubs[0] || {
    id: 'c_fallback',
    name: '동호회',
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
  const leagueTitle = activeClub.name || '동호회';

  const masterRoster = activeClub.masterRoster || PAPER_SAMPLE_PLAYERS.map(p => ({
    ...p,
    category: p.category || 'club',
    currentDivision: p.currentDivision || p.division || '7부',
  }));

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

  // 1) Create New Club
  const handleCreateClub = (name) => {
    const newClubId = `c_${Date.now()}`;
    const firstSession = {
      id: `s_${Date.now()}`,
      date: getTodayISO(),
      players: PAPER_SAMPLE_PLAYERS,
      matches: generatePaperSampleMatches(PAPER_SAMPLE_PLAYERS),
      createdAt: Date.now(),
    };

    const newClub = {
      id: newClubId,
      name,
      masterRoster: PAPER_SAMPLE_PLAYERS.map(p => ({ ...p, category: 'club', currentDivision: p.division || '7부' })),
      activeSessionId: firstSession.id,
      sessions: [firstSession],
      createdAt: Date.now(),
    };

    setClubs(prev => [...prev, newClub]);
    setActiveClubId(newClubId);
  };

  // 2) Create New Meeting Session (Date Page)
  const handleCreateSession = (newDate) => {
    const newSessionId = `s_${Date.now()}`;
    const initialParticipants = masterRoster.map(p => ({
      id: p.id,
      name: p.name,
      division: p.currentDivision || '7부',
      avatarColor: p.avatarColor || '#3b82f6',
      category: p.category || 'club',
    }));

    const newSession = {
      id: newSessionId,
      date: newDate,
      players: initialParticipants,
      matches: generateSchedule(initialParticipants),
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

  // Reset active session schedule (explicitly reset scores)
  const handleResetLeague = () => {
    if (confirm(`'${meetingDate}' 모임의 현재 경기 기록을 모두 초기화하고 새 대진표를 만드시겠습니까?`)) {
      const freshMatches = generateSchedule(players, []);
      updateActiveSession({ matches: freshMatches });
    }
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
            className={`tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
            onClick={() => setActiveTab('grid')}
          >
            <Grid size={22} />
            <span>종이 대진표 뷰 (격자표)</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar size={22} />
            <span>순서별 경기 진행 뷰</span>
          </button>
        </div>

        {/* 2) 종이 대진표 (격자표) */}
        {activeTab === 'grid' ? (
          <MatrixGridView
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

        {/* 3) 실시간 대회 순위표 & 동호회 통산 누적 순위표 */}
        <RankingTable
          rankings={rankings}
          tieBreakerExplanations={tieBreakerExplanations}
          cumulativeRankings={cumulativeResult.rankings}
          cumulativeTieBreakerExplanations={cumulativeResult.tieBreakerExplanations}
          clubName={leagueTitle}
          sessionsCount={sessions.length}
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
