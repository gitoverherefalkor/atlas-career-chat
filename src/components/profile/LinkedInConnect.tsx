
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Linkedin, CheckCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface LinkedInProfile {
  id: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  localizedHeadline?: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  profile?: LinkedInProfile;
  loading: boolean;
  error?: string;
}

export const LinkedInConnect = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    loading: true
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check connection status on component mount and when URL changes
  useEffect(() => {
    checkConnectionStatus();
    
    // Listen for URL changes (after OAuth redirect)
    const handleUrlChange = () => {
      // Small delay to ensure session is updated after OAuth
      setTimeout(() => {
        checkConnectionStatus();
      }, 1000);
    };

    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [user]);

  useEffect(() => {
    // Listen for auth state changes to detect when user returns from LinkedIn
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.app_metadata?.providers);
      
      if (event === 'SIGNED_IN' && session?.user?.app_metadata?.providers?.includes('linkedin_oidc')) {
        console.log('LinkedIn connection detected');
        // Small delay to ensure all data is updated
        setTimeout(() => {
          checkConnectionStatus();
        }, 1000);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const checkConnectionStatus = async () => {
    try {
      console.log('Checking LinkedIn connection status...');
      setStatus(prev => ({ ...prev, loading: true, error: undefined }));

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setStatus({
          isConnected: false,
          loading: false,
          error: 'Please log in first'
        });
        return;
      }

      // Check if user has LinkedIn identity
      const { data: { user } } = await supabase.auth.getUser();
      
      const hasLinkedInIdentity = user?.identities?.some(
        identity => identity.provider === 'linkedin_oidc' || identity.provider === 'linkedin'
      );

      console.log('LinkedIn identity found:', hasLinkedInIdentity);

      if (!hasLinkedInIdentity) {
        setStatus({
          isConnected: false,
          loading: false
        });
        return;
      }

      // Test if we can actually access the profile (verify token is valid)
      try {
        console.log('Testing LinkedIn API access via edge function...');
        
        const { data, error } = await supabase.functions.invoke('linkedin-profile', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          throw new Error(error.message || 'Failed to fetch LinkedIn profile');
        }

        if (data.success) {
          setStatus({
            isConnected: true,
            profile: data.profile,
            loading: false
          });
          
          toast({
            title: "LinkedIn Connected",
            description: "LinkedIn profile successfully verified.",
          });
        } else {
          // Token exists but is invalid/expired
          setStatus({
            isConnected: false,
            loading: false,
            error: data.error || 'LinkedIn connection expired. Please reconnect.'
          });
        }
      } catch (apiError) {
        console.error('Profile test failed:', apiError);
        setStatus({
          isConnected: false,
          loading: false,
          error: 'Unable to verify LinkedIn connection'
        });
      }

    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus({
        isConnected: false,
        loading: false,
        error: 'Failed to check connection status'
      });
    }
  };

  const handleConnect = async () => {
    try {
      console.log('Starting LinkedIn OAuth flow...');
      setStatus(prev => ({ ...prev, loading: true, error: undefined }));

      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      console.log('Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl,
          scopes: 'openid profile email r_liteprofile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

      console.log('OAuth initiated successfully');
      // The redirect will happen automatically
      
    } catch (error) {
      console.error('Connection failed:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: `Connection failed: ${error.message}`
      }));
      
      toast({
        title: "LinkedIn Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log('Starting LinkedIn disconnect...');
      setStatus(prev => ({ ...prev, loading: true, error: undefined }));

      const confirmDisconnect = window.confirm(
        'This will redirect you to LinkedIn to revoke access. Continue?'
      );

      if (!confirmDisconnect) {
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      // Open LinkedIn permissions page for manual revocation
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
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const handleTestProfile = async () => {
    try {
      setIsTestingConnection(true);
      setStatus(prev => ({ ...prev, error: undefined }));

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Testing LinkedIn API access via edge function...');
      
      const { data, error } = await supabase.functions.invoke('linkedin-profile', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch LinkedIn profile');
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      const profileData = data.profile;
      console.log('LinkedIn profile data:', profileData);
      
      setStatus(prev => ({
        ...prev,
        profile: profileData
      }));

      toast({
        title: "LinkedIn Profile Access Successful",
        description: `Successfully retrieved profile for ${profileData.localizedFirstName} ${profileData.localizedLastName}`,
      });

    } catch (error) {
      console.error('Profile test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setStatus(prev => ({
        ...prev,
        error: `Profile test failed: ${errorMessage}`
      }));
      
      toast({
        title: "LinkedIn Profile Access Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If token issues, mark as disconnected
      if (errorMessage.includes('token') || errorMessage.includes('401') || errorMessage.includes('403')) {
        setStatus(prev => ({ ...prev, isConnected: false }));
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleRefreshStatus = () => {
    checkConnectionStatus();
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
          
          {status.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{status.error}</p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <span className={`text-sm ${status.isConnected ? 'text-green-600' : 'text-orange-600'}`}>
              {status.isConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Connected
                </>
              ) : (
                <>❌ Not Connected</>
              )}
            </span>
          </div>

          {status.profile && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                <strong>Profile:</strong> {status.profile.localizedFirstName} {status.profile.localizedLastName}
                {status.profile.localizedHeadline && (
                  <><br /><strong>Headline:</strong> {status.profile.localizedHeadline}</>
                )}
              </p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {!status.isConnected ? (
              <Button 
                onClick={handleConnect}
                disabled={status.loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {status.loading ? (
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
            ) : (
              <>
                <Button 
                  onClick={handleTestProfile}
                  disabled={isTestingConnection}
                  variant="outline"
                  className="border-green-200 text-green-600 hover:bg-green-50"
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
                  onClick={handleDisconnect}
                  disabled={status.loading}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  {status.loading ? (
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
              </>
            )}

            <Button 
              onClick={handleRefreshStatus}
              disabled={status.loading}
              variant="outline"
              size="sm"
            >
              {status.loading ? (
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
      </CardContent>
    </Card>
  );
};
