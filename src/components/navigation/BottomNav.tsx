// bottom navigation component for main app sections
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, Settings, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// navigation item definition
interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

// main navigation items
const navItems: NavItem[] = [
  { path: '/', label: 'monitor', icon: Home },
  { path: '/history', label: 'history', icon: History },
  { path: '/settings', label: 'settings', icon: Settings },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border safe-area-bottom"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="flex justify-around items-center h-20 max-w-lg mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1',
                'transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-ring',
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className="w-7 h-7 icon-scaled" 
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span className="text-scaled-sm font-bold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
