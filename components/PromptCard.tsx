import React, { useState } from 'react';
import { PromptItem } from '../types';
import { Trash2, Edit3, Copy, Sparkles, Star, Check } from 'lucide-react';

interface PromptCardProps {
  item: PromptItem;
  onViewDetail: (item: PromptItem) => void;
  onEditAI: (item: PromptItem) => void;
  onEditManual: (item: PromptItem) => void;
  onCopy: (text: string) => void;
  onToggleFavorite: (item: PromptItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: PromptItem) => void;
  isFavorite: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({
  item,
  onViewDetail,
  onEditAI,
  onEditManual,
  onCopy,
  onToggleFavorite,
  onDelete,
  onDuplicate,
  isFavorite
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onViewDetail(item)}
      className="group cursor-pointer min-h-[400px] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-yellow-400/50 hover:shadow-2xl hover:shadow-yellow-400/5 transition-all duration-500 flex flex-col relative"
    >
      <div className="h-52 relative overflow-hidden bg-slate-950">
        <img
          src={item.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800'}
          alt={item.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800';
          }}
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            className={`p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 ${
              isFavorite
                ? 'bg-yellow-400 text-slate-950 shadow-lg'
                : 'bg-slate-900/60 text-slate-400 hover:text-yellow-400'
            }`}
          >
            <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl backdrop-blur-md transition-all duration-300 border border-red-500/20"
            title="Eliminar Prompt"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <span className="text-[9px] font-bold text-yellow-400/70 uppercase tracking-widest">{item.category || 'GENERAL'}</span>
        </div>
        <h3 className="font-black text-white text-sm uppercase tracking-tight leading-tight mb-3">{item.title}</h3>
        <p className="text-slate-500 text-xs leading-relaxed flex-1 line-clamp-3">&ldquo;{item.content}&rdquo;</p>
      </div>

      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditAI(item);
          }}
          className="flex-1 bg-yellow-400/5 hover:bg-yellow-400 text-yellow-400 hover:text-slate-950 text-[10px] font-bold py-2.5 rounded-xl transition-all tracking-widest uppercase border border-yellow-400/20 flex items-center justify-center gap-2"
        >
          <Sparkles size={12} />
          Enhance AI
        </button>
        <button
          onClick={handleCopy}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all"
          title="Copy Prompt"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditManual(item);
          }}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all"
          title="Edit Manually"
        >
          <Edit3 size={16} />
        </button>
      </div>
    </div>
  );
};

export default PromptCard;
