
import React from 'react';
import { Code2, Lightbulb, Briefcase, MessageSquare, Settings } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
const WhatIsAtlas = () => {
  const cards = [{
    icon: <Briefcase className="h-8 w-8 text-atlas-orange" />,
    title: "Tailored to business professionals",
    description: "Built for office and knowledge workers in corporate, tech, finance, and service industries. Assessment for different professions are in development."
  }, {
    icon: <Lightbulb className="h-8 w-8 text-atlas-orange" />,
    title: "Insightful and Personalized",
    description: "Atlas doesn't just tell you what you're good at, it connects the dots to specific career paths that align with your skills, values, and goals."
  }, {
    icon: <MessageSquare className="h-8 w-8 text-atlas-orange" />,
    title: "Interactive AI Coaching",
    description: "Unlike static reports, Atlas provides a conversational AI coach that explains your results, answers follow-up questions, and offers tailored guidance."
  }, {
    icon: <Settings className="h-8 w-8 text-atlas-orange" />,
    title: "Practical and Actionable",
    description: "Get concrete role recommendations with clear explanations of why they match your profile, allowing you to make informed career decisions with confidence."
  }];
  return <section id="what-is-atlas" className="section">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What is Atlas Assessment?</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-indigo mx-auto mb-6"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">Atlas Assessments provides advanced AI career guidance systems that combine psychological insights with practical career mapping to help you find fulfilling work that aligns with your unique profile.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {cards.map((card, index) => <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex flex-col items-center text-center md:items-start md:text-left md:flex-row">
                <div className="mb-4 md:mb-0 md:mr-6">{card.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                  <p className="text-gray-600">{card.description}</p>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </section>;
};
export default WhatIsAtlas;
