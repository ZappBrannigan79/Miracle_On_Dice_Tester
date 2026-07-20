// ============================================================
// MIRACLE ON DICE — Card Definitions (from nandeckhockey.csv)
// ============================================================

import type { Card, AbilityTrigger, AbilityEffect } from './types';

// -----------------------------------------------------------
// Helper builders
// -----------------------------------------------------------
function noEffect(): AbilityEffect { return { type: 'none' }; }

function ab(
  when: AbilityTrigger['when'],
  description: string,
  effect: AbilityEffect = noEffect(),
): AbilityTrigger {
  return { when, effect, description };
}

function fwd(
  id: string, firstName: string, lastName: string,
  tier: 2|3|4|5|6, cost: number, tradeValue: number,
  abilities: AbilityTrigger[] = [],
): Card {
  return {
    id, name: `${firstName} ${lastName}`, category: 'forward',
    tier, isStarter: false, cost, tradeValue,
    dieTypeId: `F${tier}` as any, abilities,
  };
}

function def(
  id: string, firstName: string, lastName: string,
  tier: 2|3|4|5|6, cost: number, tradeValue: number,
  abilities: AbilityTrigger[] = [],
): Card {
  return {
    id, name: `${firstName} ${lastName}`, category: 'defenseman',
    tier, isStarter: false, cost, tradeValue,
    dieTypeId: `D${tier}` as any, abilities,
  };
}

function gol(
  id: string, firstName: string, lastName: string,
  tier: 2|3|4|5|6, cost: number, tradeValue: number,
  abilities: AbilityTrigger[] = [],
): Card {
  return {
    id, name: `${firstName} ${lastName}`, category: 'goalie',
    tier, isStarter: false, cost, tradeValue,
    dieTypeId: `G${tier}` as any, abilities,
  };
}

// -----------------------------------------------------------
// SPECIAL CARDS
// -----------------------------------------------------------
export const PENALTY_CARD: Card = {
  id: 'penalty', name: 'Penalty', category: 'penalty',
  tier: 0, isStarter: false, cost: 0, tradeValue: 0,
  dieTypeId: 'R', abilities: [
    ab('passive', 'This card must be played face-up. (Unless another penalty card is already face-up on your board.)'),
  ],
};

export const ROOKIE_CARD_TEMPLATE: Card = {
  id: 'rookie', name: 'Rookie', category: 'rookie',
  tier: 0, isStarter: false, cost: 0, tradeValue: 0,
  dieTypeId: 'R', abilities: [],
};

export const STARTER_FORWARD: Card = {
  id: 'fs', name: 'Starter Forward', category: 'forward',
  tier: 0, isStarter: true, cost: 0, tradeValue: 1,
  dieTypeId: 'FS', abilities: [],
};

export const STARTER_DEFENSEMAN: Card = {
  id: 'ds', name: 'Starter Defenseman', category: 'defenseman',
  tier: 0, isStarter: true, cost: 0, tradeValue: 1,
  dieTypeId: 'DS', abilities: [],
};

export const STARTER_GOALIE: Card = {
  id: 'gs', name: 'Starter Goalie', category: 'goalie',
  tier: 0, isStarter: true, cost: 0, tradeValue: 1,
  dieTypeId: 'GS', abilities: [
    ab('passive', 'This card starts in play.'),
  ],
};

// -----------------------------------------------------------
// FORWARD — TIER 2  (cost = draft, tradeValue = trade)
// -----------------------------------------------------------
export const F2_CARDS: Card[] = [
  fwd('f2_jack_sundin', 'Jack', 'Sundin', 2, 2, 4, [
    ab('on_score', 'When you score a goal this turn, gain 1 ENERGY token.', { type: 'gain_energy', amount: 1 }),
  ]),
  fwd('f2_mats_koivu', 'Mats', 'Koivu', 2, 2, 4, [
    ab('initial_reveal', 'If you have 3 face-up forwards, gain 1 ENERGY token.', { type: 'gain_energy', amount: 1 }),
  ]),
  fwd('f2_sebastian_recchi', 'Sebastian', 'Recchi', 2, 1, 3),
  fwd('f2_lanny_goulet', 'Lanny', 'Goulet', 2, 1, 3),
  fwd('f2_nick_larmer', 'Nick', 'Larmer', 2, 2, 4, [
    ab('final_reveal', 'Gain 1 ENERGY token for each of your dice that are showing WILD pip(s).'),
  ]),
  fwd('f2_tim_amonte', 'Tim', 'Amonte', 2, 3, 5, [
    ab('passive', 'F2/D2 Deployment: May be played face-up in either a Forward OR Defenseman slot.'),
  ]),
  fwd('f2_bo_karlsson', 'Bo', 'Karlsson', 2, 2, 4, [
    ab('initial_reveal', 'Gain 1 ENERGY token.', { type: 'gain_energy', amount: 1 }),
  ]),
  fwd('f2_sam_getzlaf', 'Sam', 'Getzlaf', 2, 3, 5, [
    ab('final_reveal', 'If you have 3 or more dice showing ENERGY pip(s), add a penalty card to opponent\'s discard pile.'),
  ]),
];

