// useSubmitChapterFeedback — calls the submit-chapter-feedback edge
// function to persist a structured chapter feedback response.
// Used by ChapterFeedbackModal at the values → Chapter 2 transition.

import { supabase } from '@/integrations/supabase/client';
import type { ChapterFeedbackPayload } from '@/components/chat/ChapterFeedbackModal';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/submit-chapter-feedback`;

export function useSubmitChapterFeedback() {
  const submit = async (
    reportId: string,
    feedback: ChapterFeedbackPayload,
  ): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? SUPABASE_ANON_KEY;

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        report_id: reportId,
        feedback,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`submit-chapter-feedback ${res.status}: ${errText}`);
    }
  };

  return { submit };
}
