// Shown when the top-level Sentry ErrorBoundary catches an unhandled
// render error. Goal: tell the user something useful, not a white screen,
// and give them an obvious recovery action.

interface GlobalErrorFallbackProps {
  resetError: () => void;
}

export function GlobalErrorFallback({ resetError }: GlobalErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#012F64] px-6">
      <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-lg text-center">
        <h1 className="text-2xl font-semibold text-[#012F64] mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We've been notified and will look into it. You can try reloading,
          or come back in a few minutes.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-5 py-2 rounded bg-[#27A1A1] text-white font-medium hover:bg-[#229191] transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="px-5 py-2 rounded border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
