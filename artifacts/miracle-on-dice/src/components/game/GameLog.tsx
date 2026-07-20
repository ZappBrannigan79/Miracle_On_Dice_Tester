import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGame } from '@/game/context';
import { cn } from '@/lib/utils';
import { Shield, Target, Zap, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export const GameLog: React.FC = () => {
  const { state } = useGame();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.log, open]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Target className="w-4 h-4 text-destructive" />;
      case 'block': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'event': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'penalty': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <div className="w-1.5 h-1.5 rounded-full bg-slate-600 m-1.5" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'goal': return 'text-destructive font-bold bg-destructive/10 border-l-2 border-destructive';
      case 'block': return 'text-blue-300 bg-blue-900/10 border-l-2 border-blue-500';
      case 'event': return 'text-amber-300 bg-amber-900/10 border-l-2 border-amber-500';
      case 'penalty': return 'text-red-400 bg-red-900/10 border-l-2 border-red-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 w-72 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden shadow-xl z-40 flex flex-col">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-slate-800 hover:bg-slate-700 transition-colors px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 flex justify-between items-center w-full cursor-pointer"
      >
        <span>Game Log</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Shift {state.shift}</span>
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </div>
      </button>
      {open && (
        <ScrollArea className="h-48" ref={scrollRef}>
          <div className="flex flex-col p-2 gap-1">
            {state.log.slice(-50).map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "px-2 py-1.5 rounded flex gap-2 text-sm",
                  getLogColor(entry.type)
                )}
              >
                <div className="mt-0.5 shrink-0">{getLogIcon(entry.type)}</div>
                <div className="leading-tight">{entry.text}</div>
              </div>
            ))}
            {state.log.length === 0 && (
              <div className="text-center text-slate-600 text-sm py-4 italic">
                Awaiting drop of the puck...
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
