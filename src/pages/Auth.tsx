
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

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate, flowFromUrl]);

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
