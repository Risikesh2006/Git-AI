/**
 * Git AI landing page — single source of truth for product data and the
 * 3D scene layout. Every repository figure here is also what the 3D nodes,
 * the ranking section and the planner section render, so the WebGL scene and
 * the DOM content can never drift apart.
 */

export interface Repository {
  id: string;
  name: string;
  /** ML priority score, 0–100. */
  priority: number;
  status: 'Needs Attention' | 'Healthy' | 'Monitoring';
  language: string;
  /** Node position in the 3D scene: [x, y, z]. */
  position: [number, number, number];
}

/** Ranked highest-priority first — the order the ML engine outputs. */
export const REPOSITORIES: Repository[] = [
  { id: 'memory-os', name: 'Memory OS', priority: 94, status: 'Needs Attention', language: 'TypeScript', position: [-4.2, 1.1, -1.2] },
  { id: 'smart-student-hub', name: 'Smart Student Hub', priority: 82, status: 'Needs Attention', language: 'Python', position: [4.0, 0.6, -2.0] },
  { id: 'git-ai', name: 'Git AI', priority: 77, status: 'Needs Attention', language: 'TypeScript', position: [1.6, 2.4, -4.2] },
  { id: 'neuralinklocal', name: 'NeuraLinkLocal', priority: 69, status: 'Monitoring', language: 'Python', position: [-2.4, -1.8, -3.4] },
  { id: 'e-commerce', name: 'E-Commerce Platform', priority: 46, status: 'Healthy', language: 'JavaScript', position: [3.4, -2.1, 1.0] },
];

export const PORTFOLIO = {
  healthScore: 87,
  activeRepositories: 6,
  needAttention: 3,
  recommendedFocus: '2h 40m',
} as const;

/** The single highest-impact task the planner surfaces. */
export const TOP_TASK = {
  repository: 'Memory OS',
  priority: 94,
  title: 'Implement semantic memory search',
  estimate: '2 hours 30 minutes',
  estimateShort: '2h 30m',
  steps: [
    'Design the search API endpoint',
    'Connect vector similarity search',
    'Add request validation',
    'Write unit and integration tests',
    'Update API documentation',
  ],
  areas: ['Backend API', 'Vector search', 'Database', 'Tests', 'Documentation'],
} as const;

/** Why the top repository outranks the rest — model explainability. */
export const RANKING_RATIONALE = [
  'No activity for 8 days',
  'Important search feature incomplete',
  'Low test coverage',
  'High portfolio importance',
  'Active open issues',
] as const;

export const SCANNER_TREE = [
  { path: 'src/', depth: 0, kind: 'dir' as const },
  { path: 'api/', depth: 1, kind: 'dir' as const },
  { path: 'services/', depth: 1, kind: 'dir' as const },
  { path: 'components/', depth: 1, kind: 'dir' as const },
  { path: 'tests/', depth: 1, kind: 'dir' as const },
];

export const SCANNER_METRICS = [
  { label: 'Commits', value: '842' },
  { label: 'Open issues', value: '23' },
  { label: 'Pull requests', value: '11' },
  { label: 'Tests', value: '124' },
  { label: 'Documentation', value: '58%' },
  { label: 'Last activity', value: '8 days ago' },
  { label: 'TODO items', value: '17' },
] as const;

export const SCANNER_SIGNALS = [
  'Languages',
  'Branches',
  'README quality',
  'Test coverage',
  'Unresolved TODOs',
  'Recent activity',
  'Repository age',
] as const;

export interface WorkflowStage {
  id: string;
  index: string;
  title: string;
  description: string;
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  { id: 'connect', index: '01', title: 'Connect', description: 'Authorize your GitHub repositories securely.' },
  { id: 'analyze', index: '02', title: 'Analyze', description: 'Scan activity, issues, tests, documentation, branches and unfinished work.' },
  { id: 'prioritize', index: '03', title: 'Prioritize', description: 'Rank repositories using the ML priority engine.' },
  { id: 'plan', index: '04', title: 'Plan', description: 'Generate a practical task using LM Studio.' },
  { id: 'review', index: '05', title: 'Review', description: 'Inspect files, diffs and commit messages.' },
  { id: 'approve', index: '06', title: 'Approve and Push', description: 'Commit and push only after explicit user approval.' },
];

