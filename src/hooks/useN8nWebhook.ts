// Hook for communicating with the n8n chat webhook
// Replaces the @n8n/chat library's internal HTTP layer

interface WebhookMetadata {
  report_id: string;
  first_name: string;
  country: string;
}

interface PreviousMessage {
  id: string;
  kwargs: { content: string };
}

interface PreviousSessionResponse {
  data?: PreviousMessage[];
}

const WEBHOOK_URL = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL as string;
const TIMEOUT_MS = 120_000; // 2 minutes — these AI responses can take a while

export function useN8nWebhook() {

  // Send a chat message to n8n and get the bot response
  const sendMessage = async (
    sessionId: string,
    message: string,
    metadata: WebhookMetadata
  ): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        signal: controller.signal,
        body: JSON.stringify({
          action: 'sendMessage',
          'n8n-chat/sessionId': sessionId,
          chatInput: message,
          metadata,
        }),
      });

      if (!res.ok) {
        throw new Error(`Webhook returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      // Match n8n's response parsing: try output, text, message, then stringify
      const text = data.output ?? data.text ?? data.message ?? '';
      if (text === '' && Object.keys(data).length > 0) {
        return JSON.stringify(data, null, 2);
      }
      return text;
    } finally {
      clearTimeout(timeout);
    }
  };

  // Load messages from a previous session (for migration from n8n widget)
  const loadPreviousSession = async (
    sessionId: string,
    metadata: WebhookMetadata
  ): Promise<Array<{ sender: 'user' | 'bot'; content: string }>> => {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          action: 'loadPreviousSession',
          'n8n-chat/sessionId': sessionId,
          metadata,
        }),
      });

      if (!res.ok) return [];

      const data: PreviousSessionResponse = await res.json();
      if (!data.data || !Array.isArray(data.data)) return [];

      return data.data.map((msg) => ({
        sender: msg.id.includes('HumanMessage') ? 'user' as const : 'bot' as const,
        content: msg.kwargs.content,
      }));
    } catch {
      // If loading previous session fails, just start fresh
      return [];
    }
  };

  return { sendMessage, loadPreviousSession };
}
