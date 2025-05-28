
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessCodeVerificationProps {
  onVerified: (accessCodeData: any) => void;
}

export const AccessCodeVerification: React.FC<AccessCodeVerificationProps> = ({ onVerified }) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [needsPurchase, setNeedsPurchase] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter your access code');
      return;
    }

    setIsVerifying(true);
    setError('');
    setNeedsPurchase(false);

    try {
      console.log('Verifying access code:', code);
      
      const { data, error: apiError } = await supabase.functions.invoke('verify-access-code', {
        body: { code: code.trim() }
      });

      if (apiError) {
        console.error('API error:', apiError);
        setError('Failed to verify access code. Please try again.');
        return;
      }

      console.log('Verification response:', data);

      if (data.valid) {
        onVerified(data.accessCode);
      } else {
        setError(data.error);
        setNeedsPurchase(data.needsPurchase || false);
      }
    } catch (error) {
      console.error('Error verifying access code:', error);
      setError('Failed to verify access code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const formatCode = (value: string) => {
    // Remove any non-alphanumeric characters except hyphens
    const cleaned = value.replace(/[^a-zA-Z0-9-]/g, '');
    // Convert to uppercase
    return cleaned.toUpperCase();
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
    setError('');
    setNeedsPurchase(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-atlas-navy">
            Enter Your Access Code
          </CardTitle>
          <p className="text-gray-600">
            Please enter the access code you received after your purchase to start the assessment.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={code}
              onChange={handleCodeChange}
              onKeyPress={handleKeyPress}
              className="text-center font-mono text-lg tracking-wider"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Enter your access code (case insensitive)
            </p>
          </div>

          {error && (
            <Alert variant={needsPurchase ? "destructive" : "default"}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleVerify} 
            disabled={isVerifying || !code.trim()}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Access Code'
            )}
          </Button>

          {needsPurchase && (
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600 mb-3">
                Don't have a valid access code?
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Purchase Access Code
              </Button>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Having trouble? Contact support or{' '}
              <button 
                onClick={() => navigate('/')}
                className="text-atlas-blue hover:underline"
              >
                return to homepage
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
