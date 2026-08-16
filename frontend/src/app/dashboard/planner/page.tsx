'use client';

import { useState, useEffect, useCallback } from 'react';
import { repoAPI, aiAPI, feedbackAPI } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';

interface Repo {
  id: string;
  repo_name: string;
  language: string;
  priority_score: number;
  description?: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  estimated_hours: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  implementation_steps: string[];
  suggested_commit_message: string;
}

interface Plan {
  summary: string;
  tasks: Task[];
  health_insights: string[];
  quick_wins: string[];
}

export default function PlannerPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskImpl, setTaskImpl] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingTask, setGeneratingTask] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    repoAPI.getAll().then(r => {
      const sorted = (r.data || []).sort((a: Repo, b: Repo) => b.priority_score - a.priority_score);
      setRepos(sorted);
      if (sorted.length > 0) setSelectedRepo(sorted[0].id);
    }).catch(() => toast.error('Failed to load repos')).finally(() => setLoading(false));
  }, []);

  const generatePlan = async () => {
    if (!selectedRepo) return;
    setGenerating(true);
    setPlan(null);
    setSelectedTask(null);
    setTaskImpl(null);
    try {
      const { data } = await aiAPI.generateDailyPlan(selectedRepo);
      setPlan(data.plan);
      toast.success('Daily plan generated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to generate plan. Is LM Studio running?');
    } finally {
      setGenerating(false);
    }
  };

  const generateTaskImpl = async (task: Task) => {
    if (!selectedRepo) return;
    setSelectedTask(task);
    setGeneratingTask(true);
    setTaskImpl(null);
    try {
      const { data } = await aiAPI.generateTask(task, selectedRepo);
      setTaskImpl(data.implementation);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to generate task details');
    } finally {
      setGeneratingTask(false);
    }
  };

  const submitFeedback = async (action: string) => {
    if (!selectedRepo) return;
    try {
      await feedbackAPI.submit({ repoId: selectedRepo, action });
      toast.success(`Marked as ${action}`);
    } catch {}
  };

  const selectedRepoObj = repos.find(r => r.id === selectedRepo);

  const priorityColors = {
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low'
  };

  const categoryIcons: Record<string, string> = {
    feature: '✨',
    bug: '🐛',
    testing: '🧪',
    documentation: '📝',
    refactoring: '♻️'
  };

  if (loading) {
    return (
      <div className="dp-root">
        <div className="gc dp-skeleton" style={{ height: 120, borderRadius: 32, marginBottom: 20 }} />
        <div className="gc dp-skeleton" style={{ height: 460, borderRadius: 40 }} />
      </div>
    );
  }

  return (
    <div className="dp-root">
      <div className="dp-inner">
        <header className="dp-header">
          <div>
            <p className="dp-greeting">LM Studio 2.0 Engine</p>
            <h1 className="dp-title">AI Daily Planner</h1>
            <div className="dp-status">
              <span className="dp-status-dot dp-status-dot--on" />
              <span className="dp-status-text dp-status-text--on">System Online</span>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Selector */}
          <div className="gc pl-selector">
            <div className="pl-selector-field">
              <label className="pl-field-label">Select Repository</label>
              <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} className="input-neu">
                <option value="">Choose a repository...</option>
                {repos.map(r => (
                  <option key={r.id} value={r.id}>{r.repo_name} — Priority: {r.priority_score}/100</option>
                ))}
              </select>
            </div>
            <button onClick={generatePlan} disabled={generating || !selectedRepo} className="dp-scan-btn">
              {generating ? (
                <><div className="dp-spinner" />Generating...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_awesome</span>Generate Daily Plan</>
              )}
            </button>
          </div>

          {/* Loading state */}
          {generating && (
            <div className="gc" style={{ borderRadius: 40, padding: 48, textAlign: 'center' }}>
              <div className="dp-spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px', borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />
              <p style={{ color: '#fff', fontWeight: 600 }}>Generating your development plan...</p>
              <p style={{ color: '#c4c7c8', fontSize: 13, marginTop: 8 }}>LM Studio is analyzing {selectedRepoObj?.repo_name}</p>
            </div>
          )}

          {/* Plan Output */}
          {plan && !generating && (
            <div className="pl-grid">
              {/* Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="gc" style={{ borderRadius: 24, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 className="pf-card-title" style={{ marginBottom: 0, fontSize: 18 }}>Today&apos;s Tasks</h2>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{plan.tasks.length} tasks</span>
                  </div>
                  <p className="pl-quote">{plan.summary}</p>
                </div>

                {plan.tasks.map((task, i) => (
                  <div
                    key={i}
                    className={`gc pl-task ${selectedTask?.id === task.id ? 'pl-task--active' : ''}`}
                    onClick={() => generateTaskImpl(task)}
                  >
                    <div className="pl-task-head">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>{categoryIcons[task.category] || '📌'}</span>
                        <div>
                          <h3 className="pl-task-title">{task.title}</h3>
                          <p className="pl-task-desc">{task.description}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span className={`dp-badge ${priorityColors[task.priority]}`}>{task.priority}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, whiteSpace: 'nowrap' }}>~{task.estimated_hours}h</span>
                      </div>
                    </div>
                    <div className="pl-task-foot">
                      <code style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.suggested_commit_message}</code>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>View Details →</span>
                    </div>
                  </div>
                ))}

                <div className="gc" style={{ borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Mark today&apos;s plan as:</span>
                  {['completed', 'ignored', 'modified'].map(action => (
                    <button key={action} onClick={() => submitFeedback(action)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px', textTransform: 'capitalize' }}>
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {plan.health_insights.length > 0 && (
                  <div className="gc pl-side-card">
                    <h3 className="pf-card-title" style={{ fontSize: 16, marginBottom: 14 }}>Health Insights</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {plan.health_insights.map((insight, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: '#ffee44', marginTop: 2 }}>⚠</span>
                          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.quick_wins.length > 0 && (
                  <div className="gc pl-side-card">
                    <h3 className="pf-card-title" style={{ fontSize: 16, marginBottom: 14 }}>Quick Wins</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {plan.quick_wins.map((win, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: '#66ffaa', marginTop: 2 }}>✓</span>
                          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{win}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedTask || generatingTask) && (
                  <div className="gc pl-side-card">
                    <h3 className="pf-card-title" style={{ fontSize: 16, marginBottom: 14 }}>{selectedTask?.title || 'Loading...'}</h3>
                    {generatingTask ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                        <div className="dp-spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Generating implementation...</span>
                      </div>
                    ) : taskImpl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {taskImpl.detailed_steps?.length > 0 && (
                          <div>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8 }}>Implementation Steps</p>
                            <ol style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {taskImpl.detailed_steps.map((step: string, i: number) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{i + 1}.</span>
                                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {taskImpl.testing_approach && (
                          <div>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 4 }}>Testing Approach</p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{taskImpl.testing_approach}</p>
                          </div>
                        )}
                        {taskImpl.commit_message && (
                          <div>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 4 }}>Suggested Commit</p>
                            <code style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 }}>{taskImpl.commit_message}</code>
                          </div>
                        )}
                        {taskImpl.code_snippets?.length > 0 && (
                          <div>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8 }}>Code Guidance</p>
                            {taskImpl.code_snippets.slice(0, 2).map((s: any, i: number) => (
                              <div key={i} style={{ marginBottom: 8 }}>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginBottom: 4 }}>{s.filename}</p>
                                <pre className="cm-diff" style={{ maxHeight: 140 }}>{s.code}</pre>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!plan && !generating && (
            <div className="gc pl-empty">
              <div className="pl-empty-orb gc">
                <div className="pl-empty-orb-ring" />
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#fff' }}>smart_toy</span>
              </div>
              <div>
                <h2 className="pf-card-title" style={{ justifyContent: 'center' }}>Ready to plan your day?</h2>
                <p style={{ color: '#c4c7c8', maxWidth: 420, margin: '0 auto' }}>
                  Select a repository and click &quot;Generate Daily Plan&quot;. LM Studio will analyze recent commits, issues, and PRs to curate your optimal workflow.
                </p>
                {repos.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 12 }}>No repositories found. Go to the Dashboard and scan your repos first.</p>
                )}
                <div className="pl-chip-row">
                  <div className="pl-chip"><span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.5)' }}>analytics</span><span className="font-mono-label" style={{ fontSize: 10, color: '#c4c7c8', textTransform: 'uppercase' }}>Commit History</span></div>
                  <div className="pl-chip"><span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.5)' }}>bug_report</span><span className="font-mono-label" style={{ fontSize: 10, color: '#c4c7c8', textTransform: 'uppercase' }}>Issue Priority</span></div>
                  <div className="pl-chip"><span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.5)' }}>speed</span><span className="font-mono-label" style={{ fontSize: 10, color: '#c4c7c8', textTransform: 'uppercase' }}>Dev Velocity</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