// -----------------------------------------------------------
// FORWARD — TIER 3
// -----------------------------------------------------------
export const F3_CARDS: Card[] = [
  fwd('f3_marian_shaw', 'Marian', 'Shaw', 3, 5, 7, [
    ab('passive', 'F3/D3 Deployment: May be played face-up in either a Forward OR Defenseman slot.'),
  ]),
  fwd('f3_kirill_kariya', 'Kirill', 'Kariya', 3, 4, 6, [
    ab('final_reveal', 'If you have 3 or more (non-WILD) SHOOT pip(s), gain 1 SHOOT token.', { type: 'gain_shoot', amount: 1 }),
  ]),
  fwd('f3_cole_malkin', 'Cole', 'Malkin', 3, 4, 6, [
    ab('initial_reveal', 'If opponent has 1 or fewer defensemen face-up, gain 1 SHOOT token.', { type: 'gain_shoot', amount: 1 }),
  ]),
  fwd('f3_mikko_hossa', 'Mikko', 'Hossa', 3, 4, 6, [
    ab('on_score', 'When you score a goal this turn, draw 1 extra card next turn.', { type: 'draw_card', amount: 1 }),
  ]),
  fwd('f3_lucas_thornton', 'Lucas', 'Thornton', 3, 4, 6, [
    ab('final_reveal', 'If you have 3 or more (non-WILD) SHOOT pip(s), opponent loses 1 BLOCK token.'),
  ]),
  fwd('f3_filip_robitaille', 'Filip', 'Robitaille', 3, 3, 5),
  fwd('f3_bernie_cook', 'Bernie', 'Cook', 3, 3, 5),
  fwd('f3_robert_shanahan', 'Robert', 'Shanahan', 3, 4, 6, [
    ab('final_reveal', 'If another face-up Forward rolls SHOOT pip(s), gain 1 SHOOT token.', { type: 'gain_shoot', amount: 1 }),
  ]),
  fwd('f3_wyatt_francis', 'Wyatt', 'Francis', 3, 4, 6, [
    ab('final_reveal', 'If you lose Shooting Initiative, gain 1 BLOCK token.', { type: 'gain_block', amount: 1 }),
  ]),
  fwd('f3_dylan_sakic', 'Dylan', 'Sakic', 3, 5, 7, [
    ab('final_reveal', 'If you have 3 or more dice showing WILD pip(s), add a penalty card to opponent\'s discard pile.'),
  ]),
];

