'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface Listing {
  id: number;
  title: string;
  price: number | null;
  price_type: string;
  location: string;
  listing_type: string;
  category_name: string;
  seller_name: string;
  primary_image: string | null;
  is_featured?: boolean;
  created_at: string;
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const { T } = useLanguage();
  const priceLabel = listing.price
    ? `${Number(listing.price).toLocaleString()} RWF${listing.price_type === 'per_day' ? '/day' : listing.price_type === 'per_month' ? '/mo' : ''}`
    : T.priceOnRequest;

  return (
    <Link href={`/listings/${listing.id}`} className={`block bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden group relative ${listing.is_featured ? 'ring-2 ring-yellow-400' : ''}`}>
      {listing.is_featured && (
        <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
          ⭐ Featured
        </div>
      )}
      <div className="h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
        {listing.primary_image ? (
          <img src={listing.primary_image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
        ) : (
          <span className="text-5xl opacity-30">📦</span>
        )}
      </div>
      <div className="p-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${listing.listing_type === 'rent' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-[#FF6B00]'}`}>
          {listing.listing_type === 'rent' ? T.forRent : T.forSale}
        </span>
        <h3 className="mt-1.5 text-sm font-semibold text-gray-900 truncate">{listing.title}</h3>
        <p className="font-bold text-sm mt-0.5" style={{ color: '#FF6B00' }}>{priceLabel}</p>
        <p className="text-xs text-gray-500 mt-1 truncate">{listing.location || 'Kigali'}</p>
        <p className="text-xs text-gray-400 mt-0.5">{listing.category_name}</p>
      </div>
    </Link>
  );
}
