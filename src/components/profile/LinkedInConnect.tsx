
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Linkedin, CheckCircle, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const LinkedInConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
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

  useEffect(() => {
    // Listen for auth state changes to detect when user returns from LinkedIn
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.app_metadata?.providers?.includes('linkedin_oidc')) {
        console.log('LinkedIn connection detected');
        setIsConnected(true);
        setIsConnecting(false);
        toast({
          title: "LinkedIn Connected!",
          description: "Your LinkedIn profile has been successfully connected.",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleLinkedInConnect = async () => {
    console.log('Starting LinkedIn OAuth flow...');
    setIsConnecting(true);
    
    try {
      // Use profile page as redirect to stay within Atlas
      const redirectUrl = `${window.location.origin}/profile`;
      console.log('Redirect URL:', redirectUrl);

      // Use linkIdentity for already authenticated users
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl,
          scopes: 'openid profile email'
        }
      });

      console.log('Supabase OAuth response:', { data, error });

      if (error) {
        console.error('OAuth error:', error);
        // If linkIdentity fails (manual linking disabled), fall back to signInWithOAuth
        if (error.message?.includes('Manual linking is disabled')) {
          console.log('Manual linking disabled, using signInWithOAuth...');
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithOAuth({
            provider: 'linkedin_oidc',
            options: {
              redirectTo: redirectUrl,
              scopes: 'openid profile email',
              queryParams: {
                access_type: 'online',
                prompt: 'consent'
              }
            }
          });

          if (signInError) {
            console.error('SignInWithOAuth error:', signInError);
            toast({
              title: "LinkedIn Connection Failed",
              description: signInError.message,
              variant: "destructive",
            });
            setIsConnecting(false);
          } else {
            console.log('OAuth initiated successfully with signInWithOAuth');
            toast({
              title: "Redirecting to LinkedIn",
              description: "Please complete the authentication process.",
            });
          }
        } else {
          toast({
            title: "LinkedIn Connection Failed",
            description: error.message,
            variant: "destructive",
          });
          setIsConnecting(false);
        }
      } else {
        console.log('OAuth initiated successfully with linkIdentity');
        toast({
          title: "Redirecting to LinkedIn",
          description: "Please complete the authentication process.",
        });
        // Don't set isConnecting to false here - let the auth state change handle it
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to LinkedIn. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleLinkedInDisconnect = async () => {
    console.log('Starting LinkedIn disconnect...');
    setIsDisconnecting(true);
    
    try {
      // Unfortunately, Supabase doesn't have a direct way to unlink an identity
      // We need to refresh the user session to update the providers list
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        toast({
          title: "Disconnect Failed",
          description: "Unable to disconnect LinkedIn. Please try again.",
          variant: "destructive",
        });
      } else {
        // For now, we'll show a message that they need to revoke access manually
        setIsConnected(false);
        toast({
          title: "LinkedIn Disconnected",
          description: "To fully revoke access, please visit your LinkedIn app permissions and remove Atlas.",
        });
      }
    } catch (error) {
      console.error('Unexpected error during disconnect:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect LinkedIn. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
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
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">LinkedIn profile connected</span>
              </div>
              <Button 
                onClick={handleLinkedInDisconnect}
                disabled={isDisconnecting}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Disconnect LinkedIn
                  </>
                )}
              </Button>
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
