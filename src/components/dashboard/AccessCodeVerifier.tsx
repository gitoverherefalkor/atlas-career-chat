
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AccessCodeVerifierProps {
  prefilledCode?: string;
  onVerified?: () => void;
}

const AccessCodeVerifier = ({ prefilledCode, onVerified }: AccessCodeVerifierProps) => {
  const [code, setCode] = useState(prefilledCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter an access code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Verifying access code:', code);
      
      const { data, error: verifyError } = await supabase.functions.invoke('verify-access-code', {
        body: { code: code.trim().toUpperCase() }
      });

      if (verifyError) {
        console.error('Verification error:', verifyError);
        throw new Error(verifyError.message);
      }

      if (!data?.valid) {
        setError(data?.error || 'Invalid access code');
        return;
      }

      console.log('Access code verified successfully:', data);
      
      setIsVerified(true);
      toast({
        title: "Access Code Verified!",
        description: "Your access code is valid. You can now start the assessment.",
      });

      if (onVerified) {
        onVerified();
      }

      // Redirect to assessment after short delay
      setTimeout(() => {
        navigate('/assessment');
      }, 1500);

    } catch (error) {
      console.error('Access code verification failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify access code';
      setError(errorMessage);
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-verify if prefilled code is provided
  React.useEffect(() => {
    if (prefilledCode && !isVerified && !isLoading) {
      handleVerify();
    }
  }, [prefilledCode]);

  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Access Code Verified!</h3>
              <p className="text-sm text-green-700">Redirecting you to the assessment...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Enter Access Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1">
              Access Code
            </label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="font-mono"
              maxLength={19} // Including dashes
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isLoading || !code.trim()} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Access Code'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AccessCodeVerifier;
