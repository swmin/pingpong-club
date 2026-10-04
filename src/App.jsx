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

import { Grid, Calendar } from 'lucide-react';

export default function App() {
  // App States
  const [leagueTitle, setLeagueTitle] = useState('정정회 (정정숙 회장, 정용호 총무)');
  const [players, setPlayers] = useState(PAPER_SAMPLE_PLAYERS);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'schedule'
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Senior Accessibility States
  const [fontScale, setFontScale] = useState(1.0); // Default font scale: 보통 (1.0)
  const [ttsEnabled, setTtsEnabled] = useState(true);
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

  // Apply font scale to root DOM
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontScale);
    document.documentElement.setAttribute('data-theme', 'dark');
  }, [fontScale]);

  // Generate fresh empty schedule when players change
  const handleGenerateNewSchedule = (newPlayers) => {
    const newMatches = generateSchedule(newPlayers);
    setMatches(newMatches);
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
        onResetLeague={handleResetLeague}
      />

      {/* Main Header */}
      <Header
        leagueTitle={leagueTitle}
        setLeagueTitle={setLeagueTitle}
        playersCount={players.length}
        completedMatchesCount={completedCount}
        totalMatchesCount={matches.length}
        onOpenHelp={() => setIsTieBreakerOpen(true)}
      />

      {/* Export Printable Target Area: 1) 참가선수명단, 2) 종이 대진표 (격자표), 3) 실시간 대회 순위표 */}
      <div id="export-area" style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'var(--bg-main)' }}>
        {/* 1) 참가 선수 명단 */}
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
