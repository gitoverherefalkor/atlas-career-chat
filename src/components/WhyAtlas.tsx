
import React from 'react';
import { MessageSquare, Target, Award, DollarSign, Zap } from 'lucide-react';

const WhyAtlas = () => {
  const features = [
    {
      icon: <MessageSquare className="h-6 w-6" color="#EA7923" />,
      title: "Interactive & Dynamic",
      description: "Don't just read a report – discuss it! Our AI chat allows you to explore your profile in a conversational way, getting clarification and drilling down into what matters most to you."
    },
    {
      icon: <Target className="h-6 w-6" color="#EA7923" />,
      title: "Actionable Insights",
      description: "We focus on practical application. Get concrete recommendations for industries, roles, and development opportunities tailored to your unique profile."
    },
    {
      icon: <Award className="h-6 w-6" color="#EA7923" />,
      title: "Expert-Developed, AI-Enhanced",
      description: "Built upon proven psychometric principles with input from experienced practitioners, then supercharged with AI for deeper personalization and dynamic delivery."
    },
    {
      icon: <DollarSign className="h-6 w-6" color="#EA7923" />,
      title: "Affordable & Efficient",
      description: "Leveraging technology allows us to offer this powerful tool at a fraction of the cost of traditional, consultant-led assessments, especially during our Beta phase."
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Beyond Traditional Assessments</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-indigo mx-auto mb-6"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Traditional psychometric tests often provide lengthy, static reports that can be overwhelming and lack clear next steps. Atlas Assessment offers a smarter, more effective approach:
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
          <h3 className="text-2xl font-semibold mb-6 text-center">Our Scientific Approach</h3>
          <p className="text-lg text-center max-w-4xl mx-auto">
            Our methodology integrates established principles of personality and career assessment with cutting-edge Natural Language Processing (NLP) and machine learning techniques. This allows for a highly personalized interpretation and recommendation engine, validated through expert review and ongoing refinement based on user feedback and research.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhyAtlas;
