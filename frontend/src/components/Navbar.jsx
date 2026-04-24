import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase, RefreshCw, Bell, Search, X,
  Moon, Sun, MapPin, Check
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAlertsCount } from '../services/api';
import { useApp } from '../context/AppContext';

const Navbar = ({ onRefresh, isRefreshing, countdown, searchQuery, onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode, preferredLocation, setPreferredLocation } = useApp();

  const [alertCount, setAlertCount] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationInput, setLocationInput] = useState(preferredLocation);
  const locationRef = useRef(null);

  useEffect(() => {
    const fetchCount = () => getAlertsCount().then(setAlertCount).catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getAlertsCount().then(setAlertCount).catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationPicker(false);
        setLocationInput(preferredLocation);
      }
    };
    if (showLocationPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLocationPicker, preferredLocation]);

  useEffect(() => { setLocationInput(preferredLocation); }, [preferredLocation]);

  const saveLocation = () => {
    setPreferredLocation(locationInput.trim());
    setShowLocationPicker(false);
  };
  const clearLocation = () => {
    setLocationInput('');
    setPreferredLocation('');
    setShowLocationPicker(false);
  };

  const isOnAlerts = location.pathname === '/alerts';
  const countdownColor = countdown <= 10 ? '#ef4444' : countdown <= 30 ? '#f59e0b' : '#10b981';
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (countdown / 60) * circumference;

  return (
    <nav className="themed-nav sticky top-0 z-30 shadow-sm">
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '4rem', gap: '1rem' }}>

          {/* Logo */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => navigate('/')}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ background: '#3b82f6', padding: '0.5rem', borderRadius: '0.5rem' }}>
                <Briefcase size={24} color="white" />
              </div>
              <span className="themed-text" style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
                Tech<span style={{ color: '#3b82f6' }}>Jobs</span>Aggregator
              </span>
            </div>
          </div>

          {/* Live Search */}
          {!isOnAlerts && onSearch && (
            <div style={{ flex: 1, maxWidth: '36rem', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)', pointerEvents: 'none' }} />
              <input
                id="navbar-search"
                type="text"
                value={searchQuery || ''}
                onChange={e => onSearch(e.target.value)}
                placeholder="Search jobs by title, skill, company…"
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearch('')}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-subtle)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>

            {/* Location Preference */}
            <div style={{ position: 'relative' }} ref={locationRef}>
              <button
                id="location-preference-btn"
                onClick={() => { setShowLocationPicker(v => !v); setLocationInput(preferredLocation); }}
                title="Set preferred job location"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.625rem', borderRadius: '0.5rem',
                  border: `1px solid ${preferredLocation ? 'rgba(59,130,246,0.4)' : 'var(--color-border)'}`,
                  background: preferredLocation ? 'rgba(59,130,246,0.1)' : 'var(--color-surface-alt)',
                  color: preferredLocation ? '#3b82f6' : 'var(--color-text-muted)',
                  fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                <MapPin size={13} />
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {preferredLocation || 'Set Location'}
                </span>
              </button>

              {showLocationPicker && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)',
                  width: '16rem', background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  padding: '0.75rem', zIndex: 100
                }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    📍 Preferred Location
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', marginBottom: '0.5rem' }}>
                    Jobs will be pre-filtered to this city.
                  </p>
                  <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                    <MapPin size={13} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
                    <input
                      autoFocus
                      type="text"
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveLocation(); if (e.key === 'Escape') setShowLocationPicker(false); }}
                      placeholder="e.g. Hyderabad, Remote"
                      className="search-input"
                      style={{ paddingLeft: '1.75rem', paddingRight: '0.75rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {preferredLocation && (
                      <button
                        onClick={clearLocation}
                        style={{ flex: 1, padding: '0.375rem', fontSize: '0.75rem', fontWeight: 500, borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={saveLocation}
                      style={{ flex: 1, padding: '0.375rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    >
                      <Check size={12} /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              id="dark-mode-toggle"
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                background: 'var(--color-surface-alt)', cursor: 'pointer',
                color: darkMode ? '#f59e0b' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Countdown ring */}
            {!isOnAlerts && countdown !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 26 26">
                    <circle cx="13" cy="13" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="3" />
                    <circle
                      cx="13" cy="13" r={radius} fill="none"
                      stroke={countdownColor} strokeWidth="3"
                      strokeDasharray={circumference} strokeDashoffset={progress}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                    />
                  </svg>
                  <span style={{ position: 'absolute', fontSize: '9px', fontWeight: 700, color: countdownColor }}>{countdown}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)', lineHeight: 1.3, display: 'none' }} className="sm:block">
                  Auto-refresh<br />in {countdown}s
                </span>
              </div>
            )}

            {/* Alerts bell */}
            <button
              id="nav-alerts-btn"
              onClick={() => navigate(isOnAlerts ? '/' : '/alerts')}
              title="Job Alerts"
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.5rem', borderRadius: '0.5rem', border: 'none',
                background: isOnAlerts ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: isOnAlerts ? '#3b82f6' : 'var(--color-text-muted)',
                fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (!isOnAlerts) { e.currentTarget.style.background = 'var(--color-hover-bg)'; e.currentTarget.style.color = '#3b82f6'; }}}
              onMouseLeave={e => { if (!isOnAlerts) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}}
            >
              <span style={{ position: 'relative' }}>
                <Bell size={20} className={alertCount > 0 ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''} />
                {alertCount > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-6px', minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px', background: '#ef4444', color: 'white', fontSize: '9px', fontWeight: 700, padding: '0 2px' }}>
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
              </span>
              <span>{isOnAlerts ? 'Dashboard' : 'Alerts'}</span>
            </button>

            {/* Manual refresh */}
            {!isOnAlerts && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  border: 'none', background: 'none', cursor: isRefreshing ? 'default' : 'pointer',
                  color: isRefreshing ? 'var(--color-text-subtle)' : '#3b82f6',
                  fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s'
                }}
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                <span style={{ whiteSpace: 'nowrap' }}>{isRefreshing ? 'Refreshing…' : 'Fetch Latest Jobs'}</span>
              </button>
            )}

            {/* Avatar */}
            <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', overflow: 'hidden', border: '2px solid var(--color-border)', flexShrink: 0 }}>
              <img src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff" alt="User" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
