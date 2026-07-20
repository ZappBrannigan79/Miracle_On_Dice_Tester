// ============================================================
// MIRACLE ON DICE — Combat Resolution Helpers (Phase 7)
// ============================================================

import { rollCombatDice } from './dice';
import type { WaveResult, PlayerState, CombatState } from './types';
import { SHUTOUT_BLOCK_VALUE } from './types';

// -----------------------------------------------------------
// Calculate total attack from a player's shoot zone
// -----------------------------------------------------------
export function calcAttackTotal(shootPips: number, shootTokensInZone: number): {
  pipRolls: number[];
  pipTotal: number;
  tokenTotal: number;
  total: number;
} {
  const { rolls: pipRolls, total: pipTotal } = rollCombatDice(shootPips);
  const tokenTotal = shootTokensInZone;
  return { pipRolls, pipTotal, tokenTotal, total: pipTotal + tokenTotal };
}

// -----------------------------------------------------------
// Calculate total defense from a player's block zone
// -----------------------------------------------------------
export function calcDefenseTotal(
  blockPips: number,
  blockTokensCommitted: number,
  shutout: boolean
): {
  pipRolls: number[];
  pipTotal: number;
  tokenTotal: number;
  shutoutContribution: number;
  total: number;
} {
  const { rolls: pipRolls, total: pipTotal } = rollCombatDice(blockPips);
  const tokenTotal = blockTokensCommitted;
  const shutoutContribution = shutout ? SHUTOUT_BLOCK_VALUE : 0;
  return {
    pipRolls,
    pipTotal,
    tokenTotal,
    shutoutContribution,
    total: pipTotal + tokenTotal + shutoutContribution,
  };
}

// -----------------------------------------------------------
// Resolve a single wave of combat
// -----------------------------------------------------------
export function resolveWave(params: {
  wave: 1 | 2;
  attackerId: 0 | 1;
  defenderId: 0 | 1;
  attackPips: number;
  attackTokensInZone: number;
  blockPips: number;
  blockTokens: number;
  defendGoalieShutout: boolean;
}): WaveResult {
  const attack = calcAttackTotal(params.attackPips, params.attackTokensInZone);
  const defense = calcDefenseTotal(
    params.blockPips,
    params.blockTokens,
    params.defendGoalieShutout
  );
  const isGoal = attack.total > defense.total;

  return {
    wave: params.wave,
    attackerId: params.attackerId,
    defenderId: params.defenderId,
    attackPips: params.attackPips,
    attackTokens: params.attackTokensInZone,
    attackRolls: attack.pipRolls,
    attackTotal: attack.total,
    blockPips: params.blockPips,
    blockTokens: params.blockTokens,
    blockRolls: defense.pipRolls,
    blockTotal: defense.total,
    shutoutContribution: defense.shutoutContribution,
    isGoal,
  };
}

// -----------------------------------------------------------
// Compute Shooting Initiative winner
// Higher total shoot pips wins; tie broken by rollD6 pair
// -----------------------------------------------------------
export function determineInitiative(
  player0ShootPips: number,
  player1ShootPips: number
): { winner: 0 | 1; tied: boolean; tieRolls?: [number, number] } {
  if (player0ShootPips > player1ShootPips) return { winner: 0, tied: false };
  if (player1ShootPips > player0ShootPips) return { winner: 1, tied: false };
  // Tie — roll d6 to break
  return { winner: 0, tied: true }; // caller will supply tiebreaker rolls
}

// -----------------------------------------------------------
// Collect all pips in a zone for a player
// -----------------------------------------------------------
export function sumZonePips(
  player: PlayerState,
  zone: 'energy' | 'shoot' | 'block',
  wildBonusAmount = 0
): number {
  let total = 0;
  for (const die of player.rolledDice) {
    const effectiveZone = die.face.type === 'wild' ? die.wildAssignedAs : die.zone;
    if (effectiveZone !== zone) continue;

    if (die.face.type === 'wild') {
      total += die.face.value + wildBonusAmount;
    } else if (die.face.type === 'shutout') {
      // Shutout only contributes in block zone defense — handled separately
      if (zone === 'block') total += 5;
    } else if (die.face.type !== 'blank') {
      total += die.face.value;
    }
  }
  return total;
}

// -----------------------------------------------------------
// Apply puck control strip after Wave 1 goal
// -----------------------------------------------------------
export function applyPuckControl(player: PlayerState): {
  stripped: number;
  updatedPlayer: PlayerState;
} {
  const stripped = player.shootTokensCommitted;
  return {
    stripped,
    updatedPlayer: {
      ...player,
      tokens: {
        ...player.tokens,
        shoot: player.tokens.shoot, // tokens in bank stay (only committed stripped)
      },
      shootTokensCommitted: 0,
    },
  };
}

// -----------------------------------------------------------
// Initial combat state
// -----------------------------------------------------------
export function createCombatState(): CombatState {
  return {
    initiativeWinner: null,
    initiativeRolls: null,
    puckControlStripped: false,
  };
}
