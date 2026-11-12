import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function QRScanner({ onScan, isVerifying }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const [fileError, setFileError] = useState('');

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data && code.data.trim()) {
        const scannedCode = code.data.trim();
        if (scannedCode !== lastScanned) {
          setLastScanned(scannedCode);
          onScan(scannedCode);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    setCameraError('');
    setFileError('');
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        animFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.warn('Camera access unavailable:', err);
      setCameraError('Camera access unavailable or permission denied. You can still upload a QR image or enter code.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data && code.data.trim()) {
          const scannedCode = code.data.trim();
          setLastScanned(scannedCode);
          onScan(scannedCode);
        } else {
          setFileError('Could not detect a valid QR code in this image. Please ensure good lighting or enter the ticket code manually.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            Live WebRTC Camera & Image QR Scanner
          </h4>
          <p className="text-[11px] text-slate-400">
            Scan attendee ticket pass instantly without manual passcode entry
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!cameraActive ? (
            <button
              type="button"
              onClick={startCamera}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-all shadow-md"
            >
              <Camera className="w-3.5 h-3.5" /> Start Live Camera
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-all shadow-md"
            >
              <CameraOff className="w-3.5 h-3.5" /> Stop Camera
            </button>
          )}

          <label className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            Upload Ticket Image
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {cameraActive && (
        <div className="relative aspect-video max-h-72 w-full bg-black rounded-xl overflow-hidden border border-cyan-500/40 shadow-inner flex items-center justify-center my-3">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner targeting reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-cyan-400/80 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-cyan-300 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-cyan-300 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-cyan-300 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-cyan-300 rounded-br-lg" />
            </div>
          </div>

          <div className="absolute bottom-2 px-3 py-1 rounded-full bg-slate-950/80 text-[11px] text-cyan-300 border border-cyan-500/30 flex items-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" /> Point at digital ticket pass or printout
          </div>
        </div>
      )}

      {cameraError && (
        <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {fileError && (
        <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {lastScanned && (
        <div className="mt-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
          <span>Detected Code: <strong className="text-cyan-300 font-mono">{lastScanned}</strong></span>
          {isVerifying ? (
            <span className="text-blue-400 animate-pulse font-semibold">Verifying ticket in database...</span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold"><CheckCircle2 className="w-3 h-3" /> Scanned</span>
          )}
        </div>
      )}
    </div>
  );
}
