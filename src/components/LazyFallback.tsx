import { Component, useState, type ReactNode } from 'react';
import { useI18n } from '../utils/i18n';

/**
 * Placeholder while a lazily loaded view's chunk arrives (React.lazy + Suspense, docs/REFACTOR_PLAN.md Etapa 5).
 * A card with the scanning sweep the app already uses for work in progress, holding the space the view will take
 * so nothing below it jumps. `data-lazy-fallback` lets the visual smoke wait for the real content.
 */
export function ViewFallback({ minHeight = 460 }: { minHeight?: number }) {
  const { tr } = useI18n();
  return (
    <div
      className="card radar-scanning-card"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
      data-lazy-fallback=""
    >
      <span className="sr-only">{tr('common.loadingView')}</span>
    </div>
  );
}

/** Placeholder for a lazily loaded dialog: the dialog's backdrop alone, so the page dims at once. */
export function DialogFallback() {
  return <div className="dialog-backdrop fixed inset-0 z-50" aria-hidden="true" data-lazy-fallback="" />;
}

/**
 * Renders `children` from the first time `isOpen` is true and keeps them mounted after that, so a lazily loaded
 * dialog keeps its state between openings, as it did when it was always mounted.
 */
export function MountWhenOpened({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
  const [opened, setOpened] = useState(isOpen);
  if (isOpen && !opened) setOpened(true);
  return opened || isOpen ? <>{children}</> : null;
}

function LoadFailed({ minHeight }: { minHeight: number }) {
  const { tr } = useI18n();
  return (
    <div className="card p-5 flex items-center justify-center text-center text-sm text-ink-2" style={{ minHeight }} role="alert">
      {tr('common.loadViewFailed')}
    </div>
  );
}

/**
 * Catches a chunk that fails to load (for example an old tab after the app was upgraded and the chunk names
 * changed), so one view shows a notice instead of the whole app unmounting. Dialogs pass `silent`: they render
 * nothing, since a notice would stay on screen after the dialog is closed.
 */
export class LazyBoundary extends Component<{ children: ReactNode; minHeight?: number; silent?: boolean }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[lazy] a view failed to load:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return this.props.silent ? null : <LoadFailed minHeight={this.props.minHeight ?? 460} />;
  }
}