// -----------------------------------------------------------
// FORWARD — TIER 4
// -----------------------------------------------------------
export const F4_CARDS: Card[] = [
  fwd('f4_andrew_hossa', 'Andrew', 'Hossa', 4, 7, 10, [
    ab('passive', 'F4/D4 Deployment: May be played face-up in either a Forward OR Defenseman slot.'),
  ]),
  fwd('f4_brayden_kurri', 'Brayden', 'Kurri', 4, 6, 9, [
    ab('on_score', 'When you score a goal this turn, gain 2 ENERGY tokens.', { type: 'gain_energy', amount: 2 }),
  ]),
  fwd('f4_eias_datsyuk', 'Eias', 'Datsyuk', 4, 6, 9, [
    ab('final_reveal', 'If all 3 of your forwards are face-up and showing SHOOT pip(s) on their dice, gain 2 SHOOT tokens.', { type: 'gain_shoot', amount: 2 }),
  ]),
  fwd('f4_max_bossy', 'Max', 'Bossy', 4, 6, 9, [
    ab('initial_reveal', 'Gain 1 SHOOT token. Opponent cannot use WILD pip(s) for BLOCK.', { type: 'gain_shoot', amount: 1 }),
  ]),
  fwd('f4_mitch_richard', 'Mitch', 'Richard', 4, 6, 9, [
    ab('final_reveal', 'If you have 4 or more (non-WILD) SHOOT pip(s), gain 2 SHOOT tokens.', { type: 'gain_shoot', amount: 2 }),
  ]),
  fwd('f4_kyle_mogilny', 'Kyle', 'Mogilny', 4, 6, 9, [
    ab('initial_reveal', 'Gain 2 SHOOT tokens if this is the 3rd Period.', { type: 'gain_shoot', amount: 2 }),
  ]),
  fwd('f4_guy_domi', 'Guy', 'Domi', 4, 5, 8),
  fwd('f4_dickie_forsberg', 'Dickie', 'Forsberg', 4, 5, 8),
  fwd('f4_travis_bedard', 'Travis', 'Bedard', 4, 6, 9, [
    ab('initial_reveal', 'You may reroll any of your face-up Forward dice one extra time.'),
  ]),
  fwd('f4_william_sharp', 'William', 'Sharp', 4, 6, 9, [
    ab('final_reveal', 'Opponent\'s Goalie (SO) faces have no effect this turn.'),
  ]),
  fwd('f4_jake_modano', 'Jake', 'Modano', 4, 7, 10, [
    ab('final_reveal', 'If you have 2 or more dice showing ENERGY pip(s), add a penalty card to opponent\'s discard pile.'),
  ]),
];

// -----------------------------------------------------------
// FORWARD — TIER 5
// -----------------------------------------------------------
export const F5_CARDS: Card[] = [
  fwd('f5_auston_mcdonald', 'Auston', 'McDonald', 5, 7, 10),
  fwd('f5_jack_crosby', 'Jack', 'Crosby', 5, 7, 10),
  fwd('f5_mario_lindros', 'Mario', 'Lindros', 5, 8, 11, [
    ab('on_score', 'When you score a goal this turn, gain 3 ENERGY tokens.', { type: 'gain_energy', amount: 3 }),
  ]),
  fwd('f5_nathan_jagr', 'Nathan', 'Jagr', 5, 8, 11, [
    ab('initial_reveal', 'Gain 2 ENERGY tokens. If all of your forwards are face-up, gain 1 SHOOT token.', { type: 'gain_energy', amount: 2 }),
  ]),
  fwd('f5_matthew_lafleur', 'Matthew', 'Lafleur', 5, 8, 11, [
    ab('initial_reveal', 'Gain 3 SHOOT tokens if this is the 3rd Period.', { type: 'gain_shoot', amount: 3 }),
  ]),
  fwd('f5_brady_toews', 'Brady', 'Toews', 5, 8, 11, [
    ab('final_reveal', 'If you have 5 or more (non-WILD) SHOOT pip(s), gain 2 SHOOT tokens.', { type: 'gain_shoot', amount: 2 }),
  ]),
  fwd('f5_nikita_fedorov', 'Nikita', 'Fedorov', 5, 8, 11, [
    ab('final_reveal', 'If you win Shooting Initiative, treat your (F5) dice pip(s) as WILD. You may move any of your (F5) dice.', { type: 'wild_bonus', bonus: 1 }),
  ]),
  fwd('f5_artemi_selanne', 'Artemi', 'Selanne', 5, 8, 11, [
    ab('initial_reveal', 'If trailing in the game, gain 2 SHOOT tokens.', { type: 'gain_shoot', amount: 2 }),
  ]),
  fwd('f5_craig_ovechkin', 'Craig', 'Ovechkin', 5, 8, 11, [
    ab('initial_reveal', 'If trailing or tied, gain 1 SHOOT token and 1 BLOCK token.'),
  ]),
];

