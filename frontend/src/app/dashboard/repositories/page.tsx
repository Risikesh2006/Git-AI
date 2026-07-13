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

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="glass-card h-64 skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Repositories</h1>
          <p className="text-white/40 text-sm mt-1">{repos.length} repositories · sorted by priority</p>
        </div>
        <button onClick={handleScanAll} disabled={scanning} className="btn-primary">
          {scanning ? (
            <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Scanning...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Scan All</>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search repositories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-glass max-w-xs"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="input-glass w-auto"
        >
          <option value="priority">Sort: Priority</option>
          <option value="name">Sort: Name</option>
          <option value="stars">Sort: Stars</option>
          <option value="idle">Sort: Most Idle</option>
        </select>
        <select
          value={filterLang}
          onChange={e => setFilterLang(e.target.value)}
          className="input-glass w-auto"
        >
          {languages.map(l => <option key={l} value={l}>{l === 'all' ? 'All Languages' : l}</option>)}
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/30 text-lg mb-2">No repositories found</p>
          <p className="text-white/20 text-sm mb-6">
            {repos.length === 0 ? 'Scan your GitHub repositories to get started.' : 'Try adjusting your filters.'}
          </p>
          {repos.length === 0 && (
            <button onClick={handleScanAll} disabled={scanning} className="btn-primary">
              Scan Repositories
            </button>
          )}
        </div>
      )}

      {/* Repo Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(repo => {
          const m = repo.repository_metrics?.[0];
          return (
            <div key={repo.id} className="glass-card p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold text-sm truncate">{repo.repo_name}</h3>
                    {repo.is_private && (
                      <span className="text-white/30 text-[10px] border border-white/10 px-1.5 py-0.5 rounded">Private</span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{repo.description}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${getPriorityClass(repo.priority_score)}`}>
                  {repo.priority_score}
                </span>
              </div>

              {/* Priority bar */}
              <div>
                <div className="flex justify-between text-xs text-white/30 mb-1">
                  <span>Priority Score</span>
                  <span>{repo.priority_score}/100</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${repo.priority_score}%` }} />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <MetricPill label="Commits" value={m?.total_commits ?? '—'} />
                <MetricPill label="Issues" value={m?.open_issues ?? '—'} warn={(m?.open_issues ?? 0) > 5} />
                <MetricPill label="Tests" value={m?.test_files ?? '—'} />
                <MetricPill label="Doc Score" value={m ? `${m.documentation_score}%` : '—'} />
              </div>

              {/* Language & Stats */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {repo.language && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: LANG_COLORS[repo.language] || '#888' }} />
                      <span className="text-white/50 text-xs">{repo.language}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-white/30 text-xs">
                  <span>⭐ {repo.stars}</span>
                  <span>{m?.days_since_last_commit != null ? `${m.days_since_last_commit}d ago` : '—'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href="/dashboard/planner" className="btn-secondary flex-1 justify-center text-xs py-2">
                  Plan →
                </Link>
                <Link href="/dashboard/commit" className="btn-secondary text-xs py-2 px-3">
                  Commit
                </Link>
                <button
                  onClick={() => handleScanOne(repo.id)}
                  disabled={scanningId === repo.id}
                  className="btn-secondary text-xs py-2 px-3"
                  title="Re-scan this repository"
                >
                  {scanningId === repo.id ? (
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  ) : '↻'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricPill({ label, value, warn = false }: { label: string; value: any; warn?: boolean }) {
  return (
    <div className="bg-white/[0.03] rounded-lg px-3 py-2">
      <p className="text-white/30 text-[10px] mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${warn ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
