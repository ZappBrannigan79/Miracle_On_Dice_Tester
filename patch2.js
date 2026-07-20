const fs = require('fs');
let code = fs.readFileSync('artifacts/miracle-on-dice/src/pages/GameApp.tsx', 'utf8');
code = code.replace(
  "case 'phase4_initial_reveal': \n        // Initial reveal is handled synchronously or bypassed. Let's just dispatch to Phase 5.\n        // Or if we get stuck here, render a catch to move to 5.\n        dispatch({ type: 'CONFIRM_ROLL_ASSIGN', playerId: 0 }); // Hack to advance\n        return null;",
  "case 'phase4_initial_reveal': \n        // Since we skip Phase 4 straight to Phase 5 via reducer now\n        return null;"
);
fs.writeFileSync('artifacts/miracle-on-dice/src/pages/GameApp.tsx', code);
