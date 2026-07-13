'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import './dashboard.css';

// List of navigation items displayed in the sidebar along with their routing endpoints and icons
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', filled: true },
  { href: '/dashboard/repositories', label: 'Repositories', icon: 'account_tree' },
  { href: '/dashboard/planner', label: 'AI Planner', icon: 'auto_awesome' },
  { href: '/dashboard/commit', label: 'Commit Assistant', icon: 'terminal' },
  { href: '/dashboard/history', label: 'History', icon: 'history' },
];

function SidebarContent({
  user,
  pathname,
  signOut,
  onNavigate,
}: {
  user: { name?: string; github_username?: string; avatar_url?: string };
  pathname: string;
  signOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="dash-logo-block">
        <div className="dash-logo-icon">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1", fontSize: '22px' }}
          >
            smart_toy
          </span>
        </div>
        <div className="dash-logo-text">
          <span className="dash-brand-name">Git AI</span>
          <span className="dash-brand-sub">Engineering Mgr</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="dash-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const exactActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`dash-nav-item ${exactActive ? 'dash-nav-item--active' : ''}`}
            >
              <span
                className="material-symbols-outlined"
                style={
                  exactActive || item.filled
                    ? { fontVariationSettings: "'FILL' 1", fontSize: '20px' }
                    : { fontSize: '20px' }
                }
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="dash-user-block">
        <div className="dash-avatar">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
              {(user.name || user.github_username || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="dash-user-info">
          <span className="dash-user-name">{user.name || user.github_username || 'User'}</span>
          <span className="dash-user-handle">@{user.github_username || 'github_admin'}</span>
        </div>
        <button onClick={signOut} className="dash-logout-btn" title="Sign out">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="dash-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: 40, height: 40, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dash-shell">
      {/* Ambient glow decorations */}
      <div className="dash-glow dash-glow--tr" />
      <div className="dash-glow dash-glow--bl" />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="dash-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className="dash-sidebar">
        <SidebarContent user={user} pathname={pathname} signOut={signOut} />
      </aside>

      {/* Mobile sidebar */}
      <aside className={`dash-sidebar-mobile ${mobileOpen ? 'dash-sidebar-mobile--open' : ''}`}>
        <SidebarContent user={user} pathname={pathname} signOut={signOut} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="dash-main">
        {children}
      </main>
    </div>
  );
}
