import React from 'react';

const About = () => {
  return (
    <section id="about" className="section bg-gray-50">
      <div className="container-atlas">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why We Built Atlas Assessment</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-navy mx-auto"></div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
              <div className="bg-gray-200 rounded-full w-24 h-24 flex items-center justify-center text-2xl font-bold text-gray-600 flex-shrink-0">
                SG
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Sjoerd Geurts</h3>
                <p className="text-gray-500">Founder, Falkor Atlas / Atlas Assessment</p>
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <p>
                Let's be direct: navigating your career path can be incredibly challenging. I've been there myself – questioning if I was in the right role, wondering what truly motivates me professionally. It's a struggle many of us face, seeing friends, family, or colleagues grapple with the same uncertainty: "What do I really want to do?"
              </p>
              
              <p>
                Traditional tools often felt impersonal, expensive, or didn't provide the clear, actionable steps needed to make a change. I saw a gap between the potential of psychometric insights and their practical application in people's lives.
              </p>
              
              <p>
                That's why Falkor Atlas created Atlas Assessment. Driven by personal experience and a belief in leveraging technology for good, we collaborated with experts in psychometrics and AI. Our goal was ambitious but clear: build a tool that is insightful, accessible, genuinely useful, and provides guidance in a dynamic, engaging way.
              </p>
              
              <p>
                Atlas Assessment is the result – a culmination of expertise, personal passion, and cutting-edge AI, designed to empower you to find professional fulfillment. We're not just providing data; we're providing a starting point for meaningful career exploration and action.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
