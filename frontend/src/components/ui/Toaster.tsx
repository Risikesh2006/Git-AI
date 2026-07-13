'use client';

import { useEffect, useRef, useState } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// Global toast store
let addToastFn: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function toast(message: string, type: Toast['type'] = 'info', duration = 4000) {
  if (addToastFn) addToastFn({ message, type, duration });
}

toast.success = (msg: string) => toast(msg, 'success');
toast.error = (msg: string) => toast(msg, 'error');
toast.info = (msg: string) => toast(msg, 'info');
toast.warning = (msg: string) => toast(msg, 'warning');

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [...prev, { ...t, id }]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), t.duration || 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  const icons = {
    success: '✓',
    error: '✕',
    info: 'i',
    warning: '⚠'
  };

  const colors = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    info: 'border-white/20 bg-white/5 text-white',
    warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`glass rounded-xl px-4 py-3 border flex items-center gap-3 animate-fade-in ${colors[t.type]}`}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs flex-shrink-0 font-bold">
            {icons[t.type]}
          </span>
          <p className="text-sm font-medium">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
