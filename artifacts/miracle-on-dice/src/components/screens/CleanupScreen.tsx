import React, { useEffect } from 'react';
import { useGame } from '@/game/context';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export const CleanupScreen: React.FC = () => {
  const { state, dispatch } = useGame();

  useEffect(() => {
    // We could dispatch CLEANUP on mount, but let's let the user read the log and click Next Shift
    // to give them a breather.
    dispatch({ type: 'CLEANUP' });
  }, [dispatch]);

  const handleNext = () => {
    dispatch({ type: 'NEXT_SHIFT' });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-center">
      <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
      <h2 className="text-5xl font-display font-bold text-white uppercase tracking-widest mb-4">
        Shift Complete
      </h2>
      <p className="text-xl text-slate-400 mb-8 max-w-lg">
        Lineups discarded, hands refreshed, tokens capped, and market refilled. Get ready for the next drop of the puck!
      </p>
      
      <Button 
        size="lg" 
        className="h-16 px-16 text-2xl font-display uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(56,189,248,0.3)] hover:scale-105 transition-transform"
        onClick={handleNext}
        data-testid="button-next-shift"
      >
        Next Shift
      </Button>
    </div>
  );
};
