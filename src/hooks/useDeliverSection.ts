// useDeliverSection — fast-path hook that requests a templated section
// delivery from the `deliver-section` edge function instead of round-tripping
// through the n8n chat agent. Used for clean "Continue to next section"
// clicks where no LLM reasoning is needed.
//
// Returns the rendered markdown the chat should display as a bot message.
// The edge function also writes both the user prompt and the bot response
// to `n8n_chat_histories`, so the smart agent's memory stays in sync.

import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/deliver-section`;

export type DeliverableSectionType =
  | 'approach'
  | 'strengths'
  | 'development'
  | 'values'
  | 'top_career_1'
  | 'top_career_2'
  | 'top_career_3'
  | 'runner_ups'
  | 'outside_box'
  | 'dream_jobs';

interface DeliverSectionArgs {
  reportId: string;
  sectionType: DeliverableSectionType;
  previousSectionType?: DeliverableSectionType;
  /**
   * The user's message that triggered this delivery (e.g. "Looks good,
   * let's continue to the next section"). Written to `n8n_chat_histories`
   * as a `human` message before the AI delivery, so the agent's memory
   * sees both turns when it's invoked next.
   */
  userMessage?: string;
  /**
   * Frontend session_id and user_id so the edge function can persist
   * the user msg + delivery to the `chat_messages` table server-side.
   * This makes persistence atomic with the API response — refreshing
   * mid-flight no longer loses the bot message.
   */
  sessionId?: string;
  userId?: string;
  /**
   * When true, the agent is also handling this advance (post-discussion
   * case) and will write the user message to n8n_chat_histories itself
   * via langchain. Tells the edge function to skip its n8n_chat_histories
   * user-message write to avoid a duplicate. Doesn't affect chat_messages.
   */
  skipHistoryUserWrite?: boolean;
}

export function useDeliverSection() {
  const deliver = async (args: DeliverSectionArgs): Promise<string> => {
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
        report_id: args.reportId,
        section_type: args.sectionType,
        previous_section_type: args.previousSectionType,
        user_message: args.userMessage,
        session_id: args.sessionId,
        user_id: args.userId,
        skip_history_user_write: args.skipHistoryUserWrite,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`deliver-section ${res.status}: ${errText}`);
    }

    const data = await res.json();
    if (typeof data.content !== 'string') {
      throw new Error('deliver-section returned no content');
    }
    return data.content;
  };

  return { deliver };
}
