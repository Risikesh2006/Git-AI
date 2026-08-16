const { calculatePriorityScore } = require('../services/repository');

describe('calculatePriorityScore (JS heuristic fallback)', () => {
  it('returns 0-100 for a healthy, active, well-documented repo', () => {
    const score = calculatePriorityScore({
      days_since_last_commit: 1,
      open_issues: 0,
      documentation_score: 100,
      test_files: 20,
      stars: 50,
      recent_commits_30d: 10
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeLessThan(30); // healthy repo should score low priority
  });

  it('scores a stale, undocumented, untested repo higher than a healthy one', () => {
    const stale = calculatePriorityScore({
      days_since_last_commit: 400,
      open_issues: 20,
      documentation_score: 0,
      test_files: 0,
      stars: 0,
      recent_commits_30d: 0
    });
    const healthy = calculatePriorityScore({
      days_since_last_commit: 1,
      open_issues: 0,
      documentation_score: 100,
      test_files: 20,
      stars: 50,
      recent_commits_30d: 10
    });
    expect(stale).toBeGreaterThan(healthy);
  });

  it('never exceeds 100 regardless of extreme inputs', () => {
    const score = calculatePriorityScore({
      days_since_last_commit: 100000,
      open_issues: 100000,
      documentation_score: 0,
      test_files: 0,
      stars: 0,
      recent_commits_30d: 0
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  it('handles missing fields without throwing', () => {
    expect(() => calculatePriorityScore({})).not.toThrow();
  });
});
