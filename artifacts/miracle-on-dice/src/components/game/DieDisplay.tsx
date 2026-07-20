import React from 'react';

interface DieDisplayProps {
  face?: any;
  value?: any;
  die?: any;
  [key: string]: any;
}

export const DieDisplay: React.FC<DieDisplayProps> = (props) => {
  return (
    <div className="w-16 h-16 bg-slate-900 border-2 border-amber-400 text-white text-[9px] flex flex-col items-center justify-center p-1 font-mono text-center overflow-hidden rounded">
      <span className="text-amber-400 font-bold">RAW DATA:</span>
      <span>{JSON.stringify(props)}</span>
    </div>
  );
};
