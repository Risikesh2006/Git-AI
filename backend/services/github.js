const { Octokit } = require('@octokit/rest');

class GitHubService {
  constructor(accessToken) {
    this.octokit = new Octokit({ auth: accessToken });
    this.accessToken = accessToken;
  }

  async getUser() {
    const { data } = await this.octokit.users.getAuthenticated();
    return data;
  }

  async getAllRepositories() {
    const repos = await this.octokit.paginate(this.octokit.repos.listForAuthenticatedUser, {
      per_page: 100,
      sort: 'updated',
      type: 'owner'
    });
    return repos;
  }

  async getRepositoryDetails(owner, repo) {
    const [repoData, commits, issues, contents, languages] = await Promise.allSettled([
      this.octokit.repos.get({ owner, repo }),
      this.octokit.repos.listCommits({ owner, repo, per_page: 100 }),
      this.octokit.issues.listForRepo({ owner, repo, state: 'open', per_page: 100 }),
      this.octokit.repos.getContent({ owner, repo, path: '' }).catch(() => ({ data: [] })),
      this.octokit.repos.listLanguages({ owner, repo })
    ]);

    return {
      repo: repoData.status === 'fulfilled' ? repoData.value.data : null,
      commits: commits.status === 'fulfilled' ? commits.value.data : [],
      issues: issues.status === 'fulfilled' ? issues.value.data : [],
      contents: contents.status === 'fulfilled' ? contents.value.data : [],
      languages: languages.status === 'fulfilled' ? languages.value.data : {}
    };
  }

  async getRecentCommits(owner, repo, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner, repo,
        since: since.toISOString(),
        per_page: 100
      });
      return data;
    } catch { return []; }
  }

  async getReadme(owner, repo) {
    try {
      const { data } = await this.octokit.repos.getReadme({ owner, repo });
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      return { content, length: content.length };
    } catch { return { content: '', length: 0 }; }
  }

  async searchTodos(owner, repo) {
    try {
      const { data } = await this.octokit.search.code({
        q: `TODO+repo:${owner}/${repo}`,
        per_page: 100
      });
      return data.total_count;
    } catch { return 0; }
  }

  async getTreeFiles(owner, repo) {
    try {
      const { data: refData } = await this.octokit.repos.get({ owner, repo });
      const branch = refData.default_branch;
      const { data } = await this.octokit.git.getTree({
        owner, repo,
        tree_sha: branch,
        recursive: '1'
      });
      return data.tree.filter(item => item.type === 'blob');
    } catch { return []; }
  }

  async scanRepository(owner, repoName) {
    console.log(`[Scanner] Scanning ${owner}/${repoName}...`);
    const now = new Date();

    const [details, readme, recentCommits, files] = await Promise.allSettled([
      this.getRepositoryDetails(owner, repoName),
      this.getReadme(owner, repoName),
      this.getRecentCommits(owner, repoName, 30),
      this.getTreeFiles(owner, repoName)
    ]);

    const repoDetails = details.status === 'fulfilled' ? details.value : {};
    const repoData = repoDetails.repo || {};
    const allCommits = repoDetails.commits || [];
    const openIssues = repoDetails.issues || [];
    const readmeData = readme.status === 'fulfilled' ? readme.value : { content: '', length: 0 };
    const recentCommitList = recentCommits.status === 'fulfilled' ? recentCommits.value : [];
    const fileList = files.status === 'fulfilled' ? files.value : [];

    // Calculate days since last commit
    const lastCommitDate = allCommits.length > 0
      ? new Date(allCommits[0]?.commit?.author?.date)
      : new Date(repoData.updated_at || now);
    const daysSinceLastCommit = Math.floor((now - lastCommitDate) / (1000 * 60 * 60 * 24));

    // Count test files
    const testFiles = fileList.filter(f =>
      f.path?.includes('test') || f.path?.includes('spec') || f.path?.includes('__tests__')
    ).length;

    // Count all files
    const numFiles = fileList.length;

    // Documentation score (0-100)
    const readmeLength = readmeData.length;
    const hasContributing = fileList.some(f => f.path?.toLowerCase().includes('contributing'));
    const hasChangelog = fileList.some(f => f.path?.toLowerCase().includes('changelog'));
    const hasLicense = fileList.some(f => f.path?.toLowerCase().includes('license'));
    const docScore = Math.min(100, Math.floor(
      (readmeLength / 50) +
      (hasContributing ? 15 : 0) +
      (hasChangelog ? 10 : 0) +
      (hasLicense ? 10 : 0) +
      (testFiles > 0 ? 20 : 0)
    ));

    // Project age in days
    const createdDate = new Date(repoData.created_at || now);
    const projectAgeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

    const metrics = {
      repository_name: repoData.name || repoName,
      description: repoData.description || '',
      language: repoData.language || 'Unknown',
      created_date: repoData.created_at,
      project_age_days: projectAgeDays,
      last_commit_date: lastCommitDate.toISOString(),
      days_since_last_commit: daysSinceLastCommit,
      total_commits: allCommits.length,
      recent_commits_30d: recentCommitList.length,
      num_files: numFiles,
      test_files: testFiles,
      readme_length: readmeLength,
      documentation_score: docScore,
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      open_issues: openIssues.length,
      repo_size_kb: repoData.size || 0,
      is_private: repoData.private || false,
      default_branch: repoData.default_branch || 'main',
      topics: repoData.topics || [],
      html_url: repoData.html_url || '',
      clone_url: repoData.clone_url || '',
      languages: repoDetails.languages || {}
    };

    return metrics;
  }
}

module.exports = GitHubService;
