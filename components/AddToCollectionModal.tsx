import React, { useState, useEffect } from 'react';
import { createCollection, addToCollection, getUserProfile, Collection } from '../services/storage';
import { Plus, Check, FolderPlus } from 'lucide-react';

interface AddToCollectionModalProps {
  landmarkId: string;
  onClose: () => void;
  onCollectionCreated: () => void;
}

const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({ landmarkId, onClose, onCollectionCreated }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  useEffect(() => {
    setCollections(getUserProfile().collections);
  }, [view]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      const newColl = createCollection(newCollectionName, newCollectionDesc);
      addToCollection(newColl.id, landmarkId);
      onCollectionCreated();
      onClose();
    }
  };

  const handleSelect = (collectionId: string) => {
    addToCollection(collectionId, landmarkId);
    onCollectionCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl border border-white/10 p-6 animate-in zoom-in-95 duration-200">
        
        {view === 'list' ? (
            <>
                <h3 className="text-xl font-bold text-white mb-4">Add to Collection</h3>
                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto no-scrollbar">
                    <button 
                        onClick={() => setView('create')}
                        className="w-full p-4 rounded-xl border border-dashed border-white/20 text-gray-400 hover:bg-white/5 hover:border-white/40 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        <span>New Collection</span>
                    </button>
                    
                    {collections.map(col => (
                        <button 
                            key={col.id}
                            onClick={() => handleSelect(col.id)}
                            className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left flex items-center justify-between group transition-colors"
                        >
                            <span className="font-medium text-white">{col.name}</span>
                            <span className="text-xs text-gray-500">{col.items.length} items</span>
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="w-full py-3 text-gray-400 hover:text-white text-sm font-semibold">
                    Cancel
                </button>
            </>
        ) : (
            <form onSubmit={handleCreate}>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FolderPlus size={24} className="text-emerald-400"/> New Collection
                </h3>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Name</label>
                        <input 
                            type="text" 
                            value={newCollectionName}
                            onChange={e => setNewCollectionName(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-400 outline-none"
                            placeholder="e.g. Paris Trip"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Description</label>
                        <textarea 
                            value={newCollectionDesc}
                            onChange={e => setNewCollectionDesc(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-emerald-400 outline-none resize-none h-20"
                            placeholder="What is this collection about?"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={() => setView('list')} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold">
                        Back
                    </button>
                    <button type="submit" disabled={!newCollectionName} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold disabled:opacity-50">
                        Create & Add
                    </button>
                </div>
            </form>
        )}

      </div>
    </div>
  );
};

export default AddToCollectionModal;
