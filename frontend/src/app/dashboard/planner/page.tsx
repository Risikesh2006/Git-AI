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

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">AI Daily Planner</h1>
        <p className="text-white/40 text-sm">LM Studio generates your personalized development plan</p>
      </div>

      {/* Repo Selector */}
      <div className="glass-card p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="text-white/50 text-xs mb-2 block">Select Repository</label>
            <select
              value={selectedRepo}
              onChange={e => setSelectedRepo(e.target.value)}
              className="input-glass"
            >
              <option value="">Choose a repository...</option>
              {repos.map(r => (
                <option key={r.id} value={r.id}>
                  {r.repo_name} — Priority: {r.priority_score}/100
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={generatePlan}
            disabled={generating || !selectedRepo}
            className="btn-primary"
          >
            {generating ? (
              <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Generating...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>Generate Daily Plan</>
            )}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {generating && (
        <div className="glass-card p-12 text-center mb-6">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Generating your development plan...</p>
          <p className="text-white/40 text-sm mt-2">LM Studio is analyzing {selectedRepoObj?.repo_name}</p>
        </div>
      )}

      {/* Plan Output */}
      {plan && !generating && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-semibold">Today's Tasks</h2>
                <span className="text-white/30 text-xs">{plan.tasks.length} tasks</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed border-l-2 border-white/10 pl-3">{plan.summary}</p>
            </div>

            {plan.tasks.map((task, i) => (
              <div
                key={i}
                className={`glass-card p-5 cursor-pointer transition-all ${selectedTask?.id === task.id ? 'border-white/20' : ''}`}
                onClick={() => generateTaskImpl(task)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{categoryIcons[task.category] || '📌'}</span>
                    <div>
                      <h3 className="text-white font-medium text-sm">{task.title}</h3>
                      <p className="text-white/40 text-xs mt-1">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className="text-white/30 text-xs whitespace-nowrap">~{task.estimated_hours}h</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <code className="text-white/30 text-xs font-mono truncate">{task.suggested_commit_message}</code>
                  <button className="text-white/50 hover:text-white text-xs transition-colors flex-shrink-0 ml-2">
                    View Details →
                  </button>
                </div>
              </div>
            ))}

            {/* Feedback */}
            <div className="glass-card p-4 flex items-center gap-3">
              <span className="text-white/40 text-sm">Mark today's plan as:</span>
              {['completed', 'ignored', 'modified'].map(action => (
                <button key={action} onClick={() => submitFeedback(action)} className="btn-secondary text-xs py-1.5 px-3 capitalize">
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar: Insights + Task Detail */}
          <div className="flex flex-col gap-4">
            {/* Health Insights */}
            {plan.health_insights.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="text-white font-semibold text-sm mb-3">Health Insights</h3>
                <div className="flex flex-col gap-2">
                  {plan.health_insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">⚠</span>
                      <p className="text-white/50 text-xs">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Wins */}
            {plan.quick_wins.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="text-white font-semibold text-sm mb-3">Quick Wins</h3>
                <div className="flex flex-col gap-2">
                  {plan.quick_wins.map((win, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <p className="text-white/50 text-xs">{win}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Task Detail */}
            {(selectedTask || generatingTask) && (
              <div className="glass-card p-5">
                <h3 className="text-white font-semibold text-sm mb-3">
                  {selectedTask?.title || 'Loading...'}
                </h3>
                {generatingTask ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-white/40 text-sm">Generating implementation...</span>
                  </div>
                ) : taskImpl ? (
                  <div className="flex flex-col gap-4">
                    {taskImpl.detailed_steps?.length > 0 && (
                      <div>
                        <p className="text-white/30 text-xs mb-2">Implementation Steps</p>
                        <ol className="flex flex-col gap-1.5">
                          {taskImpl.detailed_steps.map((step: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-white/20 text-xs font-mono mt-0.5">{i + 1}.</span>
                              <span className="text-white/60 text-xs">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {taskImpl.testing_approach && (
                      <div>
                        <p className="text-white/30 text-xs mb-1">Testing Approach</p>
                        <p className="text-white/50 text-xs">{taskImpl.testing_approach}</p>
                      </div>
                    )}
                    {taskImpl.commit_message && (
                      <div>
                        <p className="text-white/30 text-xs mb-1">Suggested Commit</p>
                        <code className="text-white/60 text-xs block bg-white/5 p-2 rounded">{taskImpl.commit_message}</code>
                      </div>
                    )}
                    {taskImpl.code_snippets?.length > 0 && (
                      <div>
                        <p className="text-white/30 text-xs mb-2">Code Guidance</p>
                        {taskImpl.code_snippets.slice(0, 2).map((s: any, i: number) => (
                          <div key={i} className="mb-2">
                            <p className="text-white/30 text-[10px] mb-1">{s.filename}</p>
                            <pre className="bg-white/5 p-2 rounded text-xs text-white/60 overflow-x-auto">{s.code}</pre>
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
        <div className="glass-card p-16 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-white font-semibold text-xl mb-2">Ready to plan your day?</h2>
          <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
            Select a repository and click "Generate Daily Plan". LM Studio will analyze it and create your personalized development tasks.
          </p>
          {repos.length === 0 && (
            <p className="text-white/30 text-xs">No repositories found. Go to the Dashboard and scan your repos first.</p>
          )}
        </div>
      )}
    </div>
  );
}
