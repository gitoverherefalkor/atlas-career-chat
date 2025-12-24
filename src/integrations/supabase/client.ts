import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Check if we're in production and should use the proxy
const isProduction = typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  !window.location.hostname.includes('127.0.0.1');

// Custom fetch that routes through our proxy to avoid CORS issues
const customFetch = (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  // Only proxy in production
  if (!isProduction) {
    return fetch(url, options);
  }

  const urlString = url.toString();

  // Check if this is a Supabase URL that needs proxying
  if (urlString.startsWith(SUPABASE_URL)) {
    // Extract the path after the Supabase URL
    const path = urlString.replace(SUPABASE_URL + '/', '');
    // Rewrite to our proxy
    const proxyUrl = `/api/supabase-proxy/${path}`;
    console.log(`Proxying request: ${urlString} -> ${proxyUrl}`);
    return fetch(proxyUrl, options);
  }

  // For non-Supabase URLs, use regular fetch
  return fetch(url, options);
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: customFetch,
  },
});