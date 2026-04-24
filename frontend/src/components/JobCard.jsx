import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Clock, CheckCircle, ExternalLink, BookmarkIcon, BookmarkCheck } from 'lucide-react';
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
    <div className="card-container p-6 relative group transition-all">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side: Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold themed-text group-hover:text-primary transition-colors leading-tight truncate pr-4">
              {job.title}
            </h3>
            <div className="flex gap-2 flex-shrink-0">
              {isFresh && !isApplied && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow-sm" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
                  🔥 Fresh
                </span>
              )}
              {isApplied && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center shadow-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                  <CheckCircle size={12} className="mr-1" /> Applied
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm themed-text-muted mb-4">
            <div className="flex items-center">
              <Building2 size={18} className="mr-2" style={{ opacity: 0.6 }} />
              <span className="font-semibold themed-text">{job.company}</span>
            </div>
            <div className="flex items-center">
              <MapPin size={18} className="mr-2" style={{ opacity: 0.6 }} />
              <span>{job.location || 'Location not specified'}</span>
            </div>
            <div className="flex items-center">
              <Clock size={18} className="mr-2" style={{ opacity: 0.6 }} />
              <span>{timeAgo}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              {job.source}
            </span>
            {isSaved && (
              <span className="text-xs font-medium flex items-center" style={{ color: '#10b981' }}>
                <BookmarkCheck size={14} className="mr-1" /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:border-l md:pl-6 themed-border min-w-[160px]">
          <button 
            onClick={toggleSave} 
            className="p-2 rounded-lg border transition-all"
            style={{
              backgroundColor: isSaved ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface-alt)',
              borderColor: isSaved ? 'rgba(59, 130, 246, 0.3)' : 'var(--color-border)',
              color: isSaved ? '#3b82f6' : 'var(--color-text-muted)'
            }}
            title={isSaved ? "Unsave Job" : "Save Job"}
          >
            {isSaved ? <BookmarkCheck fill="currentColor" size={22} /> : <BookmarkIcon size={22} />}
          </button>
          
          <a 
            href={job.apply_link} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={markApplied}
            className="flex-1 md:w-full py-2.5 px-6 rounded-lg font-bold text-sm flex items-center justify-center transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            style={{
              backgroundColor: isApplied ? 'var(--color-surface-alt)' : '#3b82f6',
              color: isApplied ? 'var(--color-text-muted)' : 'white',
              boxShadow: isApplied ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            {isApplied ? 'Applied' : 'Apply Now'}
            <ExternalLink size={16} className="ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
