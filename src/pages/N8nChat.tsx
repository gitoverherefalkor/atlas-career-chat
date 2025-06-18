
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Type declaration for the N8N chat module
declare global {
  interface Window {
    createChat?: (config: any) => void;
  }
}

const N8nChat = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load N8N Chat CSS
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load and initialize N8N Chat
    const loadN8nChat = async () => {
      try {
        // Dynamically import the N8N chat module
        const module = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js' as any);
        const { createChat } = module;
        
        createChat({
          webhookUrl: 'https://falkoratlas.app.n8n.cloud/webhook/53c136fe-3e77-4709-a143-fe82746dd8b6/chat',
          target: '#n8n-chat-container',
          mode: 'fullscreen',
          showWelcomeScreen: false,
          initialMessages: [
            'Hi there! 👋',
            'I\'m your Atlas Career Coach powered by N8N. How can I help you today?'
          ],
          i18n: {
            en: {
              title: 'Atlas Career Coach',
              subtitle: "Start a chat about your career goals. I'm here to help!",
              footer: 'Powered by Atlas Career Solutions',
              getStarted: 'Start Career Chat',
              inputPlaceholder: 'Ask me about your career...'
            }
          }
        });
      } catch (error) {
        console.error('Error loading N8N chat:', error);
      }
    };

    // Small delay to ensure CSS is loaded
    setTimeout(loadN8nChat, 100);

    // Cleanup function
    return () => {
      // Remove the CSS link when component unmounts
      const existingLink = document.querySelector('link[href*="@n8n/chat"]');
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  // Dark mode chat theme optimized for evening use
  const customStyles = `
    :root {
      --chat--color-primary: #60a5fa;
      --chat--color-primary-shade-50: #3b82f6;
      --chat--color-primary-shade-100: #2563eb;
      --chat--color-secondary: #06b6d4;
      --chat--color-secondary-shade-50: #0891b2;
      --chat--color-white: #1e293b;
      --chat--color-light: #0f172a;
      --chat--color-light-shade-50: #1e293b;
      --chat--color-light-shade-100: #334155;
      --chat--color-medium: #475569;
      --chat--color-dark: #f8fafc;
      --chat--color-disabled: #64748b;
      --chat--color-typing: #94a3b8;

      --chat--spacing: 1rem;
      --chat--border-radius: 0.75rem;
      --chat--transition-duration: 0.2s;

      --chat--window--width: 100%;
      --chat--window--height: 100%;

      --chat--header-height: 0px;
      --chat--header--padding: 0;
      --chat--header--background: transparent;
      --chat--header--color: transparent;
      --chat--header--border-top: none;
      --chat--header--border-bottom: none;
      --chat--heading--font-size: 0;
      --chat--heading--font-weight: 0;
      --chat--heading--font-family: 'Inter', sans-serif;
      --chat--subtitle--font-size: 0;
      --chat--subtitle--line-height: 0;
      --chat--subtitle--font-family: 'Inter', sans-serif;

      --chat--textarea--height: 56px;
      --chat--textarea--padding: 1rem 1.25rem;
      --chat--textarea--border-radius: 0.75rem;
      --chat--textarea--font-family: 'Inter', sans-serif;
      --chat--textarea--font-size: 0.95rem;

      --chat--message--font-size: 0.95rem;
      --chat--message--font-family: 'Inter', sans-serif;
      --chat--message--padding: 1rem 1.25rem;
      --chat--message--border-radius: 0.75rem;
      --chat--message-line-height: 1.6;
      --chat--message--bot--background: #334155;
      --chat--message--bot--color: #f1f5f9;
      --chat--message--bot--border: 1px solid #475569;
      --chat--message--bot--box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.3);
      --chat--message--user--background: #3b82f6;
      --chat--message--user--color: #ffffff;
      --chat--message--user--border: none;
      --chat--message--user--box-shadow: 0 2px 8px 0 rgba(59, 130, 246, 0.4);
      --chat--message--pre--background: rgba(71, 85, 105, 0.3);

      --chat--toggle--background: #3b82f6;
      --chat--toggle--hover--background: #2563eb;
      --chat--toggle--active--background: #1d4ed8;
      --chat--toggle--color: #ffffff;
      --chat--toggle--size: 64px;
      --chat--toggle--border-radius: 50%;
      --chat--toggle--box-shadow: 0 4px 16px 0 rgba(59, 130, 246, 0.4);

      --chat--input--border: 1px solid #475569;
      --chat--input--focus--border: 2px solid #3b82f6;
      --chat--input--background: #1e293b;
      --chat--input--color: #f1f5f9;

      --chat--send-button--background: #3b82f6;
      --chat--send-button--hover--background: #2563eb;
      --chat--send-button--color: #ffffff;
    }

    body {
      background: #0f172a !important;
      color: #f1f5f9 !important;
    }

    #n8n-chat-container {
      width: 100%;
      height: 100%;
      font-family: 'Inter', sans-serif;
      background: #0f172a !important;
      position: relative;
    }

    /* Hide the default N8N header completely */
    #n8n-chat-container .chat-header,
    #n8n-chat-container .n8n-chat-header,
    #n8n-chat-container [class*="header"] {
      display: none !important;
      height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    /* Style the main chat container */
    #n8n-chat-container .chat-window,
    #n8n-chat-container [class*="window"] {
      background: #0f172a !important;
      border: none !important;
      border-radius: 0 !important;
      height: 100% !important;
      padding-top: 2rem !important;
      position: relative !important;
    }

    /* Style the chat messages area with proper bottom spacing */
    #n8n-chat-container .chat-messages,
    #n8n-chat-container [class*="messages"] {
      background: #0f172a !important;
      padding: 1.5rem !important;
      padding-bottom: 140px !important; /* Increased bottom padding for input area */
      min-height: calc(100vh - 200px) !important;
      overflow-y: auto !important;
    }

    /* Fix input area positioning with proper bottom margin */
    #n8n-chat-container .chat-input-container,
    #n8n-chat-container [class*="input"] {
      position: fixed !important;
      bottom: 24px !important; /* Added more space from bottom */
      left: 24px !important;
      right: 24px !important;
      width: auto !important;
      max-width: calc(100vw - 48px) !important;
      padding: 1.5rem !important;
      background: #1e293b !important;
      border: 1px solid #475569 !important;
      border-radius: 1rem !important;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5) !important;
      backdrop-filter: blur(16px) !important;
      z-index: 1000 !important;
    }

    /* Style individual messages */
    #n8n-chat-container .chat-message,
    #n8n-chat-container [class*="message"] {
      margin-bottom: 1rem !important;
      color: #f1f5f9 !important;
    }

    /* Style text inputs */
    #n8n-chat-container input,
    #n8n-chat-container textarea {
      background: #0f172a !important;
      color: #f1f5f9 !important;
      border: 1px solid #475569 !important;
      border-radius: 0.75rem !important;
    }

    #n8n-chat-container input:focus,
    #n8n-chat-container textarea:focus {
      border-color: #3b82f6 !important;
      outline: none !important;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
    }

    /* Style buttons */
    #n8n-chat-container button {
      background: #3b82f6 !important;
      color: #ffffff !important;
      border: none !important;
      border-radius: 0.75rem !important;
      transition: all 0.2s ease !important;
    }

    #n8n-chat-container button:hover {
      background: #2563eb !important;
      transform: translateY(-1px) !important;
    }

    /* Style scrollbar for dark mode */
    #n8n-chat-container ::-webkit-scrollbar {
      width: 8px;
    }

    #n8n-chat-container ::-webkit-scrollbar-track {
      background: #1e293b;
      border-radius: 4px;
    }

    #n8n-chat-container ::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 4px;
    }

    #n8n-chat-container ::-webkit-scrollbar-thumb:hover {
      background: #64748b;
    }
  `;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Inject custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-heading font-semibold text-white">Atlas Career Coach</h1>
              <span className="ml-4 text-sm text-slate-300 font-sans">
                AI-Powered Career Guidance
              </span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="font-sans bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Container - Full screen without additional wrapper */}
      <div 
        id="n8n-chat-container" 
        className="w-full"
        style={{ height: 'calc(100vh - 64px)' }}
      />
    </div>
  );
};

export default N8nChat;