// -----------------------------------------------------------
// FORWARD — TIER 6
// -----------------------------------------------------------
export const F6_CARDS: Card[] = [
  fwd('f6_stan_connor', 'Stan', 'Connor', 6, 10, 14, [
    ab('initial_reveal', 'Add a penalty card to opponent\'s discard pile unless they choose to lose 2 tokens of their choice.'),
  ]),
  fwd('f6_connor_sakic', 'Connor', 'Sakic', 6, 10, 14, [
    ab('initial_reveal', 'Opponent can\'t assign WILD pip(s) to BLOCK this turn.'),
  ]),
  fwd('f6_gordie_kane', 'Gordie', 'Kane', 6, 10, 14, [
    ab('passive', 'Your (non-WILD) SHOOT pip(s) are worth +1.', { type: 'shoot_pip_bonus', bonus: 1 }),
  ]),
  fwd('f6_sidney_hull', 'Sidney', 'Hull', 6, 10, 14, [
    ab('initial_reveal', 'Gain 2 SHOOT tokens. Opponent loses 1 BLOCK token.', { type: 'gain_shoot', amount: 2 }),
  ]),
  fwd('f6_brent_messier', 'Brent', 'Messier', 6, 9, 13),
  fwd('f6_jean_mikita', 'Jean', 'Mikita', 6, 9, 13),
];

// -----------------------------------------------------------
// DEFENSEMAN — TIER 2
// -----------------------------------------------------------
export const D2_CARDS: Card[] = [
  def('d2_noah_seabrook', 'Noah', 'Seabrook', 2, 2, 4, [
    ab('on_block', 'When you BLOCK a goal this turn, gain 1 ENERGY token.', { type: 'gain_energy', amount: 1 }),
  ]),
  def('d2_jacob_seider', 'Jacob', 'Seider', 2, 2, 4, [
    ab('final_reveal', 'If opponent has 4 or more (non-WILD) SHOOT pip(s), gain 1 BLOCK token.', { type: 'gain_block', amount: 1 }),
  ]),
  def('d2_owen_dahlin', 'Owen', 'Dahlin', 2, 2, 4, [
    ab('initial_reveal', 'If both of your defensemen are face-up, gain 1 ENERGY token.', { type: 'gain_energy', amount: 1 }),
  ]),
  def('d2_luke_clapper', 'Luke', 'Clapper', 2, 1, 3),
  def('d2_red_clapper', 'Red', 'Clapper', 2, 1, 3),
  def('d2_alex_bouchard', 'Alex', 'Bouchard', 2, 3, 5, [
    ab('passive', 'D2/F2 Deployment: May be played face-up in either a Defenseman OR Forward slot.'),
  ]),
  def('d2_travis_nurse', 'Travis', 'Nurse', 2, 2, 4, [
    ab('final_reveal', 'If you win Shooting Initiative, gain 1 ENERGY token.', { type: 'gain_energy', amount: 1 }),
  ]),
  def('d2_seth_faulk', 'Seth', 'Faulk', 2, 3, 5, [
    ab('final_reveal', 'If you have 3 or more dice showing ENERGY pip(s), add a penalty card to opponent\'s discard pile.'),
  ]),
];

// -----------------------------------------------------------
// DEFENSEMAN — TIER 3
// -----------------------------------------------------------
export const D3_CARDS: Card[] = [
  def('d3_doug_campbell', 'Doug', 'Campbell', 3, 5, 7, [
    ab('passive', 'D3/F3 Deployment: May be played face-up in either a Defenseman OR Forward slot.'),
  ]),
  def('d3_thomas_theodore', 'Thomas', 'Theodore', 3, 4, 6, [
    ab('final_reveal', 'If you roll 2+ BLOCK pip(s), gain 1 BLOCK token.', { type: 'gain_block', amount: 1 }),
  ]),
  def('d3_brock_hutson', 'Brock', 'Hutson', 3, 4, 6, [
    ab('initial_reveal', 'If both of your defensemen are face-up, gain 1 BLOCK token.', { type: 'gain_block', amount: 1 }),
  ]),
  def('d3_noah_hutson', 'Noah', 'Hutson', 3, 4, 6, [
    ab('final_reveal', 'Gain 1 SHOOT token.', { type: 'gain_shoot', amount: 1 }),
  ]),
  def('d3_lane_bourque', 'Lane', 'Bourque', 3, 4, 6, [
    ab('final_reveal', 'Opponent loses 1 token of their choice.'),
  ]),
  def('d3_brandon_carlson', 'Brandon', 'Carlson', 3, 3, 5),
  def('d3_pierre_clancy', 'Pierre', 'Clancy', 3, 3, 5),
  def('d3_shea_burns', 'Shea', 'Burns', 3, 4, 6, [
    ab('initial_reveal', 'Negate one opponent\'s "Final Reveal" ability this turn.'),
  ]),
  def('d3_dougie_letang', 'Dougie', 'Letang', 3, 5, 7, [
    ab('final_reveal', 'If you have 3 or more dice showing WILD pip(s), add a penalty card to opponent\'s discard pile.'),
  ]),
  def('d3_victor_ruff', 'Victor', 'Ruff', 3, 4, 6, [
    ab('final_reveal', 'If you have 2 or more (non-WILD) BLOCK pip(s), opponent loses 1 ENERGY token.'),
  ]),
];

