import React, { useState } from 'react';
import { Filter, X, Search, Building2, Sparkles } from 'lucide-react';

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
    setFilters({ keyword: '', location: '', source: '', company: '', experience: '', days_ago: '' });
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
        
        {/* Experience */}
        <div>
          <label className="block text-sm font-medium themed-text mb-1">Experience</label>
          <select
            name="experience"
            value={filters.experience}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Any Experience</option>
            <option value="0-1">0-1 Years (Freshers)</option>
            <option value="1-3">1-3 Years</option>
            <option value="3-5">3-5 Years</option>
            <option value="5+">5+ Years</option>
          </select>
        </div>

        {/* Walk-in Toggle */}
        <div className="pt-2">
          <label className="flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer group themed-surface-alt border-transparent hover:border-amber-500/30">
            <span className="text-sm font-bold themed-text group-hover:text-amber-500 transition-colors flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" /> Walk-in Jobs
            </span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.keyword.toLowerCase().includes('walkin') || filters.keyword.toLowerCase().includes('walk-in')}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setFilters(prev => ({ 
                    ...prev, 
                    keyword: isChecked ? 'Walk-in Interview' : (prev.keyword.toLowerCase().includes('walk') ? '' : prev.keyword)
                  }));
                }}
              />
              <div className={`w-11 h-6 rounded-full shadow-inner transition-colors duration-200 ${
                (filters.keyword.toLowerCase().includes('walkin') || filters.keyword.toLowerCase().includes('walk-in')) ? 'bg-amber-500' : 'bg-gray-400/30'
              }`}></div>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-200 ${
                (filters.keyword.toLowerCase().includes('walkin') || filters.keyword.toLowerCase().includes('walk-in')) ? 'translate-x-5' : ''
              }`}></div>
            </div>
          </label>
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
            <option value="Adzuna">Adzuna</option>
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
        fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 w-[85%] sm:w-80 lg:w-72 xl:w-80 flex-shrink-0 z-50 lg:z-auto transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
      `}>
        <div className="h-full themed-surface lg:bg-transparent lg:border-none shadow-2xl lg:shadow-none">
          <div className="lg:hidden p-6 flex justify-between items-center border-b themed-border">
            <h2 className="text-xl font-bold themed-text flex items-center">
              <Filter size={20} className="mr-2 text-blue-600" /> Filters
            </h2>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl themed-surface-alt themed-text transition-colors hover:bg-red-500/10 hover:text-red-500">
              <X size={20} />
            </button>
          </div>
          <div className="px-4 lg:px-0 h-[calc(100%-5rem)] lg:h-auto overflow-y-auto lg:overflow-visible py-6 lg:py-0">
            {SidebarContent}
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
