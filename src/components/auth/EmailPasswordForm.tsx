import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailPasswordFormProps {
  isLogin: boolean;
  disabled?: boolean;
}

// Helper to get purchase data from URL params OR localStorage
const getPurchaseData = () => {
  try {
    // First check URL params (from AccessCodeVerifier redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const urlEmail = urlParams.get('email');
    const urlFirstName = urlParams.get('firstName');
    const urlLastName = urlParams.get('lastName');
    const urlAccessCode = urlParams.get('code');

    if (urlEmail || urlFirstName || urlLastName) {
      return {
        email: urlEmail || '',
        firstName: urlFirstName || '',
        lastName: urlLastName || '',
        accessCode: urlAccessCode || ''
      };
    }

    // Fallback to localStorage (set after payment on PaymentSuccess page)
    const stored = localStorage.getItem('purchase_data');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const EmailPasswordForm = ({ isLogin, disabled }: EmailPasswordFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  // Memoize purchase data - only read from URL/localStorage once
  const purchaseData = useMemo(() => getPurchaseData(), []);

  // Prefill form when in signup mode with purchase data
  useEffect(() => {
    if (!isLogin && purchaseData) {
      setFormData(prev => ({
        ...prev,
        email: purchaseData.email || prev.email,
        firstName: purchaseData.firstName || prev.firstName,
        lastName: purchaseData.lastName || prev.lastName
      }));
    }
  }, [isLogin, purchaseData]);

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
          localStorage.setItem('atlas_auth_method', 'email');
          toast({
            title: "Welcome back!",
            description: "You've been logged in successfully.",
          });
          navigate('/dashboard');
        }
      } else {
        // Verify passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          return;
        }

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
          localStorage.setItem('atlas_auth_method', 'email');
          setSentToEmail(formData.email);
          setEmailSent(true);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: sentToEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        }
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Email sent", description: "A new verification email has been sent." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to resend. Please try again.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  // Show confirmation screen after successful signup
  if (emailSent) {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-atlas-navy">Check your email</h3>
          <p className="text-sm text-gray-600 mt-1">
            We sent a verification link to
          </p>
          <p className="text-sm font-medium text-atlas-navy mt-1">{sentToEmail}</p>
        </div>
        <p className="text-xs text-gray-500">
          Click the link in the email to activate your account. You'll be signed in automatically.
        </p>
        <div className="pt-2 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Sending...</>
            ) : (
              <><RefreshCw className="h-3 w-3 mr-2" /> Resend verification email</>
            )}
          </Button>
          <p className="text-xs text-gray-400">
            Didn't receive it? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

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

      {!isLogin && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="pl-10"
              placeholder="Repeat your password"
              minLength={8}
            />
          </div>
        </div>
      )}

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
