const GitHubCommitService = require('../services/githubCommit');

// Octokit v20 uses native fetch, which `nock`'s http-layer interception doesn't
// catch reliably across Node versions — mocking the octokit client's own methods
// is more robust and just as effective for testing our service logic.
function mockOctokit(overrides = {}) {
  return {
    repos: { get: jest.fn(), getContent: jest.fn(), listCommits: jest.fn() },
    git: {
      getRef: jest.fn(), createRef: jest.fn(), getCommit: jest.fn(),
      createBlob: jest.fn(), createTree: jest.fn(), createCommit: jest.fn(), updateRef: jest.fn()
    },
    pulls: { create: jest.fn() },
    ...overrides
  };
}

describe('GitHubCommitService (Octokit client mocked directly — no real network calls)', () => {
  let service;

  beforeEach(() => {
    service = new GitHubCommitService('fake-token');
    service.octokit = mockOctokit();
  });

  it('getFileContent decodes base64 content from the Contents API', async () => {
    service.octokit.repos.getContent.mockResolvedValue({
      data: { content: Buffer.from('console.log("hello");').toString('base64'), encoding: 'base64', sha: 'abc123' }
    });

    const result = await service.getFileContent('acme', 'widgets', 'src/index.js');
    expect(result.exists).toBe(true);
    expect(result.content).toBe('console.log("hello");');
    expect(result.sha).toBe('abc123');
  });

  it('getFileContent reports a non-existent file without throwing', async () => {
    const notFound = Object.assign(new Error('Not Found'), { status: 404 });
    service.octokit.repos.getContent.mockRejectedValue(notFound);

    const result = await service.getFileContent('acme', 'widgets', 'new-file.js');
    expect(result.exists).toBe(false);
    expect(result.content).toBe('');
  });

  it('getFileContent rethrows non-404 errors', async () => {
    const serverError = Object.assign(new Error('Server error'), { status: 500 });
    service.octokit.repos.getContent.mockRejectedValue(serverError);

    await expect(service.getFileContent('acme', 'widgets', 'x.js')).rejects.toThrow('Server error');
  });

  it('previewChanges produces a diff and flags has_changes correctly', async () => {
    service.octokit.repos.getContent.mockResolvedValue({
      data: { content: Buffer.from('old content').toString('base64'), encoding: 'base64', sha: 'sha1' }
    });

    const previews = await service.previewChanges('acme', 'widgets', [
      { path: 'README.md', newContent: 'new content' }
    ], 'main');

    expect(previews).toHaveLength(1);
    expect(previews[0].has_changes).toBe(true);
    expect(previews[0].diff).toContain('-old content');
    expect(previews[0].diff).toContain('+new content');
  });

  it('previewChanges flags has_changes: false when content is identical', async () => {
    service.octokit.repos.getContent.mockResolvedValue({
      data: { content: Buffer.from('same').toString('base64'), encoding: 'base64', sha: 'sha1' }
    });

    const previews = await service.previewChanges('acme', 'widgets', [
      { path: 'README.md', newContent: 'same' }
    ], 'main');

    expect(previews[0].has_changes).toBe(false);
  });

  it('commitFiles builds blobs -> tree -> commit -> ref update as one atomic sequence', async () => {
    service.octokit.git.getRef.mockResolvedValue({ data: { object: { sha: 'parent-commit-sha' } } });
    service.octokit.git.getCommit.mockResolvedValue({ data: { tree: { sha: 'base-tree-sha' } } });
    service.octokit.git.createBlob.mockResolvedValue({ data: { sha: 'new-blob-sha' } });
    service.octokit.git.createTree.mockResolvedValue({ data: { sha: 'new-tree-sha' } });
    service.octokit.git.createCommit.mockResolvedValue({ data: { sha: 'new-commit-sha' } });
    service.octokit.git.updateRef.mockResolvedValue({ data: { object: { sha: 'new-commit-sha' } } });

    const result = await service.commitFiles(
      'acme', 'widgets', 'gitai-branch',
      [{ path: 'README.md', newContent: 'updated' }],
      'docs: update README',
      { name: 'Test User', email: 'test@example.com' }
    );

    expect(result.commit_sha).toBe('new-commit-sha');
    expect(result.branch).toBe('gitai-branch');
    // Tree must be built on top of the fetched parent commit's tree, and the new
    // commit must parent off the branch's current tip — that's what makes this atomic.
    expect(service.octokit.git.createTree).toHaveBeenCalledWith(
      expect.objectContaining({ base_tree: 'base-tree-sha' })
    );
    expect(service.octokit.git.createCommit).toHaveBeenCalledWith(
      expect.objectContaining({ tree: 'new-tree-sha', parents: ['parent-commit-sha'] })
    );
    expect(service.octokit.git.updateRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: 'heads/gitai-branch', sha: 'new-commit-sha' })
    );
  });

  it('createBranch tolerates the branch already existing (422)', async () => {
    service.octokit.git.getRef.mockResolvedValue({ data: { object: { sha: 'base-sha' } } });
    const alreadyExists = Object.assign(new Error('Reference already exists'), { status: 422 });
    service.octokit.git.createRef.mockRejectedValue(alreadyExists);

    await expect(service.createBranch('acme', 'widgets', 'existing-branch', 'main')).resolves.toBe('existing-branch');
  });

  it('openPullRequest returns the created PR number and URL', async () => {
    service.octokit.repos.get.mockResolvedValue({ data: { default_branch: 'main' } });
    service.octokit.pulls.create.mockResolvedValue({
      data: { number: 42, html_url: 'https://github.com/acme/widgets/pull/42', state: 'open' }
    });

    const pr = await service.openPullRequest('acme', 'widgets', 'gitai-branch', null, 'My change', 'Body');
    expect(pr).toEqual({ number: 42, url: 'https://github.com/acme/widgets/pull/42', state: 'open' });
  });
});
