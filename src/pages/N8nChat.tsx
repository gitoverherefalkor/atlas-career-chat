
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        const { createChat } = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');
        
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-atlas-navy">N8N Chat Test</h1>
              <span className="ml-4 text-sm text-gray-500">
                Testing N8N Chat Integration
              </span>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="h-[calc(100vh-200px)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-atlas-blue" />
              N8N AI Career Coach
            </CardTitle>
            <p className="text-sm text-gray-600">
              This is a test page for the N8N chat integration. The chat should load below.
            </p>
          </CardHeader>
          <CardContent className="h-full p-0">
            {/* N8N Chat will be embedded here */}
            <div 
              id="n8n-chat-container" 
              className="w-full h-full"
              style={{ minHeight: '500px' }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Custom CSS for N8N Chat styling */}
      <style jsx>{`
        :root {
          --chat--color-primary: #4b7bb9;
          --chat--color-primary-shade-50: #3a6ba3;
          --chat--color-primary-shade-100: #2a5b93;
          --chat--color-secondary: #20b69e;
          --chat--color-secondary-shade-50: #1ca08a;
          --chat--color-white: #ffffff;
          --chat--color-light: #f2f4f8;
          --chat--color-light-shade-50: #e6e9f1;
          --chat--color-light-shade-100: #c2c5cc;
          --chat--color-medium: #d2d4d9;
          --chat--color-dark: #1a365d;
          --chat--color-disabled: #777980;
          --chat--color-typing: #404040;

          --chat--spacing: 1rem;
          --chat--border-radius: 0.5rem;
          --chat--transition-duration: 0.15s;

          --chat--window--width: 100%;
          --chat--window--height: 100%;

          --chat--header-height: auto;
          --chat--header--padding: var(--chat--spacing);
          --chat--header--background: var(--chat--color-dark);
          --chat--header--color: var(--chat--color-light);
          --chat--header--border-top: none;
          --chat--header--border-bottom: none;
          --chat--heading--font-size: 1.5em;
          --chat--subtitle--font-size: 0.9em;
          --chat--subtitle--line-height: 1.6;

          --chat--textarea--height: 50px;

          --chat--message--font-size: 1rem;
          --chat--message--padding: var(--chat--spacing);
          --chat--message--border-radius: var(--chat--border-radius);
          --chat--message-line-height: 1.6;
          --chat--message--bot--background: var(--chat--color-white);
          --chat--message--bot--color: var(--chat--color-dark);
          --chat--message--bot--border: 1px solid var(--chat--color-light-shade-50);
          --chat--message--user--background: var(--chat--color-primary);
          --chat--message--user--color: var(--chat--color-white);
          --chat--message--user--border: none;
          --chat--message--pre--background: rgba(0, 0, 0, 0.05);

          --chat--toggle--background: var(--chat--color-primary);
          --chat--toggle--hover--background: var(--chat--color-primary-shade-50);
          --chat--toggle--active--background: var(--chat--color-primary-shade-100);
          --chat--toggle--color: var(--chat--color-white);
          --chat--toggle--size: 64px;
        }

        #n8n-chat-container {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default N8nChat;
