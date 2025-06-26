
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

const PurchaseAccessButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();

  const handlePurchase = async () => {
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Please make sure you're logged in and your profile is loaded.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Creating checkout session for user:", user.email);
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          firstName: profile.first_name || 'User',
          lastName: profile.last_name || '',
          email: user.email,
          country: 'Netherlands', // Default country - could be made dynamic
        },
      });

      if (error) {
        console.error("Checkout error:", error);
        throw new Error(error.message);
      }

      if (!data?.url) {
        throw new Error("Failed to create checkout session");
      }

      console.log("Redirecting to checkout:", data.url);
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
      
    } catch (error) {
      console.error("Purchase error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handlePurchase}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-full">
            <ShoppingCart className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Purchase Assessment Access</h3>
            <p className="text-sm text-gray-600">Get your access code to start the assessment - €39.00</p>
          </div>
          <Button disabled={isLoading} variant="outline">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Purchase'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseAccessButton;
