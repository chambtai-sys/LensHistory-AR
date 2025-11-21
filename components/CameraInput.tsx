import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Upload, SwitchCamera } from 'lucide-react';

interface CameraInputProps {
  onCapture: (image: string, mimeType: string) => void;
}

const CameraInput: React.FC<CameraInputProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied or unavailable. Please upload a photo.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get base64 string without the prefix for the API, but keep prefix for internal preview if needed
        // The API usually expects pure base64 in inlineData depending on the library, 
        // but @google/genai usually handles the data part. 
        // We'll extract the raw base64.
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64, 'image/jpeg');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        onCapture(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center">
      {!error ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="text-white p-6 text-center bg-gray-900 rounded-xl m-4">
            <p className="mb-4">{error}</p>
        </div>
      )}

      {/* Hidden Canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8 px-6">
         {/* File Upload Fallback */}
         <label className="p-4 rounded-full bg-white/10 backdrop-blur-md text-white cursor-pointer hover:bg-white/20 transition-all">
          <Upload size={24} />
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
        </label>

        {/* Capture Button */}
        <button
          onClick={takePhoto}
          className="w-20 h-20 rounded-full border-4 border-white bg-transparent flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
        >
          <div className="w-16 h-16 bg-white rounded-full"></div>
        </button>

        {/* Switch Camera */}
        <button 
            onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
            className="p-4 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
        >
            <SwitchCamera size={24} />
        </button>
      </div>
      
      <div className="absolute top-8 left-0 right-0 text-center pointer-events-none">
         <h1 className="text-white/80 font-semibold text-sm bg-black/30 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
            LensHistory AR
         </h1>
      </div>
    </div>
  );
};

export default CameraInput;