// -----------------------------------------------------------
// DEFENSEMAN — TIER 4
// -----------------------------------------------------------
export const D4_CARDS: Card[] = [
  def('d4_johnny_harvey', 'Johnny', 'Harvey', 4, 7, 10, [
    ab('passive', 'D4/F4 Deployment: May be played face-up in either a Defenseman OR Forward slot.'),
  ]),
  def('d4_drew_coffey', 'Drew', 'Coffey', 4, 6, 9, [
    ab('initial_reveal', 'Opponent loses 1 SHOOT token.'),
  ]),
  def('d4_evan_fox', 'Evan', 'Fox', 4, 6, 9, [
    ab('final_reveal', 'If both of your defenders are face-up and showing BLOCK pip(s) on their dice, gain 2 BLOCK tokens.', { type: 'gain_block', amount: 2 }),
  ]),
  def('d4_zach_housley', 'Zach', 'Housley', 4, 6, 9, [
    ab('passive', 'Your WILD pip(s) are worth +1.', { type: 'wild_bonus', bonus: 1 }),
  ]),
  def('d4_lane_faber', 'Lane', 'Faber', 4, 6, 9, [
    ab('on_block', 'When you BLOCK a goal this turn, gain 2 ENERGY tokens.', { type: 'gain_energy', amount: 2 }),
  ]),
  def('d4_moritz_suter', 'Moritz', 'Suter', 4, 6, 9, [
    ab('initial_reveal', 'If both of your defensemen are face-up, gain 1 SHOOT token and 1 BLOCK token.'),
  ]),
  def('d4_john_blake', 'John', 'Blake', 4, 5, 8),
  def('d4_brad_clapper', 'Brad', 'Clapper', 4, 5, 8),
  def('d4_brent_weber', 'Brent', 'Weber', 4, 6, 9, [
    ab('on_block', 'When you BLOCK a goal this turn, opponent loses 2 ENERGY tokens.'),
  ]),
  def('d4_kris_clarke', 'Kris', 'Clarke', 4, 6, 9, [
    ab('final_reveal', 'If you have more pip(s) assigned to SHOOT than opponent, gain 2 SHOOT tokens.', { type: 'gain_shoot', amount: 2 }),
  ]),
  def('d4_pete_hamrlik', 'Pete', 'Hamrlik', 4, 6, 9, [
    ab('on_block', 'When you BLOCK a goal this turn, gain 1 SHOOT token.', { type: 'gain_shoot', amount: 1 }),
  ]),
];

// -----------------------------------------------------------
// DEFENSEMAN — TIER 5
// -----------------------------------------------------------
export const D5_CARDS: Card[] = [
  def('d5_adam_potvin', 'Adam', 'Potvin', 5, 9, 12, [
    ab('final_reveal', 'If you have 2 or more dice showing WILD pip(s), add a penalty card to opponent\'s discard pile.'),
  ]),
  def('d5_rasmus_leetch', 'Rasmus', 'Leetch', 5, 8, 11, [
    ab('initial_reveal', 'Opponent cannot gain SHOOT OR BLOCK tokens this turn.'),
  ]),
  def('d5_charlie_subban', 'Charlie', 'Subban', 5, 8, 11, [
    ab('initial_reveal', 'Gain 1 BLOCK token for each face-up forward opponent has in play.', { type: 'gain_block', amount: 1 }),
  ]),
  def('d5_roman_pronger', 'Roman', 'Pronger', 5, 8, 11, [
    ab('initial_reveal', 'Gain 2 BLOCK tokens.', { type: 'gain_block', amount: 2 }),
  ]),
  def('d5_seth_macinnis', 'Seth', 'MacInnis', 5, 8, 11, [
    ab('initial_reveal', 'Opponent loses 2 ENERGY tokens.'),
  ]),
  def('d5_darnell_stevens', 'Darnell', 'Stevens', 5, 7, 10),
  def('d5_doug_park', 'Doug', 'Park', 5, 7, 10),
  def('d5_neal_chara', 'Neal', 'Chara', 5, 8, 11, [
    ab('initial_reveal', 'Opponent can\'t assign WILD pip(s) to SHOOT this turn.'),
  ]),
  def('d5_travis_hedman', 'Travis', 'Hedman', 5, 8, 11, [
    ab('final_reveal', 'Spend 2 ENERGY tokens to gain 2 SHOOT tokens.'),
  ]),
];

