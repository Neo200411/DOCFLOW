import React from 'react';
import { Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const TopNav = () => {
  return (
    <nav className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center">
        <Link to="/" className="text-xl font-bold bg-gemini-gradient bg-clip-text text-transparent">
          DocFlow AI
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-full hover:bg-surface-hover">
          <Search size={20} />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-full hover:bg-surface-hover">
          <User size={20} />
        </button>
      </div>
    </nav>
  );
};

export default TopNav;
