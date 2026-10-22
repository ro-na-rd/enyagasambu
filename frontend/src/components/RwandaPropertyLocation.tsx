'use client';

import { useMemo, useState } from 'react';

const RWANDA_LOCATIONS: Record<string, string[]> = {
  'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
  Eastern: ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
  Northern: ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
  Southern: ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
  Western: ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
};

interface RwandaPropertyLocationProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function RwandaPropertyLocation({ value, onChange, required = false }: RwandaPropertyLocationProps) {
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');

  const districts = province ? RWANDA_LOCATIONS[province] || [] : [];
  const mapQuery = useMemo(() => encodeURIComponent(value || 'Rwanda'), [value]);

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
              setProvince(nextProvince);
              setDistrict('');
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
              setDistrict(nextDistrict);
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
          onChange={(event) => {
            const nextArea = event.target.value;
            setArea(nextArea);
            updateAddress(province, district, nextArea);
          }}
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
          src={`https://www.openstreetmap.org/export/embed.html?bbox=28.85%2C-2.95%2C30.95%2C-1.05&layer=mapnik&marker=-1.94%2C30.06`}
          className="h-44 w-full border-0"
          loading="lazy"
        />
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
