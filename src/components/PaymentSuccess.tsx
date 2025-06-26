import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [purchaseData, setPurchaseData] = useState<{
    email?: string;
    firstName?: string;
    lastName?: string;
  }>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const isDemo = searchParams.get('demo') === 'true';
    
    // Handle demo mode
    if (isDemo) {
      setIsProcessing(false);
      setIsComplete(true);
      setAccessCode('ATLAS-DEMO12345');
      toast({
        title: "Demo Purchase Successful!",
        description: "This is a demo purchase with a sample access code.",
      });
      return;
    }
    
    if (!sessionId) {
      navigate('/');
      return;
    }
    
    const processPayment = async () => {
      try {
        setIsProcessing(true);
        
        const { data, error } = await supabase.functions.invoke('payment-success', {
          body: { sessionId },
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data?.accessCode) {
          setAccessCode(data.accessCode);
        }

        // Store purchase data for pre-filling the auth form
        if (data?.purchaseData) {
          setPurchaseData(data.purchaseData);
        }
        
        setIsComplete(true);
        toast({
          title: "Purchase Successful!",
          description: "Check your email for your access code.",
        });
      } catch (error) {
        console.error('Payment processing error:', error);
        toast({
          title: "Payment Processing Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
        
        // Redirect to home after error
        setTimeout(() => navigate('/'), 5000);
      } finally {
        setIsProcessing(false);
      }
    };
    
    processPayment();
  }, [searchParams, navigate, toast]);

  const handleStartAssessment = () => {
    if (!user) {
      // Build URL with access code and purchase data for pre-filling
      const params = new URLSearchParams({
        code: accessCode || '',
        flow: 'signup'
      });
      
      // Add purchase data if available
      if (purchaseData.email) params.append('email', purchaseData.email);
      if (purchaseData.firstName) params.append('firstName', purchaseData.firstName);
      if (purchaseData.lastName) params.append('lastName', purchaseData.lastName);
      
      navigate(`/auth?${params.toString()}`);
    } else {
      // User is authenticated - go directly to assessment with access code
      navigate(`/assessment?code=${accessCode}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        {isProcessing ? (
          <div className="py-10">
            <div className="animate-pulse flex flex-col items-center">
              <div className="rounded-full bg-primary/20 h-20 w-20 mb-4"></div>
              <div className="h-8 bg-primary/20 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-primary/20 rounded w-full mb-2"></div>
              <div className="h-4 bg-primary/20 rounded w-5/6"></div>
            </div>
          </div>
        ) : isComplete ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
            
            {accessCode && (
              <div className="mb-6">
                <p className="text-gray-600 mb-2">Your access code:</p>
                <div className="bg-gray-100 p-3 rounded font-mono text-lg tracking-wide">
                  {accessCode}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {searchParams.get('demo') === 'true' 
                    ? 'This is a demo access code for testing purposes only.'
                    : 'This code has also been sent to your email.'}
                </p>
              </div>
            )}
            
            <p className="text-gray-600 mb-8">
              {!user ? (
                <>
                  Thank you for your purchase! To start your assessment, you'll need to create an account first. 
                  {searchParams.get('demo') !== 'true' && ' Your purchase details will help pre-fill the registration form.'}
                </>
              ) : (
                searchParams.get('demo') === 'true' 
                  ? 'Thank you for trying our demo purchase flow. You can now start the assessment!'
                  : 'Thank you for your purchase. We\'ve sent your access code to your email. You can now start your assessment!'
              )}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleStartAssessment} 
                className="w-full flex items-center justify-center gap-2 bg-atlas-teal hover:bg-atlas-teal/90"
                size="lg"
              >
                {!user ? (
                  <>
                    Create Account & Start Assessment
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Start Assessment Now
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')} 
                className="w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Home
              </Button>
            </div>
          </>
        ) : (
          <div className="py-10">
            <h1 className="text-xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We were unable to process your payment. You will be redirected back to the homepage shortly.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              variant="secondary"
            >
              Return to Home Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
