
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageSquare } from 'lucide-react';
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
          showWelcomeScreen: true,
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

  // Enhanced CSS styles matching the Atlas theme
  const customStyles = `
    :root {
      --chat--color-primary: #3989AF;
      --chat--color-primary-shade-50: #2a6b8a;
      --chat--color-primary-shade-100: #1e4d65;
      --chat--color-secondary: #27A1A1;
      --chat--color-secondary-shade-50: #1e8888;
      --chat--color-white: #ffffff;
      --chat--color-light: #f8fafc;
      --chat--color-light-shade-50: #f1f5f9;
      --chat--color-light-shade-100: #e2e8f0;
      --chat--color-medium: #cbd5e1;
      --chat--color-dark: #012F64;
      --chat--color-disabled: #64748b;
      --chat--color-typing: #334155;

      --chat--spacing: 1rem;
      --chat--border-radius: 0.5rem;
      --chat--transition-duration: 0.15s;

      --chat--window--width: 100%;
      --chat--window--height: 100%;

      --chat--header-height: auto;
      --chat--header--padding: 1.5rem;
      --chat--header--background: linear-gradient(135deg, #012F64 0%, #3989AF 100%);
      --chat--header--color: #ffffff;
      --chat--header--border-top: none;
      --chat--header--border-bottom: none;
      --chat--heading--font-size: 1.5rem;
      --chat--heading--font-weight: 600;
      --chat--heading--font-family: 'Poppins', sans-serif;
      --chat--subtitle--font-size: 0.95rem;
      --chat--subtitle--line-height: 1.6;
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
      --chat--message--bot--background: #ffffff;
      --chat--message--bot--color: #012F64;
      --chat--message--bot--border: 1px solid #e2e8f0;
      --chat--message--bot--box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      --chat--message--user--background: #3989AF;
      --chat--message--user--color: #ffffff;
      --chat--message--user--border: none;
      --chat--message--user--box-shadow: 0 1px 3px 0 rgba(57, 137, 175, 0.3);
      --chat--message--pre--background: rgba(1, 47, 100, 0.05);

      --chat--toggle--background: #3989AF;
      --chat--toggle--hover--background: #2a6b8a;
      --chat--toggle--active--background: #1e4d65;
      --chat--toggle--color: #ffffff;
      --chat--toggle--size: 64px;
      --chat--toggle--border-radius: 50%;
      --chat--toggle--box-shadow: 0 4px 12px 0 rgba(57, 137, 175, 0.3);

      --chat--input--border: 1px solid #e2e8f0;
      --chat--input--focus--border: 2px solid #3989AF;
      --chat--input--background: #ffffff;

      --chat--send-button--background: #3989AF;
      --chat--send-button--hover--background: #2a6b8a;
      --chat--send-button--color: #ffffff;
    }

    #n8n-chat-container {
      width: 100%;
      height: 100%;
      font-family: 'Inter', sans-serif;
    }

    /* Add bottom padding to prevent input from being too low */
    #n8n-chat-container .chat-window {
      padding-bottom: 2rem !important;
    }

    /* Style the chat messages container */
    #n8n-chat-container .chat-messages {
      padding-bottom: 1rem !important;
    }

    /* Style the input area */
    #n8n-chat-container .chat-input-container {
      padding: 1rem 1.5rem 1.5rem 1.5rem !important;
      background: #ffffff !important;
      border-top: 1px solid #e2e8f0 !important;
    }

    /* Improve message spacing */
    #n8n-chat-container .chat-message {
      margin-bottom: 0.75rem !important;
    }

    /* Style welcome screen */
    #n8n-chat-container .welcome-screen {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%) !important;
    }
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Inject custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-heading font-semibold text-atlas-navy">Atlas Career Coach</h1>
              <span className="ml-4 text-sm text-gray-600 font-sans">
                AI-Powered Career Guidance
              </span>
            </div>
            <Button variant="outline" onClick={() => navigate('/')} className="font-sans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="h-[calc(100vh-140px)] shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-atlas-navy to-atlas-blue text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-heading">
              <MessageSquare className="h-6 w-6 text-white" />
              Career Coaching Chat
            </CardTitle>
            <p className="text-sm text-blue-100 font-sans">
              Get personalized career advice and guidance from our AI coach
            </p>
          </CardHeader>
          <CardContent className="h-full p-0 relative">
            {/* N8N Chat will be embedded here */}
            <div 
              id="n8n-chat-container" 
              className="w-full h-full rounded-b-lg overflow-hidden"
              style={{ minHeight: '500px' }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default N8nChat;
