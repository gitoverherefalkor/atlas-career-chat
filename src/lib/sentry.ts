// Sentry initialization. Reads VITE_SENTRY_DSN at build time; if absent
// (e.g. local dev without the env var), Sentry is a no-op and won't ship
// any data. Set VITE_SENTRY_DSN in Vercel project env to enable.

import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const ENV = (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined)
  ?? (import.meta.env.MODE === 'production' ? 'production' : 'development');

export function initSentry() {
  if (!DSN) {
    // Quiet in production builds; informational in dev.
    if (import.meta.env.DEV) {
      console.info('[sentry] VITE_SENTRY_DSN not set, Sentry disabled');
    }
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: ENV,
    // Capture 10% of transactions for performance. Cheap on the free tier.
    tracesSampleRate: 0.1,
    // Always record a session replay on errors so reproductions don't
    // require a back-and-forth with the user.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    // Don't ship Sentry's own console.error noise; only real errors.
    beforeSend(event) {
      // Drop ResizeObserver loop warnings — browser-level noise, not
      // actionable.
      const msg = event.exception?.values?.[0]?.value ?? '';
      if (msg.includes('ResizeObserver loop')) return null;
      return event;
    },
  });
}

export { Sentry };
