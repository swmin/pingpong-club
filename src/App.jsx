import React, { useState, useEffect } from 'react';
import { PAPER_SAMPLE_PLAYERS, generatePaperSampleMatches } from './utils/sampleData';
import { generateSchedule, calculateRankings } from './utils/leagueCalculations';

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

import { Grid, Calendar } from 'lucide-react';

export default function App() {
  // Multi-Club States
  const [clubs, setClubs] = useState([]);
  const [activeClubId, setActiveClubId] = useState('');

  // Modals Toggle
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [isSelectClubOpen, setIsSelectClubOpen] = useState(false);
  const [isTieBreakerOpen, setIsTieBreakerOpen] = useState(false);

  // Active View & Score Modal
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'schedule'
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Senior Accessibility States
  const [fontScale, setFontScale] = useState(1.0); // Default font scale: 보통 (1.0)
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Initialize dataset & handle migration to multi-club
  useEffect(() => {
    const savedClubs = localStorage.getItem('tt_clubs_data_v2');
    const savedActiveId = localStorage.getItem('tt_active_club_id');

    if (savedClubs) {
      try {
        const parsedClubs = JSON.parse(savedClubs);
        if (Array.isArray(parsedClubs) && parsedClubs.length > 0) {
          setClubs(parsedClubs);
          setActiveClubId(savedActiveId && parsedClubs.some(c => c.id === savedActiveId) ? savedActiveId : parsedClubs[0].id);
          return;
        }
      } catch (e) {
        console.error('Failed to parse v2 multi-clubs data', e);
      }
    }

    // Migration from v1 single-club data or initialize default club
    let defaultTitle = '정정회 (정정숙 회장, 정용호 총무)';
    let defaultPlayers = PAPER_SAMPLE_PLAYERS;
    let defaultMatches = generatePaperSampleMatches(PAPER_SAMPLE_PLAYERS);

    const legacyV1 = localStorage.getItem('tt_league_data_v1');
    if (legacyV1) {
      try {
        const parsedV1 = JSON.parse(legacyV1);
        if (parsedV1.leagueTitle) defaultTitle = parsedV1.leagueTitle;
        if (parsedV1.players) defaultPlayers = parsedV1.players;
        if (parsedV1.matches) defaultMatches = parsedV1.matches;
      } catch (e) {
        console.error('Failed to parse v1 legacy data', e);
      }
    }

    const initialClub = {
      id: 'c_default',
      name: defaultTitle,
      players: defaultPlayers,
      matches: defaultMatches,
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
    players: [],
    matches: [],
  };

  const players = activeClub.players || [];
  const matches = activeClub.matches || [];
  const leagueTitle = activeClub.name || '동호회';

  // Helper to update active club properties
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

  // 1) Create New Club
  const handleCreateClub = (name) => {
    const newId = `c_${Date.now()}`;
    const newClub = {
      id: newId,
      name,
      players: PAPER_SAMPLE_PLAYERS,
      matches: generatePaperSampleMatches(PAPER_SAMPLE_PLAYERS),
      createdAt: Date.now(),
    };

    setClubs(prev => [...prev, newClub]);
    setActiveClubId(newId);
  };

  // 2) Select Club
  const handleSelectClub = (id) => {
    setActiveClubId(id);
  };

  // 3) Delete Club
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

  // Rename Club Title
  const setLeagueTitle = (newName) => {
    updateActiveClub({ name: newName });
  };

  // Set players list for active club
  const setPlayers = (newPlayers) => {
    updateActiveClub({ players: newPlayers });
  };

  // Generate fresh schedule for active club
  const handleGenerateNewSchedule = (newPlayers) => {
    const newMatches = generateSchedule(newPlayers);
    updateActiveClub({ players: newPlayers, matches: newMatches });
  };

  // Reset active club schedule
  const handleResetLeague = () => {
    if (confirm(`'${leagueTitle}' 동호회의 현재 경기 기록을 모두 초기화하고 새 대진표를 만드시겠습니까?`)) {
      const freshMatches = generateSchedule(players);
      updateActiveClub({ matches: freshMatches });
    }
  };

  // Save match score from ScoreModal
  const handleSaveScore = (updatedMatch) => {
    const nextMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    updateActiveClub({ matches: nextMatches });
    setSelectedMatch(null);
  };

  // Calculate live rankings & tie-breakers for active club
  const { rankings, tieBreakerExplanations } = calculateRankings(players, matches);

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
          playersCount={players.length}
          completedMatchesCount={completedCount}
          totalMatchesCount={matches.length}
          onOpenHelp={() => setIsTieBreakerOpen(true)}
          onOpenCreateModal={() => setIsCreateClubOpen(true)}
          onOpenSelectModal={() => setIsSelectClubOpen(true)}
          clubsCount={clubs.length}
        />

        {/* 1) 참가 선수 명단 */}
        <PlayerManager
          players={players}
          setPlayers={setPlayers}
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
            onSelectMatchCell={setSelectedMatch}
          />
        )}

        {/* 3) 실시간 대회 순위표 */}
        <RankingTable
          rankings={rankings}
          tieBreakerExplanations={tieBreakerExplanations}
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
