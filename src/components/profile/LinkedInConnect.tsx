
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Linkedin, CheckCircle, Loader2, X, ExternalLink } from 'lucide-react';
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
          description: "Your LinkedIn profile has been successfully connected with full access.",
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

      // Expanded scopes for full profile access needed for career assessment
      const expandedScopes = 'openid profile email w_member_social r_basicprofile r_emailaddress rw_company_admin r_fullprofile';

      // Use linkIdentity for already authenticated users
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl,
          scopes: expandedScopes
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
              scopes: expandedScopes,
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
              description: "Please complete the authentication process to grant full profile access.",
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
          description: "Please complete the authentication process to grant full profile access.",
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
      // Open LinkedIn permissions page in new tab
      window.open('https://www.linkedin.com/mypreferences/d/data-sharing-for-permitted-services', '_blank');
      
      // Unfortunately, Supabase doesn't have a direct way to unlink an identity
      // We need to refresh the user session to update the providers list
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        toast({
          title: "Disconnect Process Started",
          description: "Please revoke access on LinkedIn's permissions page that just opened.",
        });
      } else {
        // For now, we'll show a message that they need to revoke access manually
        setIsConnected(false);
        toast({
          title: "LinkedIn Disconnect Started",
          description: "Please revoke access on the LinkedIn permissions page that just opened to complete the disconnection.",
        });
      }
    } catch (error) {
      console.error('Unexpected error during disconnect:', error);
      toast({
        title: "Error",
        description: "Failed to open LinkedIn permissions page. Please visit linkedin.com/mypreferences manually.",
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
            Connect your LinkedIn profile to import your complete professional information for comprehensive career assessment.
          </p>
          
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">LinkedIn profile connected with full access</span>
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
                    Opening LinkedIn...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Disconnect LinkedIn
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Full Profile Access Required:</strong> To provide comprehensive career insights, 
                  we request access to your complete LinkedIn profile including work experience, 
                  education, skills, and endorsements.
                </p>
              </div>
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
                    Connect LinkedIn (Full Access)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
