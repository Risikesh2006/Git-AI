'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from '@/components/ui/Toaster';

export default function HomePage() {
  const { user, loading, signInWithGithub } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGithub();
    } catch (err: any) {
      toast.error('Sign in failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black overflow-hidden relative">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-white/[0.015] blur-3xl" />
      
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Git AI</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm hidden sm:block">AI Engineering Manager</span>
          <button onClick={handleGitHubSignIn} className="btn-primary text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Sign in with GitHub
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs text-white/60 mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Powered by LM Studio · Random Forest ML · GitHub API
        </div>
        
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none mb-6 animate-fade-in gradient-text">
          Your AI<br/>Engineering<br/>Manager
        </h1>
        
        <p className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
          Git AI analyzes your GitHub repositories, predicts which project needs attention, 
          generates development plans, and commits real changes — automatically.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
          <button onClick={handleGitHubSignIn} className="btn-primary text-base px-8 py-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Connect GitHub & Start
          </button>
          <a href="#features" className="btn-secondary text-base px-8 py-3">
            See how it works
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: '🔍',
              title: 'Repository Scanner',
              desc: 'Deep scans all your GitHub repos — commits, tests, docs, issues, languages.'
            },
            {
              icon: '🤖',
              title: 'ML Priority Engine',
              desc: 'Random Forest model predicts which project needs your attention most.'
            },
            {
              icon: '📋',
              title: 'Daily AI Planner',
              desc: 'LM Studio generates today\'s development tasks with implementation steps.'
            },
            {
              icon: '💻',
              title: 'Code Generation',
              desc: 'AI generates code snippets and full implementation guidance per task.'
            },
            {
              icon: '🚀',
              title: 'Auto Commit & Push',
              desc: 'AI writes the commit message. You approve. Git AI commits and pushes.'
            },
            {
              icon: '📊',
              title: 'Health Dashboard',
              desc: 'Portfolio health score, activity charts, and AI portfolio insights.'
            }
          ].map((f, i) => (
            <div key={i} className="glass-card p-6">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-4xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-center gradient-text mb-12">How it works</h2>
        <div className="flex flex-col gap-4">
          {[
            { step: '01', title: 'Connect GitHub', desc: 'Sign in with GitHub OAuth. Git AI gets read/write access to your repositories.' },
            { step: '02', title: 'Scan Repositories', desc: 'The scanner analyzes all your repos — commits, files, tests, documentation, open issues.' },
            { step: '03', title: 'ML Priority Score', desc: 'Random Forest model scores each repo 0-100 based on activity, health, and importance.' },
            { step: '04', title: 'AI Development Plan', desc: 'LM Studio generates tasks with steps, time estimates, and code guidance.' },
            { step: '05', title: 'Review & Commit', desc: 'Review the changes, approve the commit, Git AI pushes to GitHub for you.' },
          ].map((s, i) => (
            <div key={i} className="glass-card p-5 flex items-start gap-5">
              <span className="text-white/20 font-black text-2xl leading-none mt-1 flex-shrink-0">{s.step}</span>
              <div>
                <h3 className="text-white font-semibold mb-1">{s.title}</h3>
                <p className="text-white/40 text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 text-center py-16 px-8">
        <h2 className="text-4xl font-black gradient-text mb-4">Ready to ship more?</h2>
        <p className="text-white/40 mb-8">Connect your GitHub in seconds. No credit card required.</p>
        <button onClick={handleGitHubSignIn} className="btn-primary text-base px-10 py-4">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Start with GitHub
        </button>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-8 text-center">
        <p className="text-white/20 text-sm">
          Git AI — AI-Powered GitHub Engineering Manager · Built with Next.js, Node.js, Supabase, LM Studio
        </p>
      </footer>
    </main>
  );
}
