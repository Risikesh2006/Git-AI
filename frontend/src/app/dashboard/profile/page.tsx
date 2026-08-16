'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { repoAPI, aiAPI } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';

interface Repo {
  id: string;
  repo_name: string;
  stars: number;
  repository_metrics?: Array<{ total_commits: number }>;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [aiStatus, setAiStatus] = useState<{ connected: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [r, a] = await Promise.allSettled([repoAPI.getAll(), aiAPI.getAIStatus()]);
      if (r.status === 'fulfilled') setRepos(r.value.data || []);
      if (a.status === 'fulfilled') setAiStatus(a.value.data);
    } catch (err) {
      toast.error('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const displayName = user?.name || user?.github_username || 'Engineer';
  const handle = user?.github_username || 'github_user';
  const initial = displayName[0]?.toUpperCase() || 'U';

  const totalCommits = repos.reduce((sum, r) => sum + (r.repository_metrics?.[0]?.total_commits ?? 0), 0);
  const totalStars = repos.reduce((sum, r) => sum + (r.stars ?? 0), 0);
  const totalRepos = repos.length;

  const statCards = [
    { label: 'Total Commits', icon: 'terminal', value: totalCommits.toLocaleString() },
    { label: 'Repositories', icon: 'account_tree', value: totalRepos.toString() },
    { label: 'Total Stars', icon: 'grade', value: totalStars.toLocaleString() },
    { label: 'AI Status', icon: 'smart_toy', value: aiStatus?.connected ? 'Online' : 'Offline' },
  ];

  if (loading) {
    return (
      <div className="dp-root">
        <div className="gc dp-skeleton" style={{ height: 260, borderRadius: 40, marginBottom: 32 }} />
        <div className="dp-stat-grid">
          {[...Array(4)].map((_, i) => <div key={i} className="gc dp-skeleton" style={{ height: 140, borderRadius: 24 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="dp-root">
      <div className="dp-inner">
        {/* Profile Header */}
        <section className="pf-header">
          <div className="pf-avatar-wrap">
            <div className="pf-avatar-ring gc">
              <div className="pf-avatar-inner">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : initial}
              </div>
            </div>
            <div className="pf-verified">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#060606' }}>verified</span>
            </div>
          </div>
          <h1 className="pf-name">{displayName}</h1>
          <p className="pf-handle">@{handle} · Engineering Manager</p>
          <div className="pf-header-actions">
            <button className="pf-btn-primary">Edit Identity</button>
            <button onClick={signOut} className="pf-btn-secondary">Sign Out</button>
          </div>
        </section>

        {/* Stats */}
        <div className="dp-stat-grid" style={{ marginBottom: 24 }}>
          {statCards.map(card => (
            <div key={card.label} className="gc dp-stat-card">
              <div className="dp-stat-top">
                <span className="material-symbols-outlined dp-stat-icon">{card.icon}</span>
              </div>
              <div className="dp-stat-value-row"><span className="dp-stat-value">{card.value}</span></div>
              <p className="dp-stat-caption">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Genome + Affinity */}
        <div className="pf-grid">
          {/* Engineering Genome */}
          <div className="gc pf-genome-card">
            <h3 className="pf-card-title">
              <span className="material-symbols-outlined">fingerprint</span>
              Engineering Genome
            </h3>
            <div className="pf-genome-visual">
              <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg className="pf-genome-ring" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', color: 'rgba(255,255,255,0.2)' }} viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeDasharray="2 4" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeDasharray="10 5" strokeWidth="1" />
                </svg>
                <svg className="pf-genome-ring-rev" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', color: 'rgba(255,255,255,0.4)' }} viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeDasharray="15 10 5 10" strokeWidth="1.5" />
                  <polygon points="50,15 80,35 80,65 50,85 20,65 20,35" fill="none" stroke="currentColor" strokeWidth="0.5" style={{ opacity: 0.5 }} />
                </svg>
                <div className="pf-genome-core">
                  <span className="material-symbols-outlined" style={{ color: '#fff' }}>data_object</span>
                </div>
              </div>
            </div>
            <div className="pf-badge-row">
              <span className="pf-vapor-badge">Systems</span>
              <span className="pf-vapor-badge">Architecture</span>
              <span className="pf-vapor-badge" style={{ color: '#fff', boxShadow: '0 0 10px rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.4)' }}>AI Integration</span>
            </div>
          </div>

          {/* AI Model Affinity */}
          <div className="gc pf-affinity-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 className="pf-card-title" style={{ marginBottom: 0 }}>AI Model Affinity</h3>
              <span className="pf-live-tag"><span className="pf-live-dot" />Live Telemetry</span>
            </div>
            <div>
              <div className="pf-model-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="pf-model-icon" style={{ background: '#fff', color: '#060606' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>neurology</span>
                  </div>
                  <div>
                    <p className="pf-model-name">LM Studio Local LLM</p>
                    <p className="pf-model-role">Daily Plans &amp; Commit Messages</p>
                  </div>
                </div>
                <div className="pf-model-stat">
                  <div className="pf-model-stat-val">{aiStatus?.connected ? 'Connected' : 'Offline'}</div>
                  <div className="pf-model-stat-label">Runtime Status</div>
                </div>
              </div>
              <div className="pf-model-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="pf-model-icon" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>forest</span>
                  </div>
                  <div>
                    <p className="pf-model-name">Random Forest Priority Engine</p>
                    <p className="pf-model-role">Repository Scoring</p>
                  </div>
                </div>
                <div className="pf-model-stat">
                  <div className="pf-model-stat-val">{totalRepos}</div>
                  <div className="pf-model-stat-label">Repos Scored</div>
                </div>
              </div>
            </div>
          </div>

          {/* System Access Hub */}
          <div className="gc pf-access-card">
            <div className="pf-access-head">
              <div>
                <h3 className="pf-card-title" style={{ marginBottom: 6 }}>System Access Hub</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Local-first controls for your Git AI instance.</p>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'rgba(255,255,255,0.2)' }}>admin_panel_settings</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
              <div className="pf-toggle-col">
                <div className="pf-toggle-row">
                  <p className="pf-toggle-title">AI Training Gate</p>
                  <label className="pf-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="pf-switch-track" />
                  </label>
                </div>
                <p className="pf-toggle-desc">Restrict models from unauthorized scraping of private repositories and internal tools.</p>
              </div>
              <div className="pf-toggle-col">
                <div className="pf-toggle-row">
                  <p className="pf-toggle-title">Neural Sync Pipeline</p>
                  <label className="pf-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="pf-switch-track" />
                  </label>
                </div>
                <p className="pf-toggle-desc">Real-time bi-directional data flow for automated codebase maintenance.</p>
              </div>
              <div className="pf-toggle-col" style={{ justifyContent: 'center' }}>
                <button className="pf-rotate-btn">
                  <span className="material-symbols-outlined">key</span>
                  Rotate Cryptographic Keys
                </button>
                <div className="pf-lock-note">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span> Hardware Locked
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
