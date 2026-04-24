import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, BellOff, Plus, Trash2, CheckCheck, ChevronDown,
  ChevronUp, Search, MapPin, Building2, Clock, Zap,
  AlertCircle, Loader2, ToggleLeft, ToggleRight, ExternalLink
} from 'lucide-react';
import Navbar from '../components/Navbar';
import {
  getAlerts, createAlert, deleteAlert,
  toggleAlert, markAlertRead, getAlertMatches
} from '../services/api';

// ── Helper: relative time ─────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Source badge colours ──────────────────────────────────────────────────────
const SOURCE_COLORS = {
  'LinkedIn':    { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
  'Naukri':      { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316' },
  'Google Jobs': { bg: 'rgba(34, 197, 94, 0.15)',  text: '#22c55e' },
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ onCreateClick }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="relative mb-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05))' }}>
        <Bell size={36} className="text-primary opacity-70" />
      </div>
      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
        <Plus size={14} className="text-white" />
      </span>
    </div>
    <h2 className="text-xl font-bold themed-text mb-1">No Job Alerts Yet</h2>
    <p className="themed-text-muted max-w-xs mb-6 text-sm">
      Create alerts to be notified when new jobs matching your criteria are found.
    </p>
    <button onClick={onCreateClick} className="btn-primary flex items-center gap-2">
      <Plus size={16} /> Create Your First Alert
    </button>
  </div>
);

// ── Matched job mini-card ─────────────────────────────────────────────────────
const MatchedJobCard = ({ job }) => {
  const sourceColors = SOURCE_COLORS[job.source] || { bg: 'var(--color-surface-alt)', text: 'var(--color-text-muted)' };
  
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg themed-surface themed-border border hover:border-primary/30 hover:shadow-sm transition-all" style={{ boxShadow: '0 1px 2px var(--color-card-shadow)' }}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold themed-text text-sm truncate">{job.title}</p>
        <p className="text-xs themed-text-muted truncate mt-0.5">{job.company} · {job.location || 'Location N/A'}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: sourceColors.bg, color: sourceColors.text }}>
          {job.source}
        </span>
        {job.apply_link && (
          <a
            href={job.apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:text-primaryDark transition-colors"
            style={{ color: '#3b82f6' }}
            title="Apply"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  );
};

// ── Alert Card ────────────────────────────────────────────────────────────────
const AlertCard = ({ alert, onDelete, onToggle, onMarkRead }) => {
  const [expanded, setExpanded] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchError, setMatchError] = useState(null);

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && matches.length === 0) {
      setLoadingMatches(true);
      setMatchError(null);
      try {
        const data = await getAlertMatches(alert.id);
        setMatches(data);
        if (alert.match_count > 0) {
          await onMarkRead(alert.id);
        }
      } catch {
        setMatchError('Failed to load matches.');
      } finally {
        setLoadingMatches(false);
      }
    } else if (next && alert.match_count > 0) {
      await onMarkRead(alert.id);
    }
  };

  const chips = [
    alert.keyword  && { icon: <Search size={11} />,    label: alert.keyword },
    alert.location && { icon: <MapPin size={11} />,    label: alert.location },
    alert.company  && { icon: <Building2 size={11} />, label: alert.company },
    alert.source   && { icon: <Zap size={11} />,       label: alert.source },
    alert.days_ago && { icon: <Clock size={11} />,     label: `Last ${alert.days_ago}d` },
  ].filter(Boolean);

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${alert.is_active ? 'themed-surface themed-border shadow-sm' : 'themed-surface-alt themed-border opacity-70'}`}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        {/* Bell icon with badge */}
        <div className="relative mt-0.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: alert.is_active ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface-alt)' }}>
            {alert.is_active
              ? <Bell size={18} style={{ color: '#3b82f6' }} />
              : <BellOff size={18} className="themed-text-muted" />
            }
          </div>
          {alert.match_count > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
              {alert.match_count > 99 ? '99+' : alert.match_count}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold themed-text text-sm">{alert.name}</h3>
            {alert.match_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {alert.match_count} new match{alert.match_count !== 1 ? 'es' : ''}
              </span>
            )}
          </div>

          {/* Filter chips */}
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {chips.map((chip, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full themed-surface-alt themed-text-muted">
                  {chip.icon} {chip.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs themed-text-muted mt-1 italic">All jobs (no filters)</p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 text-[10px] themed-text-muted">
            <span>Created {timeAgo(alert.created_at)}</span>
            {alert.last_triggered_at && (
              <span>· Last match {timeAgo(alert.last_triggered_at)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Toggle active */}
          <button
            onClick={() => onToggle(alert.id)}
            title={alert.is_active ? 'Pause alert' : 'Enable alert'}
            className="p-1.5 rounded-lg transition-colors themed-text-muted"
          >
            {alert.is_active
              ? <ToggleRight size={20} style={{ color: '#3b82f6' }} />
              : <ToggleLeft size={20} />
            }
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(alert.id)}
            title="Delete alert"
            className="p-1.5 rounded-lg transition-colors themed-text-muted"
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Trash2 size={16} />
          </button>

          {/* Expand / collapse */}
          <button
            onClick={handleExpand}
            title="View matches"
            className="p-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: expanded ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: expanded ? '#3b82f6' : 'var(--color-text-muted)'
            }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded matches */}
      {expanded && (
        <div className="border-t themed-border px-4 py-3" style={{ backgroundColor: 'var(--color-overlay)' }}>
          {loadingMatches ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin" style={{ color: '#3b82f6' }} />
            </div>
          ) : matchError ? (
            <p className="text-xs text-center py-3" style={{ color: '#ef4444' }}>{matchError}</p>
          ) : matches.length === 0 ? (
            <p className="text-xs themed-text-muted text-center py-3 italic">No matching jobs found yet.</p>
          ) : (
            <>
              <p className="text-[10px] font-semibold themed-text-muted uppercase tracking-wider mb-2">
                {matches.length} matching job{matches.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {matches.map(job => <MatchedJobCard key={job.id} job={job} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── Create Alert Form Modal ───────────────────────────────────────────────────
const CreateAlertModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    name: '', keyword: '', location: '', company: '', source: '', days_ago: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Alert name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        days_ago: form.days_ago ? parseInt(form.days_ago) : null,
        keyword: form.keyword || null,
        location: form.location || null,
        company: form.company || null,
        source: form.source || null,
      };
      const created = await createAlert(payload);
      onCreate(created);
      onClose();
    } catch (err) {
      setError('Failed to create alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative themed-surface rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        {/* Header */}
        <div className="p-5 text-white" style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="font-bold text-lg">Create Job Alert</h2>
              <p className="text-white/70 text-xs">Get notified about matching new jobs</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Alert Name */}
          <div>
            <label className="block text-xs font-semibold themed-text mb-1 uppercase tracking-wide">Alert Name *</label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Senior QA Jobs in Bengaluru"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Keyword */}
            <div>
              <label className="block text-xs font-semibold themed-text mb-1 uppercase tracking-wide">Keyword</label>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 themed-text-muted" />
                <input
                  type="text" name="keyword" value={form.keyword} onChange={handleChange}
                  placeholder="QA, Java…" className="input-field pl-7 text-sm"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-semibold themed-text mb-1 uppercase tracking-wide">Company</label>
              <div className="relative">
                <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 themed-text-muted" />
                <input
                  type="text" name="company" value={form.company} onChange={handleChange}
                  placeholder="TCS, Wipro…" className="input-field pl-7 text-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold themed-text mb-1 uppercase tracking-wide">Location</label>
              <div className="relative">
                <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 themed-text-muted" />
                <input
                  type="text" name="location" value={form.location} onChange={handleChange}
                  placeholder="Bengaluru…" className="input-field pl-7 text-sm"
                />
              </div>
            </div>

            {/* Date window */}
            <div>
              <label className="block text-xs font-semibold themed-text mb-1 uppercase tracking-wide">Date Window</label>
              <div className="relative">
                <Clock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 themed-text-muted" />
                <select name="days_ago" value={form.days_ago} onChange={handleChange} className="input-field pl-7 text-sm">
                  <option value="">Any time</option>
                  <option value="1">Last 24h</option>
                  <option value="3">Last 3 days</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-semibold themed-text mb-1 uppercase tracking-wide">Source</label>
            <select name="source" value={form.source} onChange={handleChange} className="input-field text-sm">
              <option value="">All Sources</option>
              <option value="Google Jobs">Google Jobs</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Naukri">Naukri</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
              {loading ? 'Creating…' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Alerts Page ───────────────────────────────────────────────────────────────
const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const data = await getAlerts();
      setAlerts(data);
    } catch {
      setError('Failed to load alerts. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleCreate = (newAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    await deleteAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleToggle = async (id) => {
    const updated = await toggleAlert(id);
    setAlerts(prev => prev.map(a => a.id === id ? updated : a));
  };

  const handleMarkRead = async (id) => {
    const updated = await markAlertRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? updated : a));
  };

  const totalUnread = alerts.reduce((acc, a) => acc + (a.match_count || 0), 0);
  const activeCount = alerts.filter(a => a.is_active).length;

  return (
    <div className="min-h-screen themed-bg flex flex-col font-sans transition-colors duration-300">
      <Navbar onRefresh={null} isRefreshing={false} countdown={null} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold themed-text flex items-center gap-2">
              <Bell size={22} style={{ color: '#3b82f6' }} />
              Job Alerts
              {totalUnread > 0 && (
                <span className="text-sm font-semibold text-white bg-red-500 rounded-full px-2 py-0.5 animate-pulse">
                  {totalUnread} new
                </span>
              )}
            </h1>
            <p className="themed-text-muted text-sm mt-0.5">
              {alerts.length === 0
                ? 'No alerts yet'
                : `${activeCount} active · ${alerts.length} total`}
            </p>
          </div>
          <button
            id="create-alert-btn"
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> New Alert
          </button>
        </div>

        {/* Stats row */}
        {alerts.length > 0 && totalUnread > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <CheckCheck size={16} />
            <span>
              <strong>{totalUnread}</strong> new job match{totalUnread !== 1 ? 'es' : ''} across your alerts — expand an alert to view & dismiss.
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin w-10 h-10" style={{ color: '#3b82f6' }} />
          </div>
        ) : error ? (
          <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertCircle size={28} className="mx-auto mb-2" />
            <p className="font-medium">{error}</p>
            <button onClick={fetchAlerts} className="mt-3 btn-secondary" style={{ color: '#ef4444' }}>
              Retry
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState onCreateClick={() => setShowModal(true)} />
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showModal && (
        <CreateAlertModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
};

export default AlertsPage;
