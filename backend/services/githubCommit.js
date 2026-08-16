const { Octokit } = require('@octokit/rest');
const { createTwoFilesPatch } = require('diff');

// Commits changes straight through the GitHub API (Contents + Git Data API) —
// no local clone, no server disk, so the backend stays stateless across instances.
class GitHubCommitService {
  constructor(accessToken) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  async getDefaultBranch(owner, repo) {
    const { data } = await this.octokit.repos.get({ owner, repo });
    return data.default_branch;
  }

  async getFileContent(owner, repo, path, ref) {
    try {
      const { data } = await this.octokit.repos.getContent({ owner, repo, path, ref });
      if (Array.isArray(data)) throw new Error(`${path} is a directory, not a file`);
      const content = data.encoding === 'base64'
        ? Buffer.from(data.content, 'base64').toString('utf8')
        : data.content;
      return { content, sha: data.sha, exists: true };
    } catch (err) {
      if (err.status === 404) return { content: '', sha: null, exists: false };
      throw err;
    }
  }

  // Builds an in-memory unified diff per file against the current GitHub content —
  // no git binary, no working tree required.
  async previewChanges(owner, repo, files, ref) {
    const results = [];
    for (const file of files) {
      const current = await this.getFileContent(owner, repo, file.path, ref);
      const patch = createTwoFilesPatch(
        file.path, file.path,
        current.content, file.newContent,
        current.exists ? 'current' : '(new file)', 'proposed'
      );
      results.push({
        path: file.path,
        exists: current.exists,
        diff: patch,
        has_changes: current.content !== file.newContent
      });
    }
    return results;
  }

  async createBranch(owner, repo, branchName, fromBranch) {
    const baseBranch = fromBranch || (await this.getDefaultBranch(owner, repo));
    const { data: ref } = await this.octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
    try {
      await this.octokit.git.createRef({
        owner, repo,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha
      });
    } catch (err) {
      if (err.status !== 422) throw err; // 422 = branch already exists, fine to reuse
    }
    return branchName;
  }

  // Commits one or more files atomically via the Git Data API
  // (blobs -> tree -> commit -> ref update) so multi-file changes land as a single commit.
  async commitFiles(owner, repo, branch, files, message, author) {
    const { data: refData } = await this.octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    const latestCommitSha = refData.object.sha;
    const { data: latestCommit } = await this.octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha });

    const blobs = await Promise.all(files.map(async (file) => {
      const { data: blob } = await this.octokit.git.createBlob({
        owner, repo,
        content: Buffer.from(file.newContent, 'utf8').toString('base64'),
        encoding: 'base64'
      });
      return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
    }));

    const { data: newTree } = await this.octokit.git.createTree({
      owner, repo,
      base_tree: latestCommit.tree.sha,
      tree: blobs
    });

    const commitParams = { owner, repo, message, tree: newTree.sha, parents: [latestCommitSha] };
    if (author?.name && author?.email) commitParams.author = { name: author.name, email: author.email };

    const { data: newCommit } = await this.octokit.git.createCommit(commitParams);

    await this.octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: newCommit.sha });

    return { commit_sha: newCommit.sha, branch, message };
  }

  async openPullRequest(owner, repo, head, base, title, body) {
    const baseBranch = base || (await this.getDefaultBranch(owner, repo));
    const { data: pr } = await this.octokit.pulls.create({
      owner, repo, head, base: baseBranch, title, body: body || ''
    });
    return { number: pr.number, url: pr.html_url, state: pr.state };
  }

  async getRepoStatus(owner, repo, branch) {
    const defaultBranch = branch || (await this.getDefaultBranch(owner, repo));
    const { data: commits } = await this.octokit.repos.listCommits({ owner, repo, sha: defaultBranch, per_page: 5 });
    return {
      branch: defaultBranch,
      recent_commits: commits.map(c => ({
        hash: c.sha.substring(0, 7),
        message: c.commit.message,
        author: c.commit.author?.name,
        date: c.commit.author?.date
      }))
    };
  }
}

module.exports = GitHubCommitService;
