
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Clock, MessageSquare, FileText, ArrowRight, Upload } from 'lucide-react';
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

  const processSteps = [
    { icon: Upload, title: "Upload Resume (Optional)", desc: "Speed up your assessment with AI-powered resume analysis" },
    { icon: Clock, title: "AI Analysis", desc: "Your responses are immediately processed by our AI system" },
    { icon: MessageSquare, title: "AI Coaching Chat", desc: "Engage in interactive coaching to explore your results" },
    { icon: FileText, title: "Full Report", desc: "Get your comprehensive career guidance report" }
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

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Left Column: What You Get */}
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
                
                <div className="bg-atlas-teal/10 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-atlas-teal" />
                    <div>
                      <p className="font-semibold text-atlas-teal">Speed Up with Resume Upload</p>
                      <p className="text-sm text-gray-600">Upload your resume for AI-powered pre-filling and faster completion</p>
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleGetBetaAccess} className="w-full btn-primary text-lg py-6">
                  Get Beta Access Now
                </Button>
                
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Your journey begins here. After purchase, you'll receive immediate access to start your assessment.
                </p>
              </div>
            </div>

            {/* Right Column: What Happens Next */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl font-bold mb-4">What Happens After You Get Access?</h3>
                <p className="text-gray-600 mb-8">
                  Your investment in clarity delivers immediate results and actionable insights for your career future.
                </p>
              </div>

              <div className="space-y-4">
                {processSteps.map((step, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-atlas-blue to-atlas-indigo rounded-lg flex items-center justify-center flex-shrink-0">
                        <step.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                        <p className="text-gray-600 text-sm">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-atlas-blue/10 to-atlas-indigo/10 rounded-xl p-6 mt-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-bold mb-3">Professional-Grade Career Insights</h4>
                  <p className="text-gray-700 mb-4">
                    Get the clarity you need to make confident career decisions at a fraction of the cost of traditional career coaching.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-left">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Personalized Analysis</p>
                        <p className="text-xs text-gray-600">Tailored to your unique profile</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Interactive Coaching</p>
                        <p className="text-xs text-gray-600">AI-powered career guidance</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Actionable Insights</p>
                        <p className="text-xs text-gray-600">Clear next steps for your career</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
