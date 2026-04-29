import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import FilterSidebar from '../components/FilterSidebar';
import JobCard from '../components/JobCard';
import { getJobs, triggerRefresh, getCompanies } from '../services/api';
import { LayoutGrid, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AUTO_REFRESH_SECONDS = 60;

const Dashboard = () => {
  const { preferredLocation } = useApp();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const [newJobsFlash, setNewJobsFlash] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Initialize location filter from preferred location context
  const [filters, setFilters] = useState({
    keyword: '',
    location: preferredLocation,
    source: '',
    company: '',
    experience: '',
    days_ago: ''
  });
  const [companies, setCompanies] = useState([]);

  // ── Navbar live search ───────────────────────────────────────────
  const [navbarSearch, setNavbarSearch] = useState('');
  const debounceRef = useRef(null);

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
    if (filters.keyword !== navbarSearch) {
      setNavbarSearch(filters.keyword);
    }
  // eslint-disable-next-line
  }, [filters]);

  const fetchJobsData = useCallback(async (silent = false, filterOverride = null) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const baseFilters = filterOverride ?? filtersRef.current;
      const activeFilters = Object.fromEntries(
        Object.entries(baseFilters).filter(([_, v]) => v !== '')
      );
      const data = await getJobs(activeFilters);
      setJobs(prev => {
        if (silent && data.length !== prev.length) {
          setNewJobsFlash(true);
          setTimeout(() => setNewJobsFlash(false), 3000);
        }
        return data;
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load jobs. Please try again later.');
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobsData();
    getCompanies().then(setCompanies).catch(console.error);
    // eslint-disable-next-line
  }, []);

  const handleNavbarSearch = useCallback((value) => {
    setNavbarSearch(value);
    const merged = { ...filtersRef.current, keyword: value };
    setFilters(merged);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchJobsData(false, merged);
      setCountdown(AUTO_REFRESH_SECONDS);
    }, 400);
  }, [fetchJobsData]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    const merged = { ...filtersRef.current, location: preferredLocation };
    setFilters(merged);
    fetchJobsData(false, merged);
    setCountdown(AUTO_REFRESH_SECONDS);
  // eslint-disable-next-line
  }, [preferredLocation]);

  useEffect(() => {
    setCountdown(AUTO_REFRESH_SECONDS);
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchJobsData(true);
          return AUTO_REFRESH_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [fetchJobsData]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await triggerRefresh();
      await fetchJobsData();
      setCountdown(AUTO_REFRESH_SECONDS);
    } catch (err) {
      console.error('Failed to refresh', err);
      alert('Failed to refresh jobs from API.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen themed-bg flex flex-col font-sans transition-colors duration-300">
      <Navbar
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
        countdown={countdown}
        searchQuery={navbarSearch}
        onSearch={handleNavbarSearch}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-80 lg:flex-shrink-0">
          <div className="lg:sticky lg:top-24">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              onFilterSubmit={() => { fetchJobsData(); setCountdown(AUTO_REFRESH_SECONDS); }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold themed-text flex items-center gap-2">
                Latest Jobs
                {newJobsFlash && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium rounded-full px-2 py-0.5 animate-pulse" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <Sparkles size={12} /> Updated
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="themed-text-muted text-sm flex items-center gap-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{jobs.length}</span> positions found
                  {filters.location && (
                    <span className="flex items-center gap-1 bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                      <MapPin size={10} /> {filters.location}
                    </span>
                  )}
                </p>
                <span className="w-1 h-1 rounded-full bg-slate-400 opacity-30"></span>
                <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#10b981' }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live • Updated {Math.floor((new Date() - lastUpdated) / 1000)}s ago
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const isWalkin = filters.keyword.toLowerCase().includes('walk');
                  const newKeyword = isWalkin ? '' : 'Walk-in';
                  setFilters(prev => ({ ...prev, keyword: newKeyword }));
                  fetchJobsData(false, { ...filters, keyword: newKeyword });
                }}
                className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 border-2 ${
                  (filters.keyword.toLowerCase().includes('walkin') || filters.keyword.toLowerCase().includes('walk-in') || filters.keyword.toLowerCase().includes('drive'))
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : 'themed-surface themed-text themed-border hover:border-amber-500/50 hover:text-amber-500 hover:bg-amber-500/5'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${(filters.keyword.toLowerCase().includes('walkin') || filters.keyword.toLowerCase().includes('walk-in') || filters.keyword.toLowerCase().includes('drive')) ? 'bg-amber-500 animate-pulse' : 'bg-current opacity-30'}`}></div>
                Walk-in Interviews
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex justify-center items-center py-20">
              <Loader2 className="animate-spin w-12 h-12" style={{ color: '#3b82f6' }} />
            </div>
          ) : error ? (
            <div className="rounded-xl p-6 text-center flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle size={32} className="mb-2 opacity-80" />
              <p className="font-medium">{error}</p>
              <button onClick={() => fetchJobsData()} className="mt-4 btn-secondary" style={{ color: '#ef4444' }}>Try Again</button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="themed-surface border themed-border text-center rounded-xl p-12 flex flex-col items-center justify-center flex-1 transition-colors duration-300">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 themed-text-muted" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                <LayoutGrid size={32} />
              </div>
              <h3 className="text-lg font-bold themed-text mb-1">No jobs found</h3>
              <p className="themed-text-muted max-w-sm mx-auto mb-6">We couldn't find any positions matching your criteria. Try adjusting your filters.</p>
              <button onClick={() => {
                const cleared = { keyword: '', location: '', source: '', company: '', experience: '', days_ago: '' };
                setFilters(cleared);
                setNavbarSearch('');
                fetchJobsData(false, cleared);
              }} className="btn-primary">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {/* Walk-in Section */}
              {jobs.filter(job =>
                job.title.toLowerCase().includes('walk-in') ||
                job.title.toLowerCase().includes('walkin') ||
                job.title.toLowerCase().includes('drive')
              ).length > 0 && (
                <section>
                  <div className="section-header">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                      <h2 className="text-xl font-bold themed-text">Walk-in Interviews</h2>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>Direct</span>
                    </div>
                    <span className="text-sm font-medium themed-text-muted">
                      {jobs.filter(job => job.title.toLowerCase().includes('walk-in') || job.title.toLowerCase().includes('walkin') || job.title.toLowerCase().includes('drive')).length} Opportunities
                    </span>
                  </div>
                  <div className="flex flex-col gap-4">
                    {jobs.filter(job =>
                      job.title.toLowerCase().includes('walk-in') ||
                      job.title.toLowerCase().includes('walkin') ||
                      job.title.toLowerCase().includes('drive')
                    ).map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                </section>
              )}

              {/* Other Jobs Section */}
              <section>
                <div className="section-header">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                    <h2 className="text-xl font-bold themed-text">Latest Job Openings</h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>Apply Online</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {jobs.filter(job =>
                    !job.title.toLowerCase().includes('walk-in') &&
                    !job.title.toLowerCase().includes('walkin') &&
                    !job.title.toLowerCase().includes('drive')
                  ).length > 0 ? (
                    jobs.filter(job =>
                      !job.title.toLowerCase().includes('walk-in') &&
                      !job.title.toLowerCase().includes('walkin') &&
                      !job.title.toLowerCase().includes('drive')
                    ).map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))
                  ) : (
                    <div className="py-12 text-center rounded-xl border-2 border-dashed themed-border themed-surface-alt transition-colors duration-300">
                      <p className="themed-text-muted">No online applications found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
