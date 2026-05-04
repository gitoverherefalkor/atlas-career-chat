// useWrapUp — pair of calls to the wrap-up-extract / wrap-up-save edge
// functions. Triggered when the user clicks "All done, wrap up session"
// at the end of the dream-jobs section.
//
// Two-step flow so the user can preview + edit before committing:
//   1. extractHighlights(reportId) -> returns markdown bullets
//   2. saveHighlights(reportId, highlights, addendum) -> writes to DB

import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const EXTRACT_ENDPOINT = `${SUPABASE_URL}/functions/v1/wrap-up-extract`;
const SAVE_ENDPOINT = `${SUPABASE_URL}/functions/v1/wrap-up-save`;

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? SUPABASE_ANON_KEY;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    apikey: SUPABASE_ANON_KEY,
  };
}

export function useWrapUp() {
  const extractHighlights = async (reportId: string): Promise<string> => {
    const res = await fetch(EXTRACT_ENDPOINT, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ report_id: reportId }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`wrap-up-extract ${res.status}: ${errText}`);
    }
    const json = await res.json();
    return (json?.highlights ?? '') as string;
  };

  const saveHighlights = async (
    reportId: string,
    highlights: string,
    addendum: string | null,
  ): Promise<void> => {
    const res = await fetch(SAVE_ENDPOINT, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ report_id: reportId, highlights, addendum }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`wrap-up-save ${res.status}: ${errText}`);
    }
  };

  return { extractHighlights, saveHighlights };
}
