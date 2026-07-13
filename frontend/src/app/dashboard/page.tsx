'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { repoAPI, aiAPI } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import Link from 'next/link';
import { DashboardShaderBackground } from './DashboardShaderBackground';
import { useMagnetic } from './useMagnetic';

// Interface representing consolidated metrics for git repository health and activity metrics
interface HealthStats {
  health_score: number;
  total_repos: number;
  active_repos: number;
  avg_doc_score: number;
  total_stars: number;
  total_issues: number;
  avg_priority: number;
}

interface Repo {
  id: string;
  repo_name: string;
  language: string;
  priority_score: number;
  stars: number;
  description?: string;
  repository_metrics?: Array<{
    days_since_last_commit: number;
    open_issues: number;
    documentation_score: number;
  }>;
}

/* ── Tilt glass card ── */
function GlassCard({
  children,
  className = '',
  style,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = ((y - r.height / 2) / r.height) * 8;
    const ry = ((r.width / 2 - x) / r.width) * 8;
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  const El = Tag as any;
  return (
    <El
      ref={ref}
      className={`gc ${className}`}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </El>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [aiStatus, setAiStatus] = useState<{ connected: boolean } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  const [toasts, setToasts] = useState([
    { id: 1, icon: 'cancel', text: 'Failed to load repositories.', accent: true },
    { id: 2, icon: 'N', text: '2 Issues detected.', accent: false },
  ]);
  const dismissToast = (id: number) => setToasts((p) => p.filter((t) => t.id !== id));

  const scanBtnRef = useMagnetic<HTMLButtonElement>(0.4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const loadData = useCallback(async () => {
    try {
      const [s, r, a] = await Promise.allSettled([
        repoAPI.getHealthStats(),
        repoAPI.getAll(),
        aiAPI.getAIStatus(),
      ]);
      if (s.status === 'fulfilled') setStats(s.value.data);
      if (r.status === 'fulfilled') setRepos(r.value.data || []);
      if (a.status === 'fulfilled') setAiStatus(a.value.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data } = await repoAPI.scanAll();
      toast.success(`Scanned ${data.scanned} repositories! ${data.successful} successful.`);
      await loadData();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error;
      toast.error(msg || 'Scan failed. Check your GitHub connection.');
    } finally {
      setScanning(false);
    }
  };

  const topRepos = [...repos].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0)).slice(0, 5);
  const getPClass = (s: number) => s >= 85 ? 'badge-critical' : s >= 70 ? 'badge-high' : s >= 50 ? 'badge-medium' : 'badge-low';
  const getPLabel = (s: number) => s >= 85 ? 'Critical' : s >= 70 ? 'High' : s >= 50 ? 'Medium' : 'Low';

  const hasHealth = stats?.health_score != null && repos.length > 0;
  const repoCount = stats?.total_repos ?? repos.length;

  const statCards = [
    {
      label: 'Health\nScore',
      icon: 'monitoring',
      value: hasHealth ? `${stats!.health_score}` : '—',
      tag: !hasHealth ? 'RESCAN REQ' : undefined,
      caption: repos.length === 0 ? 'Scan repos to start evaluation' : 'Portfolio health score',
    },
    {
      label: 'Repositories',
      icon: 'folder_zip',
      value: `${repoCount}`,
      tag: 'TOTAL',
      caption: `${stats?.active_repos ?? 0} active (30d period)`,
    },
    {
      label: 'Open\nIssues',
      icon: 'error_outline',
      value: stats?.total_issues != null ? `${stats.total_issues}` : '—',
      tag: undefined,
      caption: 'Across all connected repositories',
    },
    {
      label: 'Total\nStars',
      icon: 'grade',
      value: stats?.total_stars != null ? `${stats.total_stars}` : '—',
      tag: undefined,
      caption: 'Total GitHub engagement reach',
    },
  ];

  if (loading) {
    return (
      <div className="dp-root">
        <DashboardShaderBackground />
        <div className="dp-inner">
          <div className="dp-stat-grid">
            {[...Array(4)].map((_, i) => <div key={i} className="gc dp-skeleton" style={{ height: 160, borderRadius: 24 }} />)}
          </div>
          <div className="dp-bento">
            <div className="gc dp-skeleton" style={{ gridColumn: 'span 8', minHeight: 500, borderRadius: 32 }} />
            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div className="gc dp-skeleton" style={{ height: 240, borderRadius: 32 }} />
              <div className="gc dp-skeleton" style={{ height: 240, borderRadius: 32 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-root">
      <DashboardShaderBackground />

      <motion.div className="dp-inner" initial="hidden" animate="show">

        {/* ── Header ── */}
        <motion.header variants={fadeUp} custom={0} className="dp-header">
          <div>
            <p className="dp-greeting">{greeting}, 👋</p>
            <h1 className="dp-title">Engineering Dashboard</h1>
            <div className="dp-status">
              <span className={`dp-status-dot ${aiStatus?.connected ? 'dp-status-dot--on' : 'dp-status-dot--off'}`} />
              <span className={`dp-status-text ${aiStatus?.connected ? 'dp-status-text--on' : 'dp-status-text--off'}`}>
                LM Studio:{' '}
                {aiStatus?.connected
                  ? 'Connected'
                  : 'Not Connected — Start LM Studio and load a model'}
              </span>
            </div>
          </div>
          <button
            ref={scanBtnRef}
            onClick={handleScan}
            disabled={scanning}
            className="dp-scan-btn"
          >
            {scanning ? (
              <>
                <div className="dp-spinner" />
                Scanning...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>sync</span>
                Scan Repositories
              </>
            )}
          </button>
        </motion.header>

        {/* ── Stat Cards ── */}
        <div className="dp-stat-grid">
          {statCards.map((card, i) => (
            <GlassCard key={card.label} className="dp-stat-card">
              <motion.div variants={fadeUp} custom={i + 1}>
                <div className="dp-stat-top">
                  <span className="dp-stat-label">{card.label}</span>
                  <span className="material-symbols-outlined dp-stat-icon">{card.icon}</span>
                </div>
                <div className="dp-stat-value-row">
                  <span className="dp-stat-value">{card.value}</span>
                  {card.tag && <span className="dp-stat-tag">{card.tag}</span>}
                </div>
                <p className="dp-stat-caption">{card.caption}</p>
              </motion.div>
            </GlassCard>
          ))}
        </div>

        {/* ── Bento ── */}
        <div className="dp-bento">

          {/* Priority Projects */}
          <GlassCard className="dp-bento-main" as="section">
            <motion.div variants={fadeUp} custom={5} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="dp-card-header">
                <h2 className="dp-card-title">Priority Projects</h2>
                <Link href="/dashboard/repositories" className="dp-view-all">
                  View all
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                </Link>
              </div>

              {topRepos.length === 0 ? (
                <div className="dp-empty">
                  <div className="dp-empty-icon-wrap">
                    <div className="dp-empty-glow" />
                    <div className="dp-empty-icon-ring gc">
                      <span className="material-symbols-outlined dp-empty-icon">deployed_code</span>
                    </div>
                  </div>
                  <h3 className="dp-empty-title">No repositories scanned yet.</h3>
                  <p className="dp-empty-desc">
                    Initiate a system scan to synchronize your GitHub repositories and begin AI-assisted optimization.
                  </p>
                  <button onClick={handleScan} disabled={scanning} className="dp-scan-now-btn gc">
                    {scanning ? 'Scanning...' : 'Scan Now'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topRepos.map((repo, i) => (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="dp-repo-row gc"
                    >
                      <span className="dp-repo-num">{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p className="dp-repo-name">{repo.repo_name}</p>
                          {repo.language && <span className="dp-repo-lang">{repo.language}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                          <div className="dp-bar-track">
                            <div className="dp-bar-fill liquid-fill" style={{ width: `${repo.priority_score}%` }} />
                          </div>
                          <span className="dp-repo-score">{repo.priority_score}/100</span>
                        </div>
                      </div>
                      <span className={`dp-badge ${getPClass(repo.priority_score)}`}>{getPLabel(repo.priority_score)}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </GlassCard>

          {/* Right column */}
          <div className="dp-bento-side">

            {/* Today's Mission */}
            <GlassCard className="dp-mission-card">
              <motion.div variants={fadeUp} custom={6}>
                {/* Sparkle decoration */}
                <div className="dp-mission-deco">
                  <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'rgba(255,255,255,0.12)' }}>auto_awesome</span>
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="dp-mission-header">
                    <div className="dp-mission-icon gc">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 className="dp-card-title" style={{ fontSize: 20 }}>Today&apos;s Mission</h2>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>auto_awesome</span>
                    </div>
                  </div>

                  {topRepos[0] ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ color: '#c4c7c8', fontSize: 13 }}>Top Priority:</p>
                        <span className={`dp-badge ${getPClass(topRepos[0].priority_score)}`}>{topRepos[0].priority_score}/100</span>
                      </div>
                      <p style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{topRepos[0].repo_name}</p>
                      <p style={{ color: '#c4c7c8', fontSize: 13, lineHeight: 1.5 }}>{topRepos[0].description || 'No description available.'}</p>
                      <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                        <Link href="/dashboard/planner" className="dp-scan-btn" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>Generate Plan →</Link>
                        <Link href="/dashboard/commit" className="dp-scan-now-btn gc" style={{ textDecoration: 'none' }}>Commit</Link>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="dp-mission-quote">
                        &quot;Scan your repositories to get today&apos;s mission. I&apos;ll analyze current tickets and suggest the highest impact work for your morning.&quot;
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div className="dp-awaiting gc">Awaiting input...</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </GlassCard>

            {/* Repository Health */}
            <GlassCard className="dp-health-card">
              <motion.div variants={fadeUp} custom={7}>
                <h2 className="dp-card-title" style={{ fontSize: 20, marginBottom: 28 }}>Repository Health</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <HealthRow label="Documentation" value={stats?.avg_doc_score ?? 0} delay={0} />
                  <HealthRow
                    label="Active Projects"
                    value={stats && stats.total_repos > 0 ? Math.round((stats.active_repos / stats.total_repos) * 100) : 0}
                    delay={0.1}
                  />
                  <HealthRow label="Overall Health" value={stats?.health_score ?? 0} delay={0.2} />
                </div>
              </motion.div>
            </GlassCard>

          </div>
        </div>
      </motion.div>

      {/* ── Toast Notifications ── */}
      <div className="dp-toasts">
        {toasts.map((t, idx) => (
          <div key={t.id} className={`dp-toast gc ${idx === 0 ? 'dp-toast--error' : ''}`}>
            {t.accent ? (
              <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: 20 }}>{t.icon}</span>
            ) : (
              <div className="dp-toast-n">N</div>
            )}
            <span className="dp-toast-text">{t.text}</span>
            <button onClick={() => dismissToast(t.id)} className="dp-toast-close">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthRow({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="dp-health-label">{label}</span>
        <span className="dp-health-pct">{value}%</span>
      </div>
      <div className="dp-health-track">
        <motion.div
          className="dp-health-fill liquid-fill"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
