import React, { useState } from 'react';
import { PromptItem, AIEditResponse } from '../types';
import { editPromptWithAI } from '../services/geminiService';
import { Copy, Check, AlertCircle } from 'lucide-react';

interface AIEditorModalProps {
  item: PromptItem | null;
  onClose: () => void;
  onSave: (editedItem: PromptItem) => void;
}

const AIEditorModal: React.FC<AIEditorModalProps> = ({ item, onClose, onSave }) => {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AIEditResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!item) return null;

  const handleEdit = async () => {
    if (!instruction.trim()) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const response = await editPromptWithAI(item.content, instruction);
      setResult(response);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error processing your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    const newItem: PromptItem = {
      ...item,
      id: item.isCustom ? item.id : `custom-${Date.now()}`,
      content: result.editedPrompt,
      enhancedContent: result.editedPrompt,
      isCustom: true,
      title: item.isCustom ? item.title : `${item.title} (AI EDITED)`
    };
    onSave(newItem);
    onClose();
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.editedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="relative">
          <div className="bg-gradient-to-br from-yellow-400/10 to-transparent p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest">
                  AI PROMPT <span className="text-yellow-400"> EDITOR </span>
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Powered by Gemini Flash</p>
              </div>
              <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-slate-950/50 rounded-2xl p-4 mb-6 border border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Editing base</p>
              <h4 className="font-bold text-white text-sm uppercase tracking-tight">{item.title}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.content}</p>
            </div>

            {!result ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">What would you like to change?</label>
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Example: Change the lighting to neon blue, make the robot look more rusty, and add 8k resolution tags..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none min-h-[120px] transition-all"
                  />
                </div>
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                    <AlertCircle size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <button
                  onClick={handleEdit}
                  disabled={isProcessing || !instruction.trim()}
                  className="w-full py-4 bg-yellow-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-yellow-400/10 uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Process with AI
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Edited Result</span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      {copied ? (
                        <><Check size={12} /> Copied!</>
                      ) : (
                        <><Copy size={12} /> Copy</>
                      )}
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="font-mono text-sm text-slate-300 leading-relaxed select-all">
                      {result.editedPrompt}
                    </p>
                  </div>
                </div>

                {result.changesMade.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Modifications Applied</h5>
                    <div className="flex flex-wrap gap-2">
                      {result.changesMade.map((change, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-[10px] border border-slate-700 font-medium">
                          {change}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setResult(null)}
                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700 uppercase tracking-widest transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-yellow-400/20 transition-all"
                  >
                    Save Asset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEditorModal;
