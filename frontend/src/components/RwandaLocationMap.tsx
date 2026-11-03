'use client';

import { useMemo, useState } from 'react';
import { MapPin, MessageCircle, Phone, Send } from '@/lib/icons';

export interface RwandaMapListing {
  id: number;
  location: string;
  category_name: string;
}

export interface RwandaLocationSelection {
  name: string;
  terms: string[];
}

interface RwandaLocationMapProps {
  listings: RwandaMapListing[];
  activeLocation: string | null;
  onLocationSelect: (location: RwandaLocationSelection | null) => void;
}

type MapLocation = RwandaLocationSelection & {
  latitude: number;
  longitude: number;
};

const LOCATIONS: MapLocation[] = [
  { name: 'Musanze', terms: ['musanze', 'ruhenger'], latitude: -1.4998, longitude: 29.635 },
  { name: 'Rubavu', terms: ['rubavu', 'gisenyi'], latitude: -1.7028, longitude: 29.2564 },
  { name: 'Nyagatare', terms: ['nyagatare'], latitude: -1.2976, longitude: 30.3267 },
  { name: 'Kigali', terms: ['kigali', 'gasabo', 'kicukiro', 'nyarugenge'], latitude: -1.9441, longitude: 30.0619 },
  { name: 'Rwamagana', terms: ['rwamagana', 'kayonza'], latitude: -1.9487, longitude: 30.4347 },
  { name: 'Muhanga', terms: ['muhanga', 'gitarama'], latitude: -2.0844, longitude: 29.7567 },
  { name: 'Huye', terms: ['huye', 'butare'], latitude: -2.5967, longitude: 29.7394 },
  { name: 'Rusizi', terms: ['rusizi', 'cyangugu'], latitude: -2.4846, longitude: 28.9075 },
];

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) return `250${digits.slice(1)}`;
  return digits;
};

export default function RwandaLocationMap({ listings, activeLocation, onLocationSelect }: RwandaLocationMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation>(LOCATIONS[3]);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);

  const locationCounts = useMemo(() => LOCATIONS.map((place) => ({
    ...place,
    count: listings.filter((listing) => {
      const location = listing.location.toLocaleLowerCase();
      return place.terms.some((term) => location.includes(term));
    }).length,
  })), [listings]);

  const mapSrc = `https://www.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}&z=12&output=embed`;
  const locationUrl = `https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`;

  const selectLocation = (location: MapLocation) => {
    setUsingCurrentLocation(false);
    setSelectedLocation(location);
    onLocationSelect(activeLocation === location.name ? null : location);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setPhoneError('Location services are not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSelectedLocation({
          name: 'Current location',
          terms: [],
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setUsingCurrentLocation(true);
        setPhoneError('');
        onLocationSelect(null);
      },
      () => setPhoneError('We could not access your location. Choose a location on the map instead.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const sendViaWhatsApp = () => {
    const phone = normalizePhone(recipientPhone);
    if (phone.length < 8 || phone.length > 15) {
      setPhoneError('Enter the recipient’s WhatsApp number, including the country code.');
      return;
    }

    const message = `I am sharing a location with you: ${selectedLocation.name}\n${locationUrl}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    setPhoneError('');
  };

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm" aria-labelledby="rwanda-map-heading">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-5 py-4">
        <div>
          <h2 id="rwanda-map-heading" className="flex items-center gap-2 text-base font-bold text-gray-900">
            <MapPin size={18} color="#E85D04" /> Rwanda location sharing
          </h2>
          <p className="mt-1 text-sm text-gray-600">Choose a Rwanda location, enter a WhatsApp number, then send the Google Maps link.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">Google Maps</span>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.8fr)]">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-[#eef7f3]" aria-label="Google Map of Rwanda">
          <iframe
            title={`Google Map showing ${selectedLocation.name}`}
            src={mapSrc}
            className="h-80 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-gray-800">Choose a location</h3>
            <button type="button" onClick={useCurrentLocation} className="text-xs font-semibold text-[#E85D04] hover:text-[#c94f03]">
              Use my location
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {locationCounts.map((place) => (
              <button
                key={place.name}
                type="button"
                onClick={() => selectLocation(place)}
                aria-pressed={!usingCurrentLocation && selectedLocation.name === place.name}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f1e42] ${!usingCurrentLocation && selectedLocation.name === place.name ? 'border-orange-300 bg-orange-50 font-bold text-[#c94f03]' : 'border-gray-100 text-gray-700 hover:border-orange-200 hover:bg-orange-50'}`}
              >
                <span className="flex min-w-0 items-center gap-1.5"><MapPin size={14} color="#E85D04" />{place.name}</span>
                {place.count > 0 && <span className="text-xs font-bold text-[#E85D04]">{place.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-orange-100 bg-orange-50/50 p-4 sm:p-5">
        <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-800"><Phone size={15} /> Recipient WhatsApp number</span>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(event) => { setRecipientPhone(event.target.value); setPhoneError(''); }}
              placeholder="+250 7XX XXX XXX"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#E85D04] focus:ring-2 focus:ring-orange-100"
              aria-describedby="whatsapp-location-help"
            />
          </label>
          <button type="button" onClick={sendViaWhatsApp} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1fba57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f1e42]">
            <MessageCircle size={17} /> Send location <Send size={15} />
          </button>
        </div>
        <p id="whatsapp-location-help" className={`mt-2 text-xs ${phoneError ? 'text-red-600' : 'text-gray-500'}`} role={phoneError ? 'alert' : undefined}>
          {phoneError || `Selected: ${selectedLocation.name}. WhatsApp opens with a Google Maps location link ready to send.`}
        </p>
      </div>
    </section>
  );
}
