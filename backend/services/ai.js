const axios = require('axios');

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'local-model';

class AIService {
  async chat(systemPrompt, userMessage, temperature = 0.7) {
    try {
      const response = await axios.post(`${LM_STUDIO_URL}/v1/chat/completions`, {
        model: LM_STUDIO_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature,
        max_tokens: 2048,
        stream: false
      }, {
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data.choices[0]?.message?.content || '';
    } catch (err) {
      console.error('[LM Studio] Error:', err.message);
      throw new Error(`LM Studio connection failed: ${err.message}`);
    }
  }

  async generateDevelopmentPlan(repoMetrics, priorityScore) {
    const systemPrompt = `You are an expert AI software engineering manager. 
You analyze GitHub repositories and create precise, actionable development plans.
Always respond in valid JSON format only.`;

    const userMessage = `Analyze this repository and create a development plan:

Repository: ${repoMetrics.repository_name}
Language: ${repoMetrics.language}
Priority Score: ${priorityScore}/100
Days Idle: ${repoMetrics.days_since_last_commit}
Open Issues: ${repoMetrics.open_issues}
Test Files: ${repoMetrics.test_files}
Documentation Score: ${repoMetrics.documentation_score}/100
Stars: ${repoMetrics.stars}
Recent Commits (30d): ${repoMetrics.recent_commits_30d}
Description: ${repoMetrics.description || 'No description'}

Respond with this exact JSON structure:
{
  "summary": "Brief 2-sentence project assessment",
  "tasks": [
    {
      "id": 1,
      "title": "Task title",
      "description": "What to implement",
      "estimated_hours": 2,
      "priority": "high|medium|low",
      "category": "feature|bug|testing|documentation|refactoring",
      "implementation_steps": ["Step 1", "Step 2", "Step 3"],
      "suggested_commit_message": "feat(scope): description"
    }
  ],
  "health_insights": ["Insight 1", "Insight 2"],
  "quick_wins": ["Quick win 1", "Quick win 2"]
}`;

    const raw = await this.chat(systemPrompt, userMessage);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('[AI] JSON parse error:', e.message);
    }
    return { summary: raw, tasks: [], health_insights: [], quick_wins: [] };
  }

  async generateCommitMessage(diff, repoName, taskDescription = '') {
    const systemPrompt = `You are an expert developer. Generate a precise conventional commit message.
Follow: type(scope): description format. Types: feat, fix, docs, style, refactor, test, chore.
Only return the commit message, nothing else.`;

    const userMessage = `Repository: ${repoName}
Task: ${taskDescription}
Changed files summary:
${diff.substring(0, 2000)}

Generate a single-line conventional commit message:`;

    const message = await this.chat(systemPrompt, userMessage, 0.3);
    return message.trim().replace(/^["']|["']$/g, '');
  }

  async generateTaskImplementation(task, repoMetrics) {
    const systemPrompt = `You are an expert software engineer. 
Generate detailed implementation guidance for development tasks.
Respond in valid JSON only.`;

    const userMessage = `Generate implementation details for this task:
Task: ${task.title}
Description: ${task.description}
Repository: ${repoMetrics.repository_name}
Language: ${repoMetrics.language}

Respond with:
{
  "detailed_steps": ["Detailed step 1", "..."],
  "code_snippets": [{"filename": "example.js", "code": "// code here", "description": "What this does"}],
  "testing_approach": "How to test this",
  "potential_issues": ["Issue to watch out for"],
  "commit_message": "feat(scope): description"
}`;

    const raw = await this.chat(systemPrompt, userMessage);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {}
    return { detailed_steps: [], code_snippets: [], testing_approach: '', potential_issues: [], commit_message: '' };
  }

  async generateHealthReport(repositories) {
    const systemPrompt = `You are a software engineering analytics expert.
Analyze multiple repositories and provide strategic insights.
Respond in valid JSON only.`;

    const repoSummary = repositories.slice(0, 10).map(r => ({
      name: r.repository_name,
      days_idle: r.days_since_last_commit,
      issues: r.open_issues,
      doc_score: r.documentation_score,
      stars: r.stars
    }));

    const userMessage = `Analyze these repositories and provide portfolio insights:
${JSON.stringify(repoSummary, null, 2)}

Respond with:
{
  "portfolio_health": 75,
  "top_recommendation": "Most urgent action",
  "portfolio_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommended_focus": "Project name",
  "weekly_goal": "What to achieve this week"
}`;

    const raw = await this.chat(systemPrompt, userMessage);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {}
    return { portfolio_health: 70, top_recommendation: raw, portfolio_insights: [], recommended_focus: '', weekly_goal: '' };
  }
}

module.exports = new AIService();
