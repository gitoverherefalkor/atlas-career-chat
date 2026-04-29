// Atlas runs on a single editorial palette (teal-navy + warm-paper cream).
// Apply the .dark class before React mounts so the page never flashes the
// un-themed default styles. Loaded as an external script to comply with the
// strict CSP (no 'unsafe-inline' for script-src).
document.documentElement.classList.add('dark');
