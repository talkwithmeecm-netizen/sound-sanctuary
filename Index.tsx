// main monitoring page - shows sound detection interface
import React from 'react';
import { SoundMonitor } from './SoundMonitor';
import { AlertTriangle, Shield } from 'lucide-react';

const Index = () => {
  return (
    <div className="space-y-8">
      {/* sound category legend - only alarming and safe */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-alarming/10 border-2 border-alarming">
          <AlertTriangle className="w-8 h-8 text-alarming icon-scaled" strokeWidth={2.5} />
          <span className="text-scaled-sm font-bold text-center">alarming</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-safe/10 border-2 border-safe">
          <Shield className="w-8 h-8 text-safe icon-scaled" strokeWidth={2.5} />
          <span className="text-scaled-sm font-bold text-center">safe</span>
        </div>
      </div>

      {/* main sound monitor */}
      <SoundMonitor />
    </div>
  );
};

export default Index;
