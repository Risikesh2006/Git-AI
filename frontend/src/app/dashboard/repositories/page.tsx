'use client';

import { useState, useEffect, useCallback } from 'react';
import { repoAPI } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import Link from 'next/link';

interface Repo {
  id: string;
  repo_name: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  is_private: boolean;
  priority_score: number;
  importance_score?: number;
  html_url?: string;
  last_scanned_at?: string;
  repository_metrics?: Array<{
    days_since_last_commit: number;
    open_issues: number;
    documentation_score: number;
    test_files: number;
    total_commits: number;
    recent_commits_30d: number;
    num_files: number;
  }>;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  CSS: '#563d7c', HTML: '#e34c26', Ruby: '#701516', Swift: '#F05138'
};

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'name' | 'stars' | 'idle'>('priority');
  const [filterLang, setFilterLang] = useState('all');

  const loadRepos = useCallback(async () => {
    try {
      const { data } = await repoAPI.getAll();
      setRepos(data || []);
    } catch (err: any) {
      toast.error('Failed to load repositories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRepos(); }, [loadRepos]);

  const handleScanAll = async () => {
    setScanning(true);
    try {
      const { data } = await repoAPI.scanAll();
      toast.success(`Scanned ${data.scanned} repos · ${data.successful} successful`);
      await loadRepos();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleScanOne = async (id: string) => {
    setScanningId(id);
    try {
      await repoAPI.scanOne(id);
      toast.success('Repository scanned successfully');
      await loadRepos();
    } catch (err: any) {
      toast.error('Scan failed');
    } finally {
      setScanningId(null);
    }
  };

  const languages = ['all', ...new Set(repos.map(r => r.language).filter(Boolean) as string[])];

  const filtered = repos
    .filter(r => {
      const matchSearch = r.repo_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase());
      const matchLang = filterLang === 'all' || r.language === filterLang;
      return matchSearch && matchLang;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return (b.priority_score || 0) - (a.priority_score || 0);
      if (sortBy === 'name') return a.repo_name.localeCompare(b.repo_name);
      if (sortBy === 'stars') return (b.stars || 0) - (a.stars || 0);
      if (sortBy === 'idle') return (b.repository_metrics?.[0]?.days_since_last_commit || 0) - (a.repository_metrics?.[0]?.days_since_last_commit || 0);
      return 0;
    });

  const getPriorityClass = (score: number) => {
    if (score >= 85) return 'badge-critical';
    if (score >= 70) return 'badge-high';
    if (score >= 50) return 'badge-medium';
    return 'badge-low';
  };

  const totalIssues = repos.reduce((sum, r) => sum + (r.repository_metrics?.[0]?.open_issues ?? 0), 0);
  const mostRecentScan = repos
    .map(r => r.last_scanned_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];
  const lastSyncLabel = mostRecentScan
    ? `${Math.max(0, Math.round((Date.now() - new Date(mostRecentScan).getTime()) / 60000))}m`
    : '—';

  if (loading) {
    return (
      <div className="dp-root">
        <div className="dp-stat-grid">
          {[...Array(3)].map((_, i) => <div key={i} className="gc dp-skeleton" style={{ height: 140, borderRadius: 24 }} />)}
        </div>
        <div className="rp-grid" style={{ marginTop: 20 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="gc dp-skeleton" style={{ height: 260, borderRadius: 24 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="dp-root">
      <div className="dp-inner">
        {/* Header */}
        <header className="dp-header">
          <div>
            <p className="dp-greeting">Engineering Ecosystem</p>
            <h1 className="dp-title">Repositories</h1>
            <div className="dp-status">
              <span className="dp-status-dot dp-status-dot--on" />
              <span className="dp-status-text dp-status-text--on">
                {repos.length} repositories tracked · sorted by {sortBy}
              </span>
            </div>
          </div>
          <button onClick={handleScanAll} disabled={scanning} className="dp-scan-btn">
            {scanning ? (
              <><div className="dp-spinner" />Scanning...</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>refresh</span>Scan All</>
            )}
          </button>
        </header>

        {/* Stat cards */}
        <div className="dp-stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="gc dp-stat-card">
            <div className="dp-stat-top">
              <span className="dp-stat-label">Total Repos</span>
              <span className="material-symbols-outlined dp-stat-icon">account_tree</span>
            </div>
            <div className="dp-stat-value-row"><span className="dp-stat-value">{repos.length}</span></div>
            <p className="dp-stat-caption">Connected to your GitHub account</p>
          </div>
          <div className="gc dp-stat-card">
            <div className="dp-stat-top">
              <span className="dp-stat-label">Open Issues</span>
              <span className="material-symbols-outlined dp-stat-icon">bug_report</span>
            </div>
            <div className="dp-stat-value-row"><span className="dp-stat-value">{totalIssues}</span></div>
            <p className="dp-stat-caption">Across all connected repositories</p>
          </div>
          <div className="gc dp-stat-card">
            <div className="dp-stat-top">
              <span className="dp-stat-label">Last Sync</span>
              <span className="material-symbols-outlined dp-stat-icon">schedule</span>
            </div>
            <div className="dp-stat-value-row"><span className="dp-stat-value">{lastSyncLabel}</span></div>
            <p className="dp-stat-caption">{mostRecentScan ? 'ago' : 'No scans yet'}</p>
          </div>
        </div>

        {/* Content panel */}
        <section className="gc" style={{ borderRadius: 32, marginTop: 20, overflow: 'hidden' }}>
          <div className="dg-toolbar">
            <div className="dg-search-wrap">
              <span className="material-symbols-outlined dg-search-icon">search</span>
              <input
                type="text"
                placeholder="Search repositories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-neu"
              />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="input-neu" style={{ width: 'auto', minWidth: 160 }}>
              <option value="priority">Sort: Priority</option>
              <option value="name">Sort: Name</option>
              <option value="stars">Sort: Stars</option>
              <option value="idle">Sort: Most Idle</option>
            </select>
            <select value={filterLang} onChange={e => setFilterLang(e.target.value)} className="input-neu" style={{ width: 'auto', minWidth: 160 }}>
              {languages.map(l => <option key={l} value={l}>{l === 'all' ? 'All Languages' : l}</option>)}
            </select>
          </div>

          <div style={{ padding: 28 }}>
            {filtered.length === 0 ? (
              <div className="dp-empty">
                <div className="dp-empty-icon-wrap">
                  <div className="dp-empty-glow" />
                  <div className="dp-empty-icon-ring gc">
                    <span className="material-symbols-outlined dp-empty-icon">folder_open</span>
                  </div>
                </div>
                <h3 className="dp-empty-title">{repos.length === 0 ? 'Scan Repositories' : 'No repositories found'}</h3>
                <p className="dp-empty-desc">
                  {repos.length === 0
                    ? 'To begin monitoring your engineering ecosystem, connect your GitHub account and perform an initial scan.'
                    : 'Try adjusting your search or filters.'}
                </p>
                {repos.length === 0 && (
                  <button onClick={handleScanAll} disabled={scanning} className="dp-scan-now-btn gc">
                    {scanning ? 'Scanning...' : 'Scan Repositories'}
                  </button>
                )}
              </div>
            ) : (
              <div className="rp-grid">
                {filtered.map(repo => {
                  const m = repo.repository_metrics?.[0];
                  return (
                    <div key={repo.id} className="gc rp-card">
                      <div className="rp-card-top">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="rp-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.repo_name}</span>
                            {repo.is_private && <span className="rp-priv-badge">Private</span>}
                          </div>
                          {repo.description && <p className="rp-desc" style={{ marginTop: 6 }}>{repo.description}</p>}
                        </div>
                        <span className={`dp-badge ${getPriorityClass(repo.priority_score)}`}>{repo.priority_score}</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
                          <span>Priority Score</span>
                          <span>{repo.priority_score}/100</span>
                        </div>
                        <div className="dp-bar-track" style={{ width: '100%' }}>
                          <div className="dp-bar-fill liquid-fill" style={{ width: `${repo.priority_score}%` }} />
                        </div>
                      </div>

                      <div className="rp-metric-grid">
                        <div className="rp-metric"><p className="rp-metric-label">Commits</p><p className="rp-metric-value">{m?.total_commits ?? '—'}</p></div>
                        <div className="rp-metric"><p className="rp-metric-label">Issues</p><p className="rp-metric-value" style={{ color: (m?.open_issues ?? 0) > 5 ? '#ff6666' : '#fff' }}>{m?.open_issues ?? '—'}</p></div>
                        <div className="rp-metric"><p className="rp-metric-label">Tests</p><p className="rp-metric-value">{m?.test_files ?? '—'}</p></div>
                        <div className="rp-metric"><p className="rp-metric-label">Doc Score</p><p className="rp-metric-value">{m ? `${m.documentation_score}%` : '—'}</p></div>
                      </div>

                      <div className="rp-footer-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {repo.language && (
                            <>
                              <span className="rp-lang-dot" style={{ background: LANG_COLORS[repo.language] || '#888' }} />
                              <span>{repo.language}</span>
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span>⭐ {repo.stars}</span>
                          <span>{m?.days_since_last_commit != null ? `${m.days_since_last_commit}d ago` : '—'}</span>
                        </div>
                      </div>

                      <div className="rp-actions">
                        <Link href="/dashboard/planner" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '8px 12px' }}>
                          Plan →
                        </Link>
                        <Link href="/dashboard/commit" className="btn-secondary" style={{ fontSize: 12, padding: '8px 12px' }}>
                          Commit
                        </Link>
                        <button
                          onClick={() => handleScanOne(repo.id)}
                          disabled={scanningId === repo.id}
                          className="btn-secondary"
                          style={{ fontSize: 12, padding: '8px 12px' }}
                          title="Re-scan this repository"
                        >
                          {scanningId === repo.id ? (
                            <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                          ) : (
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
