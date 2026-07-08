const supabase = require('./supabase');

// Priority calculation algorithm (used when ML model is unavailable)
function calculatePriorityScore(metrics) {
  let score = 0;

  // Days idle (max 30 points) - more idle = higher priority
  const idleScore = Math.min(30, (metrics.days_since_last_commit / 30) * 30);
  score += idleScore;

  // Open issues (max 20 points)
  const issueScore = Math.min(20, metrics.open_issues * 2);
  score += issueScore;

  // Low documentation (max 15 points)
  const docScore = Math.max(0, 15 - (metrics.documentation_score / 100) * 15);
  score += docScore;

  // No tests (max 15 points)
  const testScore = metrics.test_files === 0 ? 15 : Math.max(0, 10 - metrics.test_files);
  score += testScore;

  // Stars/popularity (max 10 points)
  const starScore = Math.min(10, (metrics.stars / 10) * 10);
  score += starScore;

  // Recent activity boost (max 10 points)
  const activityScore = Math.min(10, (metrics.recent_commits_30d / 5) * 10);
  score += activityScore;

  return Math.round(Math.min(100, score));
}

class RepositoryService {
  async getUserRepos(userId) {
    const { data, error } = await supabase
      .from('repositories')
      .select('*, repository_metrics(*)')
      .eq('user_id', userId)
      .order('priority_score', { ascending: false });

    if (error) throw error;
    return data;
  }

  async upsertRepository(userId, metrics, priorityScore) {
    const repoData = {
      user_id: userId,
      repo_name: metrics.repository_name,
      description: metrics.description,
      language: metrics.language,
      html_url: metrics.html_url,
      clone_url: metrics.clone_url,
      stars: metrics.stars,
      forks: metrics.forks,
      is_private: metrics.is_private,
      default_branch: metrics.default_branch,
      topics: metrics.topics,
      priority_score: priorityScore,
      last_scanned_at: new Date().toISOString()
    };

    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .upsert(repoData, { onConflict: 'user_id,repo_name' })
      .select()
      .single();

    if (repoError) throw repoError;

    // Upsert metrics
    const metricsData = {
      repo_id: repo.id,
      days_since_last_commit: metrics.days_since_last_commit,
      total_commits: metrics.total_commits,
      recent_commits_30d: metrics.recent_commits_30d,
      num_files: metrics.num_files,
      test_files: metrics.test_files,
      readme_length: metrics.readme_length,
      documentation_score: metrics.documentation_score,
      open_issues: metrics.open_issues,
      repo_size_kb: metrics.repo_size_kb,
      last_commit_date: metrics.last_commit_date,
      scanned_at: new Date().toISOString()
    };

    await supabase.from('repository_metrics').upsert(metricsData, { onConflict: 'repo_id' });

    return { ...repo, metrics: metricsData };
  }

  async getTopPriorityRepo(userId) {
    const { data, error } = await supabase
      .from('repositories')
      .select('*, repository_metrics(*)')
      .eq('user_id', userId)
      .order('priority_score', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  async updatePriority(repoId, score, importanceOverride = null) {
    const update = { priority_score: score };
    if (importanceOverride !== null) update.importance_score = importanceOverride;

    const { error } = await supabase
      .from('repositories')
      .update(update)
      .eq('id', repoId);

    if (error) throw error;
  }

  async getHealthStats(userId) {
    const { data: repos, error } = await supabase
      .from('repositories')
      .select('*, repository_metrics(*)')
      .eq('user_id', userId);

    if (error) throw error;
    if (!repos || repos.length === 0) return null;

    const totalRepos = repos.length;
    const activeRepos = repos.filter(r => r.repository_metrics?.[0]?.days_since_last_commit < 30).length;
    const avgDocScore = repos.reduce((a, r) => a + (r.repository_metrics?.[0]?.documentation_score || 0), 0) / totalRepos;
    const totalStars = repos.reduce((a, r) => a + (r.stars || 0), 0);
    const totalIssues = repos.reduce((a, r) => a + (r.repository_metrics?.[0]?.open_issues || 0), 0);
    const avgPriority = repos.reduce((a, r) => a + (r.priority_score || 0), 0) / totalRepos;

    const healthScore = Math.round(
      (activeRepos / totalRepos) * 30 +
      (avgDocScore / 100) * 25 +
      Math.max(0, 25 - (totalIssues / totalRepos) * 5) +
      25
    );

    return {
      health_score: Math.min(100, healthScore),
      total_repos: totalRepos,
      active_repos: activeRepos,
      avg_doc_score: Math.round(avgDocScore),
      total_stars: totalStars,
      total_issues: totalIssues,
      avg_priority: Math.round(avgPriority)
    };
  }
}

module.exports = { RepositoryService: new RepositoryService(), calculatePriorityScore };
