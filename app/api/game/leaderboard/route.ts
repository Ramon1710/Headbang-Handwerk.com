import { NextResponse } from 'next/server';
import { hasFirebaseConfig, isFirebaseAuthError, isInvalidFirebaseConfigError } from '@/lib/cms/firebase';
import {
  getGlobalGameLeaderboard,
  normalizeLeaderboardGame,
  sanitizeGameScoreSubmission,
  submitGlobalGameScore,
} from '@/lib/game-leaderboard';

export async function GET(request: Request) {
  try {
    if (!hasFirebaseConfig()) {
      return NextResponse.json({ error: 'missing-config' }, { status: 503 });
    }

    const game = normalizeLeaderboardGame(new URL(request.url).searchParams.get('game'));
    const leaderboard = await getGlobalGameLeaderboard(game);
    return NextResponse.json(leaderboard);
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      return NextResponse.json({ error: 'firebase-auth' }, { status: 401 });
    }

    if (isInvalidFirebaseConfigError(error)) {
      return NextResponse.json({ error: 'invalid-firebase' }, { status: 500 });
    }

    return NextResponse.json(
      {
        error: 'route-failure',
        detail: error instanceof Error ? error.message : 'unknown',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!hasFirebaseConfig()) {
      return NextResponse.json({ error: 'missing-config' }, { status: 503 });
    }

    const game = normalizeLeaderboardGame(new URL(request.url).searchParams.get('game'));
    const body = await request.json();
    const payload = sanitizeGameScoreSubmission(body);

    if (!payload) {
      return NextResponse.json({ error: 'invalid-body' }, { status: 400 });
    }

    const leaderboard = await submitGlobalGameScore(payload, game);
    return NextResponse.json(leaderboard);
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      return NextResponse.json({ error: 'firebase-auth' }, { status: 401 });
    }

    if (isInvalidFirebaseConfigError(error)) {
      return NextResponse.json({ error: 'invalid-firebase' }, { status: 500 });
    }

    return NextResponse.json(
      {
        error: 'route-failure',
        detail: error instanceof Error ? error.message : 'unknown',
      },
      { status: 500 }
    );
  }
}