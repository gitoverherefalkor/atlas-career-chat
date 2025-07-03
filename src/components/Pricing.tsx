
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const features = [
    "Analyses adjusted to your primary goals",
    "Top 3 suggestions + 7 runner-ups + 3 out-of-the-box careers",
    "Tailored dynamic AI coaching chat",
    "Ask follows up Q's and role deep dives",
    "Clear, actionable insights and recommendations",
    "Localized role nuances & salary ranges",
    "Strengths & growth strategies",
    "AI impact rating on suggested roles",
    "Bonus: Realistic dream job pivot assessment"
  ];

  const clarityFeatures = [
    {
      title: "Personalized Analysis",
      description: "Tailored to your unique profile"
    },
    {
      title: "Interactive Coaching",
      description: "AI-powered career guidance"
    },
    {
      title: "Actionable Insights",
      description: "Clear next steps for your career"
    }
  ];

  const handleGetBetaAccess = () => {
    if (user) {
      // User is logged in, go to dashboard
      navigate('/dashboard');
    } else {
      // User is not logged in, go to auth page with signup flow
      navigate('/auth?flow=signup');
    }
  };

  return (
    <section id="pricing" className="section bg-gray-50">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Invest in Your Future - Beta Access</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-indigo mx-auto mb-6"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Atlas Assessment is currently available as a beta version, giving you early access at an introductory price. Your insights and feedback will help shape the future of personalized career guidance.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Pricing Card */}
          <div className="max-w-xl mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-atlas-blue to-atlas-indigo p-6 text-white text-center">
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full py-1 px-3 mb-4">
                  <Star className="h-4 w-4" fill="currentColor" />
                  <span className="font-medium">Beta Access</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Complete Atlas Assessment</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold">€39</span>
                  <span className="text-lg ml-2 opacity-80"><s>€79</s></span>
                </div>
                <p className="mt-2 opacity-80">Limited time introductory price</p>
              </div>
              
              <div className="p-8">
                <ul className="space-y-4 mb-8">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button onClick={handleGetBetaAccess} className="w-full btn-primary text-lg py-6">
                  Get Beta Access Now
                </Button>
                
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Your journey begins here. After purchase, you'll receive immediate access to the questionnaire, get quick results, and start your interactive AI coaching session.
                </p>
              </div>
            </div>
          </div>

          {/* Investment in Clarity Section */}
          <div className="max-w-xl mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl shadow-xl p-8 h-full flex flex-col justify-center">
              <div className="text-center mb-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Your Investment in Clarity</h3>
                <p className="text-lg text-gray-700 mb-8">
                  Atlas Assessment provides you with professional-grade career insights at a fraction of the cost of traditional career coaching. 
                  Get the clarity you need to make confident career decisions.
                </p>
              </div>
              
              <div className="space-y-6">
                {clarityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">{feature.title}</p>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
