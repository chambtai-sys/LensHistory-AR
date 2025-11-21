import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ExternalLink, MapPin, Volume2, Loader2, BookmarkPlus } from 'lucide-react';
import { LandmarkInfo } from '../services/gemini';
import { decodeBase64, decodeAudioData, playBuffer } from '../utils/audioUtils';

interface ResultsOverlayProps {
  landmarkInfo: LandmarkInfo;
  audioBase64: string | null;
  onReset: () => void;
  onAddToCollection: () => void;
}

const ResultsOverlay: React.FC<ResultsOverlayProps> = ({ landmarkInfo, audioBase64, onReset, onAddToCollection }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  // Initialize Audio & Decode
  useEffect(() => {
    if (audioBase64) {
      const initAudio = async () => {
        setIsDecoding(true);
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          audioContextRef.current = ctx;
          
          const rawBytes = decodeBase64(audioBase64);
          const buffer = await decodeAudioData(rawBytes, ctx, 24000);
          setAudioBuffer(buffer);
          
          // Auto-play when ready
          playAudio(ctx, buffer);
        } catch (e) {
            console.error("Audio decoding failed", e);
        } finally {
            setIsDecoding(false);
        }
      };
      initAudio();
    }
    
    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBase64]);

  const playAudio = (ctx: AudioContext, buffer: AudioBuffer) => {
    if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
    }
    const source = playBuffer(ctx, buffer, () => setIsPlaying(false));
    audioSourceRef.current = source;
    setIsPlaying(true);
  };

  const togglePlay = async () => {
    if (!audioContextRef.current || !audioBuffer) return;
    
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    if (isPlaying) {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            setIsPlaying(false);
        }
    } else {
        playAudio(audioContextRef.current, audioBuffer);
    }
  };

  // Extract Search Sources
  const sources = landmarkInfo.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web?.uri ? { title: chunk.web.title, uri: chunk.web.uri } : null)
    .filter(Boolean) || [];

  return (
    <div className="absolute inset-x-0 bottom-0 h-2/3 md:h-1/2 bg-gradient-to-b from-transparent to-black/90 flex flex-col justify-end p-4">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-white shadow-2xl overflow-hidden flex flex-col max-h-full animate-in slide-in-from-bottom-10 duration-500">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4 shrink-0">
                <div>
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                        <MapPin size={16} />
                        <span className="text-xs font-bold tracking-wider uppercase">Identified Landmark</span>
                    </div>
                    <h2 className="text-2xl font-bold leading-tight pr-4">{landmarkInfo.name}</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onAddToCollection}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-emerald-400"
                        aria-label="Add to Collection"
                    >
                        <BookmarkPlus size={20} />
                    </button>
                    <button 
                        onClick={onReset} 
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label="Close"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto no-scrollbar flex-1 space-y-4 mb-4">
                <p className="text-gray-200 leading-relaxed text-lg font-light">
                    {landmarkInfo.description}
                </p>
                
                {/* Sources/Grounding */}
                {sources.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Sources</h3>
                        <div className="flex flex-wrap gap-2">
                            {sources.map((source: any, i: number) => (
                                <a 
                                    key={i}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-blue-300 transition-colors"
                                >
                                    <ExternalLink size={10} />
                                    <span className="truncate max-w-[150px]">{source.title || 'Source'}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Audio Player Footer */}
            <div className="shrink-0 pt-4 border-t border-white/10 flex items-center gap-4">
                <button 
                    onClick={togglePlay}
                    disabled={!audioBuffer || isDecoding}
                    className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                    {isDecoding ? (
                        <Loader2 className="animate-spin" size={24} />
                    ) : isPlaying ? (
                        <Pause size={24} fill="black" />
                    ) : (
                        <Play size={24} fill="black" className="ml-1" />
                    )}
                </button>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold mb-1">
                        <Volume2 size={12} />
                        <span>Audio Guide</span>
                    </div>
                    <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        {isPlaying && (
                             <div className="h-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite] w-full origin-left"></div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};

export default ResultsOverlay;
