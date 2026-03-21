// main app layout with header and bottom navigation
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/navigation/Header';
import { BottomNav } from '@/components/navigation/BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* sticky header */}
      <Header />
      
      {/* main content area with padding for nav */}
      <main className="flex-1 px-4 py-6 pb-24 max-w-lg mx-auto w-full">
        <Outlet />
      </main>
      
      {/* fixed bottom navigation */}
      <BottomNav />
    </div>
  );
}
