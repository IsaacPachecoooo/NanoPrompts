
import React from 'react';
import { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  favoritesCount: number;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, favoritesCount }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
          <span className="text-slate-950 font-bold text-xl">N</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">NANO BANANA <span className="text-yellow-400">PRO</span></h1>
          <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">Asset Collection v1</p>
        </div>
      </div>

      <nav className="flex gap-2">
        <button
          onClick={() => setActiveTab(TabType.LIBRARY)}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            activeTab === TabType.LIBRARY 
              ? 'bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          LIBRARY
        </button>
        <button
          onClick={() => setActiveTab(TabType.FAVORITES)}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 relative ${
            activeTab === TabType.FAVORITES 
              ? 'bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          FAVORITES
          {favoritesCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-slate-950 font-bold">
              {favoritesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab(TabType.EDITOR)}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
            activeTab === TabType.EDITOR 
              ? 'bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          EDITOR
        </button>
        {!((import.meta as any).env.VITE_GEMINI_API_KEY) && (
          <div className="ml-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-[8px] font-black text-red-400 uppercase tracking-tighter" title="AI Features Disabled: Missing API Key">
            NO AI
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
