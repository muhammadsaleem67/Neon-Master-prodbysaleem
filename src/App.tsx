import React, { useEffect, useRef, useState } from 'react';
import { NeonGame, GameScreen } from './game/engine.ts';
import { sounds } from './game/audio.ts';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Pause,
  Zap,
  Shield,
  Clock,
  Sparkles,
  HelpCircle,
  Trophy,
  Target,
  Heart,
  ChevronRight,
  User,
  Globe,
  Github,
  Linkedin,
  Mail,
  X,
  Eye,
} from 'lucide-react';

// Developer details configuration
const DEVELOPER = {
  name: "Muhammad Saleem",
  title: "Game Developer",
  linkedin: "https://www.linkedin.com/in/muhammad-saleem-junejo",
  github: "https://github.com/muhammadsaleem67",
  email: "busiwithsaleem@gmail.com",
  website: "www.downloadpdf.sainazeemtech.com"
};

export interface LeaderboardEntry {
  name: string;
  score: number;
  wave: number;
  timestamp?: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<NeonGame | null>(null);

  const [screen, setScreen] = useState<GameScreen>('title');
  const [isMuted, setIsMuted] = useState(sounds.isMuted);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);

  // Player Name
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('neon_player_name') || '');
  const [nameInputVal, setNameInputVal] = useState('');
  const [nameError, setNameError] = useState('');

  // Counters
  const [viewsCount, setViewsCount] = useState(142);
  const [playsCount, setPlaysCount] = useState(85);

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // High-frequency HUD reactive updates
  const [hudState, setHudState] = useState({
    hp: 100,
    maxHp: 100,
    lives: 3,
    score: 0,
    highScore: 0,
    wave: 1,
    combo: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    dashCooldownRemaining: 0,
    dashCooldownMax: 2.2,
    hasShield: false,
    rapidTime: 0,
    tripleTime: 0,
    slowmoTime: 0,
    autoFire: true,
  });

  // End-of-run snapshot stats
  const [gameOverStats, setGameOverStats] = useState({
    score: 0,
    highScore: 0,
    wave: 1,
    enemies: 0,
    time: 0,
    isNewHigh: false,
  });

  const loadLocalLeaderboard = () => {
    try {
      const local = JSON.parse(localStorage.getItem('neon_leaderboard_local') || '[]');
      if (local && local.length > 0) {
        setLeaderboard(local.slice(0, 10));
        return;
      }
    } catch {
      // ignore
    }
    setLeaderboard([
      { name: "CYBER_ACE", score: 18500, wave: 11 },
      { name: "VORTEX_99", score: 14200, wave: 9 },
      { name: "NEON_VIPER", score: 9800, wave: 7 },
      { name: "SOLARIS", score: 6400, wave: 5 },
      { name: "SYNTH_GHOST", score: 4100, wave: 4 }
    ]);
  };

  const saveScoreToLeaderboard = (scoreVal: number, waveVal: number) => {
    const entry: LeaderboardEntry = {
      name: playerName || 'ANONYMOUS',
      score: scoreVal,
      wave: waveVal,
      timestamp: Date.now()
    };
    try {
      const local = JSON.parse(localStorage.getItem('neon_leaderboard_local') || '[]');
      local.push(entry);
      local.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score);
      const top = local.slice(0, 20);
      localStorage.setItem('neon_leaderboard_local', JSON.stringify(top));
      setLeaderboard(top.slice(0, 10));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Record view once per session
    if (!sessionStorage.getItem('neon_master_session_visited')) {
      sessionStorage.setItem('neon_master_session_visited', 'true');
      const v = parseInt(localStorage.getItem('neon_local_views') || '142', 10) + 1;
      localStorage.setItem('neon_local_views', String(v));
      setViewsCount(v);
    } else {
      const v = parseInt(localStorage.getItem('neon_local_views') || '142', 10);
      setViewsCount(v);
    }

    const p = parseInt(localStorage.getItem('neon_local_plays') || '85', 10);
    setPlaysCount(p);

    loadLocalLeaderboard();

    if (!canvasRef.current) return;

    const game = new NeonGame(canvasRef.current, (newScreen) => {
      setScreen(newScreen);
      if (newScreen === 'gameover') {
        const isNewHigh = game.score >= game.highScore && game.score > 0;
        setGameOverStats({
          score: game.score,
          highScore: game.highScore,
          wave: game.wave,
          enemies: game.enemiesDefeated,
          time: Math.floor(game.runTime),
          isNewHigh,
        });
        saveScoreToLeaderboard(game.score, game.wave);
      }
    });
    gameRef.current = game;
    game.startLoop();

    // Check ?autostart=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      game.startGame();
    }

    const hudInterval = setInterval(() => {
      if (gameRef.current) {
        const g = gameRef.current;
        setHudState({
          hp: g.stats.hp,
          maxHp: g.stats.maxHp,
          lives: g.stats.lives,
          score: g.score,
          highScore: g.highScore,
          wave: g.wave,
          combo: g.combo,
          comboMultiplier: g.comboMultiplier,
          comboTimer: g.comboTimer,
          dashCooldownRemaining: g.player.dashTimer,
          dashCooldownMax: g.stats.dashCooldown,
          hasShield: g.player.hasShield,
          rapidTime: Math.ceil(g.player.powerups.rapid),
          tripleTime: Math.ceil(g.player.powerups.triple),
          slowmoTime: Math.ceil(g.player.powerups.slowmo),
          autoFire: g.player.autoFire,
        });
      }
    }, 80);

    return () => {
      clearInterval(hudInterval);
      game.stopLoop();
    };
  }, []);

  const handleLaunchGame = () => {
    if (!playerName) {
      setNameInputVal('');
      setNameError('');
      setShowNameModal(true);
      return;
    }
    if (gameRef.current) {
      const p = parseInt(localStorage.getItem('neon_local_plays') || '85', 10) + 1;
      localStorage.setItem('neon_local_plays', String(p));
      setPlaysCount(p);
      gameRef.current.startGame();
    }
  };

  const handleNameFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInputVal.trim();
    if (!trimmed) {
      setNameError('Pilot callsign is required.');
      return;
    }
    if (!/^[a-zA-Z0-9_ ]+$/.test(trimmed)) {
      setNameError('Letters, numbers, spaces & underscores only.');
      return;
    }
    if (trimmed.length > 15) {
      setNameError('Maximum 15 characters allowed.');
      return;
    }
    setPlayerName(trimmed);
    localStorage.setItem('neon_player_name', trimmed);
    setShowNameModal(false);
    if (gameRef.current) {
      const p = parseInt(localStorage.getItem('neon_local_plays') || '85', 10) + 1;
      localStorage.setItem('neon_local_plays', String(p));
      setPlaysCount(p);
      gameRef.current.startGame();
    }
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleAutoFire = () => {
    if (gameRef.current) {
      gameRef.current.triggerAutoFireToggle();
    }
  };

  const handleDashClick = () => {
    if (gameRef.current && gameRef.current.screen === 'playing') {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    }
  };

  const handlePauseToggle = () => {
    if (gameRef.current) {
      if (screen === 'playing') {
        gameRef.current.setScreen('paused');
      } else if (screen === 'paused') {
        gameRef.current.setScreen('playing');
      }
    }
  };

  const handleChooseUpgrade = (index: number) => {
    if (gameRef.current) {
      gameRef.current.chooseUpgrade(index);
    }
  };

  const healthPercent = Math.max(0, Math.min(100, (hudState.hp / hudState.maxHp) * 100));
  const dashPercent = hudState.dashCooldownMax > 0 
    ? Math.max(0, Math.min(100, (1 - hudState.dashCooldownRemaining / hudState.dashCooldownMax) * 100))
    : 100;
  const comboPercent = Math.max(0, Math.min(100, (hudState.comboTimer / 2.5) * 100));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060611] text-white font-mono select-none">
      {/* 60 FPS HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        className="absolute inset-0 w-full h-full cursor-crosshair block"
      />

      {/* Low-Occlusion HUD Overlay */}
      {screen === 'playing' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5 md:p-6 z-10">
          {/* Top Bar Status Clusters */}
          <div className="flex items-start justify-between w-full gap-1.5 md:gap-4">
            {/* Cluster 1: Vitality & Pilot Callsign */}
            <div className="flex flex-col gap-1.5 bg-black/75 border border-cyan-500/30 p-2 md:p-3 rounded-lg shadow-[0_0_15px_rgba(0,243,255,0.15)] min-w-[130px] md:min-w-[190px] pointer-events-auto">
              <div className="flex items-center justify-between text-[9px] md:text-[10px] font-bold">
                <span className="text-yellow-400 truncate max-w-[80px] md:max-w-[110px]" title={playerName || 'PILOT'}>
                  {playerName || 'PILOT'}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((lifeIdx) => (
                    <div
                      key={lifeIdx}
                      className={`w-3 h-3 md:w-3.5 md:h-3.5 flex items-center justify-center transition-all ${
                        lifeIdx <= hudState.lives
                          ? 'text-cyan-400 drop-shadow-[0_0_6px_#00f3ff]'
                          : 'text-gray-700 opacity-40'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
                        <path d="M12 2L4 20l8-4 8 4z" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Bar */}
              <div>
                <div className="flex justify-between text-[10px] md:text-[11px] font-bold mb-0.5">
                  <span className="text-pink-500 flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5 md:w-3 md:h-3 fill-pink-500" /> HP
                  </span>
                  <span className="tabular-nums text-pink-400">
                    {Math.round(hudState.hp)}/{hudState.maxHp}
                  </span>
                </div>
                <div className="w-full h-2 md:h-2.5 bg-black/80 rounded-sm border border-pink-500/40 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-pink-600 to-rose-400 transition-all duration-100 shadow-[0_0_8px_#ff0055]"
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>
              </div>

              {/* Dash Cooldown Bar */}
              <div>
                <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-cyan-300 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 text-cyan-400" /> DASH
                  </span>
                  <span>{hudState.dashCooldownRemaining <= 0 ? 'READY' : `${hudState.dashCooldownRemaining.toFixed(1)}s`}</span>
                </div>
                <div className="w-full h-1.5 bg-black/80 rounded-sm border border-cyan-500/40 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      hudState.dashCooldownRemaining <= 0
                        ? 'bg-cyan-400 shadow-[0_0_8px_#00f3ff]'
                        : 'bg-cyan-700'
                    }`}
                    style={{ width: `${dashPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cluster 2: Active Power-Ups & Wave */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="bg-black/80 border border-cyan-400/40 px-3 md:px-5 py-1 md:py-1.5 rounded-full shadow-[0_0_12px_rgba(0,243,255,0.2)]">
                <span className="text-xs md:text-base font-extrabold text-cyan-300 tracking-wider">
                  WAVE <span className="text-yellow-400 text-sm md:text-lg tabular-nums">{hudState.wave}</span>
                </span>
              </div>

              {/* Power-up Badges */}
              <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center max-w-[140px] md:max-w-none">
                {hudState.hasShield && (
                  <div className="flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 bg-cyan-950/80 border border-cyan-400 rounded text-[9px] md:text-xs text-cyan-300 shadow-[0_0_8px_#00d8ff] animate-pulse">
                    <Shield className="w-3 h-3" /> SHIELD
                  </div>
                )}
                {hudState.rapidTime > 0 && (
                  <div className="flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 bg-yellow-950/80 border border-yellow-400 rounded text-[9px] md:text-xs text-yellow-300 shadow-[0_0_8px_#ffe600]">
                    <Zap className="w-3 h-3" /> RAPID {hudState.rapidTime}s
                  </div>
                )}
                {hudState.tripleTime > 0 && (
                  <div className="flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 bg-green-950/80 border border-green-400 rounded text-[9px] md:text-xs text-green-300 shadow-[0_0_8px_#39ff14]">
                    <Sparkles className="w-3 h-3" /> TRIPLE {hudState.tripleTime}s
                  </div>
                )}
                {hudState.slowmoTime > 0 && (
                  <div className="flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 bg-purple-950/80 border border-purple-400 rounded text-[9px] md:text-xs text-purple-300 shadow-[0_0_8px_#bd00ff]">
                    <Clock className="w-3 h-3" /> SLOW {hudState.slowmoTime}s
                  </div>
                )}
              </div>
            </div>

            {/* Cluster 3: Score, Combo & Utilities */}
            <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
              <div className="flex items-center gap-1 md:gap-2">
                <button
                  type="button"
                  onClick={handleToggleAutoFire}
                  className={`px-1.5 md:px-2.5 py-0.5 md:py-1 text-[10px] md:text-xs border rounded transition-colors ${
                    hudState.autoFire
                      ? 'border-yellow-400/80 text-yellow-300 bg-yellow-950/40 shadow-[0_0_8px_rgba(255,230,0,0.3)]'
                      : 'border-gray-600 text-gray-400 bg-black/60'
                  }`}
                  title="Toggle Auto-Fire"
                >
                  AUTO
                </button>
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-black/60 border border-cyan-500/40 rounded text-cyan-400 hover:text-cyan-200 transition-colors shadow-[0_0_8px_rgba(0,243,255,0.2)] cursor-pointer"
                  title="Toggle Mute (M)"
                  aria-label="Toggle Mute"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-400" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handlePauseToggle}
                  className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center bg-black/60 border border-cyan-500/40 rounded text-cyan-400 hover:text-cyan-200 transition-colors shadow-[0_0_8px_rgba(0,243,255,0.2)] cursor-pointer"
                  title="Pause Game (P / Esc)"
                  aria-label="Pause Game"
                >
                  <Pause className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>

              {/* Score Box */}
              <div className="bg-black/75 border border-cyan-500/30 p-1.5 md:p-2.5 rounded-lg shadow-[0_0_15px_rgba(0,243,255,0.15)] text-right min-w-[100px] md:min-w-[140px]">
                <div className="text-[9px] md:text-[10px] text-gray-400 font-bold">SCORE</div>
                <div className="text-base md:text-2xl font-black text-cyan-300 tabular-nums drop-shadow-[0_0_8px_#00f3ff]">
                  {hudState.score.toLocaleString()}
                </div>
                <div className="text-[9px] md:text-[10px] text-yellow-400/80 flex items-center justify-end gap-1 mt-0.5">
                  <Trophy className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-400" /> {hudState.highScore.toLocaleString()}
                </div>
              </div>

              {/* Combo Multiplier Meter */}
              {hudState.comboMultiplier > 1 && (
                <div className="bg-black/70 border border-pink-500/50 px-2.5 py-1 rounded-lg text-right shadow-[0_0_12px_rgba(255,0,85,0.3)] animate-pulse">
                  <div className="text-xs md:text-sm font-black text-pink-400 tracking-wider">
                    COMBO <span className="text-yellow-300">x{hudState.comboMultiplier}</span>
                  </div>
                  <div className="w-20 md:w-24 h-1 md:h-1.5 bg-black rounded-sm border border-pink-500/40 overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-pink-500 shadow-[0_0_6px_#ff0055]"
                      style={{ width: `${comboPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile On-Screen Action Buttons */}
          <div className="pointer-events-auto flex items-end justify-between w-full md:hidden">
            <div className="text-[10px] text-cyan-400/60 bg-black/40 px-2 py-1 rounded border border-cyan-500/20">
              DRAG LEFT TO MOVE
            </div>
            <button
              type="button"
              onClick={handleDashClick}
              disabled={hudState.dashCooldownRemaining > 0}
              className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold text-xs border-2 shadow-lg transition-transform active:scale-95 ${
                hudState.dashCooldownRemaining <= 0
                  ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_15px_#00f3ff]'
                  : 'border-gray-700 bg-black/60 text-gray-500 opacity-60'
              }`}
            >
              <Zap className="w-5 h-5 mb-0.5" />
              DASH
            </button>
          </div>
        </div>
      )}

      {/* Screen 1: TITLE SCREEN */}
      {screen === 'title' && (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-4 md:p-10 z-20 bg-gradient-to-b from-transparent via-black/40 to-black/85 overflow-y-auto">
          {/* Top Bar Views & Utilities */}
          <div className="w-full flex justify-between items-center max-w-5xl text-xs">
            <div className="flex items-center gap-3 text-gray-400">
              <span className="flex items-center gap-1 text-cyan-300">
                <Eye className="w-3.5 h-3.5 text-cyan-400" /> Views: <b className="text-white">{viewsCount.toLocaleString()}</b>
              </span>
              <span className="text-gray-500">·</span>
              <span className="flex items-center gap-1 text-yellow-300">
                Plays: <b className="text-white">{playsCount.toLocaleString()}</b>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLeaderboardModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-black/60 border border-yellow-500/40 rounded text-xs text-yellow-400 hover:text-white transition-all shadow-[0_0_10px_rgba(255,230,0,0.15)] cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5" /> LEADERBOARD
              </button>
              <button
                type="button"
                onClick={() => setShowHowToPlay(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-black/60 border border-cyan-500/40 rounded text-xs text-cyan-300 hover:text-white transition-all shadow-[0_0_10px_rgba(0,243,255,0.15)] cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" /> MANUAL
              </button>
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1.5 bg-black/60 border border-cyan-500/40 rounded text-cyan-400 hover:text-white transition-all shadow-[0_0_10px_rgba(0,243,255,0.15)] cursor-pointer"
                title="Toggle Sound"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-pink-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Central Hero Lockup */}
          <div className="flex flex-col items-center text-center my-auto max-w-lg w-full">
            <div className="relative mb-4">
              <svg viewBox="0 0 460 110" className="w-[280px] sm:w-[380px] md:w-[440px] h-auto drop-shadow-[0_0_25px_#00f3ff]">
                <defs>
                  <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00f3ff" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#ff0055" />
                  </linearGradient>
                </defs>
                <polygon points="15,10 445,10 435,100 25,100" fill="rgba(8,12,28,0.75)" stroke="#00f3ff" strokeWidth="2.5" />
                <line x1="30" y1="20" x2="430" y2="20" stroke="rgba(255,0,85,0.6)" strokeWidth="1.5" />
                <line x1="35" y1="90" x2="425" y2="90" stroke="rgba(0,243,255,0.6)" strokeWidth="1.5" />
                <text
                  x="230"
                  y="68"
                  textAnchor="middle"
                  fill="url(#neonGrad)"
                  fontSize="48"
                  fontWeight="900"
                  letterSpacing="6"
                  fontFamily="monospace"
                  style={{ textShadow: '0 0 15px #00f3ff, 0 0 30px #ff0055' }}
                >
                  NEON MASTER
                </text>
              </svg>
            </div>

            <p className="text-gray-300 text-xs md:text-sm tracking-wider mb-5">
              Endless Waves · Synthwave Cyber Arena · Roguelite Upgrades
            </p>

            {/* Callsign Bar */}
            <div className="w-full bg-cyan-950/40 border border-cyan-400/40 rounded-lg p-2.5 mb-5 flex items-center justify-between shadow-[0_0_15px_rgba(0,243,255,0.15)]">
              <div className="text-left text-xs">
                <span className="text-gray-400">PILOT: </span>
                <span className="text-yellow-400 font-bold tracking-wider">{playerName || 'UNREGISTERED'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNameInputVal(playerName);
                  setNameError('');
                  setShowNameModal(true);
                }}
                className="px-2.5 py-1 text-[11px] font-bold border border-cyan-400 text-cyan-300 rounded hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer"
              >
                {playerName ? 'CHANGE NAME' : 'SET NAME'}
              </button>
            </div>

            {/* Launch CTA */}
            <button
              type="button"
              data-start="true"
              onClick={handleLaunchGame}
              className="group w-full py-4 bg-cyan-500/10 border-2 border-cyan-400 text-cyan-300 hover:text-white hover:bg-cyan-400/25 rounded-md font-black text-lg md:text-xl tracking-widest shadow-[0_0_25px_rgba(0,243,255,0.5)] hover:shadow-[0_0_40px_rgba(0,243,255,0.8)] transition-all cursor-pointer flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5 fill-current text-cyan-400 group-hover:scale-110 transition-transform" />
              ENTER THE ARENA
              <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary Option: Developer Info */}
            <button
              type="button"
              onClick={() => setShowDevModal(true)}
              className="mt-3 text-xs text-gray-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" /> About Developer
            </button>

            {hudState.highScore > 0 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-yellow-400 bg-black/60 border border-yellow-500/40 px-3.5 py-1 rounded-full shadow-[0_0_12px_rgba(255,230,0,0.25)]">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                HIGH SCORE: <span className="font-bold tabular-nums">{hudState.highScore.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Footer with Developer credit */}
          <div className="w-full text-center text-xs text-gray-400 tracking-wider flex flex-col gap-1">
            <div>WASD Move · Mouse Aim & Shoot · Space Dash · P Pause · M Mute</div>
            <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-800">
              Made with ♥ by <span className="text-cyan-400 font-bold">{DEVELOPER.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* PLAYER NAME MODAL */}
      {showNameModal && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-40">
          <div className="bg-black/95 border-2 border-cyan-400 rounded-xl p-6 md:p-8 max-w-sm w-full text-center shadow-[0_0_35px_rgba(0,243,255,0.35)]">
            <h2 className="text-xl md:text-2xl font-black text-cyan-300 tracking-wider mb-2 drop-shadow-[0_0_10px_#00f3ff]">
              ENTER YOUR NAME
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Identify yourself for global records (max 15 characters).
            </p>

            <form onSubmit={handleNameFormSubmit}>
              <input
                type="text"
                maxLength={15}
                value={nameInputVal}
                onChange={(e) => setNameInputVal(e.target.value)}
                placeholder="PILOT CALLSIGN"
                autoFocus
                className="w-full px-4 py-3 bg-black/80 border-2 border-cyan-400 rounded-lg text-white font-mono text-center tracking-widest text-base outline-none shadow-[inset_0_0_10px_rgba(0,243,255,0.3)] focus:border-yellow-400 transition-colors"
              />
              {nameError && (
                <div className="text-xs text-pink-500 mt-2 font-bold">{nameError}</div>
              )}

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-black font-black tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] cursor-pointer"
              >
                CONFIRM & LAUNCH
              </button>

              {playerName && (
                <button
                  type="button"
                  onClick={() => setShowNameModal(false)}
                  className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* LEADERBOARD MODAL */}
      {showLeaderboardModal && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-40">
          <div className="bg-black/95 border-2 border-cyan-400 rounded-xl p-6 md:p-8 max-w-md w-full shadow-[0_0_35px_rgba(0,243,255,0.3)] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-black text-cyan-300 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" /> TOP 10 PILOTS
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded border border-yellow-500/50 bg-yellow-500/10 text-yellow-400">
                Offline Mode (Local)
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto mb-4">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-cyan-500/30 text-gray-400">
                    <th className="py-1.5 px-2">#</th>
                    <th className="py-1.5 px-2">PILOT</th>
                    <th className="py-1.5 px-2">WAVE</th>
                    <th className="py-1.5 px-2 text-right">SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-gray-800 ${
                        item.name === playerName ? 'bg-cyan-500/10 text-yellow-300 font-bold' : 'text-gray-300'
                      }`}
                    >
                      <td className="py-2 px-2 text-cyan-400 font-bold">#{idx + 1}</td>
                      <td className="py-2 px-2 font-medium">
                        {item.name}
                        {item.name === playerName && <span className="ml-1 text-[9px] text-yellow-400">[YOU]</span>}
                      </td>
                      <td className="py-2 px-2 text-gray-400">W{item.wave}</td>
                      <td className="py-2 px-2 text-right text-cyan-300 font-bold tabular-nums">
                        {item.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => setShowLeaderboardModal(false)}
              className="w-full py-2.5 bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded font-bold hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* DEVELOPER INFO MODAL */}
      {showDevModal && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-40">
          <div className="bg-black/95 border-2 border-cyan-400 rounded-xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_35px_rgba(0,243,255,0.3)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-black text-cyan-300">
                ABOUT DEVELOPER
              </h3>
              <button
                type="button"
                onClick={() => setShowDevModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-3.5 mb-4 text-left">
              <div className="text-white text-base font-bold">{DEVELOPER.name}</div>
              <div className="text-yellow-400 text-xs font-semibold">{DEVELOPER.title}</div>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-left mb-5">
              {DEVELOPER.linkedin && (
                <a
                  href={DEVELOPER.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-black/60 border border-cyan-500/40 rounded text-cyan-300 hover:bg-cyan-400 hover:text-black transition-colors"
                >
                  <Linkedin className="w-4 h-4 flex-shrink-0" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
              {DEVELOPER.github && (
                <a
                  href={DEVELOPER.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-black/60 border border-cyan-500/40 rounded text-cyan-300 hover:bg-cyan-400 hover:text-black transition-colors"
                >
                  <Github className="w-4 h-4 flex-shrink-0" />
                  <span>GitHub Repositories</span>
                </a>
              )}
              {DEVELOPER.email && (
                <a
                  href={`mailto:${DEVELOPER.email}`}
                  className="flex items-center gap-3 p-2.5 bg-black/60 border border-cyan-500/40 rounded text-cyan-300 hover:bg-cyan-400 hover:text-black transition-colors"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>Email Developer</span>
                </a>
              )}
              {DEVELOPER.website && (
                <a
                  href={DEVELOPER.website.startsWith('http') ? DEVELOPER.website : `https://${DEVELOPER.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-black/60 border border-cyan-500/40 rounded text-cyan-300 hover:bg-cyan-400 hover:text-black transition-colors"
                >
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span>Portfolio / Website</span>
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowDevModal(false)}
              className="w-full py-2.5 bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded font-bold hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer"
            >
              BACK TO MENU
            </button>
          </div>
        </div>
      )}

      {/* Screen 2: ROGUELITE UPGRADE MODAL */}
      {screen === 'upgrade' && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 z-30">
          <div className="max-w-4xl w-full flex flex-col items-center">
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">WAVE {hudState.wave} CLEARED</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mt-1 drop-shadow-[0_0_15px_#00f3ff]">
                CHOOSE SYSTEM UPGRADE
              </h2>
              <p className="text-sm text-gray-400 mt-1">Select 1 tactical module to install into your vessel</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
              {gameRef.current?.offeredUpgrades.map((upgrade, idx) => {
                const rarityColor =
                  upgrade.rarity === 'legendary'
                    ? 'border-pink-500 shadow-[0_0_20px_rgba(255,0,85,0.4)] hover:shadow-[0_0_35px_rgba(255,0,85,0.7)] text-pink-400'
                    : upgrade.rarity === 'epic'
                    ? 'border-yellow-400 shadow-[0_0_18px_rgba(255,230,0,0.35)] hover:shadow-[0_0_30px_rgba(255,230,0,0.6)] text-yellow-300'
                    : upgrade.rarity === 'rare'
                    ? 'border-purple-400 shadow-[0_0_15px_rgba(189,0,255,0.3)] hover:shadow-[0_0_25px_rgba(189,0,255,0.5)] text-purple-300'
                    : 'border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.25)] hover:shadow-[0_0_25px_rgba(0,243,255,0.5)] text-cyan-300';

                return (
                  <button
                    key={upgrade.id}
                    type="button"
                    onClick={() => handleChooseUpgrade(idx)}
                    className={`flex flex-col items-start p-5 bg-black/90 border-2 rounded-xl transition-all duration-200 hover:-translate-y-1.5 cursor-pointer text-left relative overflow-hidden group ${rarityColor}`}
                  >
                    <div className="absolute top-3 right-3 text-[11px] font-bold px-2 py-0.5 bg-black/80 border border-current rounded">
                      KEY [{idx + 1}]
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-2">
                      {upgrade.rarity}
                    </span>
                    <h3 className="text-lg font-black text-white group-hover:text-cyan-200 transition-colors mb-2">
                      {upgrade.name}
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed mt-auto">{upgrade.description}</p>
                    <div className="mt-4 w-full py-2 text-center text-xs font-bold border border-current rounded bg-current/10 group-hover:bg-current group-hover:text-black transition-colors">
                      INSTALL MODULE
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-6">Press [1], [2], or [3] on your keyboard to instantly select</p>
          </div>
        </div>
      )}

      {/* Screen 3: PAUSE MODAL */}
      {screen === 'paused' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-30">
          <div className="bg-black/95 border-2 border-cyan-400/80 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_35px_rgba(0,243,255,0.35)] flex flex-col items-center">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-widest mb-6 drop-shadow-[0_0_12px_#00f3ff]">
              SIMULATION PAUSED
            </h2>
            <div className="flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={handlePauseToggle}
                className="w-full py-3 bg-cyan-500/20 border border-cyan-400 rounded-lg text-cyan-300 font-bold tracking-wider hover:bg-cyan-400 hover:text-black transition-colors shadow-[0_0_12px_rgba(0,243,255,0.3)] cursor-pointer"
              >
                RESUME [ESC]
              </button>
              <button
                type="button"
                onClick={handleLaunchGame}
                className="w-full py-3 bg-black border border-gray-600 rounded-lg text-gray-300 font-bold tracking-wider hover:border-pink-500 hover:text-pink-400 transition-colors cursor-pointer"
              >
                RESTART RUN
              </button>
              <button
                type="button"
                onClick={() => {
                  if (gameRef.current) gameRef.current.setScreen('title');
                }}
                className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-2 cursor-pointer"
              >
                RETURN TO TITLE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 4: GAME OVER MODAL */}
      {screen === 'gameover' && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 md:p-6 z-30 overflow-y-auto">
          <div className="bg-black/95 border-2 border-pink-500 rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-[0_0_40px_rgba(255,0,85,0.45)] flex flex-col items-center my-auto">
            <span className="text-xs uppercase tracking-widest text-pink-500 font-bold mb-1">VESSEL DESTROYED</span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wider mb-2 drop-shadow-[0_0_15px_#ff0055]">
              GAME OVER
            </h2>

            {/* GG Callout with Player Name */}
            <div className="w-full bg-pink-950/40 border border-pink-500/40 rounded-lg py-2 px-3 mb-4 text-xs font-bold text-yellow-400">
              GG, {playerName || 'Pilot'}! Final Score: {gameOverStats.score.toLocaleString()}
            </div>

            {/* Run Stats */}
            <div className="grid grid-cols-2 gap-2.5 w-full mb-4">
              <div className="bg-black/60 border border-cyan-500/30 p-2.5 rounded-lg text-center">
                <div className="text-[10px] text-gray-400">FINAL SCORE</div>
                <div className="text-lg font-black text-cyan-300 tabular-nums">
                  {gameOverStats.score.toLocaleString()}
                </div>
              </div>
              <div className="bg-black/60 border border-yellow-500/30 p-2.5 rounded-lg text-center">
                <div className="text-[10px] text-gray-400">WAVE REACHED</div>
                <div className="text-lg font-black text-yellow-400 tabular-nums">{gameOverStats.wave}</div>
              </div>
              <div className="bg-black/60 border border-gray-700 p-2.5 rounded-lg text-center">
                <div className="text-[10px] text-gray-400">ENEMIES DESTROYED</div>
                <div className="text-base font-black text-gray-200 tabular-nums">{gameOverStats.enemies}</div>
              </div>
              <div className="bg-black/60 border border-gray-700 p-2.5 rounded-lg text-center">
                <div className="text-[10px] text-gray-400">SURVIVAL TIME</div>
                <div className="text-base font-black text-gray-200 tabular-nums">{gameOverStats.time}s</div>
              </div>
            </div>

            {/* Leaderboard Preview on Game Over */}
            <div className="w-full bg-black/60 border border-cyan-500/25 rounded-lg p-2.5 mb-4 text-left">
              <div className="text-[11px] font-bold text-cyan-300 mb-1.5 flex justify-between items-center">
                <span>LEADERBOARD RANKINGS</span>
                <span className="text-[9px] text-yellow-400">Top Pilots</span>
              </div>
              <div className="max-h-28 overflow-y-auto">
                <table className="w-full text-[10px] text-left">
                  <tbody>
                    {leaderboard.slice(0, 5).map((lb, i) => (
                      <tr
                        key={i}
                        className={`border-b border-gray-800/60 ${
                          lb.name === playerName ? 'text-yellow-300 font-bold' : 'text-gray-400'
                        }`}
                      >
                        <td className="py-1 text-cyan-400">#{i + 1}</td>
                        <td className="py-1 truncate max-w-[120px]">{lb.name}</td>
                        <td className="py-1">W{lb.wave}</td>
                        <td className="py-1 text-right text-cyan-300 tabular-nums font-bold">
                          {lb.score.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Restart CTA */}
            <button
              type="button"
              data-start="true"
              onClick={handleLaunchGame}
              className="w-full py-3.5 bg-pink-500/20 border-2 border-pink-500 text-pink-300 hover:bg-pink-500 hover:text-white rounded-xl font-black text-base tracking-widest shadow-[0_0_25px_rgba(255,0,85,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> RESTART RUN
            </button>
            <button
              type="button"
              onClick={() => {
                if (gameRef.current) gameRef.current.setScreen('title');
              }}
              className="mt-2.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              RETURN TO TITLE SCREEN
            </button>
          </div>
        </div>
      )}

      {/* HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-40">
          <div className="bg-black/95 border-2 border-cyan-400/80 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_35px_rgba(0,243,255,0.3)]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-black text-cyan-300 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" /> FLIGHT MANUAL
              </h3>
              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="text-gray-400 hover:text-white text-sm font-bold border border-gray-700 px-2.5 py-1 rounded cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-gray-300">
              <div>
                <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-cyan-400" /> Controls & Combat
                </h4>
                <p className="leading-relaxed">
                  Use <span className="text-cyan-300 font-bold">WASD / Arrow Keys</span> to navigate. Aim with mouse; click or keep Auto-Fire enabled. Press <span className="text-cyan-300 font-bold">Space</span> to Dash with invincibility frames.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" /> Enemy Intel
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li><span className="text-pink-400 font-semibold">Chaser (Pink)</span>: Swift swarming triangles.</li>
                  <li><span className="text-amber-400 font-semibold">Tank (Amber)</span>: Armored hexagons; release shrapnel bursts upon defeat.</li>
                  <li><span className="text-purple-400 font-semibold">Shooter (Purple)</span>: Kites at distance and fires aimed plasma bolts.</li>
                  <li><span className="text-red-500 font-semibold">Boss (Every 5 Waves)</span>: Colossal titan with radial bursts, lasers & minions!</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-yellow-400" /> Power-Ups & Combos
                </h4>
                <p className="leading-relaxed">
                  Defeat enemies rapidly to build up to a <span className="text-yellow-400 font-bold">10x Combo Multiplier</span>. Collect glowing drops for Shields, Rapid Fire, Triple Spread, and Chrono Slow-Mo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="mt-6 w-full py-2.5 bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded font-bold hover:bg-cyan-400 hover:text-black transition-colors cursor-pointer"
            >
              GOT IT, PILOT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
