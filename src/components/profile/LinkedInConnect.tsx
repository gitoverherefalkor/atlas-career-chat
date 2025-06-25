
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Linkedin, CheckCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const LinkedInConnect = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileTestResult, setProfileTestResult] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    checkConnectionStatus();
  }, [user]);

  useEffect(() => {
    // Listen for auth state changes to detect when user returns from LinkedIn
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.app_metadata?.providers);
      
      if (event === 'SIGNED_IN' && session?.user?.app_metadata?.providers?.includes('linkedin_oidc')) {
        console.log('LinkedIn connection detected');
        // Check if we actually have a token
        if (session?.provider_token) {
          setIsConnected(true);
          setIsConnecting(false);
          toast({
            title: "LinkedIn Connected!",
            description: "Your LinkedIn profile has been successfully connected.",
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const checkConnectionStatus = async () => {
    console.log('Checking LinkedIn connection status...');
    setIsRefreshing(true);
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      const hasLinkedInProvider = session?.user?.app_metadata?.providers?.includes('linkedin_oidc');
      const hasProviderToken = !!session?.provider_token;
      
      console.log('LinkedIn provider status:', hasLinkedInProvider);
      console.log('Provider token available:', hasProviderToken);
      
      // User is connected only if they have BOTH provider AND token
      const connectionStatus = hasLinkedInProvider && hasProviderToken;
      
      console.log('Final connection status:', connectionStatus);
      
      const wasConnected = isConnected;
      setIsConnected(connectionStatus);
      setProfileTestResult(null);
      
      // Show toast only if status actually changed
      if (connectionStatus && !wasConnected) {
        toast({
          title: "LinkedIn Connected",
          description: "LinkedIn connection verified.",
        });
      } else if (!connectionStatus && wasConnected) {
        toast({
          title: "LinkedIn Disconnected",
          description: "LinkedIn connection has been removed.",
        });
      }
      
    } catch (error) {
      console.error('Error checking connection status:', error);
      toast({
        title: "Connection Check Failed",
        description: "Failed to check LinkedIn connection status.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const testLinkedInProfile = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to LinkedIn first.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    setProfileTestResult(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session found');
      }

      const linkedinToken = session.provider_token;
      
      if (!linkedinToken) {
        throw new Error('No LinkedIn access token found. Please reconnect to LinkedIn.');
      }

      console.log('Testing LinkedIn API access...');
      
      // Test basic profile access
      const profileResponse = await fetch('https://api.linkedin.com/v2/people/~', {
        headers: {
          'Authorization': `Bearer ${linkedinToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        if (profileResponse.status === 401) {
          throw new Error('LinkedIn access token is invalid or expired. Please reconnect.');
        }
        throw new Error(`LinkedIn API error: ${profileResponse.status} ${profileResponse.statusText}`);
      }

      const profileData = await profileResponse.json();
      console.log('LinkedIn profile data:', profileData);
      
      // Format results
      const firstName = profileData.localizedFirstName || 'N/A';
      const lastName = profileData.localizedLastName || 'N/A';
      const headline = profileData.localizedHeadline || 'N/A';
      
      let resultText = `✅ Successfully retrieved LinkedIn profile:\n\nName: ${firstName} ${lastName}\nHeadline: ${headline}`;
      
      setProfileTestResult(resultText);
      
      toast({
        title: "LinkedIn Profile Access Successful",
        description: "Successfully retrieved your LinkedIn profile information.",
      });

    } catch (error) {
      console.error('LinkedIn profile test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProfileTestResult(`❌ Error: ${errorMessage}`);
      
      toast({
        title: "LinkedIn Profile Access Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If token issues, mark as disconnected
      if (errorMessage.includes('token') || errorMessage.includes('401') || errorMessage.includes('403')) {
        setIsConnected(false);
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleLinkedInConnect = async () => {
    console.log('Starting LinkedIn OAuth flow...');
    setIsConnecting(true);
    
    try {
      // Use the current window location for redirect, but ensure it's the full URL
      const redirectUrl = window.location.origin + '/profile';
      console.log('Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl,
          // Use minimal scopes that LinkedIn definitely supports
          scopes: 'openid profile email',
          // Force the OAuth to open in the same window instead of popup
          queryParams: {
            access_type: 'online',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('OAuth error:', error);
        toast({
          title: "LinkedIn Connection Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsConnecting(false);
      } else {
        console.log('OAuth initiated successfully');
        // Don't show a toast here since the user will be redirected
        // The loading state will be cleared when they return
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
      window.open('https://www.linkedin.com/mypreferences/d/data-sharing-for-permitted-services', '_blank');
      
      toast({
        title: "LinkedIn Permissions Page Opened",
        description: "Please revoke access on the LinkedIn page that just opened, then click 'Refresh Status' below.",
      });
      
    } catch (error) {
      console.error('Error during disconnect:', error);
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
            Connect your LinkedIn profile to import your professional information for career assessment.
          </p>
          
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">LinkedIn profile connected</span>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={testLinkedInProfile}
                  disabled={isTestingConnection}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Test Profile Access
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={checkConnectionStatus}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </>
                  )}
                </Button>
                
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
              
              {profileTestResult && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Profile Test Result:</h4>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">{profileTestResult}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Profile Access:</strong> Connect your LinkedIn to import your professional 
                  information for comprehensive career assessment.
                </p>
              </div>
              
              <div className="flex gap-2">
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
                
                <Button 
                  onClick={checkConnectionStatus}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
