'use client';

import { useState, useEffect, useCallback } from 'react';
import { gitAPI, feedbackAPI } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';

interface Commit {
  id: string;
  commit_hash: string;
  commit_message: string;
  pushed: boolean;
  committed_at: string;
  repositories?: { repo_name: string };
}

interface Feedback {
  id: string;
  action: string;
  notes?: string;
  created_at: string;
  repositories?: { repo_name: string };
}

interface Patterns {
  total_feedback: number;
  action_distribution: Record<string, number>;
  completion_rate: number;
  preferred_languages: Record<string, number>;
}

export default function HistoryPage() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'commits' | 'feedback' | 'patterns'>('commits');

  const load = useCallback(async () => {
    const [commitsRes, feedbackRes, patternsRes] = await Promise.allSettled([
      gitAPI.getHistory(),
      feedbackAPI.getHistory(),
      feedbackAPI.getPatterns()
    ]);
    if (commitsRes.status === 'fulfilled') setCommits(commitsRes.value.data || []);
    if (feedbackRes.status === 'fulfilled') setFeedback(feedbackRes.value.data || []);
    if (patternsRes.status === 'fulfilled') setPatterns(patternsRes.value.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const actionColors: Record<string, string> = {
    completed: 'text-green-400 badge-low',
    ignored: 'text-white/40 badge-medium',
    modified: 'text-blue-400',
    in_progress: 'text-yellow-400 badge-high'
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Activity History</h1>
        <p className="text-white/40 text-sm">Track your commits, AI recommendations, and learning patterns</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-fit mb-6">
        {(['commits', 'feedback', 'patterns'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
              activeTab === tab ? 'bg-white text-black' : 'text-white/50 hover:text-white'
            }`}
          >
            {tab}
            {tab === 'commits' && <span className="ml-1.5 text-xs opacity-60">({commits.length})</span>}
            {tab === 'feedback' && <span className="ml-1.5 text-xs opacity-60">({feedback.length})</span>}
          </button>
        ))}
      </div>

      {/* Commits Tab */}
      {activeTab === 'commits' && (
        <div className="flex flex-col gap-3">
          {commits.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-white/30">No commits yet. Use the Commit Assistant to commit changes.</p>
            </div>
          ) : commits.map(c => (
            <div key={c.id} className="glass-card p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-sm font-medium truncate">{c.commit_message}</p>
                  {c.pushed && <span className="badge-low text-[10px] px-1.5 py-0.5 rounded-full">pushed</span>}
                </div>
                <div className="flex items-center gap-3 text-white/30 text-xs">
                  <code>{c.commit_hash?.substring(0, 7) || '—'}</code>
                  <span>{c.repositories?.repo_name || '—'}</span>
                  <span>{new Date(c.committed_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="flex flex-col gap-3">
          {feedback.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-white/30">No feedback submitted yet. Use the AI Planner and mark tasks as completed.</p>
            </div>
          ) : feedback.map(f => (
            <div key={f.id} className="glass-card p-4 flex items-center gap-4">
              <div className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${actionColors[f.action] || ''}`}>
                {f.action}
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-sm">{f.repositories?.repo_name || 'Unknown repo'}</p>
                {f.notes && <p className="text-white/30 text-xs mt-0.5">{f.notes}</p>}
              </div>
              <span className="text-white/30 text-xs">{new Date(f.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && patterns && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Completion Rate</h3>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-black text-white">{patterns.completion_rate}%</div>
              <div className="flex-1">
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 rounded-full transition-all duration-700"
                    style={{ width: `${patterns.completion_rate}%` }}
                  />
                </div>
                <p className="text-white/30 text-xs mt-2">{patterns.total_feedback} total feedback entries</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Action Distribution</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(patterns.action_distribution).map(([action, count]) => (
                <div key={action} className="flex items-center gap-3">
                  <span className="text-white/50 text-xs capitalize w-20">{action}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{ width: `${(count / patterns.total_feedback) * 100}%` }}
                    />
                  </div>
                  <span className="text-white/30 text-xs w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {Object.keys(patterns.preferred_languages).length > 0 && (
            <div className="glass-card p-5 md:col-span-2">
              <h3 className="text-white font-semibold text-sm mb-4">Preferred Languages (Completed Tasks)</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(patterns.preferred_languages)
                  .sort(([, a], [, b]) => b - a)
                  .map(([lang, count]) => (
                    <div key={lang} className="glass px-3 py-1.5 rounded-full">
                      <span className="text-white text-sm">{lang}</span>
                      <span className="text-white/40 text-xs ml-1.5">{count} tasks</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
