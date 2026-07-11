"use client";

import { useRef, useState } from "react";
import Image from "next/image";

function GlassCard({ as: Tag = "div", className = "", children, ...props }) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 50;
    const rotateY = (centerX - x) / 50;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    const card = ref.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  return (
    <Tag
      ref={ref}
      className={`glass-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Tag>
  );
}

const navItems = [
  { label: "Dashboard", icon: "dashboard", filled: true, active: true },
  { label: "Repositories", icon: "account_tree", active: false },
  { label: "AI Planner", icon: "auto_awesome", active: false },
  { label: "Commit Assistant", icon: "terminal", active: false },
  { label: "History", icon: "history", active: false },
];

const statCards = [
  {
    label: "Health Score",
    icon: "monitoring",
    value: "—",
    tag: "RESCAN REQ",
    caption: "Scan repos to start evaluation",
  },
  {
    label: "Repositories",
    icon: "folder_zip",
    value: "0",
    tag: "TOTAL",
    caption: "0 active (30d period)",
  },
  {
    label: "Open Issues",
    icon: "error_outline",
    value: "—",
    tag: null,
    caption: "Across all connected repositories",
  },
  {
    label: "Total Stars",
    icon: "grade",
    value: "—",
    tag: null,
    caption: "Total GitHub engagement reach",
  },
];

const healthMetrics = [
  { label: "Documentation", value: 0 },
  { label: "Active Projects", value: 0 },
  { label: "Overall Health", value: 0 },
];

export default function DashboardPage() {
  const [toasts, setToasts] = useState([
    { id: 1, icon: "cancel", text: "Failed to load repositories.", accent: true },
    { id: 2, icon: "N", text: "2 Issues detected.", accent: false },
  ]);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {/* Navigation Sidebar */}
      <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-6 py-8 px-4 glass-card rounded-3xl h-[870px] w-72">
        <div className="flex items-center gap-3 px-4 mb-8">
          <span
            className="material-symbols-outlined text-primary text-headline-md"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            smart_toy
          </span>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md leading-none tracking-tight">
              Git AI
            </span>
            <span className="font-label-mono text-label-mono opacity-50 uppercase tracking-[0.2em]">
              Engineering Mgr
            </span>
          </div>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`flex items-center gap-4 px-6 py-3.5 rounded-full transition-all group ${
                item.active
                  ? "nav-pill-active text-primary"
                  : "hover:bg-white/5 text-on-surface-variant"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={item.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium tracking-wide">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10 flex items-center gap-4 px-4">
          <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center font-bold text-lg overflow-hidden border border-white/20">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEhG4Hb2NlYZ88vzvJyNWxaoFhx9rV1mTfTB6X37XBBgXbfjhUpip1Gq4xgtzcvrRB4gmkT1t1OWGDyTs9rIidIRMtslFh__Y4c_ZUI9za2nUi0rFRS1QpZa4EoktD1HXPbX_LXK4kpHKIr997uszWesDmZgf2tSk60TKehvXB8nLJMwskHJpqiO3iDqP-JD04pYCtQCXVwnRlFNFtFBav3_5ttDvFJVnS-l2EwNTf9Hj1FNpO_666"
              alt="User avatar"
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-primary">User</span>
            <span className="font-label-mono text-[10px] text-on-surface-variant">
              @github_admin
            </span>
          </div>
          <button className="ml-auto material-symbols-outlined text-on-surface-variant hover:text-white transition-colors">
            logout
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="lg:ml-margin-desktop lg:pl-80 pr-margin-desktop py-12 min-h-screen">
        {/* Top Header Section */}
        <header className="flex justify-between items-end mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-on-surface-variant opacity-80">
              <span className="font-body-md">Good morning, 👋</span>
            </div>
            <h1 className="font-display-hero text-headline-lg tracking-tighter">
              Engineering Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-error ai-pulse"></div>
              <span className="font-label-mono text-label-mono text-error/80">
                LM Studio: Not Connected — Start LM Studio and load a model
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="group relative px-8 py-4 bg-white text-black rounded-full font-semibold overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <span className="relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">sync</span>
                Scan Repositories
              </span>
              <div className="absolute inset-0 bg-gradient-to-tr from-white via-silver-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </div>
        </header>

        {/* Stats Grid (Top-Level Insights) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
          {statCards.map((card) => (
            <GlassCard
              key={card.label}
              className="p-8 rounded-3xl group hover:border-white/40 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="font-label-mono text-label-mono text-on-surface-variant">
                  {card.label}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant">
                  {card.icon}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-headline-lg font-bold tracking-tighter">
                  {card.value}
                </span>
                {card.tag && (
                  <span className="font-label-mono text-on-surface-variant text-[10px]">
                    {card.tag}
                  </span>
                )}
              </div>
              <p className="mt-4 text-on-surface-variant text-sm font-medium">
                {card.caption}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Main Dashboard Layout (Bento Style) */}
        <div className="grid grid-cols-12 gap-gutter">
          {/* Priority Projects (Large Section) */}
          <GlassCard
            as="section"
            className="col-span-12 lg:col-span-8 rounded-[32px] p-10 flex flex-col min-h-[500px]"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-headline-md text-headline-md tracking-tight">
                Priority Projects
              </h2>
              <a
                className="font-label-mono text-label-mono text-on-surface-variant hover:text-white transition-colors flex items-center gap-1"
                href="#"
              >
                View all{" "}
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </a>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="relative w-32 h-32 mb-8 group">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-full h-full rounded-full border border-white/10 flex items-center justify-center glass-card">
                  <span className="material-symbols-outlined text-5xl opacity-40 group-hover:scale-110 transition-transform duration-500">
                    deployed_code
                  </span>
                </div>
              </div>
              <h3 className="text-body-lg font-semibold mb-2">
                No repositories scanned yet.
              </h3>
              <p className="text-on-surface-variant max-w-sm mx-auto mb-8">
                Initiate a system scan to synchronize your GitHub repositories
                and begin AI-assisted optimization.
              </p>
              <button className="px-10 py-4 glass-card rounded-full font-semibold hover:bg-white/10 hover:border-white/40 transition-all active:scale-95">
                Scan Now
              </button>
            </div>
          </GlassCard>

          {/* Right Column Sidebar Info */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
            {/* Today's Mission (AI Assistant Card) */}
            <GlassCard className="rounded-[32px] p-8 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
                <span className="material-symbols-outlined text-6xl">
                  auto_awesome
                </span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-primary text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      smart_toy
                    </span>
                  </div>
                  <h2 className="font-headline-md text-[20px] tracking-tight">
                    Today&apos;s Mission
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 italic text-on-surface-variant">
                    &quot;Scan your repositories to get today&apos;s mission.
                    I&apos;ll analyze current tickets and suggest the highest
                    impact work for your morning.&quot;
                  </div>
                  <div className="flex justify-end">
                    <div className="px-4 py-2 rounded-full glass-card text-label-mono text-[10px] uppercase tracking-widest text-primary/60">
                      Awaiting input...
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Repository Health Indicators */}
            <GlassCard className="rounded-[32px] p-8">
              <h2 className="font-headline-md text-[20px] tracking-tight mb-8">
                Repository Health
              </h2>
              <div className="space-y-8">
                {healthMetrics.map((metric, idx) => (
                  <div key={metric.label}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-label-mono text-label-mono uppercase opacity-60">
                        {metric.label}
                      </span>
                      <span className="font-label-mono text-label-mono">
                        {metric.value}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full liquid-fill rounded-full transition-all duration-1000"
                        style={{
                          width: `${metric.value}%`,
                          transitionDelay: `${idx * 100}ms`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      {/* Error Toast Notifications */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-[60]">
        {toasts.map((toast, idx) => (
          <div
            key={toast.id}
            className={`flex items-center gap-4 px-6 py-4 glass-card border-error/20 rounded-2xl ${
              idx === 0 ? "animate-bounce" : ""
            }`}
          >
            {toast.accent ? (
              <span className="material-symbols-outlined text-error">
                {toast.icon}
              </span>
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-error/10 text-error font-bold text-xs">
                {toast.icon}
              </div>
            )}
            <span className="font-medium">{toast.text}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="material-symbols-outlined text-on-surface-variant hover:text-white ml-4 text-sm"
            >
              close
            </button>
          </div>
        ))}
      </div>

      {/* Background Decoration */}
      <div className="fixed top-1/4 -right-1/4 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      <div className="fixed -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
    </>
  );
}
