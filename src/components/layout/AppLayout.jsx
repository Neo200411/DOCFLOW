import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
