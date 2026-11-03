import { MapPin } from '@/lib/icons';

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

type MapLocation = {
  name: string;
  terms: string[];
  x: number;
  y: number;
};

const LOCATIONS: MapLocation[] = [
  { name: 'Musanze', terms: ['musanze', 'ruhenger'], x: 42, y: 17 },
  { name: 'Rubavu', terms: ['rubavu', 'gisenyi'], x: 20, y: 34 },
  { name: 'Nyagatare', terms: ['nyagatare'], x: 79, y: 28 },
  { name: 'Kigali', terms: ['kigali', 'gasabo', 'kicukiro', 'nyarugenge'], x: 54, y: 52 },
  { name: 'Rwamagana', terms: ['rwamagana', 'kayonza'], x: 69, y: 59 },
  { name: 'Muhanga', terms: ['muhanga', 'gitarama'], x: 40, y: 64 },
  { name: 'Huye', terms: ['huye', 'butare'], x: 45, y: 80 },
  { name: 'Rusizi', terms: ['rusizi', 'cyangugu'], x: 18, y: 86 },
];

const isProperty = (categoryName: string) => /propert|real estate|land|house|apartment/i.test(categoryName);

export default function RwandaLocationMap({ listings, activeLocation, onLocationSelect }: RwandaLocationMapProps) {
  const locations = LOCATIONS.map((place) => {
    const matches = listings.filter((listing) => {
      const location = listing.location.toLocaleLowerCase();
      return place.terms.some((term) => location.includes(term));
    });

    return {
      ...place,
      count: matches.length,
      propertyCount: matches.filter((listing) => isProperty(listing.category_name)).length,
    };
  }).filter((place) => place.count > 0);

  if (locations.length === 0) return null;

  const propertyCount = locations.reduce((total, place) => total + place.propertyCount, 0);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm" aria-labelledby="rwanda-map-heading">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-5 py-4">
        <div>
          <h2 id="rwanda-map-heading" className="flex items-center gap-2 text-base font-bold text-gray-900">
            <MapPin size={18} color="#E85D04" /> Rwanda listing locations
          </h2>
          <p className="mt-1 text-sm text-gray-600">Select a location to view its posted Supply Chain listings.</p>
        </div>
        <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
          {propertyCount > 0 ? `${propertyCount} property listing${propertyCount === 1 ? '' : 's'} mapped` : `${locations.length} area${locations.length === 1 ? '' : 's'} represented`}
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(12rem,0.8fr)]">
        <div className="relative min-h-72 overflow-hidden rounded-xl bg-[#eef7f3]" aria-label="Map of Rwanda showing listing locations">
          <svg viewBox="0 0 100 110" className="absolute inset-0 h-full w-full" role="img" aria-labelledby="rwanda-map-title rwanda-map-description">
            <title id="rwanda-map-title">Rwanda listing coverage map</title>
            <desc id="rwanda-map-description">Map markers identify Rwanda locations with current Supply Chain listings.</desc>
            <path d="M48 5 61 10 70 20 87 29 91 42 83 53 88 67 80 80 72 98 58 105 45 99 32 102 22 90 14 78 18 64 10 52 17 38 25 29 31 15 40 10Z" fill="#d8eee4" stroke="#5d8e77" strokeWidth="1.4" />
            <path d="M31 15 46 31 45 52 18 64M46 31 70 20 83 53 61 59 45 52M45 52 61 59 58 105M18 64 45 52 32 102M61 59 88 67 72 98" fill="none" stroke="#9bc7b1" strokeWidth="0.7" strokeDasharray="2 2" />
          </svg>
          <div className="absolute inset-0">
            {locations.map((place) => (
              <button
                key={place.name}
                type="button"
                onClick={() => onLocationSelect(place)}
                aria-pressed={activeLocation === place.name}
                className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E85D04] p-1.5 text-white shadow-md outline-offset-2 transition hover:scale-110 hover:bg-[#c94f03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f1e42]"
                style={{ left: `${place.x}%`, top: `${place.y}%` }}
                aria-label={`View ${place.count} listing${place.count === 1 ? '' : 's'} in ${place.name}`}
              >
                <MapPin size={15} strokeWidth={2.5} />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden w-max -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs font-semibold text-white group-hover:block group-focus-visible:block">
                  {place.name}: {place.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <ul className="grid content-start gap-2 sm:grid-cols-2 lg:grid-cols-1" aria-label="Locations with Supply Chain listings">
          {locations.map((place) => (
            <li key={place.name}>
              <button
                type="button"
                onClick={() => onLocationSelect(place)}
                aria-pressed={activeLocation === place.name}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-left transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f1e42]"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-800"><MapPin size={15} color="#E85D04" />{place.name}</span>
                <span className="shrink-0 text-xs font-bold text-[#E85D04]">{place.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
