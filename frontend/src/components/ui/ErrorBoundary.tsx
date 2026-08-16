'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  error: Error | null;
}

// Dashboard pages call three different backends (Node API, ML service, LM Studio /
// cloud LLM) — any of them being unreachable should show a recoverable error, not
// a blank white screen from an unhandled render crash.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    const sentry = (window as unknown as { Sentry?: { captureException?: (e: Error) => void } }).Sentry;
    sentry?.captureException?.(error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="gc" style={{ borderRadius: 28, padding: 48, textAlign: 'center', margin: 24 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
          <p style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>
            {this.props.fallbackTitle || 'Something went wrong'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>
            {this.state.error.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <button onClick={() => this.setState({ error: null })} className="btn-secondary">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
