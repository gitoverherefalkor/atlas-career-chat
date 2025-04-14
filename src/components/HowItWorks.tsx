import React from 'react';
import { ClipboardList, Brain, MessageSquare } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <ClipboardList className="h-10 w-10 text-white" />,
      title: "Complete the Insightful Questionnaire",
      description: "Answer a series of carefully crafted questions designed to understand your skills, interests, values, and working style. Takes approximately 20 minutes to complete.",
      color: "bg-atlas-blue"
    },
    {
      icon: <Brain className="h-10 w-10 text-white" />,
      title: "Expert-Informed AI Analysis",
      description: "Our system, built on established psychometric frameworks and enhanced by AI, analyzes your responses to create a detailed, personalized profile.",
      color: "bg-atlas-indigo"
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-white" />,
      title: "Engage with Your AI Career Coach",
      description: "Receive a link to a private, interactive chat session. Here, your results are presented dynamically. Ask questions, explore specific areas deeper, and receive tailored career recommendations.",
      color: "bg-atlas-purple"
    }
  ];

  return (
    <section id="how-it-works" className="section bg-gray-50">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Path to Clarity in 3 Steps</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-navy mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-1">
              <div className="border border-gray-100 rounded-lg p-6">
                <div className={`${step.color} rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">{step.title}</h3>
                <p className="text-gray-600 text-center">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-atlas-blue to-atlas-navy rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-12 text-white">
            <div className="md:max-w-2xl mx-auto text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Start Your Journey Today</h3>
              <p className="text-lg mb-6 opacity-90">
                Take the first step toward understanding your ideal career path with Atlas Assessment. Get personalized insights that will guide your professional decisions.
              </p>
              <button className="inline-flex items-center justify-center rounded-md text-lg bg-white text-atlas-indigo hover:bg-gray-100 font-semibold py-3 px-8 transition-colors">
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
