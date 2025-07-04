
import React from 'react';
import { MessageSquare, Target, Award, DollarSign, Zap, Briefcase } from 'lucide-react';

const WhyAtlas = () => {
  const features = [
    {
      icon: <MessageSquare className="h-6 w-6" color="#ffffff" />,
      title: "Interactive and Conversational",
      description: "Engage directly with your personalized AI-powered career coach. Ask follow-up questions and explore your results in depth.",
      bgColor: "bg-atlas-blue"
    },
    {
      icon: <Target className="h-6 w-6" color="#ffffff" />,
      title: "Practical and Actionable",
      description: "Clear explanations and realistic assessments tailored to your profile with concrete recommendations for industries, roles, and development opportunities.",
      bgColor: "bg-atlas-orange"
    },
    {
      icon: <Award className="h-6 w-6" color="#ffffff" />,
      title: "Expert-Driven and AI-Enhanced",
      description: "Designed by career professionals and continuously refined through advanced AI analysis that adapts to your unique profile and needs.",
      bgColor: "bg-atlas-navy"
    },
    {
      icon: <DollarSign className="h-6 w-6" color="#ffffff" />,
      title: "Affordable and Efficient",
      description: "Leveraging technology to provide premium career guidance at a fraction of traditional coaching costs, with immediate insights available anytime.",
      bgColor: "bg-atlas-teal"
    },
    {
      icon: <Zap className="h-6 w-6" color="#ffffff" />,
      title: "Modern Approach",
      description: "Addresses today's career challenges, focusing on adaptability, continuous learning, and finding fulfilling work in an ever-changing landscape.",
      bgColor: "bg-atlas-purple"
    },
    {
      icon: <Briefcase className="h-6 w-6" color="#ffffff" />,
      title: "Specific and personalized career matches",
      description: "Get clear, data-backed recommendations for real-world roles that align with your values, skills, preferences, and future goals.",
      bgColor: "bg-atlas-indigo"
    }
  ];

  return (
    <section id="why-atlas" className="section bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container-atlas">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-atlas-blue to-atlas-navy bg-clip-text text-transparent">
            Beyond Traditional Career Assessments
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-indigo mx-auto mb-6"></div>
          <p className="text-lg max-w-4xl mx-auto mb-8 text-gray-700">
            Traditional career assessments often leave you with overwhelming, static reports. Atlas Assessment offers a smarter, more engaging solution that combines AI analysis and expert guidance to uncover your ideal career paths.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className={`${feature.bgColor} rounded-full w-12 h-12 flex items-center justify-center mb-4 shadow-md`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-atlas-navy">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyAtlas;
