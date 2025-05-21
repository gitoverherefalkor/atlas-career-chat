
import React from 'react';
import { Brain, BookUser, MessageSquare, CheckCircle } from 'lucide-react';

const WhatIsAtlas = () => {
  const features = [
    {
      title: "Combines Psychometrics and AI",
      description: "Integrates proven psychological assessment principles with cutting-edge artificial intelligence for unparalleled career insights.",
      icon: <Brain className="w-12 h-12 text-atlas-blue" />
    },
    {
      title: "Delivers Personalized Guidance",
      description: "Offers tailored recommendations and actionable steps based on your unique profile, helping you make informed career decisions.",
      icon: <BookUser className="w-12 h-12 text-atlas-blue" />
    },
    {
      title: "Provides an Interactive Experience",
      description: "Engages you in a dynamic chat format, allowing you to explore your results, ask questions, and gain deeper understanding.",
      icon: <MessageSquare className="w-12 h-12 text-atlas-blue" />
    }
  ];

  const isForYou = [
    "Considering a career shift better suited to your current skills, interests, or life circumstances.",
    "Exploring advancement or promotion opportunities within your current industry.",
    "Re-evaluating your work preferences and values to achieve better work-life balance.",
    "Identifying your core strengths and areas where professional growth is possible.",
    "Feeling burnout or dissatisfaction in your current role and seeking meaningful change.",
    "Concerned about job security in the face of AI-driven automation and looking for resilient career options."
  ];

  return (
    <section className="section bg-gray-50">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Understand yourself, define your future.</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-indigo mx-auto"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Atlas Assessment isn't just another internet career quiz. It's a personalized, dynamic experience designed for the realities of today's rapidly evolving job market. Instead of static reports, you'll receive interactive insights and actionable advice through an AI-powered career coaching session.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center">{feature.title}</h3>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-atlas-teal/20 to-atlas-purple/20 rounded-lg transform -rotate-2"></div>
          <div className="relative bg-white rounded-xl shadow-lg p-8 md:p-12 mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Is This For You?</h3>
                <p className="text-gray-700 mb-6">
                  Crafted by experienced career coaches and enhanced by advanced AI analysis, Atlas provides in-depth insights into your strengths, motivations, values, and potential career paths. Every recommended career includes detailed explanations of why each job aligns specifically with your profile, clarifies the role's responsibilities, identifies the most suitable type of organization, and assesses how future-proof it is in an AI-affected workplace.
                </p>
                <p className="text-gray-700 mb-6">
                  Atlas Assessment is particularly valuable if you're:
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  {isForYou.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-atlas-blue mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="bg-atlas-blue hover:bg-atlas-indigo text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                  Start Exploring Now
                </button>
              </div>
              <div className="flex justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80" 
                  alt="Foggy mountain path representing career choices and decisions" 
                  className="max-w-md rounded-lg shadow-lg" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatIsAtlas;
