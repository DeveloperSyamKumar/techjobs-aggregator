import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

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

  return (
    <AppContext.Provider
      value={{
        darkMode,
        toggleDarkMode: () => setDarkMode(d => !d),
        preferredLocation,
        setPreferredLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
