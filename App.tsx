import React, { useState, useEffect, useMemo } from 'react';
import { PromptItem, TabType } from './types';
import { parsePromptsFromMarkdown } from './services/promptParser';
import { getPrompts, savePrompt, updatePrompt, deletePrompt as deleteFromFirestore } from './services/firebaseService';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import PromptCard from './components/PromptCard';
import PromptModal from './components/PromptModal';
import AIEditorModal from './components/AIEditorModal';
import EditorTab from './components/EditorTab';
import ConfirmModal from './components/ConfirmModal';

const DELETED_IDS_KEY = 'nano-banana-deleted-ids';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.LIBRARY);
  const [libraryPrompts, setLibraryPrompts] = useState<PromptItem[]>([]);
  const [customPrompts, setCustomPrompts] = useState<PromptItem[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<PromptItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [manualEditPrompt, setManualEditPrompt] = useState<PromptItem | null>(null);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedPrompts = await parsePromptsFromMarkdown();
        setLibraryPrompts(fetchedPrompts);
        try {
          const firestorePrompts = await getPrompts();
          setCustomPrompts(firestorePrompts);
        } catch (fsError) {
          console.error('Error loading Firestore data:', fsError);
          const savedCustom = localStorage.getItem('nano-banana-custom-prompts');
          if (savedCustom) setCustomPrompts(JSON.parse(savedCustom));
        }
        const savedDeleted = localStorage.getItem(DELETED_IDS_KEY);
        if (savedDeleted) {
          try { setDeletedIds(JSON.parse(savedDeleted)); }
          catch (e) { localStorage.removeItem(DELETED_IDS_KEY); }
        }
        const savedFavorites = localStorage.getItem('nano-banana-favorites');
        if (savedFavorites) {
          try { setFavorites(JSON.parse(savedFavorites)); }
          catch (e) { localStorage.removeItem('nano-banana-favorites'); }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load library data. You can still use the Editor.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('nano-banana-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('nano-banana-custom-prompts', JSON.stringify(customPrompts));
  }, [customPrompts]);

  useEffect(() => {
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedIds));
  }, [deletedIds]);

  const allPrompts = useMemo(() => {
    const merged = [...libraryPrompts];
    customPrompts.forEach(custom => {
      const index = merged.findIndex(p => p.id === custom.id);
      if (index !== -1) { merged[index] = custom; }
      else { merged.push(custom); }
    });
    return merged.filter(p => !deletedIds.includes(p.id));
  }, [libraryPrompts, customPrompts, deletedIds]);

  const filteredPrompts = useMemo(() => {
    let list: PromptItem[] = [];
    if (activeTab === TabType.LIBRARY) {
      list = allPrompts;
    } else if (activeTab === TabType.FAVORITES) {
      list = favorites.filter(p => !deletedIds.includes(p.id));
    } else if (activeTab === TabType.EDITOR) {
      list = customPrompts.filter(p => !deletedIds.includes(p.id));
    }
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query)
    );
  }, [activeTab, allPrompts, favorites, customPrompts, searchQuery, deletedIds]);

  const toggleFavorite = (item: PromptItem) => {
    setFavorites(prev => {
      const exists = prev.find(p => p.id === item.id);
      return exists ? prev.filter(p => p.id !== item.id) : [...prev, item];
    });
  };

  const handleSaveCustom = async (item: PromptItem) => {
    try {
      const isExisting = customPrompts.some(p => p.id === item.id);
      if (isExisting) {
        await updatePrompt(item.id, item);
        setCustomPrompts(prev => prev.map(p => p.id === item.id ? item : p));
      } else {
        const { id, ...promptData } = item;
        const newId = await savePrompt(promptData);
        const newItem = { ...item, id: newId };
        setCustomPrompts(prev => [newItem, ...prev]);
      }
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      setCustomPrompts(prev => {
        const exists = prev.find(p => p.id === item.id);
        if (exists) return prev.map(p => p.id === item.id ? item : p);
        return [item, ...prev];
      });
    }
  };

  const handleDeletePrompt = async (id: string) => {
    const isCustom = customPrompts.some(p => p.id === id);
    if (isCustom) {
      try { await deleteFromFirestore(id); }
      catch (error) { console.error('Error deleting from Firestore:', error); }
      setCustomPrompts(prev => prev.filter(p => p.id !== id));
    }
    setDeletedIds(prev => [...new Set([...prev, id])]);
    setFavorites(prev => prev.filter(p => p.id !== id));
  };

  const handleEditManual = (item: PromptItem) => {
    setManualEditPrompt(item);
    setActiveTab(TabType.EDITOR);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white mb-2">
            {activeTab === TabType.LIBRARY ? 'Curated Library' : activeTab === TabType.FAVORITES ? 'My Favorites' : 'Asset Editor'}
          </h1>
          <p className="text-slate-500 text-sm">
            {activeTab === TabType.LIBRARY
              ? 'A curated collection of high-fidelity visual prompts optimized for modern creative engines.'
              : activeTab === TabType.FAVORITES
              ? 'Your personal vault of curated and AI-optimized prompt strings.'
              : 'Create, modify, and manage your own custom visual assets and prompts.'}
          </p>
        </div>

        {activeTab !== TabType.EDITOR && (
          <SearchBar value={searchQuery} onChange={setSearchQuery} resultCount={filteredPrompts.length} />
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex justify-between">
            {error}
            <button onClick={() => setError(null)} className="hover:text-white">✕</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <p className="text-slate-500 text-sm animate-pulse">Loading Assets...</p>
          </div>
        ) : (
          <>
            {activeTab === TabType.EDITOR ? (
              <EditorTab
                prompts={customPrompts.filter(p => !deletedIds.includes(p.id))}
                onSavePrompt={handleSaveCustom}
                onDeletePrompt={(id) => setPromptToDelete(id)}
                initialEditPrompt={manualEditPrompt}
                onClearInitialEdit={() => setManualEditPrompt(null)}
              />
            ) : (
              <>
                {filteredPrompts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPrompts.map(item => (
                      <PromptCard
                        key={item.id}
                        item={item}
                        isFavorite={favorites.some(f => f.id === item.id)}
                        onToggleFavorite={toggleFavorite}
                        onViewDetail={setSelectedPrompt}
                        onEditAI={setEditingPrompt}
                        onEditManual={handleEditManual}
                        onDelete={setPromptToDelete}
                        onCopy={handleCopy}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-32">
                    <p className="text-slate-600 text-sm">No assets found</p>
                    <button onClick={() => setSearchQuery('')} className="mt-4 text-yellow-400 font-bold text-xs uppercase tracking-widest hover:underline">
                      Clear search filters
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <PromptModal prompt={selectedPrompt} onClose={() => setSelectedPrompt(null)} onDelete={setPromptToDelete} />
      <AIEditorModal prompt={editingPrompt} onClose={() => setEditingPrompt(null)} onSave={handleSaveCustom} />
      <ConfirmModal
        isOpen={!!promptToDelete}
        onClose={() => setPromptToDelete(null)}
        onConfirm={() => {
          if (promptToDelete) {
            handleDeletePrompt(promptToDelete);
            setPromptToDelete(null);
          }
        }}
        title="¿Eliminar prompt?"
        message="Esta acción no se puede deshacer. El prompt se eliminará permanentemente de tu colección."
      />

      <footer className="border-t border-slate-800/50 mt-20 py-8 text-center text-slate-600 text-xs">
        <p className="font-bold tracking-widest uppercase mb-1">B</p>
        <p>Nano Banana Pro Collection</p>
        <div className="flex justify-center gap-6 mt-3">
          <a href="#" className="hover:text-slate-400 transition-colors">Technical Docs</a>
          <a href="https://github.com/IsaacPachecoooo/NanoPrompts" className="hover:text-slate-400 transition-colors">GitHub Repository</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
