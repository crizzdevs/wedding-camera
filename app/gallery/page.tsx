'use client';

import { useState, useEffect, useCallback } from 'react';

interface Photo {
  id: string;
  signedUrl: string;
  uploaded_at: string;
  session_id: string;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('wedding_session_id') || '';
}

export default function GalleryPage() {
  const [revealed, setRevealed] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setRevealed(data.revealed);

      if (data.revealed) {
        const galleryRes = await fetch('/api/gallery');
        const galleryData = await galleryRes.json();
        if (galleryData.photos) setPhotos(galleryData.photos);
      }
    } catch {
      console.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Lightbox keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightboxPhoto) return;
      if (e.key === 'Escape') setLightboxPhoto(null);
      if (e.key === 'ArrowRight') {
        const idx = photos.findIndex(p => p.id === lightboxPhoto.id);
        if (idx < photos.length - 1) setLightboxPhoto(photos[idx + 1]);
      }
      if (e.key === 'ArrowLeft') {
        const idx = photos.findIndex(p => p.id === lightboxPhoto.id);
        if (idx > 0) setLightboxPhoto(photos[idx - 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxPhoto, photos]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="loading-dot w-2 h-2 rounded-full"
              style={{ background: 'var(--blush-dark)', animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!revealed) {
    return (
      <LockedGallery />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <header className="py-12 px-6 text-center">
        <p className="font-sans text-xs tracking-[0.3em] uppercase opacity-40 mb-2">the gallery is open</p>
        <h1 className="font-serif text-4xl font-light italic" style={{ color: 'var(--charcoal)' }}>
          Our Wedding Day
        </h1>
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="h-px w-16" style={{ background: 'var(--blush)' }} />
          <span className="text-lg" style={{ color: 'var(--blush-dark)' }}>♥</span>
          <div className="h-px w-16" style={{ background: 'var(--blush)' }} />
        </div>
        <p className="font-sans text-sm opacity-50 mt-3">{photos.length} memories captured</p>
      </header>

      {/* Masonry grid */}
      <div className="px-4 pb-16 max-w-5xl mx-auto">
        <div className="masonry-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="masonry-item cursor-pointer group relative"
              onClick={() => setLightboxPhoto(photo)}
            >
              <div
                className="rounded overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]"
                style={{
                  border: photo.session_id === sessionId
                    ? '2px solid var(--blush-dark)'
                    : '2px solid transparent',
                  boxShadow: '0 2px 12px rgba(42,32,32,0.1)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.signedUrl}
                  alt="Wedding photo"
                  className="w-full block"
                  loading="lazy"
                />
                {photo.session_id === sessionId && (
                  <div
                    className="absolute top-2 right-2 text-xs font-sans px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--blush-dark)', color: 'white', fontSize: '10px' }}
                  >
                    yours
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center lightbox-overlay"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxPhoto.signedUrl}
              alt="Full size"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-sans text-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
            >
              ×
            </button>
            {/* Nav arrows */}
            {photos.findIndex(p => p.id === lightboxPhoto.id) > 0 && (
              <button
                onClick={() => {
                  const idx = photos.findIndex(p => p.id === lightboxPhoto.id);
                  setLightboxPhoto(photos[idx - 1]);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
              >
                ‹
              </button>
            )}
            {photos.findIndex(p => p.id === lightboxPhoto.id) < photos.length - 1 && (
              <button
                onClick={() => {
                  const idx = photos.findIndex(p => p.id === lightboxPhoto.id);
                  setLightboxPhoto(photos[idx + 1]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}

      {/* Back to camera */}
      <div className="fixed bottom-6 right-6">
        <a
          href="/camera"
          className="font-sans text-xs tracking-widest uppercase px-4 py-2 rounded-full transition-all"
          style={{
            background: 'var(--charcoal)',
            color: 'var(--cream)',
            opacity: 0.7,
          }}
        >
          📷 Add Photos
        </a>
      </div>
    </div>
  );
}

function LockedGallery() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--charcoal)' }}
    >
      {/* Envelope illustration */}
      <div className="mb-8 relative">
        <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="15" width="90" height="60" rx="4" stroke="var(--gold)" strokeWidth="1.5" fill="rgba(201,169,110,0.05)" />
          <path d="M5 19l45 28 45-28" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M5 75l30-22m60 22L65 53" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" />
          {/* Wax seal */}
          <circle cx="50" cy="44" r="12" fill="var(--blush-dark)" opacity="0.9" />
          <text x="50" y="49" textAnchor="middle" fontSize="12" fill="var(--cream)">♥</text>
        </svg>
      </div>

      <p className="font-sans text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--gold)', opacity: 0.6 }}>
        gallery locked
      </p>
      <h1 className="font-serif text-4xl font-light italic mb-4" style={{ color: 'var(--cream)' }}>
        Check back tomorrow
      </h1>
      <p className="font-sans text-sm opacity-40 mb-2 max-w-xs leading-relaxed" style={{ color: 'var(--cream)' }}>
        The photos are being developed. The couple will reveal all memories once the night is over.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <div className="h-px w-12" style={{ background: 'var(--blush)' }} />
        <span style={{ color: 'var(--blush)' }}>♥</span>
        <div className="h-px w-12" style={{ background: 'var(--blush)' }} />
      </div>

      <a
        href="/camera"
        className="mt-10 font-sans text-xs tracking-widest uppercase px-6 py-3 rounded-full transition-all"
        style={{
          border: '1px solid rgba(201,169,110,0.3)',
          color: 'var(--gold)',
          opacity: 0.7,
        }}
      >
        📷 Take more photos
      </a>
    </div>
  );
}
