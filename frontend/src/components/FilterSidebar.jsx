import React, { useState } from 'react';
import { Filter, X, Search, Building2 } from 'lucide-react';

const FilterSidebar = ({ filters, setFilters, onFilterSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterSubmit();
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters({ keyword: '', location: '', source: '', company: '', days_ago: '' });
    setTimeout(onFilterSubmit, 0);
  };

  const SidebarContent = (
    <div className="themed-surface p-6 rounded-xl border themed-border h-full transition-colors duration-300" style={{ boxShadow: '0 1px 3px var(--color-card-shadow)' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold flex items-center themed-text">
          <Filter size={20} className="mr-2" style={{ color: '#3b82f6' }} /> Filters
        </h2>
        <button onClick={clearFilters} style={{ color: '#3b82f6' }} className="text-sm font-medium hover:underline">
          Clear All
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium themed-text mb-1">Keywords</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="themed-text-muted" style={{ opacity: 0.7 }} />
            </div>
            <input
              type="text"
              name="keyword"
              value={filters.keyword}
              onChange={handleChange}
              placeholder="e.g. Software, QA"
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium themed-text mb-1">Company</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2 size={16} className="themed-text-muted" style={{ opacity: 0.7 }} />
            </div>
            <input
              type="text"
              name="company"
              value={filters.company}
              onChange={handleChange}
              placeholder="e.g. TCS, Infosys, Wipro"
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium themed-text mb-1">Location</label>
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleChange}
            placeholder="e.g. Hyderabad, Remote"
            className="input-field"
          />
        </div>

        {/* Date Posted */}
        <div>
          <label className="block text-sm font-medium themed-text mb-1">Date Posted</label>
          <select
            name="days_ago"
            value={filters.days_ago}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Any Time</option>
            <option value="1">Last 24 hours</option>
            <option value="3">Last 3 days</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium themed-text mb-1">Source</label>
          <select
            name="source"
            value={filters.source}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">All Sources</option>
            <option value="Google Jobs">Google Jobs</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Naukri">Naukri</option>
          </select>
        </div>

        <button type="submit" className="btn-primary w-full mt-2">
          Apply Filters
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed bottom-6 right-6 p-4 text-white rounded-full shadow-lg z-50 transition-all active:scale-95"
        style={{ backgroundColor: '#3b82f6' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Filter size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0 pt-16 mt-2 pb-6 px-4' : '-translate-x-full'}
        lg:relative lg:translate-x-0 w-80 lg:w-72 xl:w-80 flex-shrink-0 z-40 transition-transform duration-300 ease-in-out lg:z-auto
      `}>
        {SidebarContent}
      </div>
    </>
  );
};

export default FilterSidebar;