// -----------------------------------------------------------
// DEFENSEMAN — TIER 6
// -----------------------------------------------------------
export const D6_CARDS: Card[] = [
  def('d6_quinn_orr', 'Quinn', 'Orr', 6, 10, 14, [
    ab('final_reveal', 'Gain 1 SHOOT token for every face-up Forward you have in play.', { type: 'gain_shoot', amount: 1 }),
  ]),
  def('d6_miro_bourque', 'Miro', 'Bourque', 6, 10, 14, [
    ab('initial_reveal', 'Gain 1 ENERGY token for each face-up card you have in play.', { type: 'gain_energy', amount: 1 }),
  ]),
  def('d6_cale_lidstrom', 'Cale', 'Lidstrom', 6, 10, 14, [
    ab('passive', 'Your (non-WILD) BLOCK pip(s) are worth +1.', { type: 'shoot_pip_bonus', bonus: 1 }),
  ]),
  def('d6_ray_chelios', 'Ray', 'Chelios', 6, 10, 14, [
    ab('initial_reveal', 'Gain 2 BLOCK tokens. Opponent loses 1 token of their choice.', { type: 'gain_block', amount: 2 }),
  ]),
  def('d6_al_shore', 'Al', 'Shore', 6, 9, 13),
  def('d6_eddie_horton', 'Eddie', 'Horton', 6, 9, 13),
];

// -----------------------------------------------------------
// GOALIE — TIER 2
// -----------------------------------------------------------
export const G2_CARDS: Card[] = [
  gol('g2_stuart_hall', 'Stuart', 'Hall', 2, 2, 4, [
    ab('on_block', 'When you BLOCK a goal this turn, gain 1 BLOCK token.', { type: 'gain_block', amount: 1 }),
  ]),
  gol('g2_patrick_durnan', 'Patrick', 'Durnan', 2, 2, 4, [
    ab('on_block', 'When you BLOCK a goal this turn, gain 1 ENERGY token.', { type: 'gain_energy', amount: 1 }),
  ]),
  gol('g2_glenn_parent', 'Glenn', 'Parent', 2, 1, 3),
  gol('g2_terry_vernon', 'Terry', 'Vernon', 2, 1, 3),
];

// -----------------------------------------------------------
// GOALIE — TIER 3
// -----------------------------------------------------------
export const G3_CARDS: Card[] = [
  gol('g3_connor_hextall', 'Connor', 'Hextall', 3, 4, 6, [
    ab('final_reveal', 'If you have 3 or more (non-WILD) BLOCK pip(s), gain 1 BLOCK token.', { type: 'gain_block', amount: 1 }),
  ]),
  gol('g3_martin_plante', 'Martin', 'Plante', 3, 4, 6, [
    ab('final_reveal', 'If opponent has 5 or more (non-WILD) SHOOT pip(s), gain 1 BLOCK token.', { type: 'gain_block', amount: 1 }),
  ]),
  gol('g3_jordan_belfour', 'Jordan', 'Belfour', 3, 3, 5),
  gol('g3_dominik_swayman', 'Dominik', 'Swayman', 3, 3, 5),
];

