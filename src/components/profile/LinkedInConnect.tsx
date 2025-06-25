
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Linkedin, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const LinkedInConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check if user has LinkedIn connection on component mount
    if (user?.app_metadata?.providers?.includes('linkedin_oidc')) {
      console.log('User already connected to LinkedIn');
      setIsConnected(true);
    }
  }, [user]);

  const handleLinkedInConnect = async () => {
    console.log('Starting LinkedIn OAuth flow...');
    setIsConnecting(true);
    
    try {
      const redirectUrl = `${window.location.origin}/profile`;
      console.log('Redirect URL:', redirectUrl);
      console.log('Current origin:', window.location.origin);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl,
          scopes: 'openid'
        }
      });

      console.log('Supabase OAuth response:', { data, error });

      if (error) {
        console.error('OAuth error:', error);
        toast({
          title: "LinkedIn Connection Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('OAuth initiated successfully');
        toast({
          title: "Redirecting to LinkedIn",
          description: "Please complete the authentication process.",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to LinkedIn. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Linkedin className="h-5 w-5 mr-2 text-blue-600" />
          LinkedIn Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your LinkedIn profile to link your professional account with Atlas.
          </p>
          
          {isConnected ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">LinkedIn profile connected</span>
            </div>
          ) : (
            <Button 
              onClick={handleLinkedInConnect}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Linkedin className="h-4 w-4 mr-2" />
                  Connect LinkedIn
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
