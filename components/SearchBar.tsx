
import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  count: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, count }) => {
  return (
    <div className="relative mb-12">
      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SEARCH PROMPTS BY KEYWORD, STYLE OR ENGINE..."
        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm font-medium tracking-wide py-5 pl-14 pr-32 rounded-3xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all shadow-inner"
      />
      <div className="absolute inset-y-2 right-2 flex items-center">
        <div className="bg-slate-950 text-slate-400 text-[10px] font-black px-4 h-full flex items-center rounded-2xl border border-slate-800 uppercase tracking-widest">
          {count} RESULTS
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
