'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

export default function BrokerPhotoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/broker/login');
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fc' }}>
      <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
    </div>
  );

  if (!user) return null;

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  const handleSave = () => {
    if (preview) {
      localStorage.setItem('broker_photo', preview);
    }
    router.push('/broker');
  };

  const handleSkip = () => {
    router.push('/broker');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #0f1e4211 0%, #E85D0411 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">

        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-base"
            style={{ background: 'linear-gradient(135deg, #0f1e42, #E85D04)' }}>E</div>
          <div className="text-left">
            <p className="font-extrabold text-sm leading-tight" style={{ color: '#0f1e42' }}>
              Broker Portal
            </p>
            <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#E85D04' }}>E-Nyagasambu</p>
          </div>
        </div>

        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: NAVY }}>
          <span className="text-white text-2xl">📷</span>
        </div>

        <h1 className="text-xl font-bold mb-1" style={{ color: NAVY }}>Profile Photo</h1>
        <p className="text-sm text-gray-500 mb-6">
          Welcome, <strong>{user?.name}</strong>! Upload a photo for your broker certificate.
        </p>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="cursor-pointer rounded-2xl border-2 border-dashed mb-6 overflow-hidden transition mx-auto"
          style={{ borderColor: dragging ? ORG : '#d1d5db', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: dragging ? '#fff7f2' : '#f9fafb', borderRadius: '50%' }}
        >
          {preview
            ? <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <><span className="text-5xl mb-3">🖼️</span><p className="text-sm text-gray-400">Click or drag photo</p></>
          }
        </div>

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        <div className="flex gap-3 justify-center">
          {preview && (
            <button onClick={handleSave}
              className="text-white font-bold px-6 py-2.5 rounded-lg transition hover:opacity-90 text-sm"
              style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
              Save Photo →
            </button>
          )}
          <button onClick={handleSkip}
            className="font-medium px-6 py-2.5 rounded-lg border transition hover:bg-gray-50 text-sm"
            style={{ color: NAVY, borderColor: '#d1d5db' }}>
            {preview ? 'Skip' : 'Skip for now'}
          </button>
        </div>

        {preview && (
          <Link href="/broker"
            className="block mt-4 text-xs text-gray-400 hover:text-gray-600">
            Continue to Dashboard →
          </Link>
        )}
      </div>
    </div>
  );
}
