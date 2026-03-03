
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

const App: React.FC = () => {
  console.log("App: Rendering...");
  const [activeTab, setActiveTab] = useState<TabType>(TabType.LIBRARY);
  const [libraryPrompts, setLibraryPrompts] = useState<PromptItem[]>([]);
  const [customPrompts, setCustomPrompts] = useState<PromptItem[]>([]);
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
        // Load library prompts from Markdown
        const fetchedPrompts = await parsePromptsFromMarkdown();
        setLibraryPrompts(fetchedPrompts);
        
        // Load custom prompts from Firestore
        try {
          const firestorePrompts = await getPrompts();
          setCustomPrompts(firestorePrompts);
        } catch (fsError) {
          console.error("Error loading Firestore data:", fsError);
          // Fallback to localStorage if Firestore fails
          const savedCustom = localStorage.getItem('nano-banana-custom-prompts');
          if (savedCustom) {
            setCustomPrompts(JSON.parse(savedCustom));
          }
        }
        
        const savedFavorites = localStorage.getItem('nano-banana-favorites');
        if (savedFavorites) {
          try {
            setFavorites(JSON.parse(savedFavorites));
          } catch (e) {
            console.error("Error parsing favorites:", e);
            localStorage.removeItem('nano-banana-favorites');
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        setError("Failed to load library data. You can still use the Editor.");
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

  // Merge library with custom overrides and additions
  const allPrompts = useMemo(() => {
    const merged = [...libraryPrompts];
    
    customPrompts.forEach(custom => {
      const index = merged.findIndex(p => p.id === custom.id);
      if (index !== -1) {
        merged[index] = custom;
      } else {
        merged.push(custom);
      }
    });
    
    return merged;
  }, [libraryPrompts, customPrompts]);

  const filteredPrompts = useMemo(() => {
    let list: PromptItem[] = [];
    
    if (activeTab === TabType.LIBRARY) {
      list = allPrompts;
    } else if (activeTab === TabType.FAVORITES) {
      list = favorites;
    } else if (activeTab === TabType.EDITOR) {
      list = customPrompts;
    }

    if (!searchQuery) return list;
    
    const query = searchQuery.toLowerCase();
    return list.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.content.toLowerCase().includes(query)
    );
  }, [activeTab, allPrompts, favorites, customPrompts, searchQuery]);

  const toggleFavorite = (item: PromptItem) => {
    setFavorites(prev => {
      const exists = prev.find(p => p.id === item.id);
      if (exists) {
        return prev.filter(p => p.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSaveCustom = async (item: PromptItem) => {
    try {
      const isExisting = customPrompts.some(p => p.id === item.id);
      
      if (isExisting) {
        // Update in Firestore
        await updatePrompt(item.id, item);
        setCustomPrompts(prev => prev.map(p => p.id === item.id ? item : p));
      } else {
        // Save to Firestore
        const { id, ...promptData } = item;
        const newId = await savePrompt(promptData);
        const newItem = { ...item, id: newId };
        setCustomPrompts(prev => [newItem, ...prev]);
      }
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      // Fallback to local state if Firestore fails
      setCustomPrompts(prev => {
        const exists = prev.find(p => p.id === item.id);
        if (exists) {
          return prev.map(p => p.id === item.id ? item : p);
        } else {
          return [item, ...prev];
        }
      });
    }
  };

  const handleDeleteCustom = async (id: string) => {
    try {
      await deleteFromFirestore(id);
      setCustomPrompts(prev => prev.filter(p => p.id !== id));
      setFavorites(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting from Firestore:", error);
      // Fallback to local state
      setCustomPrompts(prev => prev.filter(p => p.id !== id));
      setFavorites(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleEditManual = (item: PromptItem) => {
    setManualEditPrompt(item);
    setActiveTab(TabType.EDITOR);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        favoritesCount={favorites.length}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
            {activeTab === TabType.LIBRARY ? 'Curated Library' : 
             activeTab === TabType.FAVORITES ? 'My Favorites' : 'Asset Editor'}
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl text-sm">
            {activeTab === TabType.LIBRARY 
              ? 'A curated collection of high-fidelity visual prompts optimized for modern creative engines.' 
              : activeTab === TabType.FAVORITES 
              ? 'Your personal vault of curated and AI-optimized prompt strings.'
              : 'Create, modify, and manage your own custom visual assets and prompts.'}
          </p>
        </div>

        {activeTab !== TabType.EDITOR && (
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            count={filteredPrompts.length} 
          />
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:text-white">✕</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Assets...</p>
          </div>
        ) : (
          <>
            {activeTab === TabType.EDITOR ? (
              <EditorTab 
                prompts={customPrompts}
                onSavePrompt={handleSaveCustom}
                onDeletePrompt={setPromptToDelete}
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
                  <div className="text-center py-40 border-2 border-dashed border-slate-900 rounded-3xl">
                    <p className="text-slate-600 font-bold uppercase tracking-widest">No assets found</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-yellow-400 font-bold text-xs uppercase tracking-widest hover:underline"
                    >
                      Clear search filters
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <PromptModal 
        item={selectedPrompt} 
        onClose={() => setSelectedPrompt(null)} 
        onDelete={setPromptToDelete}
      />

      <AIEditorModal 
        item={editingPrompt} 
        onClose={() => setEditingPrompt(null)} 
        onSave={handleSaveCustom}
      />

      <ConfirmModal 
        isOpen={!!promptToDelete}
        onClose={() => setPromptToDelete(null)}
        onConfirm={() => {
          if (promptToDelete) {
            handleDeleteCustom(promptToDelete);
            setPromptToDelete(null);
          }
        }}
        title="¿Eliminar prompt?"
        message="Esta acción no se puede deshacer. El prompt se eliminará permanentemente de tu colección."
      />

      <footer className="border-t border-slate-900 py-12 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
               <span className="text-yellow-400 font-black">B</span>
            </div>
            <p className="text-xs font-bold text-slate-600 tracking-widest uppercase">Nano Banana Pro Collection</p>
          </div>
          <div className="flex gap-8 text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em]">
            <span className="hover:text-yellow-400 transition-colors cursor-pointer">Technical Docs</span>
            <span className="hover:text-yellow-400 transition-colors cursor-pointer">GitHub Repository</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
