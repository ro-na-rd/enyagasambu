'use client';

import { useEffect, useMemo, useState } from 'react';

const RWANDA_LOCATIONS: Record<string, string[]> = {
  'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
  Eastern: ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
  Northern: ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
  Southern: ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
  Western: ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
};

const PROVINCE_CENTERS: Record<string, { lat: number; lon: number }> = {
  'Kigali City': { lat: -1.9441, lon: 30.0619 },
  Eastern: { lat: -1.9052, lon: 30.5407 },
  Northern: { lat: -1.4998, lon: 29.634 },
  Southern: { lat: -2.3517, lon: 29.751 },
  Western: { lat: -2.0606, lon: 29.3478 },
};

const RWANDA_VIEW = { lat: -1.94, lon: 30.06 };

interface RwandaPropertyLocationProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

function stripTail(text: string): string {
  const index = text.lastIndexOf(',');
  return index === -1 ? '' : text.slice(0, index).trim();
}

function parseLocation(value: string): { province: string; district: string; area: string } {
  let rest = value.trim();
  let province = '';
  let district = '';

  if (rest.endsWith(', Rwanda')) {
    rest = rest.slice(0, -', Rwanda'.length).trim();
  }

  const tail = rest.split(',').map((segment) => segment.trim()).pop() || '';

  if (RWANDA_LOCATIONS[tail]) {
    province = tail;
    rest = stripTail(rest);
    const nextTail = rest.split(',').map((segment) => segment.trim()).pop() || '';
    if (nextTail && (RWANDA_LOCATIONS[province] || []).includes(nextTail)) {
      district = nextTail;
      rest = stripTail(rest);
    }
  } else {
    const owner = Object.entries(RWANDA_LOCATIONS).find(([, districts]) => districts.includes(tail));
    if (owner && rest) {
      province = owner[0];
      district = tail;
      rest = stripTail(rest);
    }
  }

  return { province, district, area: rest };
}

export default function RwandaPropertyLocation({ value, onChange, required = false }: RwandaPropertyLocationProps) {
  const { province, district, area } = useMemo(() => parseLocation(value), [value]);
  const [geocoded, setGeocoded] = useState<{ place: string; lat: number; lon: number } | null>(null);

  const districts = province ? RWANDA_LOCATIONS[province] || [] : [];
  const activePlace = district || province;
  const mapQuery = useMemo(() => encodeURIComponent(value || 'Rwanda'), [value]);
  const mapCenter = geocoded && geocoded.place === activePlace ? geocoded : null;

  useEffect(() => {
    if (!activePlace) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${activePlace}, Rwanda`)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((results: unknown) => {
          const hit = Array.isArray(results) ? (results as Array<{ lat: string; lon: string }>)[0] : undefined;
          if (hit) setGeocoded({ place: activePlace, lat: parseFloat(hit.lat), lon: parseFloat(hit.lon) });
        })
        .catch(() => { });
    }, 700);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activePlace]);

  const center = mapCenter || (province ? PROVINCE_CENTERS[province] : null) || RWANDA_VIEW;
  const spanLat = mapCenter ? 0.07 : province ? 0.55 : 0.95;
  const spanLon = mapCenter ? 0.09 : province ? 0.7 : 1.05;
  const bbox = [
    center.lon - spanLon,
    center.lat - spanLat,
    center.lon + spanLon,
    center.lat + spanLat,
  ].map((n) => n.toFixed(4)).join('%2C');
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat.toFixed(4)}%2C${center.lon.toFixed(4)}`;

  const updateAddress = (nextProvince: string, nextDistrict: string, nextArea: string) => {
    onChange([nextArea.trim(), nextDistrict, nextProvince, 'Rwanda'].filter(Boolean).join(', '));
  };

  return (
    <section className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Property address and map</h3>
        <p className="mt-1 text-xs text-gray-600">Choose the Rwanda location for this house, land, apartment, office, or other property. Your exact address is optional.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Province or Kigali City {required && <span className="text-red-500">*</span>}
          <select
            value={province}
            onChange={(event) => {
              const nextProvince = event.target.value;
              updateAddress(nextProvince, '', area);
            }}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40"
          >
            <option value="">Select province…</option>
            {Object.keys(RWANDA_LOCATIONS).map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          District {required && <span className="text-red-500">*</span>}
          <select
            value={district}
            disabled={!province}
            onChange={(event) => {
              const nextDistrict = event.target.value;
              updateAddress(province, nextDistrict, area);
            }}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40"
          >
            <option value="">Select district…</option>
            {districts.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-700">
        Sector, cell, village, or landmark
        <input
          value={area}
          onChange={(event) => updateAddress(province, district, event.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40"
          placeholder="e.g. Kacyiru, near Kigali Heights"
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Map address
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40"
          placeholder="Select an area above or enter an address"
        />
      </label>

      <div className="overflow-hidden rounded-lg border border-orange-100 bg-white">
        <iframe
          title="Rwanda property location preview"
          src={mapEmbedUrl}
          className="h-44 w-full border-0"
          loading="lazy"
        />
        <p className="px-3 pt-1.5 text-[10px] text-gray-400">
          Map data ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
            OpenStreetMap
          </a>{' '}
          contributors
        </p>
        <a
          href={`https://www.openstreetmap.org/search?query=${mapQuery}`}
          target="_blank"
          rel="noreferrer"
          className="block px-3 py-2 text-center text-xs font-semibold text-[#E85D04] hover:underline"
        >
          Open {value || 'Rwanda'} in the map
        </a>
      </div>
    </section>
  );
}

export function isPropertyCategory(category?: { name?: string; slug?: string; type?: string }) {
  if (!category) return false;
  return category.type === 'rental_property' || /house|apartment|land|plot|property|office|real.?estate/i.test(`${category.name || ''} ${category.slug || ''}`);
}
