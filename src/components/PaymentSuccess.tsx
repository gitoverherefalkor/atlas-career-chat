
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
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
            <p className="text-gray-600 mb-8">
              Thank you for your purchase. We've sent your access code to your email. 
              Please check your inbox (and spam folder) for instructions on how to access your assessment.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Home
            </Button>
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
