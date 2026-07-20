import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GameProvider } from '@/game/context';

// The game UI is implemented in src/pages/GameApp.tsx by the design subagent
import GameApp from '@/pages/GameApp';

function App() {
  return (
    <TooltipProvider>
      <GameProvider>
        <GameApp />
        <Toaster />
      </GameProvider>
    </TooltipProvider>
  );
}

export default App;
