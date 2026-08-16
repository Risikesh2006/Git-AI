const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('./supabase');

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'local-model';
const CLOUD_LLM_MODEL = process.env.CLOUD_LLM_MODEL || 'claude-sonnet-5';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// Rough Claude Sonnet 5 pricing for the usage_events cost estimate (introductory
// rate through 2026-08-31; update if it changes). Not billing-accurate — a signal
// for per-user spend caps, not an invoice. Gemini's free tier is $0 up to its
// rate limits, so its estimated cost is always 0 — the usage_events row still
// records token counts, useful for watching free-tier headroom.
const CLOUD_INPUT_COST_PER_TOKEN = 2.0 / 1_000_000;
const CLOUD_OUTPUT_COST_PER_TOKEN = 10.0 / 1_000_000;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

// Prefer the free Gemini tier when both keys are set — CLOUD_LLM_PROVIDER
// forces a choice ('gemini' | 'anthropic') if you want the paid model instead.
function resolveCloudProvider() {
  const forced = process.env.CLOUD_LLM_PROVIDER;
  if (forced === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (forced === 'anthropic' && anthropic) return 'anthropic';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (anthropic) return 'anthropic';
  return null;
}

class AIService {
  // Local-first: probes LM Studio quickly and uses it when reachable, so the
  // "your code never leaves your machine" pitch holds by default. Falls back to
  // the cloud model only when LM Studio is unset, unreachable, or errors out —
  // which also means the planner keeps working for users whose machine is offline.
  async chat(systemPrompt, userMessage, temperature = 0.7, userId = null) {
    const lmReachable = await this._probeLMStudio();

    if (lmReachable) {
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

        await this._logUsage(userId, 'lm_studio', LM_STUDIO_MODEL, 0, 0, 0);
        return response.data.choices[0]?.message?.content || '';
      } catch (err) {
        console.warn('[LM Studio] Request failed after health check, falling back to cloud:', err.message);
      }
    }

    const provider = resolveCloudProvider();
    if (!provider) {
      throw new Error('LM Studio unreachable and no cloud LLM configured. Start LM Studio, or set GEMINI_API_KEY / ANTHROPIC_API_KEY.');
    }
    return provider === 'gemini'
      ? this._chatGemini(systemPrompt, userMessage, temperature, userId)
      : this._chatAnthropic(systemPrompt, userMessage, userId);
  }

  async _probeLMStudio() {
    try {
      await axios.get(`${LM_STUDIO_URL}/v1/models`, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  // Gemini exposes an OpenAI-compatible endpoint, so this reuses the same
  // request/response shape as the LM Studio call above rather than a separate SDK.
  async _chatGemini(systemPrompt, userMessage, temperature, userId) {
    try {
      const response = await axios.post(GEMINI_URL, {
        model: GEMINI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature,
        max_tokens: 2048
      }, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
        }
      });

      const usage = response.data.usage || {};
      await this._logUsage(userId, 'gemini', GEMINI_MODEL, usage.prompt_tokens || 0, usage.completion_tokens || 0, 0);
      return response.data.choices?.[0]?.message?.content || '';
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.message;
      console.error('[Gemini] Error:', detail);
      throw new Error(`Cloud LLM (Gemini) request failed: ${detail}`);
    }
  }

  async _chatAnthropic(systemPrompt, userMessage, userId) {
    try {
      const response = await anthropic.messages.create({
        model: CLOUD_LLM_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      });

      const text = response.content.find(b => b.type === 'text')?.text || '';
      const cost =
        response.usage.input_tokens * CLOUD_INPUT_COST_PER_TOKEN +
        response.usage.output_tokens * CLOUD_OUTPUT_COST_PER_TOKEN;
      await this._logUsage(userId, 'anthropic', CLOUD_LLM_MODEL, response.usage.input_tokens, response.usage.output_tokens, cost);

      return text;
    } catch (err) {
      console.error('[Cloud LLM] Error:', err.message);
      throw new Error(`Cloud LLM request failed: ${err.message}`);
    }
  }

  async _logUsage(userId, provider, model, inputTokens, outputTokens, costUsd) {
    if (!userId) return;
    try {
      await supabase.from('usage_events').insert({
        user_id: userId,
        event_type: 'llm_call',
        provider,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost_usd: costUsd
      });
    } catch (e) {
      console.warn('[Usage] Failed to log LLM usage event:', e.message);
    }
  }

  async generateDevelopmentPlan(repoMetrics, priorityScore, userId = null) {
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

    const raw = await this.chat(systemPrompt, userMessage, 0.7, userId);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('[AI] JSON parse error:', e.message);
    }
    return { summary: raw, tasks: [], health_insights: [], quick_wins: [] };
  }

  async generateCommitMessage(diff, repoName, taskDescription = '', userId = null) {
    const systemPrompt = `You are an expert developer. Generate a precise conventional commit message.
Follow: type(scope): description format. Types: feat, fix, docs, style, refactor, test, chore.
Only return the commit message, nothing else.`;

    const userMessage = `Repository: ${repoName}
Task: ${taskDescription}
Changed files summary:
${diff.substring(0, 2000)}

Generate a single-line conventional commit message:`;

    const message = await this.chat(systemPrompt, userMessage, 0.3, userId);
    return message.trim().replace(/^["']|["']$/g, '');
  }

  async generateTaskImplementation(task, repoMetrics, userId = null) {
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

    const raw = await this.chat(systemPrompt, userMessage, 0.7, userId);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {}
    return { detailed_steps: [], code_snippets: [], testing_approach: '', potential_issues: [], commit_message: '' };
  }

  async generateHealthReport(repositories, userId = null) {
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

    const raw = await this.chat(systemPrompt, userMessage, 0.7, userId);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {}
    return { portfolio_health: 70, top_recommendation: raw, portfolio_insights: [], recommended_focus: '', weekly_goal: '' };
  }
}

module.exports = new AIService();