// -----------------------------------------------------------
// GOALIE — TIER 4
// -----------------------------------------------------------
export const G4_CARDS: Card[] = [
  gol('g4_jeremy_sawchuk', 'Jeremy', 'Sawchuk', 4, 7, 10, [
    ab('final_reveal', 'If you have 2 or more dice showing ENERGY pip(s), add a penalty card to opponent\'s discard pile.'),
  ]),
  gol('g4_jake_luongo', 'Jake', 'Luongo', 4, 6, 9, [
    ab('final_reveal', 'If you have 4 or more (non-WILD) BLOCK pip(s), gain 1 BLOCK token.', { type: 'gain_block', amount: 1 }),
  ]),
  gol('g4_jacques_joseph', 'Jacques', 'Joseph', 4, 6, 9, [
    ab('final_reveal', 'You may reroll this die once during Final Reveal.'),
  ]),
  gol('g4_billy_fuhr', 'Billy', 'Fuhr', 4, 5, 8),
];

// -----------------------------------------------------------
// GOALIE — TIER 5
// -----------------------------------------------------------
export const G5_CARDS: Card[] = [
  gol('g5_carey_crawford', 'Carey', 'Crawford', 5, 9, 12, [
    ab('final_reveal', 'If you have 2 or more dice showing WILD pip(s), add a penalty card to opponent\'s discard pile.'),
  ]),
  gol('g5_jacob_dryden', 'Jacob', 'Dryden', 5, 8, 11, [
    ab('on_block', 'When you BLOCK a goal this turn, gain 1 BLOCK token.', { type: 'gain_block', amount: 1 }),
  ]),
  gol('g5_curtis_belfour', 'Curtis', 'Belfour', 5, 8, 11, [
    ab('final_reveal', 'If this die shows (SO), gain 2 ENERGY tokens.', { type: 'gain_energy', amount: 2 }),
  ]),
  gol('g5_grant_smith', 'Grant', 'Smith', 5, 7, 10),
];

// -----------------------------------------------------------
// GOALIE — TIER 6
// -----------------------------------------------------------
export const G6_CARDS: Card[] = [
  gol('g6_igor_hasek', 'Igor', 'Hasek', 6, 9, 13),
  gol('g6_malcolm_roy', 'Malcolm', 'Roy', 6, 10, 14, [
    ab('final_reveal', 'If opponent scores, you may still use your assigned SHOOT tokens on your shot.'),
  ]),
  gol('g6_corey_broduer', 'Corey', 'Broduer', 6, 10, 14, [
    ab('final_reveal', 'If this die shows BLOCK pip(s), opponent loses their placed SHOOT tokens.'),
  ]),
  gol('g6_frank_richter', 'Frank', 'Richter', 6, 9, 13, [
    ab('final_reveal', 'If opponent has 3 or more placed SHOOT tokens, gain 1 BLOCK token.', { type: 'gain_block', amount: 1 }),
  ]),
];

// -----------------------------------------------------------
// All market-purchasable cards
// -----------------------------------------------------------
export const ALL_MARKET_CARDS: Card[] = [
  ...F2_CARDS, ...F3_CARDS, ...F4_CARDS, ...F5_CARDS, ...F6_CARDS,
  ...D2_CARDS, ...D3_CARDS, ...D4_CARDS, ...D5_CARDS, ...D6_CARDS,
  ...G2_CARDS, ...G3_CARDS, ...G4_CARDS, ...G5_CARDS, ...G6_CARDS,
];

// -----------------------------------------------------------
// Build a starting deck for one player
// 5 Rookies + 3 Starter Forwards + 2 Starter Defensemen
// -----------------------------------------------------------
export function buildStartingDeck(playerId: 0 | 1): Card[] {
  const p = playerId;
  const rookies: Card[] = Array.from({ length: 5 }, (_, i) => ({
    ...ROOKIE_CARD_TEMPLATE,
    id: `rookie_p${p}_${i}`,
  }));
  const forwards: Card[] = Array.from({ length: 3 }, (_, i) => ({
    ...STARTER_FORWARD,
    id: `fs_p${p}_${i}`,
  }));
  const dmen: Card[] = Array.from({ length: 2 }, (_, i) => ({
    ...STARTER_DEFENSEMAN,
    id: `ds_p${p}_${i}`,
  }));
  return [...rookies, ...forwards, ...dmen];
}

// -----------------------------------------------------------
// Build penalty supply (12 copies)
// -----------------------------------------------------------
export function buildPenaltySupply(): Card[] {
  return Array.from({ length: 12 }, (_, i) => ({
    ...PENALTY_CARD,
    id: `penalty_${i}`,
  }));
}

// -----------------------------------------------------------
// Shuffle utility
// -----------------------------------------------------------
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
