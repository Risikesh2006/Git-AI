'use client';

import { useState, useEffect } from 'react';
import { repoAPI, gitAPI, aiAPI } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';

type Stage = 'select' | 'prepare' | 'review' | 'confirm' | 'done';

interface Repo {
  id: string;
  repo_name: string;
  language: string;
  priority_score: number;
  default_branch?: string;
}

interface GitStatus {
  branch: string;
  modified: string[];
  untracked: string[];
  deleted: string[];
  has_changes: boolean;
  diff_summary: string;
}

interface PrepareData {
  repo_name: string;
  branch: string;
  status: GitStatus;
  diff: string;
  suggested_commit_message: string;
  has_changes: boolean;
}

export default function CommitPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [stage, setStage] = useState<Stage>('select');
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [prepareData, setPrepareData] = useState<PrepareData | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [commitResult, setCommitResult] = useState<any>(null);
  const [pushAfterCommit, setPushAfterCommit] = useState(true);
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    repoAPI.getAll()
      .then(r => {
        const sorted = (r.data || []).sort((a: Repo, b: Repo) => b.priority_score - a.priority_score);
        setRepos(sorted);
        if (sorted.length > 0) setSelectedRepo(sorted[0].id);
      })
      .catch(() => toast.error('Failed to load repos'))
      .finally(() => setLoading(false));
  }, []);

  const handlePrepare = async () => {
    if (!selectedRepo) return;
    setPreparing(true);
    try {
      const { data } = await gitAPI.prepare(selectedRepo, taskDescription);
      setPrepareData(data);
      setCommitMessage(data.suggested_commit_message || '');
      setStage('review');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to prepare repository. Is the repo cloneable?');
    } finally {
      setPreparing(false);
    }
  };

  const handleRegenerateMessage = async () => {
    if (!prepareData) return;
    setGeneratingMsg(true);
    try {
      const { data } = await aiAPI.generateCommitMessage(
        prepareData.diff || '',
        prepareData.repo_name,
        taskDescription
      );
      setCommitMessage(data.message);
    } catch (err: any) {
      toast.error('Failed to generate commit message');
    } finally {
      setGeneratingMsg(false);
    }
  };

  const handleCommitAndPush = async () => {
    if (!approved || !selectedRepo || !commitMessage.trim()) {
      toast.error('Please approve the action and provide a commit message');
      return;
    }

    setCommitting(true);
    try {
      let result;
      if (pushAfterCommit) {
        const { data } = await gitAPI.commitAndPush(selectedRepo, commitMessage);
        result = data;
      } else {
        const { data } = await gitAPI.commit(selectedRepo, commitMessage);
        result = data;
      }
      setCommitResult(result);
      setStage('done');
      toast.success(`Successfully ${pushAfterCommit ? 'committed & pushed' : 'committed'} to ${prepareData?.branch}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Commit failed. Check repository access.');
    } finally {
      setCommitting(false);
    }
  };

  const reset = () => {
    setStage('select');
    setPrepareData(null);
    setCommitMessage('');
    setTaskDescription('');
    setCommitResult(null);
    setApproved(false);
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Commit Assistant</h1>
        <p className="text-white/40 text-sm">AI-generated commit messages · Requires your approval before pushing</p>
      </div>

      {/* ⚠️ Approval Notice */}
      <div className="glass-card p-4 mb-6 border-yellow-500/20 flex items-start gap-3">
        <span className="text-yellow-400 text-lg">⚠</span>
        <div>
          <p className="text-yellow-400 text-sm font-medium">Approval Required</p>
          <p className="text-white/40 text-xs mt-0.5">
            Git AI will <strong className="text-white/60">never</strong> commit or push without your explicit approval. 
            You must check the confirmation box before any changes are made.
          </p>
        </div>
      </div>

      {/* Stage: Select */}
      {(stage === 'select' || stage === 'prepare') && (
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-5">Select Repository & Describe Task</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-white/50 text-xs mb-2 block">Repository</label>
              <select
                value={selectedRepo}
                onChange={e => setSelectedRepo(e.target.value)}
                className="input-glass"
              >
                <option value="">Choose repository...</option>
                {repos.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.repo_name} — Priority {r.priority_score}/100
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs mb-2 block">What did you work on? (optional — helps AI write better commit message)</label>
              <input
                type="text"
                value={taskDescription}
                onChange={e => setTaskDescription(e.target.value)}
                placeholder="e.g. Implemented memory search feature with timeline filtering..."
                className="input-glass"
              />
            </div>
            <button
              onClick={handlePrepare}
              disabled={preparing || !selectedRepo}
              className="btn-primary w-fit"
            >
              {preparing ? (
                <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Cloning & Preparing...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>Prepare & Review Changes</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stage: Review */}
      {stage === 'review' && prepareData && (
        <div className="flex flex-col gap-6">
          {/* Repo Info */}
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{prepareData.repo_name}</p>
              <p className="text-white/40 text-sm">Branch: <code className="text-white/60">{prepareData.branch}</code></p>
            </div>
            <button onClick={reset} className="btn-secondary text-sm">← Change Repo</button>
          </div>

          {/* No Changes */}
          {!prepareData.has_changes && (
            <div className="glass-card p-10 text-center">
              <p className="text-green-400 text-4xl mb-3">✓</p>
              <p className="text-white font-semibold mb-2">No uncommitted changes</p>
              <p className="text-white/40 text-sm">The repository is clean. Make some changes first, then return here to commit.</p>
            </div>
          )}

          {prepareData.has_changes && (
            <>
              {/* Changed Files */}
              <div className="glass-card p-5">
                <h3 className="text-white font-semibold text-sm mb-3">Changed Files</h3>
                <div className="flex flex-col gap-1">
                  {prepareData.status.modified.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <span className="text-yellow-400 w-3">M</span>
                      <code className="text-white/60">{f}</code>
                    </div>
                  ))}
                  {prepareData.status.untracked.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <span className="text-green-400 w-3">A</span>
                      <code className="text-white/60">{f}</code>
                    </div>
                  ))}
                  {prepareData.status.deleted.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <span className="text-red-400 w-3">D</span>
                      <code className="text-white/60">{f}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diff Preview */}
              {prepareData.diff && (
                <div className="glass-card p-5">
                  <h3 className="text-white font-semibold text-sm mb-3">Diff Preview</h3>
                  <pre className="text-xs font-mono overflow-auto max-h-64 text-white/50 leading-relaxed">
                    {prepareData.diff.slice(0, 3000)}
                    {prepareData.diff.length > 3000 && '\n... (truncated)'}
                  </pre>
                </div>
              )}

              {/* Commit Message */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">Commit Message</h3>
                  <button
                    onClick={handleRegenerateMessage}
                    disabled={generatingMsg}
                    className="btn-secondary text-xs py-1.5"
                  >
                    {generatingMsg ? 'Generating...' : '🤖 Regenerate with AI'}
                  </button>
                </div>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={e => setCommitMessage(e.target.value)}
                  placeholder="feat(scope): description"
                  className="input-glass font-mono"
                />
                <p className="text-white/25 text-xs mt-2">AI suggested: {prepareData.suggested_commit_message || 'N/A'}</p>
              </div>

              {/* Options */}
              <div className="glass-card p-5">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={pushAfterCommit}
                    onChange={e => setPushAfterCommit(e.target.checked)}
                    className="w-4 h-4 accent-white"
                  />
                  <span className="text-white/70 text-sm">Push to remote after commit</span>
                </label>

                {/* APPROVAL CHECKBOX */}
                <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approved}
                      onChange={e => setApproved(e.target.checked)}
                      className="w-4 h-4 accent-white mt-0.5"
                    />
                    <div>
                      <p className="text-yellow-400 text-sm font-medium">I approve this commit</p>
                      <p className="text-white/40 text-xs mt-1">
                        I confirm I want to commit "{commitMessage}" to {prepareData.repo_name}/{prepareData.branch}
                        {pushAfterCommit ? ' and push to GitHub.' : '.'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleCommitAndPush}
                  disabled={committing || !approved || !commitMessage.trim()}
                  className={`btn-primary flex-1 justify-center ${!approved ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {committing ? (
                    <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    {pushAfterCommit ? 'Committing & Pushing...' : 'Committing...'}</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    {pushAfterCommit ? 'Commit & Push to GitHub' : 'Commit Only'}</>
                  )}
                </button>
                <button onClick={reset} className="btn-secondary">Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stage: Done */}
      {stage === 'done' && commitResult && (
        <div className="glass-card p-10 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-white text-xl font-bold mb-2">
            {commitResult.pushed ? 'Committed & Pushed!' : 'Committed Successfully!'}
          </h2>
          <div className="glass p-4 rounded-lg inline-block mt-4 mb-6 text-left">
            <p className="text-white/40 text-xs mb-1">Commit</p>
            <code className="text-white font-mono text-sm">{commitResult.commit}</code>
            <p className="text-white/40 text-xs mt-2 mb-1">Message</p>
            <p className="text-white/70 text-sm">{commitResult.message}</p>
            {commitResult.branch && (
              <>
                <p className="text-white/40 text-xs mt-2 mb-1">Branch</p>
                <code className="text-white/70 text-sm">{commitResult.branch}</code>
              </>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-primary">Make Another Commit</button>
          </div>
        </div>
      )}
    </div>
  );
}
