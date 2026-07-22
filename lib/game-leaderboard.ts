import {
  getFirebaseDb,
  hasFirebaseConfig,
  isFirebaseAuthError,
  toFirebaseAuthError,
} from '@/lib/cms/firebase';
import type { GameHighScoreRecord, GameLeaderboardEntry, GameLeaderboardResponse } from '@/lib/types';

const GAME_LEADERBOARD_COLLECTIONS = {
  'baustellen-rocker': 'gameLeaderboard',
  huehnerjagt: 'huehnerjagtLeaderboard',
} as const;

export type LeaderboardGame = keyof typeof GAME_LEADERBOARD_COLLECTIONS;
const MAX_PLAYER_NAME_LENGTH = 24;
const MAX_SCORE = 999999;
const MAX_LEVEL = 999;

export function normalizeLeaderboardGame(value: unknown): LeaderboardGame {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (normalized === 'huehnerjagt' || normalized === 'hühnerjagt' || normalized === 'headbang-huehnerjagd') {
    return 'huehnerjagt';
  }

  return 'baustellen-rocker';
}

function getLeaderboardCollection(game: LeaderboardGame) {
  return GAME_LEADERBOARD_COLLECTIONS[game];
}

export function normalizeGamePlayerName(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'Headbanger';
  }

  return trimmed.slice(0, MAX_PLAYER_NAME_LENGTH);
}

function normalizeScore(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(MAX_SCORE, Math.floor(parsed)));
}

function normalizeLevel(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.max(1, Math.min(MAX_LEVEL, Math.floor(parsed)));
}

function normalizeCreatedAt(value: unknown) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return new Date(0).toISOString();
  }

  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? new Date(0).toISOString() : new Date(parsed).toISOString();
}

function normalizeLeaderboardEntry(id: string, data: Record<string, unknown>): GameLeaderboardEntry {
  return {
    id,
    name: normalizeGamePlayerName(String(data.name ?? 'Headbanger')),
    score: normalizeScore(data.score),
    level: normalizeLevel(data.level),
    timeUp: Boolean(data.timeUp),
    createdAt: normalizeCreatedAt(data.createdAt),
  };
}

function sortLeaderboard(entries: GameLeaderboardEntry[]) {
  return [...entries].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

function buildLeaderboardResponse(entries: GameLeaderboardEntry[]): GameLeaderboardResponse {
  const sortedEntries = sortLeaderboard(entries).slice(0, 10);
  const highScore: GameHighScoreRecord | null = sortedEntries[0]
    ? { name: sortedEntries[0].name, score: sortedEntries[0].score }
    : null;

  return {
    highScore,
    topEntries: sortedEntries,
  };
}

export function sanitizeGameScoreSubmission(input: unknown) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const candidate = input as Record<string, unknown>;

  return {
    name: normalizeGamePlayerName(String(candidate.name ?? 'Headbanger')),
    score: normalizeScore(candidate.score),
    level: normalizeLevel(candidate.level),
    timeUp: Boolean(candidate.timeUp),
  };
}

export async function getGlobalGameLeaderboard(game: LeaderboardGame = 'baustellen-rocker') {
  if (!hasFirebaseConfig()) {
    return { highScore: null, topEntries: [] } satisfies GameLeaderboardResponse;
  }

  try {
    const db = getFirebaseDb();
    const snapshot = await db.collection(getLeaderboardCollection(game)).orderBy('score', 'desc').limit(10).get();
    const entries = snapshot.docs.map((doc) => normalizeLeaderboardEntry(doc.id, doc.data() as Record<string, unknown>));

    return buildLeaderboardResponse(entries);
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      throw toFirebaseAuthError();
    }

    throw error;
  }
}

export async function submitGlobalGameScore(
  input: { name: string; score: number; level: number; timeUp: boolean },
  game: LeaderboardGame = 'baustellen-rocker'
) {
  if (!hasFirebaseConfig()) {
    return { highScore: null, topEntries: [] } satisfies GameLeaderboardResponse;
  }

  try {
    const db = getFirebaseDb();

    if (input.score > 0) {
      await db.collection(getLeaderboardCollection(game)).add({
        name: normalizeGamePlayerName(input.name),
        score: normalizeScore(input.score),
        level: normalizeLevel(input.level),
        timeUp: Boolean(input.timeUp),
        createdAt: new Date().toISOString(),
      });
    }

    return getGlobalGameLeaderboard(game);
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      throw toFirebaseAuthError();
    }

    throw error;
  }
}