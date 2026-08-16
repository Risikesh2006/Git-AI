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

  if (loading) {
    return (
      <div className="dp-root">
        <div className="gc dp-skeleton" style={{ height: 120, borderRadius: 32, marginBottom: 20 }} />
        <div className="gc dp-skeleton" style={{ height: 320, borderRadius: 28 }} />
      </div>
    );
  }

  return (
    <div className="dp-root">
      <div className="dp-inner">
        <header className="dp-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span className="cm-stage-badge">Assistant Interface</span>
              <div className="dp-status">
                <span className="dp-status-dot dp-status-dot--on" />
                <span className="dp-status-text dp-status-text--on">System Operational</span>
              </div>
            </div>
            <h1 className="dp-title">Commit Assistant</h1>
            <p style={{ color: '#c4c7c8', maxWidth: 560, marginTop: 4 }}>AI-generated commit messages · Requires your approval before pushing</p>
          </div>
        </header>

        {/* Approval Notice */}
        <div className="gc cm-banner" style={{ marginBottom: 20 }}>
          <div className="cm-banner-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>verified_user</span>
          </div>
          <div>
            <h3 className="font-mono-label" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', marginBottom: 4 }}>Approval Required</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
              Git AI will never commit or push without your explicit approval. You can review and edit every message before finalizing changes to the remote repository.
            </p>
          </div>
        </div>

        {/* Stage: Select */}
        {(stage === 'select' || stage === 'prepare') && (
          <div className="gc cm-panel">
            <h2 className="pf-card-title">Select Repository &amp; Describe Task</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="pl-field-label">Repository</label>
                <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} className="input-neu">
                  <option value="">Choose repository...</option>
                  {repos.map(r => (
                    <option key={r.id} value={r.id}>{r.repo_name} — Priority {r.priority_score}/100</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="pl-field-label">Contribution Details (optional — helps AI write a better commit message)</label>
                <textarea
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  placeholder="What did you work on? e.g. Implemented memory search feature with timeline filtering..."
                  className="input-neu"
                  style={{ minHeight: 120 }}
                />
              </div>
              <button onClick={handlePrepare} disabled={preparing || !selectedRepo} className="dp-scan-btn" style={{ width: 'fit-content' }}>
                {preparing ? (
                  <><div className="dp-spinner" />Cloning &amp; Preparing...</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>Prepare &amp; Review Changes</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Stage: Review */}
        {stage === 'review' && prepareData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="gc" style={{ borderRadius: 20, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#fff', fontWeight: 700 }}>{prepareData.repo_name}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Branch: <code style={{ color: 'rgba(255,255,255,0.6)' }}>{prepareData.branch}</code></p>
              </div>
              <button onClick={reset} className="btn-secondary" style={{ fontSize: 13 }}>← Change Repo</button>
            </div>

            {!prepareData.has_changes && (
              <div className="gc" style={{ borderRadius: 28, padding: 48, textAlign: 'center' }}>
                <p style={{ color: '#66ffaa', fontSize: 40, marginBottom: 12 }}>✓</p>
                <p style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>No uncommitted changes</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>The repository is clean. Make some changes first, then return here to commit.</p>
              </div>
            )}

            {prepareData.has_changes && (
              <>
                <div className="gc cm-panel">
                  <h3 className="pf-card-title" style={{ fontSize: 16 }}>Changed Files</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {prepareData.status.modified.map(f => (
                      <div key={f} className="cm-file-row"><span className="cm-file-tag" style={{ color: '#ffee44' }}>M</span><code style={{ color: 'rgba(255,255,255,0.6)' }}>{f}</code></div>
                    ))}
                    {prepareData.status.untracked.map(f => (
                      <div key={f} className="cm-file-row"><span className="cm-file-tag" style={{ color: '#66ffaa' }}>A</span><code style={{ color: 'rgba(255,255,255,0.6)' }}>{f}</code></div>
                    ))}
                    {prepareData.status.deleted.map(f => (
                      <div key={f} className="cm-file-row"><span className="cm-file-tag" style={{ color: '#ff6666' }}>D</span><code style={{ color: 'rgba(255,255,255,0.6)' }}>{f}</code></div>
                    ))}
                  </div>
                </div>

                {prepareData.diff && (
                  <div className="gc cm-panel">
                    <h3 className="pf-card-title" style={{ fontSize: 16 }}>Diff Preview</h3>
                    <pre className="cm-diff">
                      {prepareData.diff.slice(0, 3000)}
                      {prepareData.diff.length > 3000 && '\n... (truncated)'}
                    </pre>
                  </div>
                )}

                <div className="gc cm-panel">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h3 className="pf-card-title" style={{ fontSize: 16, marginBottom: 0 }}>Commit Message</h3>
                    <button onClick={handleRegenerateMessage} disabled={generatingMsg} className="btn-secondary" style={{ fontSize: 12 }}>
                      {generatingMsg ? 'Generating...' : '✨ Regenerate with AI'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={e => setCommitMessage(e.target.value)}
                    placeholder="feat(scope): description"
                    className="input-neu"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  />
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 10 }}>AI suggested: {prepareData.suggested_commit_message || 'N/A'}</p>
                </div>

                <div className="gc cm-panel">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 18 }}>
                    <input type="checkbox" checked={pushAfterCommit} onChange={e => setPushAfterCommit(e.target.checked)} className="w-4 h-4 accent-white" />
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Push to remote after commit</span>
                  </label>

                  <div className="cm-approve-box">
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} className="w-4 h-4 accent-white" style={{ marginTop: 2 }} />
                      <div>
                        <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>I approve this commit</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
                          I confirm I want to commit &quot;{commitMessage}&quot; to {prepareData.repo_name}/{prepareData.branch}
                          {pushAfterCommit ? ' and push to GitHub.' : '.'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handleCommitAndPush}
                    disabled={committing || !approved || !commitMessage.trim()}
                    className="dp-scan-btn"
                    style={{ flex: 1, justifyContent: 'center', opacity: !approved ? 0.5 : 1, cursor: !approved ? 'not-allowed' : 'pointer' }}
                  >
                    {committing ? (
                      <><div className="dp-spinner" />{pushAfterCommit ? 'Committing & Pushing...' : 'Committing...'}</>
                    ) : (
                      <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span>{pushAfterCommit ? 'Commit & Push to GitHub' : 'Commit Only'}</>
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
          <div className="gc" style={{ borderRadius: 28, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              {commitResult.pushed ? 'Committed & Pushed!' : 'Committed Successfully!'}
            </h2>
            <div className="gc" style={{ padding: 18, borderRadius: 16, display: 'inline-block', marginTop: 16, marginBottom: 24, textAlign: 'left' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Commit</p>
              <code style={{ color: '#fff', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }}>{commitResult.commit}</code>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 10, marginBottom: 4 }}>Message</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{commitResult.message}</p>
              {commitResult.branch && (
                <>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 10, marginBottom: 4 }}>Branch</p>
                  <code style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{commitResult.branch}</code>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={reset} className="dp-scan-btn">Make Another Commit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
