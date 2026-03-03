
import React from 'react';
import { PromptItem } from '../types';
import { Trash2 } from 'lucide-react';

interface PromptModalProps {
  item: PromptItem | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const PromptModal: React.FC<PromptModalProps> = ({ item, onClose, onDelete }) => {
  if (!item) return null;

  const getJsonRepresentation = (item: PromptItem) => {
    try {
      // Si ya es un JSON stringificado, lo parseamos para formatear
      const parsed = JSON.parse(item.content);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Si es texto plano, devolvemos un objeto estructurado
      return JSON.stringify({
        asset_info: {
          id: item.id,
          title: item.title,
          engine: item.engine || "GEMINI_NANO_PRO"
        },
        prompt: String(item.content) // Garantizamos string
      }, null, 2);
    }
  };

  const jsonContent = getJsonRepresentation(item);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-6xl bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 bg-slate-950/50 hover:bg-red-500/20 hover:text-red-500 p-3 rounded-2xl transition-all text-slate-400 border border-slate-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-full md:w-5/12 bg-black flex items-center justify-center p-6 relative overflow-hidden group border-r border-slate-800/50">
          <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <img 
            src={item.imageUrl} 
            alt={item.title} 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 transition-transform duration-700 group-hover:scale-[1.02]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800';
            }}
          />
        </div>

        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col overflow-y-auto bg-slate-900/50 custom-scrollbar">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
               <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
               <span className="text-[10px] text-yellow-400 font-bold tracking-[0.3em] uppercase">Structured Asset</span>
            </div>
            <h2 className="text-4xl font-black text-white leading-tight uppercase tracking-tighter">{item.title}</h2>
          </div>

          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                SOURCE CODE (JSON)
              </h4>
              <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 font-mono text-sm overflow-hidden relative group">
                <pre className="text-slate-400 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto custom-scrollbar">
                  {jsonContent.split('\n').map((line, i) => {
                    const isKey = line.includes('":');
                    return (
                      <div key={i}>
                        {isKey ? (
                          <>
                            <span className="text-yellow-400/80">{String(line.split('":')[0])}"</span>
                            <span className="text-slate-600">:</span>
                            <span className="text-blue-400">{String(line.split('":')[1])}</span>
                          </>
                        ) : (
                          <span className="text-slate-500">{String(line)}</span>
                        )}
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-12 flex gap-4">
            {item.isCustom && onDelete && (
              <button 
                onClick={() => {
                  onDelete(item.id);
                  onClose();
                }}
                className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold py-5 rounded-2xl transition-all border border-red-500/20 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
            <button 
              onClick={() => {
                navigator.clipboard.writeText(jsonContent);
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-5 rounded-2xl transition-all border border-slate-700 uppercase tracking-widest text-[11px]"
            >
              Copy JSON
            </button>
            <button 
              onClick={() => {
                // Copiar el prompt puro para usar en Midjourney/Gemini
                let textToCopy = item.content;
                try {
                   const p = JSON.parse(textToCopy);
                   if (p.prompt) textToCopy = p.prompt;
                   else if (p.visual_description) textToCopy = p.visual_description;
                } catch(e) {}
                navigator.clipboard.writeText(String(textToCopy));
              }}
              className="flex-[2] bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-5 rounded-2xl transition-all shadow-2xl shadow-yellow-400/10 uppercase tracking-widest text-[11px] flex items-center justify-center gap-3"
            >
              Copy Asset String
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
