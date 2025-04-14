
import React from 'react';
import { ShoppingCart, Mail, ClipboardCheck, Search, Sparkles, FileText } from 'lucide-react';

const NextSteps = () => {
  const steps = [
    {
      icon: ShoppingCart,
      title: "Purchase Your License Key",
      description: "Click the purchase button and securely buy your license key"
    },
    {
      icon: Mail,
      title: "Access Your Questionnaire",
      description: "Find your unique access key and a link to the Atlas Assessment questionnaire in your email"
    },
    {
      icon: ClipboardCheck,
      title: "Complete the Assessment",
      description: "Complete the questionnaire at your own pace, answering honestly for the most accurate results."
    },
    {
      icon: Search,
      title: "Results Processing",
      description: "Once submitted, your results are processed (usually within minutes). You'll receive another email with a unique link to your personal, interactive AI chat report."
    },
    {
      icon: Sparkles,
      title: "Explore Your Insights",
      description: "Engage with your AI career coach! Explore your profile, ask questions, and discover your tailored career recommendations. - Top fits, runner-ups, out of the box and dream job assessment."
    },
    {
      icon: FileText,
      title: "Receive Your Consolidated Report",
      description: "Find the final Atlas Assessment Report, now with the nuances and specific insights discussed during your AI coaching session, in your email – a valuable, personalized reference for your ongoing career exploration and planning."
    }
  ];

  return (
    <section className="section bg-white">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Journey Starts Here</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-indigo mx-auto"></div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-200 hidden md:block"></div>
            
            {/* Steps */}
            <div className="space-y-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-shrink-0 items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-atlas-blue to-atlas-indigo text-white md:z-10">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NextSteps;
