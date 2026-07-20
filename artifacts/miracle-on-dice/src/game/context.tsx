// ============================================================
// MIRACLE ON DICE — React Game Context
// ============================================================

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { GameState, GameAction } from './types';
import { createInitialState, gameReducer } from './engine';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  // Convenience helpers
  startGame: (playerNames: [string, string]) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const startGame = useCallback((playerNames: [string, string]) => {
    dispatch({ type: 'START_GAME', playerNames });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, startGame, resetGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}

// Derived selector hooks live in ./hooks.ts to keep this file
// (which exports a React component) Fast-Refresh compatible.
