'use client';

import { useEffect, useRef, useState } from 'react';
import type { GameHighScoreRecord, GameLeaderboardEntry, GameLeaderboardResponse } from '@/lib/types';

type HudState = {
  score: number;
  level: number;
  lives: number;
  timeLeft: number;
};

type OverlayState =
  | { mode: 'start' }
  | { mode: 'gameover'; timeUp: boolean; score: number; level: number; isNewHighScore: boolean };

type Player = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
};

type ItemType = {
  type: 'tool' | 'beer' | 'nail';
  emoji: string;
  points: number;
  badgeColor: string;
  rimColor: string;
};

type Item = ItemType & {
  x: number;
  y: number;
  r: number;
  speed: number;
  rot: number;
  rotSpeed: number;
};

const WIDTH = 640;
const HEIGHT = 480;
const FRAME_UNIT = 16.6667;
const PLAYER_NAME_STORAGE_KEY = 'headbang-handwerk-game-player-name';
const INITIAL_HUD: HudState = { score: 0, level: 1, lives: 3, timeLeft: 60 };
const INITIAL_OVERLAY: OverlayState = { mode: 'start' };
const DEFAULT_PLAYER_NAME = 'Headbanger';
const ITEM_TYPES: ItemType[] = [
  { type: 'tool', emoji: '🔨', points: 10, badgeColor: '#f4ede3', rimColor: '#8e7963' },
  { type: 'tool', emoji: '🔧', points: 10, badgeColor: '#f4ede3', rimColor: '#8e7963' },
  { type: 'tool', emoji: '🪚', points: 15, badgeColor: '#f4ede3', rimColor: '#8e7963' },
  { type: 'beer', emoji: '🍺', points: 20, badgeColor: '#f6b94f', rimColor: '#8a4b00' },
  { type: 'beer', emoji: '🍻', points: 25, badgeColor: '#f6b94f', rimColor: '#8a4b00' },
  { type: 'nail', emoji: '🔩', points: -1, badgeColor: '#d94841', rimColor: '#5f1313' },
  { type: 'nail', emoji: '⚡', points: -1, badgeColor: '#d94841', rimColor: '#5f1313' },
];

function createInitialPlayer(): Player {
  return {
    x: WIDTH / 2 - 35,
    y: HEIGHT - 70,
    w: 70,
    h: 55,
    speed: 6,
  };
}

function normalizePlayerName(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return DEFAULT_PLAYER_NAME;
  }

  return trimmed.slice(0, 24);
}

