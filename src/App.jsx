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

import { Grid, Calendar, Trophy } from 'lucide-react';

export default function App() {
  // App States
  const [leagueTitle, setLeagueTitle] = useState('정정회 (정정숙 회장, 정용호 총무)');
  const [players, setPlayers] = useState(PAPER_SAMPLE_PLAYERS);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'schedule'
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Senior Accessibility States
  const [fontScale, setFontScale] = useState(1.2); // Default to Large for seniors
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [isTieBreakerOpen, setIsTieBreakerOpen] = useState(false);

  // Initialize dataset from localstorage or paper sample
  useEffect(() => {
    const saved = localStorage.getItem('tt_league_data_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.leagueTitle) {
          setLeagueTitle(parsed.leagueTitle === '풀리그 금요 개인전 (번개리그)' ? '정정회 (정정숙 회장, 정용호 총무)' : parsed.leagueTitle);
        }
        if (parsed.players) setPlayers(parsed.players);
        if (parsed.matches) setMatches(parsed.matches);
        return;
      } catch (e) {
        console.error('Failed to parse localstorage data', e);
      }
    }

    // Default to Paper Sample Data
    const defaultMatches = generatePaperSampleMatches(PAPER_SAMPLE_PLAYERS);
    setMatches(defaultMatches);
  }, []);

  // Sync to localstorage
  useEffect(() => {
    if (matches.length > 0) {
      localStorage.setItem('tt_league_data_v1', JSON.stringify({
        leagueTitle,
        players,
        matches,
      }));
    }
  }, [leagueTitle, players, matches]);

  // Apply font scale & theme to root DOM
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontScale);
    document.documentElement.setAttribute('data-theme', theme);
  }, [fontScale, theme]);

  // Generate fresh empty schedule when players change
  const handleGenerateNewSchedule = (newPlayers) => {
    const newMatches = generateSchedule(newPlayers);
    setMatches(newMatches);
  };

  // Load paper sample preset
  const handleLoadPaperSample = () => {
    if (confirm('종이 대진표(1777725049075.jpg)의 샘플 데이터로 복원하시겠습니까?')) {
      setLeagueTitle('정정회 (정정숙 회장, 정용호 총무)');
      setPlayers(PAPER_SAMPLE_PLAYERS);
      const sampleMatches = generatePaperSampleMatches(PAPER_SAMPLE_PLAYERS);
      setMatches(sampleMatches);
    }
  };

  // Reset current league to empty pending matches
  const handleResetLeague = () => {
    if (confirm('현재 경기 기록을 모두 초기화하고 새 대진표를 만드시겠습니까?')) {
      const freshMatches = generateSchedule(players);
      setMatches(freshMatches);
    }
  };

  // Save match score from ScoreModal
  const handleSaveScore = (updatedMatch) => {
    const nextMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    setMatches(nextMatches);
    setSelectedMatch(null);
  };

  // Calculate live rankings & tie-breakers
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
        theme={theme}
        setTheme={setTheme}
        onLoadPaperSample={handleLoadPaperSample}
        onResetLeague={handleResetLeague}
      />

      {/* Main Header & Export */}
      <Header
        leagueTitle={leagueTitle}
        setLeagueTitle={setLeagueTitle}
        playersCount={players.length}
        completedMatchesCount={completedCount}
        totalMatchesCount={matches.length}
        onOpenHelp={() => setIsTieBreakerOpen(true)}
      />

      {/* Player List Manager */}
      <PlayerManager
        players={players}
        setPlayers={setPlayers}
        onGenerateNewSchedule={handleGenerateNewSchedule}
      />

      {/* View Tabs */}
      <div className="view-tabs">
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

      {/* Main Content Area */}
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

      {/* Live Standings Leaderboard */}
      <RankingTable
        rankings={rankings}
        tieBreakerExplanations={tieBreakerExplanations}
        onOpenTieBreakerModal={() => setIsTieBreakerOpen(true)}
      />

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
