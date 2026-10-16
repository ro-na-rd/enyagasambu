import type { Metadata } from 'next';
import ListingDetailClient from './ListingDetailClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://enyagasambu.rw';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

interface ListingApiResponse {
  listing: {
    id: number;
    title: string;
    description: string;
    price: number | null;
    currency?: string;
    location: string;
    category_name: string;
    images: { id: number; image_url: string; is_primary: boolean }[];
  };
}

async function fetchListingForMeta(id: string): Promise<ListingApiResponse['listing'] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/listings/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data: ListingApiResponse = await res.json();
    return data.listing;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListingForMeta(id);

  if (!listing) {
    return {
      title: 'Listing Not Found',
    };
  }

  const primaryImage = listing.images?.find(img => img.is_primary)?.image_url
    || listing.images?.[0]?.image_url
    || '/og-image.png';
  const price = listing.price
    ? `${Number(listing.price).toLocaleString()} ${listing.currency || 'RWF'}`
    : 'Price on request';
  const description = listing.description
    ? listing.description.slice(0, 200)
    : `${listing.title} - ${price} in ${listing.location || 'Rwanda'}. Browse on E-Nyagasambu.`;

  const listingUrl = `${SITE_URL}/listings/${id}`;

  return {
    title: listing.title,
    description,
    alternates: {
      canonical: listingUrl,
    },
    openGraph: {
      type: 'article',
      url: listingUrl,
      title: `${listing.title} - ${price}`,
      description,
      siteName: 'E-Nyagasambu',
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.title} - ${price}`,
      description,
      images: [primaryImage],
    },
  };
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ListingDetailClient params={params} />;
}
