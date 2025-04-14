
import React from 'react';

const NextSteps = () => {
  const steps = [
    {
      number: 1,
      title: "Purchase Your License Key",
      description: "Click the purchase button and securely buy your license key via Sendowl."
    },
    {
      number: 2,
      title: "Access Your Questionnaire",
      description: "You'll receive an email with your unique access key and a link to the Atlas Assessment questionnaire."
    },
    {
      number: 3,
      title: "Complete the Assessment",
      description: "Complete the questionnaire at your own pace, answering honestly for the most accurate results."
    },
    {
      number: 4,
      title: "Results Processing",
      description: "Once submitted, your results are processed (usually within minutes). You'll receive another email with a unique link to your personal, interactive AI chat report."
    },
    {
      number: 5,
      title: "Explore Your Insights",
      description: "Engage with your AI career coach! Explore your profile, ask questions, and discover your tailored recommendations. A summary of your key insights can also be requested via the chat."
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
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-shrink-0 items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-atlas-blue to-atlas-indigo text-white text-xl font-bold md:z-10">
                    {step.number}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NextSteps;
