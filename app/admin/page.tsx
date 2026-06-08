'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';

interface Photo {
  id: string;
  signedUrl: string;
  uploaded_at: string;
  session_id: string;
  gcs_filename: string;
}

interface AdminData {
  photos: Photo[];
  count: number;
  revealed: boolean;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    // Check if already authed in session
    const saved = sessionStorage.getItem('admin_password');
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/gallery?admin=true', {
        headers: { 'x-admin-password': password },
      });
      if (res.status === 401) {
        setAuthed(false);
        setAuthError('Session expired. Please log in again.');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    // Validate password against backend
    const res = await fetch('/api/gallery?admin=true', {
      headers: { 'x-admin-password': password },
    });
    if (res.ok) {
      sessionStorage.setItem('admin_password', password);
      setAuthed(true);
    } else {
      setAuthError('Incorrect password');
    }
  }

  async function handleReveal() {
    setRevealing(true);
    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Gallery revealed! Guests can now view their photos.' });
        loadData();
      } else {
        setMessage({ type: 'error', text: 'Failed to reveal gallery' });
      }
    } finally {
      setRevealing(false);
    }
  }

  async function handleDelete(photo: Photo) {
    setDeletingId(photo.id);
    try {
      const res = await fetch(`/api/upload?id=${photo.id}&gcs=${encodeURIComponent(photo.gcs_filename)}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        setData(prev => prev ? { ...prev, photos: prev.photos.filter(p => p.id !== photo.id), count: prev.count - 1 } : prev);
        setMessage({ type: 'success', text: 'Photo deleted' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete photo' });
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (!authed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--cream)' }}
      >
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="font-sans text-xs tracking-[0.3em] uppercase opacity-40 mb-2">admin</p>
            <h1 className="font-serif text-3xl font-light italic" style={{ color: 'var(--charcoal)' }}>
              Wedding Console
            </h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full px-4 py-3 rounded-lg font-sans text-sm outline-none"
              style={{
                background: 'white',
                border: '1.5px solid var(--cream-200)',
                color: 'var(--charcoal)',
              }}
            />
            {authError && (
              <p className="text-red-500 text-xs font-sans">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-sans text-sm font-medium tracking-wide transition-all"
              style={{
                background: 'var(--charcoal)',
                color: 'var(--cream)',
              }}
            >
              Enter →
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <header
        className="px-6 py-6 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--cream-200)' }}
      >
        <div>
          <p className="font-sans text-xs tracking-[0.3em] uppercase opacity-40">admin</p>
          <h1 className="font-serif text-2xl font-light italic" style={{ color: 'var(--charcoal)' }}>
            Wedding Console
          </h1>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem('admin_password'); setAuthed(false); }}
          className="font-sans text-xs opacity-40 hover:opacity-70 transition-opacity"
        >
          Log out
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Message */}
        {message && (
          <div
            className="px-4 py-3 rounded-lg font-sans text-sm animate-fade-in"
            style={{
              background: message.type === 'success' ? 'rgba(107,128,99,0.1)' : 'rgba(192,92,99,0.1)',
              border: `1px solid ${message.type === 'success' ? 'var(--sage)' : 'var(--blush-dark)'}`,
              color: message.type === 'success' ? 'var(--sage-dark)' : 'var(--blush-dark)',
            }}
          >
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right opacity-50 hover:opacity-100">×</button>
          </div>
        )}

        {/* Stats + Reveal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="rounded-xl p-5 col-span-1"
            style={{ background: 'white', border: '1px solid var(--cream-200)' }}
          >
            <p className="font-sans text-xs uppercase tracking-widest opacity-40 mb-1">Total Photos</p>
            <p className="font-serif text-4xl font-light" style={{ color: 'var(--charcoal)' }}>
              {loading ? '—' : data?.count ?? 0}
            </p>
          </div>

          <div
            className="rounded-xl p-5 col-span-1"
            style={{ background: 'white', border: '1px solid var(--cream-200)' }}
          >
            <p className="font-sans text-xs uppercase tracking-widest opacity-40 mb-1">Gallery Status</p>
            <p
              className="font-sans text-sm font-medium mt-1"
              style={{ color: data?.revealed ? 'var(--sage-dark)' : 'var(--blush-dark)' }}
            >
              {data?.revealed ? '✓ Revealed to guests' : '⏳ Hidden — not yet revealed'}
            </p>
          </div>

          <div
            className="rounded-xl p-5 col-span-1 flex items-center justify-center"
            style={{
              background: data?.revealed ? 'rgba(107,128,99,0.1)' : 'var(--charcoal)',
              border: '1px solid var(--cream-200)',
            }}
          >
            {data?.revealed ? (
              <p className="font-sans text-sm font-medium" style={{ color: 'var(--sage-dark)' }}>
                Gallery is live ✓
              </p>
            ) : (
              <button
                onClick={handleReveal}
                disabled={revealing}
                className="w-full py-3 rounded-lg font-sans text-sm font-medium tracking-wide transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--blush-dark), #8a3a3f)',
                  color: 'white',
                  opacity: revealing ? 0.7 : 1,
                }}
              >
                {revealing ? 'Revealing…' : '✦ Reveal Gallery'}
              </button>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div
          className="rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6"
          style={{ background: 'white', border: '1px solid var(--cream-200)' }}
        >
          <div
            className="p-4 rounded-lg"
            style={{ background: 'var(--cream)', border: '1px solid var(--cream-200)' }}
          >
            <QRCode
              value={`${baseUrl}/camera`}
              size={140}
              bgColor="transparent"
              fgColor="var(--charcoal)"
              level="M"
            />
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-widest opacity-40 mb-2">Guest Camera Link</p>
            <p className="font-serif text-xl font-light italic mb-2" style={{ color: 'var(--charcoal)' }}>
              Share this QR code at the venue
            </p>
            <p className="font-mono text-xs opacity-50 break-all">{baseUrl}/camera</p>
            <div className="flex gap-3 mt-3">
              <a
                href="/camera"
                target="_blank"
                className="font-sans text-xs tracking-wide px-3 py-1.5 rounded-full"
                style={{ border: '1px solid var(--charcoal)', color: 'var(--charcoal)', opacity: 0.6 }}
              >
                Preview →
              </a>
              <button
                onClick={() => window.print()}
                className="font-sans text-xs tracking-wide px-3 py-1.5 rounded-full"
                style={{ border: '1px solid var(--charcoal)', color: 'var(--charcoal)', opacity: 0.6 }}
              >
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Photo grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-light italic" style={{ color: 'var(--charcoal)' }}>
              All Photos
            </h2>
            <button
              onClick={loadData}
              className="font-sans text-xs opacity-40 hover:opacity-70 transition-opacity"
            >
              Refresh ↺
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex gap-2">
                {[0,1,2].map(i => (
                  <div key={i} className="loading-dot w-2 h-2 rounded-full"
                    style={{ background: 'var(--blush-dark)', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {data?.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden"
                  style={{ border: '1px solid var(--cream-200)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.signedUrl}
                    alt=""
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2"
                    style={{ background: 'rgba(42,32,32,0.6)' }}
                  >
                    <p className="font-mono text-xs text-white opacity-70">
                      {new Date(photo.uploaded_at).toLocaleTimeString()}
                    </p>
                    <button
                      onClick={() => handleDelete(photo)}
                      disabled={deletingId === photo.id}
                      className="self-end text-xs font-sans px-2 py-1 rounded"
                      style={{ background: 'var(--blush-dark)', color: 'white' }}
                    >
                      {deletingId === photo.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && data?.photos.length === 0 && (
            <div className="text-center py-16 opacity-40">
              <p className="font-serif text-xl italic">No photos yet</p>
              <p className="font-sans text-xs mt-1">Share the QR code with your guests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
