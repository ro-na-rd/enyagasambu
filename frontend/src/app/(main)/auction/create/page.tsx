'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Gavel, Loader2, CheckCircle, AlertCircle, ArrowLeft, Image as ImageIcon, Clock,
} from '@/lib/icons';

interface Category { id: number; name: string; slug: string; type: string; icon?: string }

const ORG = '#E85D04';
const NAVY = '#0f1e42';

const CURRENCIES = ['RWF', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'UGX', 'ZAR', 'XAF', 'CHF', 'CAD', 'AUD'];

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalToISO(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function CreateAuctionPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [increment, setIncrement] = useState('500');
  const [reservePrice, setReservePrice] = useState('');
  const [currency, setCurrency] = useState('RWF');
  const [location, setLocation] = useState('');
  const [startInput, setStartInput] = useState(() => toLocalInput(new Date(Date.now() + 30 * 60 * 1000)));
  const [endInput, setEndInput] = useState(() => toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [antiSniping, setAntiSniping] = useState(true);
  const [snipingWindow, setSnipingWindow] = useState('30');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    api.get('/categories').then(({ data }) => {
      const productCats = (data.categories || []).filter((c: Category) => c.type === 'product');
      setCategories(productCats);
    }).catch(() => {});
  }, [user, router]);

  useEffect(() => {
    return () => { previews.forEach((p) => URL.revokeObjectURL(p)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6);
    setImages(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p));
      return urls;
    });
  };

  const validate = (): string | null => {
    if (!title.trim()) return 'Product title is required.';
    if (!categoryId) return 'Please choose a category.';
    const start = Number(startingPrice);
    if (!Number.isFinite(start) || start <= 0) return 'Starting price must be greater than zero.';
    const inc = Number(increment);
    if (!Number.isFinite(inc) || inc <= 0) return 'Minimum bid increment must be positive.';
    const startIso = parseLocalToISO(startInput);
    const endIso = parseLocalToISO(endInput);
    if (!startIso || !endIso) return 'Auction start and end times are required.';
    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) return 'Auction end time must be after the start time.';
    if (reservePrice.trim() !== '' && (Number.isNaN(Number(reservePrice)) || Number(reservePrice) < 0)) {
      return 'Reserve price must be zero or greater.';
    }
    const win = Number(snipingWindow);
    if (antiSniping && (!Number.isFinite(win) || win <= 0)) return 'Anti-sniping window must be a positive number of seconds.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    setSubmitting(true);
    const form = new FormData();
    form.append('title', title.trim());
    form.append('description', description.trim());
    form.append('category_id', categoryId);
    form.append('starting_price', startingPrice);
    form.append('minimum_increment', increment);
    form.append('currency', currency);
    form.append('location', location.trim() || 'Kigali');
    form.append('auction_start', parseLocalToISO(startInput) as string);
    form.append('auction_end', parseLocalToISO(endInput) as string);
    if (reservePrice.trim() !== '') form.append('reserve_price', reservePrice);
    form.append('anti_sniping', String(antiSniping));
    form.append('sniping_window', snipingWindow);
    images.forEach((f) => form.append('images', f));

    try {
      const { data } = await api.post('/auctions', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true);
      setTimeout(() => router.push(`/auction/${data.auctionId}`), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create auction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="bg-white rounded-2xl shadow p-8 space-y-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={34} color="#16a34a" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Auction Created!</h2>
          <p className="text-gray-500 text-sm">Your auction is live and open for bidding. Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/auction" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#E85D04] transition mb-5">
        <ArrowLeft size={15} /> Back to auctions
      </Link>

      <div className="rounded-2xl p-5 mb-5" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}>
        <div className="flex items-center gap-3 text-white">
          <Gavel size={28} />
          <div>
            <h1 className="text-xl font-bold">Submit an item for auction</h1>
            <p className="text-white/80 text-xs mt-0.5">Set a starting price, schedule the auction window and let bidders compete.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
            placeholder="e.g. Vintage Rolex Datejust 1987"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#E85D04]"
            placeholder="Describe the item, its condition, history, and what makes it special…"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            >
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              placeholder="e.g. Kicukiro, Kigali"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starting price *</label>
            <input
              type="number"
              min="1"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              placeholder="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min. increment *</label>
            <input
              type="number"
              min="1"
              value={increment}
              onChange={(e) => setIncrement(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              placeholder="500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reserve price <span className="text-gray-400 font-normal">(optional — minimum you will accept)</span>
          </label>
          <input
            type="number"
            min="0"
            value={reservePrice}
            onChange={(e) => setReservePrice(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            placeholder="e.g. 50000"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auction starts *</label>
            <input
              type="datetime-local"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auction ends *</label>
            <input
              type="datetime-local"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Anti-sniping</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Automatically extend the auction when a bid lands in the final window.</p>
            </div>
            <button
              type="button"
              onClick={() => setAntiSniping((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition ${antiSniping ? 'bg-[#E85D04]' : 'bg-gray-300'}`}
              aria-label="Toggle anti-sniping"
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${antiSniping ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
          {antiSniping && (
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Extension window (seconds)</label>
              <input
                type="number"
                min="1"
                value={snipingWindow}
                onChange={(e) => setSnipingWindow(e.target.value)}
                className="w-full sm:w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                placeholder="30"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos (up to 6)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImages}
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-[#E85D04] file:font-medium hover:file:bg-orange-100"
          />
          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {previews.map((url, i) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          {previews.length === 0 && (
            <p className="text-[11px] text-gray-400 mt-1.5 inline-flex items-center gap-1">
              <ImageIcon size={12} /> Optional, but auctions with photos get more bids.
            </p>
          )}
        </div>

        <div className="bg-orange-50 rounded-lg px-4 py-3 text-xs text-gray-600 flex items-start gap-2">
          <Clock size={14} className="mt-0.5 shrink-0" style={{ color: ORG }} />
          <span>Auctions are free to create. Once started, bidders compete in real time and the highest bidder at closing wins.</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#E85D04] text-white font-semibold py-3 rounded-lg hover:bg-[#e05d00] transition disabled:opacity-60"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />}
          {submitting ? 'Creating auction…' : 'Create Auction'}
        </button>
      </form>
    </div>
  );
}
