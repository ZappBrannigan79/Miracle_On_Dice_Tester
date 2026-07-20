import React from 'react';
import { useGame } from '@/game/context';
import { HUD } from '@/components/game/HUD';
import { GameLog } from '@/components/game/GameLog';
import { SetupScreen } from '@/components/screens/SetupScreen';
import { FaceoffScreen } from '@/components/screens/FaceoffScreen';
import { TurnEventScreen } from '@/components/screens/TurnEventScreen';
import { LineupScreen } from '@/components/screens/LineupScreen';
import { RollAssignScreen } from '@/components/screens/RollAssignScreen';
import { FinalRevealScreen } from '@/components/screens/FinalRevealScreen';
import { ShootingPhaseScreen } from '@/components/screens/ShootingPhaseScreen';
import { BuyPhaseScreen } from '@/components/screens/BuyPhaseScreen';
import { CleanupScreen } from '@/components/screens/CleanupScreen';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

export default function GameApp() {
  const { state, dispatch } = useGame();

  const renderPhase = () => {
    switch (state.phase) {
      case 'setup': return <SetupScreen />;
      case 'phase1_faceoff': return <FaceoffScreen />;
      case 'phase2_turn_event': return <TurnEventScreen />;
      case 'phase3_lineup': return <LineupScreen />;
      case 'phase4_initial_reveal': 
        // Since we skip Phase 4 straight to Phase 5 via reducer now
        return null;
      case 'phase5_roll_assign': return <RollAssignScreen />;
      case 'phase6_final_reveal': return <FinalRevealScreen />;
      case 'phase7_shooting': 
      case 'phase7_wave1_defense':
      case 'phase7_wave1_resolve':
      case 'phase7_wave2_defense':
      case 'phase7_wave2_resolve':
        return <ShootingPhaseScreen />;
      case 'phase8_buy': return <BuyPhaseScreen />;
      case 'phase9_cleanup': return <CleanupScreen />;
      
      case 'intermission':
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
            <h1 className="text-6xl font-display font-bold text-white uppercase tracking-widest mb-6">End of Period</h1>
            <Button size="lg" className="h-16 px-12 text-2xl font-display uppercase" onClick={() => dispatch({ type: 'NEXT_SHIFT' })}>
              Start Next Period
            </Button>
          </div>
        );
        
      case 'overtime':
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
            <h1 className="text-6xl font-display font-bold text-amber-500 uppercase tracking-widest mb-6 animate-pulse">SUDDEN DEATH OVERTIME</h1>
            <Button size="lg" className="h-16 px-12 text-2xl font-display uppercase bg-amber-600" onClick={() => dispatch({ type: 'ENTER_OVERTIME' })}>
              Drop The Puck
            </Button>
          </div>
        );
        
      case 'game_over':
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
            <Trophy className="w-32 h-32 text-amber-400 mb-8" />
            <h1 className="text-7xl font-display font-bold text-white uppercase tracking-widest mb-4">Game Over</h1>
            {state.winner === 'tie' ? (
              <h2 className="text-4xl text-slate-400 uppercase tracking-widest mb-12">It's a Tie!</h2>
            ) : (
              <h2 className="text-4xl text-primary font-bold uppercase tracking-widest mb-12">
                {state.players[state.winner as number]?.name} Wins!
              </h2>
            )}
            <Button size="lg" className="h-16 px-12 text-2xl font-display uppercase bg-slate-800 hover:bg-slate-700 text-white" onClick={() => dispatch({ type: 'RESET_GAME' })}>
              Play Again
            </Button>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center text-white">
            Unknown phase: {state.phase}
          </div>
        );
    }
  };

  return (
    <div className="w-full min-h-[100dvh] flex flex-col bg-slate-950 overflow-hidden font-sans text-slate-200">
      <HUD />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {renderPhase()}
      </main>
      {state.phase !== 'setup' && state.phase !== 'game_over' && <GameLog />}
    </div>
  );
}
