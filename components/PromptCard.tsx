import React from 'react';
import { PromptItem } from '../types';
import { Trash2, Edit3, Copy, Sparkles, Star, Files } from 'lucide-react';

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
  return (
    <div
      onClick={() => onViewDetail(item)}
      className="group cursor-pointer bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-yellow-400/50 hover:shadow-2xl hover:shadow-yellow-400/5 transition-all duration-500 flex flex-col relative"
    >
      <div className="h-52 relative overflow-hidden bg-slate-950">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-70 group-hover:opacity-100"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>

        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            className={`p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 ${
              isFavorite ? 'bg-yellow-400 text-slate-950 shadow-lg' : 'bg-slate-900/60 text-slate-400 hover:text-yellow-400'
            }`}
          >
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl backdrop-blur-md transition-all duration-300 border border-red-500/20"
            title="Eliminar Prompt"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base font-black text-white tracking-tight uppercase group-hover:text-yellow-400 transition-colors">{item.title}</h3>
        </div>
        <p className="text-slate-400 text-xs mb-4 leading-relaxed font-light italic flex-1 overflow-hidden">
          "{item.content}"
        </p>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(item.content);
            }}
            className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
            title="Copiar al portapapeles"
          >
            <Copy size={14} />
            Copy
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(item);
            }}
            className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
            title="Duplicar prompt"
          >
            <Files size={14} />
            Duplicate
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditAI(item);
            }}
            className="flex-1 px-3 py-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
            title="Editar con IA"
          >
            <Sparkles size={14} />
            AI Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;
