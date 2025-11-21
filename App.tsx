import React, { useState, useEffect } from 'react';
import CameraInput from './components/CameraInput';
import ResultsOverlay from './components/ResultsOverlay';
import ProfileView from './components/ProfileView';
import AddToCollectionModal from './components/AddToCollectionModal';
import { identifyLandmark, getLandmarkHistory, generateNarration } from './services/gemini';
import { 
  saveLandmark, 
  addPoints, 
  checkBadges, 
  SavedLandmark, 
  getUserProfile,
  UserProfile 
} from './services/storage';
import { Loader2, Sparkles, Trophy, User as UserIcon } from 'lucide-react';

type AppState = 'IDLE' | 'ANALYZING' | 'RESULT' | 'ERROR';

interface Toast {
  id: string;
  message: string;
  type: 'points' | 'badge';
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentLandmark, setCurrentLandmark] = useState<SavedLandmark | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("");
  
  // UI State
  const [showProfile, setShowProfile] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [userPoints, setUserPoints] = useState(0);

  // Init user points on load
  useEffect(() => {
    setUserPoints(getUserProfile().points);
  }, []);

  const addToast = (message: string, type: 'points' | 'badge') => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleCapture = async (image: string, mimeType: string) => {
    setCapturedImage(`data:${mimeType};base64,${image}`);
    setAppState('ANALYZING');
    
    try {
      // Step 1: Identify
      setLoadingStep("Identifying landmark...");
      const name = await identifyLandmark(image, mimeType);
      
      // Step 2: Get History
      setLoadingStep(`Researching ${name}...`);
      const info = await getLandmarkHistory(name);

      // Step 3: Save to History (Auto) & Gamification
      const saved = saveLandmark(info, image); // Save small base64 (currently using full image, which is heavy, but OK for demo)
      setCurrentLandmark(saved);
      
      // Award Points
      const { newPoints, leveledUp } = addPoints(100); // 100 XP for identifying
      setUserPoints(newPoints);
      addToast("+100 XP Found Landmark", 'points');
      if (leveledUp) addToast("Level Up!", 'badge');

      // Check Badges
      const newBadges = checkBadges();
      newBadges.forEach(b => addToast(`Badge Unlocked: ${b.name}`, 'badge'));

      // Step 4: Generate TTS
      setLoadingStep("Creating audio guide...");
      const audio = await generateNarration(info.description);
      setAudioBase64(audio);

      setAppState('RESULT');
    } catch (error) {
      console.error(error);
      setAppState('ERROR');
    }
  };

  const handleReset = () => {
    setAppState('IDLE');
    setCapturedImage(null);
    setCurrentLandmark(null);
    setAudioBase64(null);
  };

  const handleCollectionCreated = () => {
    const { newPoints } = addPoints(20);
    setUserPoints(newPoints);
    addToast("+20 XP Collection Updated", 'points');
    
    const newBadges = checkBadges();
    newBadges.forEach(b => addToast(`Badge Unlocked: ${b.name}`, 'badge'));
  };

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative font-sans">
      
      {/* Background */}
      {appState === 'IDLE' ? (
        <CameraInput onCapture={handleCapture} />
      ) : (
        capturedImage && (
          <div className="absolute inset-0">
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover opacity-60" 
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          </div>
        )
      )}

      {/* HUD: Points & Profile Button */}
      <div className="absolute top-4 right-4 z-30 flex gap-3">
        <button 
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full hover:bg-black/60 transition-all active:scale-95"
        >
          <div className="flex flex-col items-end leading-none">
             <span className="text-[10px] text-gray-400 font-bold uppercase">Explorer</span>
             <span className="text-sm font-bold text-emerald-400">{userPoints} XP</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
             <UserIcon size={14} className="text-white" />
          </div>
        </button>
      </div>

      {/* Toasts */}
      <div className="absolute top-20 right-4 z-40 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
            <div key={toast.id} className="bg-white/10 backdrop-blur-md border border-emerald-500/30 text-white px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-right fade-in duration-300 flex items-center gap-3">
                <div className={`p-2 rounded-full ${toast.type === 'badge' ? 'bg-yellow-500' : 'bg-emerald-500'}`}>
                    <Trophy size={14} className="text-black" />
                </div>
                <span className="font-bold text-sm">{toast.message}</span>
            </div>
        ))}
      </div>

      {/* Loading State */}
      {appState === 'ANALYZING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 text-center">
           <div className="relative">
             <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
             <Sparkles size={64} className="text-emerald-400 relative z-10 animate-spin-slow" />
           </div>
           <h2 className="mt-8 text-2xl font-bold text-white">Analyzing Scene</h2>
           <p className="text-emerald-400 mt-2 animate-pulse">{loadingStep}</p>
           <Loader2 className="mt-8 animate-spin text-white/50" size={32} />
        </div>
      )}

      {/* Result State */}
      {appState === 'RESULT' && currentLandmark && (
        <ResultsOverlay 
            landmarkInfo={currentLandmark} 
            audioBase64={audioBase64} 
            onReset={handleReset} 
            onAddToCollection={() => setShowCollectionModal(true)}
        />
      )}

      {/* Error State */}
      {appState === 'ERROR' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-50 p-8 text-center">
            <div className="p-4 rounded-full bg-red-500/20 mb-4">
                <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
            <p className="text-gray-400 mb-6">We couldn't identify the landmark. Please try again.</p>
            <button 
                onClick={handleReset}
                className="px-6 py-3 bg-white text-black rounded-full font-semibold hover:scale-105 transition-transform"
            >
                Try Again
            </button>
        </div>
      )}

      {/* Modals */}
      {showProfile && <ProfileView onClose={() => setShowProfile(false)} />}
      
      {showCollectionModal && currentLandmark && (
        <AddToCollectionModal 
            landmarkId={currentLandmark.id} 
            onClose={() => setShowCollectionModal(false)}
            onCollectionCreated={handleCollectionCreated}
        />
      )}

    </div>
  );
};

export default App;
