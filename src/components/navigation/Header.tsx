// header component with app title and user controls
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Ear, LogOut } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-card border-b-2 border-border">
      <div className="flex items-center justify-between h-16 px-4 max-w-lg mx-auto">
        {/* app logo and title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center icon-scaled">
            <Ear className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-scaled-xl font-bold">SoundSense</h1>
        </div>

        {/* sign out button */}
        {user && (
          <Button
            onClick={signOut}
            variant="ghost"
            size="sm"
            className="h-10 px-3 btn-scaled"
            aria-label="sign out"
          >
            <LogOut className="w-5 h-5 icon-scaled" strokeWidth={2.5} />
            <span className="ml-2 text-scaled-sm font-bold hidden sm:inline">sign out</span>
          </Button>
        )}
      </div>
    </header>
  );
}
