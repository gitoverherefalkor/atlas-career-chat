
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthConfirm = async () => {
      // Check for error in query params (from Edge Function)
      const errorParam = searchParams.get('error');
      if (errorParam) {
        setStatus('error');
        setMessage(errorParam);
        return;
      }

      // Check for session data from Edge Function (base64 encoded in query param)
      const sessionParam = searchParams.get('session');
      if (sessionParam) {
        try {
          console.log('Found session from Edge Function');

          // Decode the base64 session data
          const sessionData = JSON.parse(atob(decodeURIComponent(sessionParam)));
          console.log('Session decoded for user:', sessionData.user?.email);

          // Store the complete session in localStorage (Supabase format)
          const storageKey = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
          localStorage.setItem(storageKey, JSON.stringify(sessionData));
          console.log('Full session stored in localStorage');

          // Clear the URL params for cleaner display
          window.history.replaceState(null, '', window.location.pathname);

          setStatus('success');
          setMessage('Successfully signed in!');

          // Redirect to dashboard
          setTimeout(() => {
            // Force a page reload to ensure Supabase client picks up the new session
            window.location.href = '/dashboard';
          }, 1000);
          return;
        } catch (err) {
          console.error('Error parsing session:', err);
          setStatus('error');
          setMessage('Failed to process sign in. Please try again.');
          return;
        }
      }

      // Handle PKCE code flow (if coming directly from Supabase, not Edge Function)
      const hasCode = searchParams.has('code');
      if (hasCode) {
        // This path shouldn't happen with the Edge Function approach
        // but keep as fallback
        console.log('Code param detected - redirecting through edge function');
        setStatus('error');
        setMessage('Please use social login buttons to sign in.');
        return;
      }

      // Handle email confirmation and password reset
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || !type) {
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/dashboard');
          return;
        }

        setStatus('error');
        setMessage('Invalid confirmation link. Please try signing up again.');
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
        });

        if (error) {
          console.error('Confirmation error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to confirm your email. Please try again.');
          return;
        }

        if (data.user) {
          // If this is a password reset (recovery), redirect to reset password page
          if (type === 'recovery') {
            navigate('/reset-password');
            return;
          }

          // Regular email confirmation
          setStatus('success');
          setMessage('Your email has been confirmed successfully!');

          // Redirect to dashboard after email verification
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } catch (error) {
        console.error('Unexpected error during confirmation:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthConfirm();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-atlas-navy mb-2">
            Atlas Assessment
          </h1>
          <p className="text-gray-600">Email Confirmation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
              
              {status === 'loading' && 'Confirming your email...'}
              {status === 'success' && 'Email Confirmed!'}
              {status === 'error' && 'Confirmation Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant={status === 'error' ? "destructive" : "default"}>
              <AlertDescription className="text-center">
                {message}
              </AlertDescription>
            </Alert>

            {status === 'success' && (
              <p className="text-sm text-gray-600 text-center mt-4">
                Redirecting you to your dashboard...
              </p>
            )}

            {status === 'error' && (
              <div className="mt-6 text-center space-y-2">
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Try Signing Up Again
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Back to Homepage
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthConfirm;
