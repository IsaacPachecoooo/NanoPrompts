
import React, { useState } from 'react';
import { PromptItem } from '../types';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';

interface EditorTabProps {
  prompts: PromptItem[];
  onSavePrompt: (prompt: PromptItem) => void;
  onDeletePrompt: (id: string) => void;
  initialEditPrompt?: PromptItem | null;
  onClearInitialEdit?: () => void;
}

const EditorTab: React.FC<EditorTabProps> = ({ 
  prompts, 
  onSavePrompt, 
  onDeletePrompt,
  initialEditPrompt,
  onClearInitialEdit
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PromptItem>>({});
  const [isCreating, setIsCreating] = useState(false);

  React.useEffect(() => {
    if (initialEditPrompt) {
      startEdit(initialEditPrompt);
      if (onClearInitialEdit) onClearInitialEdit();
    }
  }, [initialEditPrompt]);

  const startEdit = (prompt: PromptItem) => {
    setEditingId(prompt.id);
    setFormData(prompt);
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      id: `custom-${Date.now()}`,
      title: '',
      content: '',
      imageUrl: '',
      isCustom: true,
      category: 'CUSTOM',
      tags: [],
      engine: 'Midjourney'
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({});
  };

  const handleSave = () => {
    if (formData.title && formData.content) {
      onSavePrompt(formData as PromptItem);
      cancelEdit();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight">Prompt Workshop</h3>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Create and manage your custom visual assets</p>
        </div>
        <button
          onClick={startCreate}
          className="bg-yellow-400 text-slate-950 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/10"
        >
          <Plus size={16} />
          New Prompt
        </button>
      </div>

      {(isCreating || editingId) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-black text-yellow-400 uppercase tracking-[0.2em]">
              {isCreating ? 'Create New Asset' : 'Edit Asset'}
            </h4>
            <button onClick={cancelEdit} className="text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Asset Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. CYBERPUNK CITYSCAPE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Image URL / Asset Path</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.imageUrl || ''}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm pl-11 focus:outline-none focus:border-yellow-400/50 transition-colors"
                  />
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. ARCHITECTURE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Visual Prompt String</label>
                <textarea
                  value={formData.content || ''}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Describe the visual asset in detail..."
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={cancelEdit}
              className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              className="bg-white text-slate-950 px-8 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-colors"
            >
              <Save size={16} />
              Save Asset
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {prompts.map(prompt => (
          <div 
            key={prompt.id} 
            className="group bg-slate-900/30 border border-slate-900 rounded-2xl p-4 flex items-center justify-between hover:border-slate-800 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                {prompt.imageUrl ? (
                  <img src={prompt.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>
              <div>
                <h5 className="text-sm font-bold text-white uppercase tracking-tight">{prompt.title}</h5>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  {prompt.isCustom ? 'User Created' : 'Library Asset'} • {prompt.category || 'General'} • {prompt.engine || 'MJ'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => startEdit(prompt)}
                className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all"
                title="Edit Asset"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => onDeletePrompt(prompt.id)}
                className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                title="Delete Asset"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {prompts.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-900 rounded-3xl">
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">No custom assets yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorTab;
