
import React from 'react';
import { MapPin } from 'lucide-react';

interface LocationInputProps {
  country: string;
  onCountryChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  disabled?: boolean;
}

// Countries supported by most job APIs
const COUNTRIES = [
  { code: 'us', label: 'United States' },
  { code: 'gb', label: 'United Kingdom' },
  { code: 'ca', label: 'Canada' },
  { code: 'au', label: 'Australia' },
  { code: 'nl', label: 'Netherlands' },
  { code: 'de', label: 'Germany' },
  { code: 'fr', label: 'France' },
  { code: 'be', label: 'Belgium' },
  { code: 'ch', label: 'Switzerland' },
  { code: 'at', label: 'Austria' },
  { code: 'ie', label: 'Ireland' },
  { code: 'se', label: 'Sweden' },
  { code: 'dk', label: 'Denmark' },
  { code: 'no', label: 'Norway' },
  { code: 'fi', label: 'Finland' },
  { code: 'es', label: 'Spain' },
  { code: 'it', label: 'Italy' },
  { code: 'pt', label: 'Portugal' },
  { code: 'pl', label: 'Poland' },
  { code: 'nz', label: 'New Zealand' },
  { code: 'sg', label: 'Singapore' },
  { code: 'in', label: 'India' },
];

// Map profile country names to country codes
export function profileCountryToCode(profileCountry: string | null): string {
  if (!profileCountry) return 'us';
  const lower = profileCountry.toLowerCase().trim();

  // Try exact match on label
  const exact = COUNTRIES.find(c => c.label.toLowerCase() === lower);
  if (exact) return exact.code;

  // Try code match
  const byCode = COUNTRIES.find(c => c.code === lower);
  if (byCode) return byCode.code;

  // Common partial matches
  if (lower.includes('united states') || lower.includes('usa') || lower.includes('u.s.')) return 'us';
  if (lower.includes('united kingdom') || lower.includes('uk') || lower.includes('britain')) return 'gb';
  if (lower.includes('netherlands') || lower.includes('holland')) return 'nl';
  if (lower.includes('new zealand')) return 'nz';

  return 'us'; // Default fallback
}

const LocationInput: React.FC<LocationInputProps> = ({
  country,
  onCountryChange,
  city,
  onCityChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900">Your location</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          disabled={disabled}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:border-transparent disabled:opacity-50"
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>

        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City (optional)"
          disabled={disabled}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:border-transparent disabled:opacity-50"
        />
      </div>
    </div>
  );
};

export default LocationInput;
