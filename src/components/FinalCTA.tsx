import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const FinalCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUnlockInsights = () => {
    if (user) {
      // User is logged in, go to dashboard
      navigate('/dashboard');
    } else {
      // User is not logged in, go to payment/checkout page
      navigate('/payment');
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-atlas-blue via-atlas-navy to-atlas-navy text-white">
      <div className="container-atlas text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Take Control of Your Career?
        </h2>
        <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
          Get clarity and direction today. Secure your Atlas Assessment access code now and start your journey toward a more fulfilling professional future.
        </p>
        <Button 
          onClick={handleUnlockInsights}
          className="bg-white hover:bg-gray-100 text-atlas-navy text-lg py-6 px-10 inline-flex items-center gap-2"
        >
          Unlock Your Career Insights
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
};

export default FinalCTA;
