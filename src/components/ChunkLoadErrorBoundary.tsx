import React from 'react';

/**
 * Error boundary that catches failed lazy-loaded chunks and reloads the page.
 *
 * Why this exists: When Vercel deploys a new build, the old HTML cached in
 * users' browsers references JS chunks with hashes that no longer exist.
 * When React Router navigates to a lazy route, the dynamic import fails
 * silently and the page stays blank. This boundary detects that specific
 * failure and forces a hard reload so the browser picks up fresh HTML.
 */

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message || '';
  const name = error.name || '';
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk [\d]+ failed/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

const RELOAD_TS_KEY = 'chunk_reload_ts';
// If a reload happens again within this window, the chunk is genuinely
// broken (not just stale) — stop reloading to avoid an infinite loop.
const RELOAD_LOOP_WINDOW_MS = 10_000;

export class ChunkLoadErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    if (isChunkLoadError(error)) {
      const lastReload = Number(sessionStorage.getItem(RELOAD_TS_KEY) || 0);
      // Reload for each genuine stale-deploy event, but back off if we just
      // reloaded — that means the chunk is broken, not merely out of date.
      if (Date.now() - lastReload > RELOAD_LOOP_WINDOW_MS) {
        sessionStorage.setItem(RELOAD_TS_KEY, String(Date.now()));
        window.location.reload();
      }
    }
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (!isChunkLoadError(error)) {
      console.error('Uncaught error:', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">Please refresh the page to continue.</p>
            <button
              onClick={() => {
                sessionStorage.removeItem(RELOAD_TS_KEY);
                window.location.reload();
              }}
              className="px-6 py-3 bg-[#27A1A1] hover:bg-[#1f8282] text-white rounded-full font-bold"
            >
              Refresh
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
