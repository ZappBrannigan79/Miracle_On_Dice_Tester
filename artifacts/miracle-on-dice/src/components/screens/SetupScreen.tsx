import React, { useState } from 'react';
import { useGame } from '@/game/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';

export const SetupScreen: React.FC = () => {
  const { startGame } = useGame();
  const [p1Name, setP1Name] = useState('Home Team');
  const [p2Name, setP2Name] = useState('Away Team');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (p1Name.trim() && p2Name.trim()) {
      startGame([p1Name.trim(), p2Name.trim()]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5 pointer-events-none">
        <Hexagon className="w-[120vw] h-[120vh]" strokeWidth={0.5} />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
        
        <div className="text-center mb-10 relative">
          <h1 className="text-6xl font-display font-bold text-white uppercase tracking-tighter mb-2">
            Miracle<br/>
            <span className="text-primary text-glow-blue">On Dice</span>
          </h1>
          <p className="text-slate-400 tracking-widest text-sm uppercase">2-Player Hockey Deckbuilder</p>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-300 uppercase tracking-widest text-xs">Home Team (Player 1)</Label>
            <Input 
              value={p1Name} 
              onChange={(e) => setP1Name(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white focus-visible:ring-primary h-12 text-lg"
              data-testid="input-p1-name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 uppercase tracking-widest text-xs">Away Team (Player 2)</Label>
            <Input 
              value={p2Name} 
              onChange={(e) => setP2Name(e.target.value)}
              className="bg-slate-950 border-slate-700 text-white focus-visible:ring-destructive h-12 text-lg"
              data-testid="input-p2-name"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-display uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(56,189,248,0.5)]"
            disabled={!p1Name.trim() || !p2Name.trim()}
            data-testid="button-start-game"
          >
            Drop The Puck
          </Button>
        </form>
      </motion.div>
    </div>
  );
};
