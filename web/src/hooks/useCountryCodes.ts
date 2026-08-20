import { useState, useEffect } from 'react';

export interface CountryCode {
  name: string;
  code: string; // e.g. 'ET', 'DJ'
  dial_code: string; // e.g. '+251', '+253'
  flag: string; // e.g. '🇪🇹'
  flagUrl: string; // e.g. 'https://flagcdn.com/w40/et.png'
  placeholder?: string;
}

// Fallback initial list (Corridor focus) while API loads or if offline
const FALLBACK_COUNTRIES: CountryCode[] = [
  { name: 'Ethiopia', code: 'ET', dial_code: '+251', flag: '🇪🇹', flagUrl: 'https://flagcdn.com/w40/et.png', placeholder: '911 234 567' },
  { name: 'Djibouti', code: 'DJ', dial_code: '+253', flag: '🇩🇯', flagUrl: 'https://flagcdn.com/w40/dj.png', placeholder: '77 12 34 56' },
  { name: 'Kenya', code: 'KE', dial_code: '+254', flag: '🇰🇪', flagUrl: 'https://flagcdn.com/w40/ke.png', placeholder: '712 345 678' },
  { name: 'Somalia', code: 'SO', dial_code: '+252', flag: '🇸🇴', flagUrl: 'https://flagcdn.com/w40/so.png', placeholder: '61 234 5678' },
  { name: 'Sudan', code: 'SD', dial_code: '+249', flag: '🇸🇩', flagUrl: 'https://flagcdn.com/w40/sd.png', placeholder: '91 234 5678' },
  { name: 'United Arab Emirates', code: 'AE', dial_code: '+971', flag: '🇦🇪', flagUrl: 'https://flagcdn.com/w40/ae.png', placeholder: '50 123 4567' },
  { name: 'United States', code: 'US', dial_code: '+1', flag: '🇺🇸', flagUrl: 'https://flagcdn.com/w40/us.png', placeholder: '555 123 4567' },
  { name: 'United Kingdom', code: 'GB', dial_code: '+44', flag: '🇬🇧', flagUrl: 'https://flagcdn.com/w40/gb.png', placeholder: '7911 123456' },
];

/**
 * Converts a 2-letter ISO country code into a regional indicator emoji flag.
 */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Custom hook to dynamically fetch international country dialing codes
 * from a live API with auto-detected IP geolocation.
 */
export function useCountryCodes() {
  const [countries, setCountries] = useState<CountryCode[]>(FALLBACK_COUNTRIES);
  const [selectedDialCode, setSelectedDialCode] = useState<string>('+251');
  const [detectedCountry, setDetectedCountry] = useState<string>('ET');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchCountriesAndLocation() {
      try {
        // 1. Fetch full list of world countries with dialing codes from public API
        const countriesPromise = fetch('https://countriesnow.space/api/v0.1/countries/codes')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        // 2. Fetch user's country code based on their IP address
        const geoPromise = fetch('https://api.country.is')
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const [countriesRes, geoRes] = await Promise.all([countriesPromise, geoPromise]);

        if (!isMounted) return;

        let detectedIso = 'ET';
        if (geoRes && geoRes.country) {
          detectedIso = geoRes.country.toUpperCase();
          setDetectedCountry(detectedIso);
        }

        if (countriesRes && Array.isArray(countriesRes.data)) {
          const apiList: CountryCode[] = countriesRes.data
            .filter((c: any) => c.name && c.dial_code && c.code)
            .map((c: any) => {
              const dialCode = c.dial_code.startsWith('+') ? c.dial_code : `+${c.dial_code}`;
              const isoCode = (c.code || '').toLowerCase();
              return {
                name: c.name,
                code: c.code,
                dial_code: dialCode,
                flag: getFlagEmoji(c.code),
                flagUrl: isoCode ? `https://flagcdn.com/w40/${isoCode}.png` : '',
                placeholder: dialCode === '+251' ? '911 234 567' : dialCode === '+253' ? '77 12 34 56' : '123 456 789',
              };
            });

          // Priority corridor countries to place at the top of the list
          const priorityCodes = ['ET', 'DJ', 'KE', 'SO', 'SD', 'AE', 'US', 'GB'];
          const priorityList = apiList.filter((c) => priorityCodes.includes(c.code));
          const others = apiList
            .filter((c) => !priorityCodes.includes(c.code))
            .sort((a, b) => a.name.localeCompare(b.name));

          const combined = [...priorityList, ...others];
          setCountries(combined);

          // If detected country exists in list, set it as active dial code
          const matchedCountry = combined.find((c) => c.code === detectedIso);
          if (matchedCountry) {
            setSelectedDialCode(matchedCountry.dial_code);
          }
        }
      } catch (err) {
        console.warn('Could not load countries from API, using corridor defaults:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchCountriesAndLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    countries,
    selectedDialCode,
    setSelectedDialCode,
    detectedCountry,
    isLoading,
  };
}
