'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Props {
  listingId: number;
  size?: number;
  showCount?: boolean;
  className?: string;
  isOwner?: boolean;
}

const STAR = '★';

export default function StarRating({ listingId, size = 16, showCount = true, className = '', isOwner = false }: Props) {
  const { user } = useAuth();
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [myStars, setMyStars] = useState<number | null>(null);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/ratings/${listingId}`)
      .then(({ data }) => {
        if (!active) return;
        setAvg(Number(data.avg) || 0);
        setCount(Number(data.count) || 0);
        setMyStars(data.myStars);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [listingId]);

  const display = hover > 0 ? hover : myStars || Math.round(avg);

  const handleRate = async (stars: number) => {
    if (isOwner) {
      setMessage('You cannot rate your own post.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (!user) {
      setMessage('Please sign in to rate this post.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    if (myStars) {
      setMessage('You already rated this post. Each user can rate only once.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const { data } = await api.post(`/ratings/${listingId}`, { stars });
      setAvg(Number(data.avg) || 0);
      setCount(Number(data.count) || 0);
      setMyStars(data.myStars);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(msg || 'Could not submit your rating.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rate this post">
        {[1, 2, 3, 4, 5].map((s) => {
          const filled = s <= display;
          const clickable = !!user && !myStars && !saving && !isOwner;
          return (
            <button
              key={s}
              type="button"
              disabled={!clickable}
              onClick={() => handleRate(s)}
              onMouseEnter={() => { if (clickable) setHover(s); }}
              onMouseLeave={() => setHover(0)}
              aria-label={`${s} star${s > 1 ? 's' : ''}`}
              className={`leading-none transition-transform ${clickable ? 'cursor-pointer hover:scale-125' : 'cursor-default'} ${saving ? 'opacity-60' : ''}`}
              style={{ fontSize: size, color: filled ? '#F59E0B' : '#D1D5DB', textShadow: filled ? '0 0 2px rgba(245,158,11,0.4)' : 'none' }}
            >
              {STAR}
            </button>
          );
        })}
      </div>
      {showCount && (
        <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
          {count > 0 ? `${avg.toFixed(1)} (${count})` : 'No ratings'}
        </span>
      )}
      {message && <span className="text-[10px] text-orange-600 font-medium whitespace-nowrap">{message}</span>}
    </div>
  );
}