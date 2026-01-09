
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AccessCodeVerifier from '@/components/dashboard/AccessCodeVerifier';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const processPayment = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('Invalid payment session. Please try again.');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: paymentError } = await supabase.functions.invoke('payment-success', {
          body: { sessionId }
        });

        if (paymentError) {
          console.error('Payment processing error:', paymentError);
          throw new Error(paymentError.message);
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Payment processing failed');
        }

        setAccessCode(data.accessCode);

        // Store purchase data in localStorage for the sign-up flow
        console.log('Payment success data received:', data);
        console.log('Purchase data:', data.purchaseData);

        if (data.purchaseData) {
          const purchaseDataToStore = {
            email: data.purchaseData.email,
            firstName: data.purchaseData.firstName,
            lastName: data.purchaseData.lastName,
            accessCode: data.accessCode
          };
          console.log('Storing purchase_data in localStorage:', purchaseDataToStore);
          localStorage.setItem('purchase_data', JSON.stringify(purchaseDataToStore));
        } else {
          console.warn('No purchaseData in response - form will not be prefilled');
        }

        // Update profile with country if user is already logged in
        const { data: { user } } = await supabase.auth.getUser();
        const paymentCountry = localStorage.getItem('payment_country');

        if (user && paymentCountry) {
          try {
            await supabase
              .from('profiles')
              .update({ country: paymentCountry })
              .eq('id', user.id);
            console.log('Profile updated with country:', paymentCountry);
            // Clean up after storing
            localStorage.removeItem('payment_country');
          } catch (error) {
            console.error('Error updating profile with country:', error);
            // Don't fail the payment flow if this fails
          }
        }

        toast({
          title: "Payment Successful!",
          description: "Your access code has been generated. Check your email for the invoice.",
        });

      } catch (error) {
        console.error('Payment processing failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
        setError(errorMessage);
        
        toast({
          title: "Payment Processing Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    processPayment();
  }, [searchParams, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-atlas-blue" />
            <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your payment and generate your access code.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-red-600">Payment Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Back to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Success Message */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-green-800">
              <CheckCircle className="h-6 w-6" />
              Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-green-700">
            <p className="mb-2">Thank you for your purchase!</p>
            <p className="text-sm">Your access code has been sent to your email and is ready to use below.</p>
          </CardContent>
        </Card>

        {/* Access Code Display & Verification */}
        {accessCode && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Your Access Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <p className="text-2xl font-mono font-bold text-atlas-navy tracking-wider">
                    {accessCode}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  This code is automatically verified below. You can start your assessment now!
                </p>
              </CardContent>
            </Card>

            {/* Auto-verify the access code */}
            <AccessCodeVerifier 
              prefilledCode={accessCode}
              onVerified={() => {
                toast({
                  title: "Ready to Start!",
                  description: "Your access code is verified. Starting assessment...",
                });
              }}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="text-center space-y-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
