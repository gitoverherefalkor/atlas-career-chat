
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthConfirm = async () => {
      // Check if this is an OAuth callback (has code/token in hash or query)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session?.user) {
        // OAuth callback successful - user is authenticated
        console.log('OAuth successful, user authenticated:', session.user.email);

        // Check if profile exists, create if not
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!existingProfile) {
          // Create profile from OAuth data
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email!,
              first_name: session.user.user_metadata?.full_name?.split(' ')[0] || '',
              last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }

        setStatus('success');
        setMessage('Successfully signed in!');

        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
        return;
      }

      // Handle email confirmation (old flow)
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      console.log('AuthConfirm params:', { token, type });

      if (!token || !type) {
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
          setStatus('success');
          setMessage('Your email has been confirmed successfully!');

          // Redirect to payment after email verification
          setTimeout(() => {
            navigate('/payment');
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
