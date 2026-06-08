'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import imageCompression from 'browser-image-compression';

interface FilmPhoto {
  id: string;
  dataUrl: string;
  uploaded: boolean;
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('wedding_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('wedding_session_id', sid);
  }
  return sid;
}

export default function CameraPage() {
  const [stagedPhoto, setStagedPhoto] = useState<string | null>(null);
  const [filmStrip, setFilmStrip] = useState<FilmPhoto[]>([]);
  const [shotCount, setShotCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadError(null);
    setUploadSuccess(false);

    // Compress
    const compressed = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      setStagedPhoto(e.target?.result as string);
      setStagedFile(compressed as unknown as File);
    };
    reader.readAsDataURL(compressed);

    // Shutter flash
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 400);
  }, []);

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleCameraClick = () => cameraInputRef.current?.click();

  const handleRedo = () => {
    setStagedPhoto(null);
    setStagedFile(null);
    setUploadError(null);
  };

  const handleKeep = async () => {
    if (!stagedFile || !stagedPhoto) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const sessionId = getOrCreateSessionId();
      const formData = new FormData();
      formData.append('photo', stagedFile, `photo-${Date.now()}.jpg`);
      formData.append('session_id', sessionId);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const newPhoto: FilmPhoto = {
        id: data.id || crypto.randomUUID(),
        dataUrl: stagedPhoto,
        uploaded: true,
      };

      setFilmStrip((prev) => [newPhoto, ...prev]);
      setShotCount((c) => c + 1);
      setStagedPhoto(null);
      setStagedFile(null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--charcoal)', color: 'var(--cream)' }}>
      {/* Header */}
      <header className="pt-8 pb-4 px-6 text-center">
        <p className="font-sans text-xs tracking-[0.3em] uppercase opacity-50 mb-1">disposable camera</p>
        <h1 className="font-serif text-3xl font-light italic" style={{ color: 'var(--gold-light)' }}>
          Capture the Day
        </h1>
        <p className="font-sans text-xs opacity-40 mt-1 tracking-wide">
          your photos will be revealed tomorrow ✦
        </p>
      </header>

      {/* Shot counter */}
      <div className="flex justify-center mb-4">
        <div
          className="font-mono text-xs px-4 py-1.5 rounded-full flex items-center gap-2"
          style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)', color: 'var(--gold)' }}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          {shotCount} shot{shotCount !== 1 ? 's' : ''} taken
        </div>
      </div>

      {/* Main viewfinder area */}
      <div className="flex-1 flex flex-col items-center px-4 pb-2">
        <div
          className="relative w-full max-w-sm rounded-lg overflow-hidden"
          style={{
            aspectRatio: '3/4',
            background: '#111',
            border: '2px solid rgba(201,169,110,0.2)',
            boxShadow: '0 0 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.4)',
          }}
        >
          {/* Viewfinder corners */}
          <div className="viewfinder-corner tl" />
          <div className="viewfinder-corner tr" />
          <div className="viewfinder-corner bl" />
          <div className="viewfinder-corner br" />

          {/* Shutter flash overlay */}
          {shutterFlash && (
            <div className="absolute inset-0 bg-white z-20 shutter-flash pointer-events-none" />
          )}

          {stagedPhoto ? (
            /* Preview staged photo */
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stagedPhoto}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)' }}
              />
              {/* Upload progress overlay */}
              {isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ background: 'rgba(26,18,18,0.75)' }}>
                  <div className="flex gap-2 mb-3">
                    {[0,1,2].map(i => (
                      <div key={i} className="loading-dot w-2 h-2 rounded-full"
                        style={{ background: 'var(--gold)', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                  <p className="font-sans text-xs tracking-widest opacity-70">Developing…</p>
                </div>
              )}
            </div>
          ) : (
            /* Empty viewfinder */
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 opacity-30">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.5" />
                <line x1="24" y1="6" x2="24" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="24" y1="37" x2="24" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="6" y1="24" x2="11" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="37" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="font-sans text-xs tracking-widest">ready to shoot</p>
            </div>
          )}
        </div>

        {/* Error / success messages */}
        {uploadError && (
          <div className="mt-2 text-xs text-red-400 font-sans text-center px-4">
            {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div className="mt-2 text-xs font-sans text-center animate-fade-in" style={{ color: 'var(--sage)' }}>
            ✓ Photo saved to the album
          </div>
        )}

        {/* Buttons */}
        <div className="mt-4 w-full max-w-sm">
          {stagedPhoto ? (
            /* Staged: Keep or Redo */
            <div className="flex gap-3">
              <button
                onClick={handleRedo}
                disabled={isUploading}
                className="flex-1 py-3 rounded-lg font-sans text-sm tracking-wide transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                Redo
              </button>
              <button
                onClick={handleKeep}
                disabled={isUploading}
                className="flex-[2] py-3 rounded-lg font-sans text-sm tracking-wide transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, var(--gold), #a87d40)',
                  color: 'var(--charcoal)',
                  fontWeight: 500,
                  boxShadow: '0 4px 20px rgba(201,169,110,0.3)',
                }}
              >
                {isUploading ? 'Developing…' : 'Keep it ✦'}
              </button>
            </div>
          ) : (
            /* No photo: Upload or Camera */
            <div className="flex gap-3">
              <button
                onClick={handleUploadClick}
                className="flex-1 py-3 rounded-lg font-sans text-sm tracking-wide flex flex-col items-center gap-1 transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 5V4a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 9v4m-2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Gallery</span>
              </button>
              <button
                onClick={handleCameraClick}
                className="flex-[2] py-3 rounded-lg font-sans text-sm tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, var(--blush-dark), #8a3a3f)',
                  color: 'var(--cream)',
                  fontWeight: 500,
                  boxShadow: '0 4px 20px rgba(192,92,99,0.3)',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M2 8a2 2 0 012-2h1.5l1.5-2h8l1.5 2H18a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="11" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Camera
              </button>
            </div>
          )}
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
      </div>

      {/* Film strip */}
      <div
        className="mt-2 py-3 overflow-hidden"
        style={{ background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Film holes top */}
        <div className="flex items-center gap-2 px-3 mb-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="film-hole opacity-40" />
          ))}
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 px-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {filmStrip.length === 0 ? (
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded"
                  style={{
                    width: 52,
                    height: 52,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px dashed rgba(255,255,255,0.12)',
                  }}
                />
              ))}
            </div>
          ) : (
            filmStrip.map((photo, idx) => (
              <div
                key={photo.id}
                className="flex-shrink-0 rounded overflow-hidden animate-film-advance"
                style={{
                  width: 52,
                  height: 52,
                  border: idx === 0 ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))
          )}
        </div>

        {/* Film holes bottom */}
        <div className="flex items-center gap-2 px-3 mt-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="film-hole opacity-40" />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center">
        <a
          href="/gallery"
          className="font-sans text-xs tracking-widest uppercase opacity-30 hover:opacity-60 transition-opacity"
          style={{ color: 'var(--cream)' }}
        >
          View Gallery →
        </a>
      </div>
    </div>
  );
}
