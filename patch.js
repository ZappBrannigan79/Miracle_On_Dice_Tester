const fs = require('fs');
let code = fs.readFileSync('artifacts/miracle-on-dice/src/game/engine.ts', 'utf8');
code = code.replace(
  "case 'END_BUY_PHASE': {",
  "case 'END_BUY_PHASE': {\n      const { playerId } = action;\n      const logText = `${state.players[playerId].name} ends their buy phase.`;\n      const hasOtherPlayerEnded = state.log.slice(-10).some(l => l.text.includes('ends their buy phase'));\n      if (hasOtherPlayerEnded) {\n        return { ...state, phase: 'phase9_cleanup', buyPhaseActivePlayer: null, log: [...state.log, makeLog('phase8_buy', state.shift, state.period, logText)] };\n      }\n      return { ...state, buyPhaseActivePlayer: playerId === 0 ? 1 : 0, log: [...state.log, makeLog('phase8_buy', state.shift, state.period, logText)] };\n    }\n    case 'DUMMY_END_BUY_PHASE_OLD': {"
);
fs.writeFileSync('artifacts/miracle-on-dice/src/game/engine.ts', code);
