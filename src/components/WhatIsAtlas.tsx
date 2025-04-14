import React from 'react';

const WhatIsAtlas = () => {
  const features = [
    {
      title: "Combines Psychometrics and AI",
      description: "Integrates proven psychological assessment principles with cutting-edge artificial intelligence for unparalleled career insights.",
      image: "/images/feature-psychometrics-ai.svg"
    },
    {
      title: "Delivers Personalized Guidance",
      description: "Offers tailored recommendations and actionable steps based on your unique profile, helping you make informed career decisions.",
      image: "/images/feature-personalized-guidance.svg"
    },
    {
      title: "Provides an Interactive Experience",
      description: "Engages you in a dynamic chat format, allowing you to explore your results, ask questions, and gain deeper understanding.",
      image: "/images/feature-interactive-experience.svg"
    }
  ];

  return (
    <section className="section bg-gray-50">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What is Atlas Assessment?</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-indigo mx-auto"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Atlas Assessment is a revolutionary tool designed to provide you with personalized career insights through an engaging, AI-enhanced chat experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <img src={feature.image} alt={feature.title} className="h-20 w-20 mx-auto mb-4" />
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
                <h3 className="text-2xl font-bold mb-4">Unlock Your Potential</h3>
                <p className="text-gray-700 mb-6">
                  Discover your strengths, interests, and ideal career paths with our comprehensive assessment. Get ready to take control of your professional future.
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-6">
                  <li>Gain clarity on your skills and talents</li>
                  <li>Identify fulfilling career options</li>
                  <li>Receive actionable steps for growth</li>
                </ul>
                <button className="bg-atlas-blue hover:bg-atlas-indigo text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                  Start Exploring Now
                </button>
              </div>
              <div className="flex justify-center">
                <img src="/images/unlock-potential.svg" alt="Unlock Your Potential" className="max-w-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatIsAtlas;