function formatLeaderboardDate(value: string) {
  if (!value) {
    return 'ohne Zeit';
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(parsed));
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export function GameClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const secondTimerRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const spawnIntervalRef = useRef(55);
  const itemsRef = useRef<Item[]>([]);
  const playerRef = useRef<Player>(createInitialPlayer());
  const hudRef = useRef(INITIAL_HUD);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const drunkFactorRef = useRef(0);
  const flashRef = useRef<{ color: string; alpha: number }>({ color: '#ff7a00', alpha: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const touchRef = useRef({ left: false, right: false });
  const draggingRef = useRef(false);
  const highScoreRef = useRef<GameHighScoreRecord | null>(null);
  const playerNameRef = useRef(DEFAULT_PLAYER_NAME);
  const recordTimeoutRef = useRef<number | null>(null);
  const hasCelebratedRecordRef = useRef(false);

  const [hud, setHud] = useState(INITIAL_HUD);
  const [overlay, setOverlay] = useState<OverlayState>(INITIAL_OVERLAY);
  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(false);
  const [highScore, setHighScore] = useState<GameHighScoreRecord | null>(null);
  const [playerName, setPlayerName] = useState(DEFAULT_PLAYER_NAME);
  const [leaderboardEntries, setLeaderboardEntries] = useState<GameLeaderboardEntry[]>([]);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [showNewRecordEffect, setShowNewRecordEffect] = useState(false);

  const syncHud = (nextHud: HudState) => {
    hudRef.current = nextHud;
    setHud(nextHud);
  };

  const syncPaused = (nextPaused: boolean) => {
    pausedRef.current = nextPaused;
    setPaused(nextPaused);
  };

  const syncRunning = (nextRunning: boolean) => {
    runningRef.current = nextRunning;
    setRunning(nextRunning);
  };

  const flash = (color: string) => {
    flashRef.current = { color, alpha: 0.35 };
  };

  const syncHighScore = (nextHighScore: GameHighScoreRecord | null) => {
    highScoreRef.current = nextHighScore;
    setHighScore(nextHighScore);
  };

  const syncPlayerName = (nextPlayerName: string) => {
    playerNameRef.current = nextPlayerName;
    setPlayerName(nextPlayerName);
  };

  const applyLeaderboard = (payload: GameLeaderboardResponse) => {
    syncHighScore(payload.highScore);
    setLeaderboardEntries(payload.topEntries);
    setLeaderboardError(null);
  };

  const triggerNewRecordEffect = () => {
    hasCelebratedRecordRef.current = true;
    setShowNewRecordEffect(true);

    if (recordTimeoutRef.current !== null) {
      window.clearTimeout(recordTimeoutRef.current);
    }

    recordTimeoutRef.current = window.setTimeout(() => {
      setShowNewRecordEffect(false);
      recordTimeoutRef.current = null;
    }, 1800);
  };

  const loadGlobalLeaderboard = async () => {
    try {
      const response = await fetch('/api/game/leaderboard', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('leaderboard-load-failed');
      }

      const payload = (await response.json()) as GameLeaderboardResponse;
      applyLeaderboard(payload);
    } catch {
      setLeaderboardError('Globale Bestenliste aktuell nicht verfuegbar.');
    }
  };

  const submitGlobalScore = async (payload: { name: string; score: number; level: number; timeUp: boolean }) => {
    try {
      const response = await fetch('/api/game/leaderboard', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('leaderboard-save-failed');
      }

      const nextLeaderboard = (await response.json()) as GameLeaderboardResponse;
      applyLeaderboard(nextLeaderboard);
    } catch {
      setLeaderboardError('Score konnte nicht global gespeichert werden.');
    }
  };

  const spawnItem = () => {
    const nailChance = Math.min(0.15 + hudRef.current.level * 0.03, 0.4);
    const random = Math.random();
    let pool: ItemType[];

    if (random < nailChance) {
      pool = ITEM_TYPES.filter((item) => item.type === 'nail');
    } else if (random < nailChance + 0.25) {
      pool = ITEM_TYPES.filter((item) => item.type === 'beer');
    } else {
      pool = ITEM_TYPES.filter((item) => item.type === 'tool');
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];

    itemsRef.current.push({
      x: Math.random() * (WIDTH - 40) + 20,
      y: -20,
      r: 18,
      speed: 2 + hudRef.current.level * 0.4 + Math.random() * 1.5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      ...picked,
    });
  };

  const gameOver = (timeUp: boolean) => {
    const finalScore = hudRef.current.score;
    const finalLevel = hudRef.current.level;
    const normalizedName = normalizePlayerName(playerNameRef.current);
    const isNewHighScore = finalScore > (highScoreRef.current?.score ?? 0);

    void submitGlobalScore({
      name: normalizedName,
      score: finalScore,
      level: finalLevel,
      timeUp,
    });

    syncRunning(false);
    syncPaused(false);
    setOverlay({
      mode: 'gameover',
      timeUp,
      score: finalScore,
      level: finalLevel,
      isNewHighScore,
    });
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, timestamp: number) => {
    const player = playerRef.current;
    const wobble = drunkFactorRef.current > 0 ? Math.sin(timestamp / 100) * drunkFactorRef.current : 0;

    ctx.save();
    ctx.translate(player.x + player.w / 2 + wobble, player.y + player.h / 2);

    ctx.strokeStyle = '#f7efe5';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-25, 25);
    ctx.lineTo(25, -5);
    ctx.moveTo(-25, -5);
    ctx.lineTo(25, 25);
    ctx.stroke();

    ctx.fillStyle = '#f7efe5';
    for (const [x, y] of [
      [-25, 25],
      [25, -5],
      [-25, -5],
      [25, 25],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#f8f4ee';
    ctx.beginPath();
    ctx.arc(0, -15, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-12, -5, 24, 14);

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-8, -17, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -17, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-3, -2);
    ctx.lineTo(3, -2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    for (let index = -9; index <= 9; index += 6) {
      ctx.beginPath();
      ctx.moveTo(index, -5);
      ctx.lineTo(index, 7);
      ctx.stroke();
    }

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -28, 22, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-22, -30, 44, 6);

    ctx.strokeStyle = '#b8a48e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(0, -28);
    ctx.moveTo(-12, -47);
    ctx.lineTo(-6, -28);
    ctx.moveTo(12, -47);
    ctx.lineTo(6, -28);
    ctx.stroke();

    ctx.restore();
  };

  const drawItem = (ctx: CanvasRenderingContext2D, item: Item) => {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rot);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = item.badgeColor;
    ctx.beginPath();
    ctx.arc(0, 0, item.r + 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = item.rimColor;
    ctx.beginPath();
    ctx.arc(0, 0, item.r + 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '30px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.emoji, 0, 0);
    ctx.restore();
  };

  const drawScene = (timestamp: number) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#0b0908';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let index = 0; index < 5; index += 1) {
      const offset = (timestamp / 50) % 130;
      ctx.fillStyle = index % 2 === 0 ? '#ffb14d' : '#f7efe5';
      ctx.beginPath();
      ctx.moveTo(index * 130 + offset, 0);
      ctx.lineTo(index * 130 + 60 + offset, 0);
      ctx.lineTo(index * 130 + 30 + offset, HEIGHT);
      ctx.lineTo(index * 130 - 30 + offset, HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 122, 0, 0.08)';
    ctx.fillRect(0, HEIGHT - 54, WIDTH, 54);

    for (const item of itemsRef.current) {
      drawItem(ctx, item);
    }

    drawPlayer(ctx, timestamp);

    if (flashRef.current.alpha > 0) {
      ctx.fillStyle = flashRef.current.color;
      ctx.globalAlpha = flashRef.current.alpha;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1;
      flashRef.current.alpha = Math.max(0, flashRef.current.alpha - 0.03);
    }

    if (pausedRef.current && runningRef.current) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSE', WIDTH / 2, HEIGHT / 2);
    }
  };

  const updateGame = (delta: number) => {
    const player = playerRef.current;
    const frameScale = delta / FRAME_UNIT;
    const keys = keysRef.current;
    const touches = touchRef.current;
    const nextHud = { ...hudRef.current };

    let effectiveSpeed = player.speed - drunkFactorRef.current * 0.5;
    effectiveSpeed = Math.max(2.4, effectiveSpeed);

    if (keys.ArrowLeft || keys.a || keys.A || touches.left) {
      player.x -= effectiveSpeed * frameScale;
    }

    if (keys.ArrowRight || keys.d || keys.D || touches.right) {
      player.x += effectiveSpeed * frameScale;
    }

    if (drunkFactorRef.current > 0) {
      player.x += Math.sin(performance.now() / 150) * drunkFactorRef.current * 0.7 * frameScale;
    }

    player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));

    spawnTimerRef.current += frameScale;
    if (spawnTimerRef.current > spawnIntervalRef.current) {
      spawnItem();
      spawnTimerRef.current = 0;
    }

    for (let index = itemsRef.current.length - 1; index >= 0; index -= 1) {
      const item = itemsRef.current[index];
      item.y += item.speed * frameScale;
      item.rot += item.rotSpeed * frameScale;

      const playerCenterX = player.x + player.w / 2;
      const playerCenterY = player.y + 5;
      const deltaX = item.x - playerCenterX;
      const deltaY = item.y - playerCenterY;

      if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < item.r + 28) {
        if (item.type === 'nail') {
          nextHud.lives -= 1;
          flash('#b42318');
          itemsRef.current.splice(index, 1);
          syncHud(nextHud);

          if (nextHud.lives <= 0) {
            gameOver(false);
          }

          continue;
        }

        nextHud.score += item.points;
        if (nextHud.score > (highScoreRef.current?.score ?? 0) && !hasCelebratedRecordRef.current) {
          triggerNewRecordEffect();
        }

        if (item.type === 'beer') {
          drunkFactorRef.current = Math.min(drunkFactorRef.current + 1.2, 6);
          flash('#f6b94f');
        } else {
          flash('#2f9e44');
        }

        itemsRef.current.splice(index, 1);
        continue;
      }

      if (item.y > HEIGHT + 20) {
        itemsRef.current.splice(index, 1);
      }
    }

    drunkFactorRef.current = Math.max(0, drunkFactorRef.current - 0.004 * frameScale);

    const newLevel = Math.floor(nextHud.score / 150) + 1;
    if (newLevel !== nextHud.level) {
      nextHud.level = newLevel;
      spawnIntervalRef.current = Math.max(20, 55 - newLevel * 4);
    }

    if (
      nextHud.score !== hudRef.current.score ||
      nextHud.level !== hudRef.current.level ||
      nextHud.lives !== hudRef.current.lives ||
      nextHud.timeLeft !== hudRef.current.timeLeft
    ) {
      syncHud(nextHud);
    }
  };

  const loop = (timestamp: number) => {
    if (!runningRef.current) {
      animationFrameRef.current = null;
      return;
    }

    const lastTimestamp = lastFrameTimeRef.current ?? timestamp;
    const delta = Math.min(32, timestamp - lastTimestamp || FRAME_UNIT);
    lastFrameTimeRef.current = timestamp;

    if (!pausedRef.current) {
      secondTimerRef.current += delta;
      if (secondTimerRef.current >= 1000) {
        const secondsElapsed = Math.floor(secondTimerRef.current / 1000);
        secondTimerRef.current -= secondsElapsed * 1000;

        const nextHud = {
          ...hudRef.current,
          timeLeft: Math.max(0, hudRef.current.timeLeft - secondsElapsed),
        };

        syncHud(nextHud);

        if (nextHud.timeLeft <= 0) {
          drawScene(timestamp);
          gameOver(true);
          return;
        }
      }

      updateGame(delta);
    }

    drawScene(timestamp);
    animationFrameRef.current = window.requestAnimationFrame(loop);
  };

  const resetGame = () => {
    itemsRef.current = [];
    playerRef.current = createInitialPlayer();
    spawnTimerRef.current = 0;
    spawnIntervalRef.current = 55;
    secondTimerRef.current = 0;
    lastFrameTimeRef.current = null;
    drunkFactorRef.current = 0;
    flashRef.current = { color: '#ff7a00', alpha: 0 };
    hasCelebratedRecordRef.current = false;
    setShowNewRecordEffect(false);
    if (recordTimeoutRef.current !== null) {
      window.clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
    }
    syncHud(INITIAL_HUD);
    syncPaused(false);
  };

  const startGame = () => {
    resetGame();
    setOverlay(INITIAL_OVERLAY);
    syncRunning(true);
    if (animationFrameRef.current === null) {
      animationFrameRef.current = window.requestAnimationFrame(loop);
    }
  };

  const restartGame = () => {
    setOverlay(INITIAL_OVERLAY);
    startGame();
  };

  const togglePause = () => {
    if (!runningRef.current) {
      return;
    }

    syncPaused(!pausedRef.current);
  };

  useEffect(() => {
    const storedPlayerName = window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY);
    const nextPlayerName = normalizePlayerName(storedPlayerName || DEFAULT_PLAYER_NAME);
    syncPlayerName(nextPlayerName);
    void loadGlobalLeaderboard();

    drawScene(performance.now());

    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.key] = true;

      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        togglePause();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.key] = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (recordTimeoutRef.current !== null) {
        window.clearTimeout(recordTimeoutRef.current);
      }
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleCanvasTouch = (clientX: number) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scale = WIDTH / rect.width;
    const nextX = (clientX - rect.left) * scale;
    playerRef.current.x = Math.max(0, Math.min(WIDTH - playerRef.current.w, nextX - playerRef.current.w / 2));
  };

  const overlayVisible = !running;

  return (
    <section className="mx-auto flex w-full max-w-[760px] flex-col items-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mb-4 flex w-full max-w-[640px] flex-col gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(21,17,14,0.84)_0%,rgba(11,8,7,0.9)_100%)] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
        <label htmlFor="game-player-name" className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">
          Dein Name fuer Highscore und Verlauf
        </label>
        <input
          id="game-player-name"
          type="text"
          value={playerName}
          maxLength={24}
          onChange={(event) => {
            const rawValue = event.target.value;
            const limitedValue = rawValue.slice(0, 24);
            syncPlayerName(limitedValue || '');
            window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, normalizePlayerName(limitedValue || ''));
          }}
          onBlur={() => {
            const normalizedName = normalizePlayerName(playerNameRef.current);
            syncPlayerName(normalizedName);
            window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, normalizedName);
          }}
          className="rounded-xl border border-[color:var(--color-border)] bg-black/25 px-4 py-3 text-white outline-none transition focus:border-[color:var(--color-accent)]"
          placeholder="Headbanger"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(21,17,14,0.92)_0%,rgba(11,8,7,0.94)_100%)] px-4 py-3 text-sm shadow-[0_18px_40px_rgba(0,0,0,0.32)]">
        <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2">Bier: <span className="font-black text-white">{hud.score}</span></div>
        <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2">Highscore: <span className="font-black text-white">{highScore?.score ?? 0}</span> <span className="text-[color:var(--color-muted)]">von {highScore?.name ?? 'noch niemandem'}</span></div>
        <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2">Level: <span className="font-black text-white">{hud.level}</span></div>
        <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2">Leben: <span className="font-black text-white">{hud.lives}</span></div>
        <div className="rounded-xl border border-white/8 bg-black/15 px-3 py-2">Zeit: <span className="font-black text-white">{hud.timeLeft}</span></div>
      </div>

      <div className="relative w-full max-w-[640px] overflow-hidden rounded-[1.35rem] border-4 border-[color:var(--color-border)] bg-[radial-gradient(ellipse_at_center,rgba(31,24,20,1)_0%,rgba(5,5,5,1)_100%)] shadow-[0_0_25px_rgba(255,255,255,0.12),inset_0_0_30px_rgba(0,0,0,1)]">
        {showNewRecordEffect ? (
          <div className="pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2 animate-pulse rounded-full border border-[color:var(--color-accent-soft)] bg-[linear-gradient(180deg,rgba(255,122,0,0.96)_0%,rgba(134,56,0,0.98)_100%)] px-5 py-2 text-xs font-black uppercase tracking-[0.28em] text-black shadow-[0_0_30px_rgba(255,177,77,0.45)]">
            Neuer Rekord!
          </div>
        ) : null}

        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="block h-auto w-full touch-none"
          onTouchStart={(event) => {
            draggingRef.current = true;
            handleCanvasTouch(event.touches[0].clientX);
          }}
          onTouchMove={(event) => {
            event.preventDefault();
            if (draggingRef.current) {
              handleCanvasTouch(event.touches[0].clientX);
            }
          }}
          onTouchEnd={() => {
            draggingRef.current = false;
          }}
        />

        {overlayVisible ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 px-6 text-center">
            {overlay.mode === 'start' ? (
              <>
                <h2 className="mb-4 text-3xl font-black text-white">Willkommen auf der Baustelle</h2>
                <p className="max-w-md body-copy text-[color:var(--color-muted)]">
                  Du bist der Headbang-Handwerker. Fang Werkzeuge und Biere mit deinem Helm, sammle Punkte und meide rostige Nägel.
                  Auf dem PC steuerst du mit den Pfeiltasten oder A und D, auf dem Handy mit den Buttons oder per Wischen direkt auf dem Spielfeld.
                </p>
                <button
                  type="button"
                  onClick={startGame}
                  className="mt-6 rounded-xl border-2 border-[color:var(--color-accent-soft)] bg-[linear-gradient(180deg,rgba(255,122,0,0.96)_0%,rgba(134,56,0,0.98)_100%)] px-7 py-3 text-sm font-black uppercase tracking-[0.22em] text-black transition hover:brightness-110"
                >
                  Rock On
                </button>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-3xl font-black text-white">{overlay.timeUp ? 'Feierabend' : 'Baustellenunfall'}</h2>
                {overlay.isNewHighScore ? (
                  <div className="mb-4 rounded-full border border-[color:var(--color-accent-soft)] bg-[linear-gradient(180deg,rgba(255,122,0,0.96)_0%,rgba(134,56,0,0.98)_100%)] px-5 py-2 text-xs font-black uppercase tracking-[0.26em] text-black shadow-[0_0_24px_rgba(255,177,77,0.35)]">
                    Neuer Highscore!
                  </div>
                ) : null}
                <p className="max-w-md body-copy text-[color:var(--color-muted)]">
                  <span className="font-black text-white">{playerName}</span> hat <span className="font-black text-white">{overlay.score}</span> Bier-Punkte gesammelt und Level <span className="font-black text-white">{overlay.level}</span> erreicht.
                  {overlay.timeUp
                    ? ' Die Schicht ist vorbei. Zeit fuer ein kaltes Bier im Bierzelt.'
                    : ' Ein rostiger Nagel hat dich ausser Gefecht gesetzt.'}
                </p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent-soft)]">
                  Highscore: <span className="text-white">{highScore?.score ?? 0}</span> von {highScore?.name ?? 'noch niemandem'}
                </p>
                <button
                  type="button"
                  onClick={restartGame}
                  className="mt-6 rounded-xl border-2 border-[color:var(--color-accent-soft)] bg-[linear-gradient(180deg,rgba(255,122,0,0.96)_0%,rgba(134,56,0,0.98)_100%)] px-7 py-3 text-sm font-black uppercase tracking-[0.22em] text-black transition hover:brightness-110"
                >
                  Nochmal rocken
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-6 w-full max-w-[640px] rounded-[1.35rem] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(21,17,14,0.82)_0%,rgba(11,8,7,0.9)_100%)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-white">Globale Top 10</h2>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">Alle Spieler</p>
        </div>

        {leaderboardError ? (
          <p className="body-copy text-sm text-[#ffcf98]">{leaderboardError}</p>
        ) : leaderboardEntries.length > 0 ? (
          <div className="grid gap-2">
            {leaderboardEntries.map((entry, index) => (
              <div key={entry.id} className="grid grid-cols-[2.5rem,minmax(0,1fr),auto] items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-3 py-3 text-sm">
                <div className="text-center font-black text-[color:var(--color-accent-soft)]">#{index + 1}</div>
                <div>
                  <p className="font-semibold text-white">
                    {entry.name} <span className="text-[color:var(--color-muted)]">am {formatLeaderboardDate(entry.createdAt)}</span>
                  </p>
                  <p className="text-[color:var(--color-muted)]">
                    Level {entry.level} · {entry.timeUp ? 'Feierabend' : 'Unfall'}{index === 0 ? ' · Aktueller Rekord' : ''}
                  </p>
                </div>
                <div className="text-right font-black text-white">{entry.score}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="body-copy text-sm text-[color:var(--color-muted)]">Noch keine globalen Scores gespeichert. Starte das Spiel und setze den ersten Eintrag.</p>
        )}
      </div>

      <div className="mt-4 flex w-full max-w-[640px] items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(51,51,51,1)_0%,rgba(13,13,13,1)_100%)] text-4xl text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] active:scale-95"
          onPointerDown={() => {
            touchRef.current.left = true;
          }}
          onPointerUp={() => {
            touchRef.current.left = false;
          }}
          onPointerLeave={() => {
            touchRef.current.left = false;
          }}
          onPointerCancel={() => {
            touchRef.current.left = false;
          }}
        >
          ◀
        </button>

        <button
          type="button"
          onClick={togglePause}
          className="flex h-[70px] w-[70px] items-center justify-center rounded-full border-2 border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(51,51,51,1)_0%,rgba(13,13,13,1)_100%)] text-2xl text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] active:scale-95"
          aria-label={paused ? 'Spiel fortsetzen' : 'Spiel pausieren'}
        >
          {paused ? '▶' : '⏸'}
        </button>

        <button
          type="button"
          className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[color:var(--color-border)] bg-[linear-gradient(180deg,rgba(51,51,51,1)_0%,rgba(13,13,13,1)_100%)] text-4xl text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] active:scale-95"
          onPointerDown={() => {
            touchRef.current.right = true;
          }}
          onPointerUp={() => {
            touchRef.current.right = false;
          }}
          onPointerLeave={() => {
            touchRef.current.right = false;
          }}
          onPointerCancel={() => {
            touchRef.current.right = false;
          }}
        >
          ▶
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-[color:var(--color-muted)] lg:block">Steuerung: ← → oder A / D, Leertaste fuer Pause</p>
      <p className="mt-2 max-w-2xl text-center text-xs uppercase tracking-[0.2em] text-[#6f6258]">Ein Fan-Spiel fuer den Verein Headbang Handwerk</p>
    </section>
  );
}