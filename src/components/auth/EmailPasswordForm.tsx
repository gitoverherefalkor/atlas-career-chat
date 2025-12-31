
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailPasswordFormProps {
  isLogin: boolean;
  disabled?: boolean;
}

// Helper to get purchase data from localStorage (set after payment)
const getPurchaseData = () => {
  try {
    const stored = localStorage.getItem('purchase_data');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const EmailPasswordForm = ({ isLogin, disabled }: EmailPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check for prefill data from payment flow
  const purchaseData = getPurchaseData();

  const [formData, setFormData] = useState({
    email: (!isLogin && purchaseData?.email) || '',
    password: '',
    firstName: (!isLogin && purchaseData?.firstName) || '',
    lastName: (!isLogin && purchaseData?.lastName) || ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          toast({
            title: "Welcome back!",
            description: "You've been logged in successfully.",
          });
          navigate('/dashboard');
        }
      } else {
        // Check if user has an access code from URL params or purchase data
        const urlParams = new URLSearchParams(window.location.search);
        const accessCode = urlParams.get('code') || purchaseData?.accessCode;

        // If no access code, prevent signup
        if (!accessCode) {
          setError('You need an access code to create an account. Please purchase an assessment first or use the access code from your email.');
          return;
        }

        const redirectUrl = `${window.location.origin}/auth/confirm`;

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              access_code: accessCode
            }
          }
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account before proceeding.",
          });

          setError('Please check your email and click the verification link to activate your account. Once verified, you can sign in below.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLogin && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="firstName"
                name="firstName"
                type="text"
                required={!isLogin}
                value={formData.firstName}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="John"
              />
            </div>
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-1">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required={!isLogin}
                value={formData.lastName}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="Doe"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="pl-10"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          {isLogin && (
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs text-atlas-navy hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            value={formData.password}
            onChange={handleInputChange}
            className="pl-10 pr-10"
            placeholder={isLogin ? "Enter your password" : "Create a password"}
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {!isLogin && (
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 8 characters long
          </p>
        )}
      </div>

      {error && (
        <Alert variant={error.includes('verification') ? "default" : "destructive"}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isLoading || disabled} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isLogin ? 'Signing in...' : 'Creating account...'}
          </>
        ) : (
          isLogin ? 'Sign In' : 'Create Account'
        )}
      </Button>
    </form>
  );
};

export default EmailPasswordForm;
