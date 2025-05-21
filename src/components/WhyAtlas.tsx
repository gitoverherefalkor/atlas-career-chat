
import React from 'react';
import { MessageSquare, Target, Award, DollarSign, Zap } from 'lucide-react';

const WhyAtlas = () => {
  const features = [
    {
      icon: <MessageSquare className="h-6 w-6" color="#EA7923" />,
      title: "Interactive and Conversational",
      description: "Engage directly with your personalized AI-powered career coach. Ask follow-up questions and explore your results in depth."
    },
    {
      icon: <Target className="h-6 w-6" color="#EA7923" />,
      title: "Practical and Actionable",
      description: "Clear explanations and realistic assessments tailored to your profile with concrete recommendations for industries, roles, and development opportunities."
    },
    {
      icon: <Award className="h-6 w-6" color="#EA7923" />,
      title: "Expert-Driven and AI-Enhanced",
      description: "Designed by career professionals and continuously refined through advanced AI analysis that adapts to your unique profile and needs."
    },
    {
      icon: <DollarSign className="h-6 w-6" color="#EA7923" />,
      title: "Affordable and Efficient",
      description: "Leveraging technology for an accessible premium service at an introductory beta rate - a fraction of traditional career coaching costs."
    },
    {
      icon: <Zap className="h-6 w-6" color="#EA7923" />,
      title: "Modern Approach",
      description: "Addresses today's career challenges, focusing on adaptability, continuous learning, and finding fulfilling work in an ever-changing landscape."
    }
  ];

  return (
    <section id="why-atlas" className="section bg-white">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Beyond Traditional Career Assessments</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-indigo mx-auto mb-6"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Traditional career assessments often leave you with overwhelming, static reports. Atlas Assessment offers a smarter, more engaging solution:
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="bg-blue-50 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gray-50 rounded-xl p-8 border border-gray-100">
          <h3 className="text-2xl font-semibold mb-6 text-center">Our Approach</h3>
          <p className="text-lg text-center max-w-4xl mx-auto">
            Our approach combines established career coaching methodologies with innovative AI technologies, ensuring customized, accurate, and continually improving career guidance.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhyAtlas;
