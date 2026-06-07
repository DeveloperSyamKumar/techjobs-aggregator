import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

// Fast IP-based city lookup (no user prompt needed)
const detectByIP = async () => {
  // Race between two IP services — first to respond wins
  try {
    const result = await Promise.any([
      fetch("https://freeipapi.com/api/json").then(r => r.json()).then(d => d.cityName || Promise.reject()),
      fetch("https://ipapi.co/json/").then(r => r.json()).then(d => d.city || Promise.reject()),
    ]);
    return result;
  } catch {
    return null;
  }
};

// Helper for location auto-detection
const detectLocation = async (isManual = false) => {
  if (isManual && navigator.geolocation) {
    // For manual trigger: race browser GPS against IP lookup simultaneously.
    // Whichever resolves first wins — so IP usually wins in ~300ms if GPS is slow.
    const browserGPS = new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            if (res.ok) {
              const data = await res.json();
              const city = data.address.city || data.address.town || data.address.village || data.address.state_district;
              resolve(city || null);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        },
        () => resolve(null), // permission denied or error → resolve null so race continues
        { timeout: 3000, enableHighAccuracy: false }
      );
    });

    const ipLookup = detectByIP();

    // Return first non-null result
    try {
      const city = await Promise.any(
        [browserGPS, ipLookup].map(p => p.then(v => v ? v : Promise.reject()))
      );
      return city;
    } catch {
      return null;
    }
  }

  // For silent auto-load on startup: skip GPS entirely, just use fast IP lookup
  return detectByIP();
};

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  const [preferredLocation, setPreferredLocation] = useState(
    () => localStorage.getItem('preferredLocation') || ''
  );

  // Sync dark class on <html> and persist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  // Persist preferred location
  useEffect(() => {
    localStorage.setItem('preferredLocation', preferredLocation);
  }, [preferredLocation]);

  // Auto-detect location on first load if not set
  useEffect(() => {
    const stored = localStorage.getItem('preferredLocation');
    if (!stored) {
      detectLocation().then(city => {
        if (city) {
          setPreferredLocation(city);
        }
      });
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        darkMode,
        toggleDarkMode: () => setDarkMode(d => !d),
        preferredLocation,
        setPreferredLocation,
        detectLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

