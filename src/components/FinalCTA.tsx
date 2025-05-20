
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CheckoutForm } from './CheckoutForm';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FinalCTA = () => {
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const navigate = useNavigate();

  // Function for demo mode without Stripe
  const handleDemoCheckout = () => {
    toast.success("Demo purchase successful! Redirecting to success page...");
    setTimeout(() => {
      navigate('/payment-success?demo=true');
    }, 1500);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-atlas-blue via-atlas-navy to-atlas-navy text-white">
      <div className="container-atlas text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Take Control of Your Career Narrative?
        </h2>
        <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
          Get the clarity and direction you need. Purchase your Atlas Assessment license key today and start your journey towards a more fulfilling professional future.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white hover:bg-gray-100 text-atlas-navy text-lg py-6 px-10 inline-flex items-center gap-2">
                Unlock Your Career Insights
                <ArrowRight className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Complete Your Purchase</DialogTitle>
                <DialogDescription>
                  Enter your details to receive your Atlas Assessment access code.
                </DialogDescription>
              </DialogHeader>
              <CheckoutForm />
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            className="bg-transparent hover:bg-white/10 border-white text-white text-lg py-6 px-6"
            onClick={handleDemoCheckout}
          >
            Demo Purchase (No Payment)
          </Button>
        </div>
        
        <p className="text-sm mt-6 opacity-80">
          Having trouble with checkout? Try the demo option to test the experience.
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
