
import React from 'react';
import { ClipboardList, Brain, MessageSquare } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const HowItWorks = () => {
  const { ref: stepsRef, isVisible: stepsVisible } = useScrollAnimation(0.8);
  
  const steps = [{
    icon: <ClipboardList className="h-10 w-10 text-white" />,
    title: "Complete an Insightful Questionnaire",
    description: "Thoughtfully designed to capture your skills, interests, values, work style, and current life context (approximately 20 minutes).",
    color: "bg-atlas-blue"
  }, {
    icon: <Brain className="h-10 w-10 text-white" />,
    title: "AI-driven Expert Analysis",
    description: "Your responses are analyzed through advanced AI, developed in collaboration with career coaching professionals, generating your personalized career profile.",
    color: "bg-atlas-indigo"
  }, {
    icon: <MessageSquare className="h-10 w-10 text-white" />,
    title: "Interactive AI Career Coaching Chat",
    description: "Receive your personalized insights through an intuitive, interactive AI chat session. Explore detailed recommendations, realistic suitability analyses, and clear next steps to achieve your goals.",
    color: "bg-atlas-purple"
  }];

  return (
    <section id="how-it-works" className="section bg-gray-50">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Path to Clarity in 3 Steps</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-navy mx-auto"></div>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 mb-16">
          {/* Left column: 3 Steps - takes 2 columns */}
          <div ref={stepsRef} className="lg:col-span-2 space-y-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-1000 p-1 px-[10px] py-[6px] transform ${
                  stepsVisible 
                    ? 'translate-x-0 opacity-100' 
                    : '-translate-x-16 opacity-0'
                }`}
                style={{ 
                  transitionDelay: stepsVisible ? `${index * 400}ms` : '0ms' 
                }}
              >
                <div className="border border-gray-100 rounded-lg p-6 px-[12px]">
                  <div className="flex items-start gap-4">
                    <div className={`${step.color} rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0`}>
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3 text-lg">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right column: Chat Interface - takes 3 columns */}
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-sm font-medium text-gray-600 ml-2">Atlas Assessment Chat</span>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-800 font-medium mb-3">Hi, and great to have you here!</p>
                  <p className="text-sm text-gray-700 mb-4">
                    <span className="font-medium">Welcome to your career insights session.</span> My goal is to walk you through your personality profile and career recommendations in a way that's clear, engaging, and actionable.
                  </p>
                  <p className="text-sm text-gray-700 mb-4">Here's how this will work:</p>
                  <ul className="text-sm text-gray-700 space-y-1 mb-4">
                    <li>- We'll start with a quick Executive Summary.</li>
                    <li>- Then do a deeper dive into your <span className="font-medium">Personality Insights</span> - exploring what drives you, how you work best, and key takeaways that shape your career direction.</li>
                  </ul>
                  <p className="text-sm text-gray-700 mb-4">
                    Then, we'll move on to your <span className="font-medium">Career matches</span>:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 mb-4">
                    <li>- Top 3 best fits</li>
                    <li>- Suitable Runner-up suggestions</li>
                    <li>- Some Out-of-the-box careers you might not have considered</li>
                    <li>- And an assessment on your Dream job(s) you provided</li>
                  </ul>
                  <p className="text-sm text-gray-700 mb-4">
                    No need to take notes - you'll receive a full report with all the details at the end of this session!
                  </p>
                  <p className="text-sm text-gray-700 mb-4">
                    <span className="font-medium">Feel free to ask anything along the way</span> - whether it's clarification, exploring a career further, or sharing feedback on your results.
                  </p>
                  <p className="text-sm text-gray-700">Ok, let's get to it. Let me know when you're ready!</p>
                </div>
                
                <div className="bg-atlas-blue text-white rounded-lg p-4 ml-12">
                  <p className="text-sm">Sounds good. Let's go!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-atlas-blue to-atlas-navy rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-12 text-white">
            <div className="md:max-w-2xl mx-auto text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Start Your Journey Today</h3>
              <p className="text-lg mb-6 opacity-90">
                Take the first step toward understanding your ideal career path with Atlas Assessment. Get personalized insights that will guide your professional decisions.
              </p>
              <a 
                href="#pricing" 
                className="inline-flex items-center justify-center rounded-md text-lg bg-white text-atlas-indigo hover:bg-gray-100 font-semibold py-3 px-8 transition-colors"
              >
                Get Started Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