export const COMMIT_REVIEW = {
  repository: 'Memory OS',
  branch: 'feature/semantic-memory-search',
  filesChanged: 4,
  additions: 182,
  deletions: 37,
  message: 'feat(search): implement semantic memory search with vector similarity',
} as const;

/** Illustrative diff shown in the Commit Assistant section. */
export const COMMIT_DIFF: { type: 'meta' | 'hunk' | 'add' | 'del' | 'ctx'; text: string }[] = [
  { type: 'meta', text: 'src/api/services/memory_search.py' },
  { type: 'hunk', text: '@@ -18,7 +18,12 @@ class MemorySearchService:' },
  { type: 'ctx', text: '     def __init__(self, store: VectorStore):' },
  { type: 'ctx', text: '         self.store = store' },
  { type: 'del', text: '-    def search(self, q):' },
  { type: 'del', text: '-        return self.store.scan(q)' },
  { type: 'add', text: '+    def search(self, q: str, k: int = 10) -> list[Match]:' },
  { type: 'add', text: '+        vector = self.embedder.encode(q)' },
  { type: 'add', text: '+        return self.store.similarity(vector, top_k=k)' },
  { type: 'ctx', text: '' },
];

export const ARCHITECTURE_FLOW = [
  'GitHub repositories',
  'Python repository scanner',
  'Feature engineering',
  'ML priority model',
  'LM Studio',
  'Human review',
  'Git commit and push',
] as const;

export const SECURITY_POINTS = [
  { title: 'No push without approval', detail: 'Every commit and push waits for an explicit confirmation from you.' },
  { title: 'Tokens stored server-side', detail: 'GitHub credentials live behind the API, never in the browser bundle.' },
  { title: 'Scoped authorization', detail: 'Access is limited to the repositories and scopes you grant.' },
  { title: 'Local model support', detail: 'Planning can run entirely on your own LM Studio instance.' },
  { title: 'Complete action history', detail: 'Every scan, plan and git action is recorded and reviewable.' },
  { title: 'Secrets via environment', detail: 'Configuration is supplied through environment variables only.' },
] as const;

export const TECHNOLOGIES = [
  'GitHub', 'Next.js', 'TypeScript', 'Python', 'FastAPI',
  'Supabase', 'PostgreSQL', 'Scikit-learn', 'LM Studio', 'Framer Motion',
] as const;

export const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Intelligence', href: '#intelligence' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Security', href: '#security' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Documentation', href: '#documentation' },
] as const;

/* ── 3D camera choreography ──────────────────────────────────────────
   Eight waypoints mapped to overall scroll progress (0 → 1). The rig
   samples a CatmullRomCurve3 through `position` and separately lerps the
   `lookAt` target, which keeps the camera aimed at whatever the adjacent
   DOM section is describing while motion stays continuous — no cuts.     */

export interface CameraWaypoint {
  position: [number, number, number];
  lookAt: [number, number, number];
  /** Narrative label — kept for readability and debugging. */
  beat: string;
}

export const CAMERA_PATH: CameraWaypoint[] = [
  { position: [0, 0.6, 14.0], lookAt: [0, 0, 0], beat: 'Wide establishing network' },
  { position: [0.4, 0.3, 7.4], lookAt: [0, 0, 0], beat: 'Approach intelligence core' },
  { position: [-3.4, 0.9, 3.6], lookAt: [-4.2, 1.1, -1.2], beat: 'Glide past repository nodes' },
  { position: [0.2, 6.0, 6.2], lookAt: [0, 0, -1.0], beat: 'Rise above priority ranking' },
  { position: [1.4, 1.6, 1.2], lookAt: [1.6, 2.4, -4.2], beat: 'Through task cards' },
  { position: [-1.2, -0.8, 3.2], lookAt: [-2.4, -1.8, -3.4], beat: 'Commit review interface' },
  { position: [0, 1.8, 9.6], lookAt: [0, 0, 0], beat: 'Pull back to full workflow' },
  { position: [0, 0.2, 13.2], lookAt: [0, 0, 0], beat: 'Final calm composition' },
];

/** Scene palette, mirrored from the CSS custom properties. */
export const SCENE_COLORS = {
  background: '#050706',
  sage: '#b8c79c',
  glow: '#d8e8b8',
  silver: '#d7dbd4',
  line: '#7e8a74',
} as const;
