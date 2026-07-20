// ============================================================
// MIRACLE ON DICE — Derived selector hooks
// Kept in a separate file so context.tsx (which exports a
// component) stays Fast-Refresh compatible.
// ============================================================

import { useGame } from './context';

export function usePlayer(id: 0 | 1) {
  const { state } = useGame();
  return state.players[id];
}

export function useCurrentPeriod() {
  const { state } = useGame();
  return state.periods[state.period - 1];
}

export function useCurrentEvent() {
  const { state } = useGame();
  return state.periods[state.period - 1].currentEvent;
}

export function useFaceoffWinner(): 0 | 1 | null {
  const { state } = useGame();
  return state.faceoff?.winner ?? null;
}

export function useIsMyTurn(playerId: 0 | 1): boolean {
  const { state } = useGame();
  return state.activeScreenPlayer === playerId || state.buyPhaseActivePlayer === playerId;
}
