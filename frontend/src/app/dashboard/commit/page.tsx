'use client';

import { useState, useEffect } from 'react';
import { repoAPI, gitAPI, aiAPI } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';

type Stage = 'select' | 'review' | 'confirm' | 'done';

interface Repo {
  id: string;
  repo_name: string;
  language: string;
  priority_score: number;
  default_branch?: string;
}

interface FileEdit {
  path: string;
  newContent: string;
}

interface FilePreview {
  path: string;
  exists: boolean;
  diff: string;
  has_changes: boolean;
}

interface PrepareData {
  repo_name: string;
  branch: string;
  files: FilePreview[];
  suggested_commit_message: string;
  has_changes: boolean;
}

interface CommitResult {
  commit: string;
  branch: string;
  is_feature_branch?: boolean;
  pr?: { number: number; url: string; state: string };
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return message || fallback;
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
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [openPr, setOpenPr] = useState(true);
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [approved, setApproved] = useState(false);
  const [fileEdits, setFileEdits] = useState<FileEdit[]>([{ path: '', newContent: '' }]);

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

  const updateFileEdit = (i: number, patch: Partial<FileEdit>) => {
    setFileEdits(prev => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  };
  const addFileEdit = () => setFileEdits(prev => [...prev, { path: '', newContent: '' }]);
  const removeFileEdit = (i: number) => setFileEdits(prev => prev.filter((_, idx) => idx !== i));

  const handlePrepare = async () => {
    if (!selectedRepo) return;
    const files = fileEdits.filter(f => f.path.trim());
    if (files.length === 0) {
      toast.error('Add at least one file path and its new content');
      return;
    }
    setPreparing(true);
    try {
      const { data } = await gitAPI.prepare(selectedRepo, taskDescription, files);
      setPrepareData(data);
      setCommitMessage(data.suggested_commit_message || '');
      setStage('review');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to preview changes against GitHub.'));
    } finally {
      setPreparing(false);
    }
  };

  const handleRegenerateMessage = async () => {
    if (!prepareData) return;
    setGeneratingMsg(true);
    try {
      const combinedDiff = prepareData.files.map(f => f.diff).join('\n');
      const { data } = await aiAPI.generateCommitMessage(combinedDiff, prepareData.repo_name, taskDescription);
      setCommitMessage(data.message);
    } catch {
      toast.error('Failed to generate commit message');
    } finally {
      setGeneratingMsg(false);
    }
  };

  const handleCommit = async () => {
    if (!approved || !selectedRepo || !commitMessage.trim()) {
      toast.error('Please approve the action and provide a commit message');
      return;
    }
    setCommitting(true);
    try {
      const files = fileEdits.filter(f => f.path.trim());
      const { data: commitData }: { data: CommitResult } = await gitAPI.commit(selectedRepo, commitMessage, files);

      let result: CommitResult = commitData;
      if (openPr && commitData.is_feature_branch) {
        const { data: prData } = await gitAPI.openPullRequest(
          selectedRepo,
          commitData.branch,
          commitMessage,
          taskDescription
        );
        result = { ...commitData, pr: prData };
      }

      setCommitResult(result);
      setStage('done');
      toast.success(`Committed to ${commitData.branch}${result.pr ? ' and opened a PR' : ''}!`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Commit failed. Check repository access.'));
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
    setFileEdits([{ path: '', newContent: '' }]);
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
            <p style={{ color: '#c4c7c8', maxWidth: 560, marginTop: 4 }}>
              Changes are written straight to GitHub via the API — no local clone. AI-generated commit
              messages. Requires your approval before anything reaches your repository.
            </p>
          </div>
        </header>

        <div className="gc cm-banner" style={{ marginBottom: 20 }}>
          <div className="cm-banner-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>verified_user</span>
          </div>
          <div>
            <h3 className="font-mono-label" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', marginBottom: 4 }}>Approval Required</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
              Git AI will never commit without your explicit approval. Changes land on a feature branch by
              default — review the diff, then choose whether to open a pull request.
            </p>
          </div>
        </div>

        {stage === 'select' && (
          <div className="gc cm-panel">
            <h2 className="pf-card-title">Select Repository &amp; Propose Changes</h2>
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
                <label className="pl-field-label">Task Description (optional — helps AI write a better commit message)</label>
                <textarea
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  placeholder="What are you changing? e.g. Fix the null check in the auth middleware..."
                  className="input-neu"
                  style={{ minHeight: 80 }}
                />
              </div>

              <div>
                <label className="pl-field-label">Files to change</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {fileEdits.map((f, i) => (
                    <div key={i} className="gc" style={{ padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={f.path}
                          onChange={e => updateFileEdit(i, { path: e.target.value })}
                          placeholder="path/to/file.ts"
                          className="input-neu"
                          style={{ fontFamily: 'JetBrains Mono, monospace', flex: 1 }}
                        />
                        {fileEdits.length > 1 && (
                          <button onClick={() => removeFileEdit(i)} className="btn-secondary" style={{ fontSize: 12 }}>Remove</button>
                        )}
                      </div>
                      <textarea
                        value={f.newContent}
                        onChange={e => updateFileEdit(i, { newContent: e.target.value })}
                        placeholder="Full new content of the file"
                        className="input-neu"
                        style={{ minHeight: 140, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
                      />
                    </div>
                  ))}
                  <button onClick={addFileEdit} className="btn-secondary" style={{ width: 'fit-content', fontSize: 12 }}>+ Add another file</button>
                </div>
              </div>

              <button onClick={handlePrepare} disabled={preparing || !selectedRepo} className="dp-scan-btn" style={{ width: 'fit-content' }}>
                {preparing ? (
                  <><div className="dp-spinner" />Fetching current file state...</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>Preview Diff</>
                )}
              </button>
            </div>
          </div>
        )}

        {stage === 'review' && prepareData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="gc" style={{ borderRadius: 20, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#fff', fontWeight: 700 }}>{prepareData.repo_name}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Base branch: <code style={{ color: 'rgba(255,255,255,0.6)' }}>{prepareData.branch}</code></p>
              </div>
              <button onClick={reset} className="btn-secondary" style={{ fontSize: 13 }}>← Start Over</button>
            </div>

            {!prepareData.has_changes && (
              <div className="gc" style={{ borderRadius: 28, padding: 48, textAlign: 'center' }}>
                <p style={{ color: '#66ffaa', fontSize: 40, marginBottom: 12 }}>✓</p>
                <p style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>No changes detected</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>The proposed content matches what&apos;s already on GitHub.</p>
              </div>
            )}

            {prepareData.has_changes && (
              <>
                {prepareData.files.map(f => (
                  <div key={f.path} className="gc cm-panel">
                    <h3 className="pf-card-title" style={{ fontSize: 16 }}>
                      <span className="cm-file-tag" style={{ color: f.exists ? '#ffee44' : '#66ffaa' }}>{f.exists ? 'M' : 'A'}</span>{' '}
                      <code>{f.path}</code>
                    </h3>
                    <pre className="cm-diff">
                      {f.diff.slice(0, 3000)}
                      {f.diff.length > 3000 && '\n... (truncated)'}
                    </pre>
                  </div>
                ))}

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
                    <input type="checkbox" checked={openPr} onChange={e => setOpenPr(e.target.checked)} className="w-4 h-4 accent-white" />
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Open a pull request from the new branch (recommended)</span>
                  </label>

                  <div className="cm-approve-box">
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} className="w-4 h-4 accent-white" style={{ marginTop: 2 }} />
                      <div>
                        <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>I approve this commit</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
                          I confirm I want to commit &quot;{commitMessage}&quot; to a new branch on {prepareData.repo_name}
                          {openPr ? ' and open a pull request.' : '.'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handleCommit}
                    disabled={committing || !approved || !commitMessage.trim()}
                    className="dp-scan-btn"
                    style={{ flex: 1, justifyContent: 'center', opacity: !approved ? 0.5 : 1, cursor: !approved ? 'not-allowed' : 'pointer' }}
                  >
                    {committing ? (
                      <><div className="dp-spinner" />{openPr ? 'Committing & Opening PR...' : 'Committing...'}</>
                    ) : (
                      <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span>{openPr ? 'Commit & Open PR' : 'Commit to Branch'}</>
                    )}
                  </button>
                  <button onClick={reset} className="btn-secondary">Cancel</button>
                </div>
              </>
            )}
          </div>
        )}

        {stage === 'done' && commitResult && (
          <div className="gc" style={{ borderRadius: 28, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              {commitResult.pr ? 'Committed & PR Opened!' : 'Committed Successfully!'}
            </h2>
            <div className="gc" style={{ padding: 18, borderRadius: 16, display: 'inline-block', marginTop: 16, marginBottom: 24, textAlign: 'left' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Commit</p>
              <code style={{ color: '#fff', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }}>{commitResult.commit}</code>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 10, marginBottom: 4 }}>Branch</p>
              <code style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{commitResult.branch}</code>
              {commitResult.pr && (
                <>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 10, marginBottom: 4 }}>Pull Request</p>
                  <a href={commitResult.pr.url} target="_blank" rel="noreferrer" style={{ color: '#66ffaa', fontSize: 14 }}>#{commitResult.pr.number} →</a>
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
