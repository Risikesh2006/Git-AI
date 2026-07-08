"""
Git AI - Repository Scanner
Scans GitHub repositories and generates github_data.csv
Uses PyGithub for GitHub API access.

Usage:
    python scanner.py --token YOUR_GITHUB_TOKEN --output dataset/github_data.csv
"""

import os
import csv
import json
import argparse
import requests
from datetime import datetime, timezone
from typing import Optional


class RepositoryScanner:
    def __init__(self, token: str):
        self.token = token
        self.headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        self.base_url = 'https://api.github.com'

    def _get(self, url: str, params: dict = None) -> dict:
        resp = requests.get(url, headers=self.headers, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def _paginate(self, url: str, params: dict = None) -> list:
        results = []
        page = 1
        while True:
            p = dict(params or {})
            p['per_page'] = 100
            p['page'] = page
            data = self._get(url, p)
            if not data:
                break
            results.extend(data if isinstance(data, list) else [data])
            if len(data) < 100:
                break
            page += 1
        return results

    def get_user(self) -> dict:
        return self._get(f'{self.base_url}/user')

    def get_repositories(self, username: str) -> list:
        return self._paginate(
            f'{self.base_url}/users/{username}/repos',
            {'type': 'owner', 'sort': 'updated'}
        )

    def get_commits(self, owner: str, repo: str, days: int = 30) -> tuple[int, int]:
        """Returns (total_commits, recent_commits_30d)"""
        try:
            # Recent commits
            since = datetime.now(timezone.utc)
            since = since.replace(day=since.day - min(days, since.day - 1))
            since_str = since.strftime('%Y-%m-%dT%H:%M:%SZ')

            recent = self._paginate(
                f'{self.base_url}/repos/{owner}/{repo}/commits',
                {'since': since_str}
            )

            # Total commits (use contributor stats)
            try:
                stats = self._get(f'{self.base_url}/repos/{owner}/{repo}/contributors', {'per_page': 100})
                total = sum(c.get('contributions', 0) for c in stats) if isinstance(stats, list) else len(recent)
            except:
                total = len(recent)

            return total, len(recent)
        except:
            return 0, 0

    def get_file_count(self, owner: str, repo: str, branch: str = 'main') -> tuple[int, int]:
        """Returns (total_files, test_files)"""
        try:
            # Try to get tree
            for b in [branch, 'master', 'main']:
                try:
                    tree = self._get(
                        f'{self.base_url}/repos/{owner}/{repo}/git/trees/{b}',
                        {'recursive': '1'}
                    )
                    files = [f for f in tree.get('tree', []) if f.get('type') == 'blob']
                    total = len(files)
                    test_count = sum(1 for f in files if any(
                        kw in f['path'].lower()
                        for kw in ['test', 'spec', '__tests__', '.test.', '.spec.']
                    ))
                    return total, test_count
                except:
                    continue
            return 0, 0
        except:
            return 0, 0

    def get_readme(self, owner: str, repo: str) -> int:
        """Returns README length in characters."""
        try:
            import base64
            data = self._get(f'{self.base_url}/repos/{owner}/{repo}/readme')
            content = base64.b64decode(data.get('content', '')).decode('utf-8', errors='ignore')
            return len(content)
        except:
            return 0

    def get_todo_count(self, owner: str, repo: str) -> int:
        """Search for TODO comments in repo."""
        try:
            data = self._get(
                f'{self.base_url}/search/code',
                {'q': f'TODO repo:{owner}/{repo}', 'per_page': 1}
            )
            return data.get('total_count', 0)
        except:
            return 0

    def calculate_doc_score(self, readme_len: int, test_files: int, total_files: int,
                            has_contributing: bool, has_changelog: bool, has_license: bool) -> int:
        score = 0
        score += min(50, int(readme_len / 50))
        score += 15 if has_contributing else 0
        score += 10 if has_changelog else 0
        score += 10 if has_license else 0
        score += 15 if test_files > 0 else 0
        return min(100, score)

    def scan_repository(self, owner: str, repo: dict) -> Optional[dict]:
        """Scan a single repository and return metrics."""
        repo_name = repo['name']
        print(f"  Scanning: {owner}/{repo_name}...")

        now = datetime.now(timezone.utc)
        created_date = datetime.fromisoformat(repo.get('created_at', '').replace('Z', '+00:00'))
        project_age_days = max(1, (now - created_date).days)

        # Last commit
        last_commit_str = repo.get('pushed_at', repo.get('updated_at', ''))
        if last_commit_str:
            last_commit = datetime.fromisoformat(last_commit_str.replace('Z', '+00:00'))
            days_since = (now - last_commit).days
        else:
            last_commit = now
            days_since = 0

        total_commits, recent_commits = self.get_commits(owner, repo_name)
        total_files, test_files = self.get_file_count(owner, repo_name, repo.get('default_branch', 'main'))
        readme_len = self.get_readme(owner, repo_name)
        todo_count = self.get_todo_count(owner, repo_name)

        # Check special files
        try:
            contents = self._get(f'{self.base_url}/repos/{owner}/{repo_name}/contents/')
            file_names = [f['name'].lower() for f in (contents if isinstance(contents, list) else [])]
            has_contributing = any('contributing' in n for n in file_names)
            has_changelog = any('changelog' in n for n in file_names)
            has_license = any('license' in n for n in file_names)
        except:
            has_contributing = has_changelog = has_license = False

        doc_score = self.calculate_doc_score(
            readme_len, test_files, total_files,
            has_contributing, has_changelog, has_license
        )

        return {
            'repository_name': repo_name,
            'description': repo.get('description', ''),
            'language': repo.get('language', 'Unknown'),
            'created_date': repo.get('created_at', ''),
            'project_age_days': project_age_days,
            'last_commit_date': last_commit.isoformat(),
            'days_since_last_commit': days_since,
            'total_commits': total_commits,
            'recent_commits_30d': recent_commits,
            'num_files': total_files,
            'test_files': test_files,
            'readme_length': readme_len,
            'documentation_score': doc_score,
            'stars': repo.get('stargazers_count', 0),
            'forks': repo.get('forks_count', 0),
            'open_issues': repo.get('open_issues_count', 0),
            'repo_size_kb': repo.get('size', 0),
            'todo_count': todo_count,
            'is_private': repo.get('private', False),
            'default_branch': repo.get('default_branch', 'main'),
            'topics': ','.join(repo.get('topics', [])),
            'html_url': repo.get('html_url', '')
        }

    def scan_all(self, output_path: str):
        """Scan all user repositories and save to CSV."""
        user = self.get_user()
        username = user['login']
        print(f"\n🔍 Scanning repositories for: {username}")
        print(f"   Public repos: {user.get('public_repos', 0)}")

        repos = self.get_repositories(username)
        print(f"   Found {len(repos)} repositories\n")

        results = []
        for repo in repos:
            try:
                metrics = self.scan_repository(username, repo)
                if metrics:
                    results.append(metrics)
                    print(f"   ✅ {repo['name']} - Priority estimate: {self._estimate_priority(metrics)}")
            except Exception as e:
                print(f"   ❌ {repo['name']}: {e}")

        if not results:
            print("❌ No repositories scanned successfully.")
            return

        # Write CSV
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=results[0].keys())
            writer.writeheader()
            writer.writerows(results)

        print(f"\n✅ Saved {len(results)} repositories to: {output_path}")

    def _estimate_priority(self, metrics: dict) -> int:
        score = 0
        score += min(30, (metrics['days_since_last_commit'] / 30) * 30)
        score += min(20, metrics['open_issues'] * 2)
        score += max(0, 15 - (metrics['documentation_score'] / 100) * 15)
        score += 15 if metrics['test_files'] == 0 else 0
        score += min(10, metrics['stars'])
        score += min(10, metrics['recent_commits_30d'] * 2)
        return int(min(100, score))


def main():
    parser = argparse.ArgumentParser(description='Git AI Repository Scanner')
    parser.add_argument('--token', required=True, help='GitHub Personal Access Token')
    parser.add_argument('--output', default='dataset/github_data.csv', help='Output CSV path')
    args = parser.parse_args()

    scanner = RepositoryScanner(args.token)
    scanner.scan_all(args.output)


if __name__ == '__main__':
    main()
