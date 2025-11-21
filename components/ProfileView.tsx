import React, { useState, useEffect } from 'react';
import { UserProfile, getUserProfile } from '../services/storage';
import { X, Trophy, Award, LayoutGrid, MapPin, Share2, User } from 'lucide-react';

interface ProfileViewProps {
  onClose: () => void;
}

const MOCK_LEADERBOARD = [
  { name: 'Alex Walker', points: 2450, id: '1' },
  { name: 'Sam Cities', points: 1890, id: '2' },
  { name: 'Jordan H.', points: 1200, id: '3' },
  { name: 'Casey T.', points: 950, id: '4' },
];

const ProfileView: React.FC<ProfileViewProps> = ({ onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'collections' | 'leaderboard'>('stats');

  useEffect(() => {
    setProfile(getUserProfile());
  }, []);

  if (!profile) return null;

  const handleShareCollection = async (collection: any) => {
    const text = `Check out my landmark collection "${collection.name}": ${collection.description}. Found with LensHistory AR!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: collection.name,
          text: text,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      alert('Copied to clipboard: ' + text);
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl text-white flex flex-col animate-in slide-in-from-bottom-10 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center text-xl font-bold">
              {profile.level}
           </div>
           <div>
             <h2 className="text-xl font-bold">Explorer Profile</h2>
             <p className="text-sm text-gray-400">{profile.points} XP</p>
           </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 p-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'stats' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500 hover:text-white'}`}
        >
            <Trophy size={16} /> Overview
        </button>
        <button 
            onClick={() => setActiveTab('collections')}
            className={`flex-1 p-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'collections' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500 hover:text-white'}`}
        >
            <LayoutGrid size={16} /> Collections
        </button>
        <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 p-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'leaderboard' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500 hover:text-white'}`}
        >
            <Award size={16} /> Leaderboard
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* Stats Tab */}
        {activeTab === 'stats' && (
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-bold mb-4">Badges</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {profile.badges.map((badge) => (
                            <div key={badge.id} className={`aspect-square rounded-xl border ${badge.unlocked ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/5 bg-white/5 grayscale opacity-50'} flex flex-col items-center justify-center p-2 text-center transition-all`}>
                                <div className="text-2xl mb-2">{badge.unlocked ? '🏆' : '🔒'}</div>
                                <span className="text-xs font-bold">{badge.name}</span>
                                <span className="text-[10px] text-gray-400 leading-tight mt-1">{badge.description}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-4">Recent Discoveries</h3>
                    <div className="space-y-3">
                        {profile.history.length === 0 ? (
                            <p className="text-gray-500 italic">No landmarks found yet. Go explore!</p>
                        ) : (
                            profile.history.slice(0, 10).map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                                        {item.image && <img src={`data:image/jpeg;base64,${item.image}`} className="w-full h-full object-cover" alt="thumbnail" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{item.name}</h4>
                                        <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Collections Tab */}
        {activeTab === 'collections' && (
            <div className="space-y-4">
                {profile.collections.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        <p>You haven't created any collections yet.</p>
                        <p className="text-sm">Find a landmark and save it to start a collection!</p>
                    </div>
                ) : (
                    profile.collections.map((collection) => (
                        <div key={collection.id} className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-5 border border-white/10">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold">{collection.name}</h3>
                                <button onClick={() => handleShareCollection(collection)} className="p-2 hover:bg-white/10 rounded-full">
                                    <Share2 size={18} className="text-emerald-400" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">{collection.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                <MapPin size={12} />
                                <span>{collection.items.length} Landmarks</span>
                            </div>
                            
                            {/* Preview Images of items in collection */}
                            <div className="flex -space-x-3 overflow-hidden">
                                {collection.items.slice(0, 5).map((itemId) => {
                                    const item = profile.history.find(h => h.id === itemId);
                                    if (!item) return null;
                                    return (
                                        <div key={itemId} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden">
                                            <img src={`data:image/jpeg;base64,${item.image}`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
            <div className="space-y-2">
                 {[...MOCK_LEADERBOARD, { name: 'You', points: profile.points, id: 'me' }]
                    .sort((a, b) => b.points - a.points)
                    .map((user, index) => (
                    <div key={user.id} className={`flex items-center gap-4 p-4 rounded-xl ${user.id === 'me' ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-white/5'}`}>
                        <div className="font-mono font-bold text-gray-500 w-6">#{index + 1}</div>
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                             <User size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold">{user.name}</div>
                        </div>
                        <div className="font-mono text-emerald-400 font-bold">{user.points} XP</div>
                    </div>
                 ))}
            </div>
        )}

      </div>
    </div>
  );
};

export default ProfileView;
