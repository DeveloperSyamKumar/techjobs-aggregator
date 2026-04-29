import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Clock, CheckCircle, ExternalLink, BookmarkIcon, BookmarkCheck, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const JobCard = ({ job }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
    
    const uniqueId = job.apply_link;
    if (savedJobs.includes(uniqueId) || savedJobs.includes(job.id)) setIsSaved(true);
    if (appliedJobs.includes(uniqueId) || appliedJobs.includes(job.id)) setIsApplied(true);
  }, [job.id, job.apply_link]);

  const toggleSave = () => {
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    const uniqueId = job.apply_link;
    if (isSaved) {
      const updated = savedJobs.filter(id => id !== uniqueId && id !== job.id);
      localStorage.setItem('savedJobs', JSON.stringify(updated));
      setIsSaved(false);
    } else {
      savedJobs.push(uniqueId);
      localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
      setIsSaved(true);
    }
  };

  const markApplied = () => {
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
    const uniqueId = job.apply_link;
    if (!appliedJobs.includes(uniqueId) && !appliedJobs.includes(job.id)) {
      appliedJobs.push(uniqueId);
      localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
      setIsApplied(true);
    }
  };

  const postedDate = new Date(job.posted_date + "Z");
  const isFresh = (new Date() - postedDate) < 24 * 60 * 60 * 1000;
  
  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });
  } catch(e) {
    timeAgo = 'Recently';
  }

  return (
    <div className="card-container p-5 md:p-6 relative group animate-fade-in transition-all">
      <div className="flex flex-col md:flex-row gap-5 md:gap-8">
        {/* Left side: Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg md:text-xl font-bold themed-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight pr-4">
              {job.title}
            </h3>
            <div className="flex gap-2 flex-shrink-0">
              {isFresh && !isApplied && (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-lg shadow-sm bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  🔥 Fresh
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-y-3 gap-x-8 text-sm themed-text-muted mb-5">
            <div className="flex items-center group/meta">
              <div className="w-8 h-8 rounded-lg themed-surface-alt flex items-center justify-center mr-3 group-hover/meta:bg-blue-600/10 transition-colors">
                <Building2 size={16} className="text-slate-400 group-hover/meta:text-blue-600" />
              </div>
              <span className="font-semibold themed-text truncate">{job.company}</span>
            </div>
            <div className="flex items-center group/meta">
              <div className="w-8 h-8 rounded-lg themed-surface-alt flex items-center justify-center mr-3 group-hover/meta:bg-blue-600/10 transition-colors">
                <MapPin size={16} className="text-slate-400 group-hover/meta:text-blue-600" />
              </div>
              <span className="truncate">{job.location || 'Remote'}</span>
            </div>
            {job.experience && (
              <div className="flex items-center group/meta">
                <div className="w-8 h-8 rounded-lg themed-surface-alt flex items-center justify-center mr-3 group-hover/meta:bg-purple-600/10 transition-colors">
                  <Briefcase size={16} className="text-slate-400 group-hover/meta:text-purple-600" />
                </div>
                <span className="font-bold text-purple-600 dark:text-purple-400">{job.experience}</span>
              </div>
            )}
            <div className="flex items-center group/meta">
              <div className="w-8 h-8 rounded-lg themed-surface-alt flex items-center justify-center mr-3 group-hover/meta:bg-emerald-600/10 transition-colors">
                <Clock size={16} className="text-slate-400 group-hover/meta:text-emerald-600" />
              </div>
              <span>{timeAgo}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">
              {job.source}
            </span>
            {isApplied && (
              <span className="text-xs font-bold flex items-center text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                <CheckCircle size={14} className="mr-1.5" /> Applied
              </span>
            )}
            {isSaved && (
              <span className="text-xs font-bold flex items-center text-blue-600 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                <BookmarkCheck size={14} className="mr-1.5" /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:border-l md:pl-8 themed-border min-w-full md:min-w-[180px]">
          <button 
            onClick={toggleSave} 
            className="p-3 rounded-xl border transition-all duration-300 hover:scale-110 active:scale-90"
            style={{
              backgroundColor: isSaved ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface-alt)',
              borderColor: isSaved ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
              color: isSaved ? '#3b82f6' : 'var(--color-text-muted)'
            }}
          >
            {isSaved ? <BookmarkCheck fill="currentColor" size={24} /> : <BookmarkIcon size={24} />}
          </button>
          
          <a 
            href={job.apply_link} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={markApplied}
            className={`flex-1 md:w-full py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isApplied ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20 hover:shadow-blue-500/40'
            }`}
          >
            {isApplied ? 'Applied' : 'Apply Now'}
            {!isApplied && <ExternalLink size={16} className="ml-2" />}
          </a>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
