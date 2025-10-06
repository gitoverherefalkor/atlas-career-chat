
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthForm from '@/components/auth/AuthForm';
import AuthToggle from '@/components/auth/AuthToggle';
import AuthNavigation from '@/components/auth/AuthNavigation';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const flowFromUrl = searchParams.get('flow');

  useEffect(() => {
    if (flowFromUrl === 'signup') {
      setIsLogin(false);
    }

    // Only check auth if NOT coming from payment flow
    // (payment flow sends users here to complete signup)
    const checkAuth = async () => {
      const accessCode = searchParams.get('code');

      // If user has access code, they're in payment flow - let them through
      if (accessCode) {
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate, flowFromUrl, searchParams]);

  const handleToggle = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthHeader isLogin={isLogin} />

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? 'Sign In' : 'Create Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AuthForm isLogin={isLogin} />
            <AuthToggle isLogin={isLogin} onToggle={handleToggle} />
            <AuthNavigation />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
