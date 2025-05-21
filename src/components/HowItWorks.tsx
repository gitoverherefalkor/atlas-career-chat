
import React from 'react';
import { ClipboardList, Brain, MessageSquare } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <ClipboardList className="h-10 w-10 text-white" />,
      title: "Complete an Insightful Questionnaire",
      description: "Thoughtfully designed to capture your skills, interests, values, work style, and current life context (approximately 20 minutes).",
      color: "bg-atlas-blue"
    },
    {
      icon: <Brain className="h-10 w-10 text-white" />,
      title: "AI-driven Expert Analysis",
      description: "Your responses are analyzed through advanced AI, developed in collaboration with career coaching professionals, generating your personalized career profile.",
      color: "bg-atlas-indigo"
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-white" />,
      title: "Interactive AI Career Coaching Chat",
      description: "Receive your personalized insights through an intuitive, interactive AI chat session. Explore detailed recommendations, realistic suitability analyses, and clear next steps to achieve your goals.",
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
