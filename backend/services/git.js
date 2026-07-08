const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class GitService {
  async getRepoPath(cloneUrl, repoName, githubToken) {
    const tmpDir = path.join(os.tmpdir(), 'gitai_repos', repoName);
    const authUrl = cloneUrl.replace('https://', `https://oauth2:${githubToken}@`);

    try {
      await fs.access(tmpDir);
      // Repo exists, pull latest
      const git = simpleGit(tmpDir);
      await git.pull();
      return tmpDir;
    } catch {
      // Clone repo
      await fs.mkdir(tmpDir, { recursive: true });
      const git = simpleGit();
      await git.clone(authUrl, tmpDir, ['--depth', '50']);
      return tmpDir;
    }
  }

  async getStatus(repoPath) {
    const git = simpleGit(repoPath);
    const status = await git.status();
    const diff = await git.diff(['--stat']).catch(() => '');
    return {
      branch: status.current,
      ahead: status.ahead,
      behind: status.behind,
      staged: status.staged,
      modified: status.modified,
      untracked: status.not_added,
      deleted: status.deleted,
      diff_summary: diff,
      has_changes: status.modified.length > 0 || status.not_added.length > 0 || status.deleted.length > 0
    };
  }

  async getDiff(repoPath) {
    const git = simpleGit(repoPath);
    const diff = await git.diff().catch(() => '');
    const diffStaged = await git.diff(['--cached']).catch(() => '');
    return diff + diffStaged;
  }

  async stageAll(repoPath) {
    const git = simpleGit(repoPath);
    await git.add('.');
    return await git.status();
  }

  async commit(repoPath, message, authorName, authorEmail) {
    const git = simpleGit(repoPath);

    // Configure author
    await git.addConfig('user.name', authorName);
    await git.addConfig('user.email', authorEmail);

    const result = await git.commit(message);
    return {
      commit: result.commit,
      summary: result.summary,
      message
    };
  }

  async push(repoPath, branch = 'main') {
    const git = simpleGit(repoPath);
    const result = await git.push('origin', branch);
    return { pushed: true, branch, result };
  }

  async getLog(repoPath, limit = 10) {
    const git = simpleGit(repoPath);
    const log = await git.log({ maxCount: limit });
    return log.all.map(c => ({
      hash: c.hash.substring(0, 7),
      message: c.message,
      author: c.author_name,
      date: c.date
    }));
  }

  async createBranch(repoPath, branchName) {
    const git = simpleGit(repoPath);
    await git.checkoutLocalBranch(branchName);
    return { branch: branchName };
  }

  async cleanup(repoName) {
    const tmpDir = path.join(os.tmpdir(), 'gitai_repos', repoName);
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('[Git] Cleanup warning:', e.message);
    }
  }
}

module.exports = new GitService();
