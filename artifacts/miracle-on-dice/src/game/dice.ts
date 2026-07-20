// ============================================================
// MIRACLE ON DICE — Dice Face Definitions & Rolling Logic
// ============================================================

import type { DieFace, DieTypeId, PipType } from './types';

// All dice have exactly 6 faces (indices 0-5)
type SixFaces = [DieFace, DieFace, DieFace, DieFace, DieFace, DieFace];

function face(type: PipType, value: number): DieFace {
  return { type, value };
}

// -----------------------------------------------------------
// Die face tables (from rulebook Section IX)
// -----------------------------------------------------------

export const DIE_FACES: Record<DieTypeId, SixFaces> = {
  // ── Forward Dice (Blue) ──────────────────────────────────
  FS: [
    face('energy', 1),
    face('energy', 2),
    face('shoot',  1),
    face('shoot',  1),
    face('wild',   1),
    face('blank',  0),
  ],
  F1: [
    face('energy', 1),
    face('energy', 2),
    face('shoot',  1),
    face('shoot',  2),
    face('wild',   1),
    face('blank',  0),
  ],
  F2: [
    face('energy', 1),
    face('energy', 2),
    face('shoot',  2),
    face('shoot',  1),
    face('wild',   1),
    face('blank',  0),
  ],
  F3: [
    face('energy', 1),
    face('energy', 2),
    face('shoot',  2),
    face('shoot',  2),
    face('wild',   1),
    face('blank',  0),
  ],
  F4: [
    face('energy', 1),
    face('energy', 2),
    face('shoot',  2),
    face('shoot',  2),
    face('wild',   2),
    face('blank',  0),
  ],
  F5: [
    face('energy', 2),
    face('energy', 2),
    face('shoot',  2),
    face('shoot',  3),
    face('wild',   2),
    face('blank',  0),
  ],
  F6: [
    face('energy', 2),
    face('energy', 2),
    face('shoot',  3),
    face('shoot',  3),
    face('wild',   3),
    face('blank',  0),
  ],

  // ── Defenseman Dice (Red) ────────────────────────────────
  DS: [
    face('energy', 1),
    face('energy', 2),
    face('block',  1),
    face('block',  1),
    face('wild',   1),
    face('blank',  0),
  ],
  D1: [
    face('energy', 1),
    face('energy', 2),
    face('block',  1),
    face('block',  2),
    face('wild',   1),
    face('blank',  0),
  ],
  D2: [
    face('energy', 1),
    face('energy', 2),
    face('block',  2),
    face('block',  1),
    face('wild',   1),
    face('blank',  0),
  ],
  D3: [
    face('energy', 1),
    face('energy', 2),
    face('block',  2),
    face('block',  2),
    face('wild',   1),
    face('blank',  0),
  ],
  D4: [
    face('energy', 1),
    face('energy', 2),
    face('block',  2),
    face('block',  2),
    face('wild',   2),
    face('blank',  0),
  ],
  D5: [
    face('energy', 2),
    face('energy', 2),
    face('block',  2),
    face('block',  3),
    face('wild',   2),
    face('blank',  0),
  ],
  D6: [
    face('energy', 2),
    face('energy', 2),
    face('block',  3),
    face('block',  3),
    face('wild',   3),
    face('blank',  0),
  ],

  // ── Goalie Dice (Grey/Black) ─────────────────────────────
  GS: [
    face('block',   1),
    face('block',   1),
    face('block',   1),
    face('block',   1),
    face('block',   2),
    face('shutout', 5), // Shutout = 5 automatic block successes
  ],
  G1: [
    face('block',   1),
    face('block',   1),
    face('block',   1),
    face('block',   2),
    face('block',   2),
    face('shutout', 5),
  ],
  G2: [
    face('block',   1),
    face('block',   1),
    face('block',   2),
    face('block',   2),
    face('block',   2),
    face('shutout', 5),
  ],
  G3: [
    face('block',   1),
    face('block',   2),
    face('block',   2),
    face('block',   2),
    face('block',   2),
    face('shutout', 5),
  ],
  G4: [
    face('block',   2),
    face('block',   2),
    face('block',   2),
    face('block',   2),
    face('block',   2),
    face('shutout', 5),
  ],
  G5: [
    face('block',   2),
    face('block',   2),
    face('block',   2),
    face('block',   3),
    face('block',   3),
    face('shutout', 5),
  ],
  G6: [
    face('block',   2),
    face('block',   3),
    face('block',   3),
    face('block',   3),
    face('block',   3),
    face('shutout', 5),
  ],

  // ── Rookie Die (White) ────────────────────────────────────
  R: [
    face('energy', 1),
    face('energy', 1),
    face('energy', 2),
    face('shoot',  1),
    face('block',  1),
    face('blank',  0),
  ],

  // ── Combat Die (custom d6: 2,2,1,1,0,0) ──────────────────
  // Used for BOTH attack rolls and block rolls in Phase 7
  COMBAT: [
    face('shoot', 2),
    face('shoot', 2),
    face('shoot', 1),
    face('shoot', 1),
    face('shoot', 0),
    face('shoot', 0),
  ],
};

// -----------------------------------------------------------
// Roll a single die — returns the face index (0-5)
// -----------------------------------------------------------
export function rollDie(): number {
  return Math.floor(Math.random() * 6);
}

// -----------------------------------------------------------
// Roll and return the resolved face
// -----------------------------------------------------------
export function rollDieFace(dieTypeId: DieTypeId): { faceIndex: number; face: DieFace } {
  const faceIndex = rollDie();
  return { faceIndex, face: DIE_FACES[dieTypeId][faceIndex] };
}

// -----------------------------------------------------------
// Roll a standard d6 (1-6) — used for Faceoff and Initiative
// -----------------------------------------------------------
export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// -----------------------------------------------------------
// Roll N combat dice and return sum of their pip values
// -----------------------------------------------------------
export function rollCombatDice(count: number): { rolls: number[]; total: number } {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    const { face: f } = rollDieFace('COMBAT');
    rolls.push(f.value);
  }
  const total = rolls.reduce((sum, v) => sum + v, 0);
  return { rolls, total };
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

/** Resolve the pip value for a rolled die face, accounting for wild assignment */
export function resolvedPipValue(face: DieFace, wildAssignedAs?: 'energy' | 'shoot' | 'block'): number {
  if (face.type === 'shutout') return 5;
  if (face.type === 'blank') return 0;
  return face.value;
}

/** Is this die type a goalie die? */
export function isGoalieDie(id: DieTypeId): boolean {
  return id === 'GS' || id.startsWith('G');
}

/** Is this die type a forward die? */
export function isForwardDie(id: DieTypeId): boolean {
  return id === 'FS' || (id.startsWith('F') && id !== 'FS');
}

/** Is this die type a defenseman die? */
export function isDefenseDie(id: DieTypeId): boolean {
  return id === 'DS' || (id.startsWith('D') && id !== 'DS');
}
