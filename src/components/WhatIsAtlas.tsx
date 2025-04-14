import React from 'react';
import { CheckCircle } from 'lucide-react';

const WhatIsAtlas = () => {
  return (
    <section id="what-is-atlas" className="section bg-gradient-to-r from-atlas-blue to-atlas-teal">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Understand Yourself, Define Your Future</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-indigo mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-lg mb-6">
              Atlas Assessment isn't just another personality test. It's a dynamic tool designed for the modern professional landscape. We move beyond static reports by providing your results through an interactive AI-powered career coach chat.
            </p>
            <p className="text-lg mb-8">
              Developed in collaboration with psychometric experts and leveraging advanced AI, AA provides a nuanced understanding of your strengths, work preferences, motivations, and potential career trajectories.
            </p>

            <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
              <h3 className="text-xl font-semibold mb-5">Is This For You?</h3>
              <p className="mb-4">Atlas Assessment is designed for anyone asking:</p>
              <ul className="space-y-3">
                {[
                  "\"Am I on the right career path?\"",
                  "\"What kind of work truly energizes me?\"",
                  "\"What are my core professional strengths and how can I use them?\"",
                  "\"How can I make a more informed decision about my next career move?\"",
                  "\"I need more than just a report; I want to explore my results.\""
                ].map((question, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                Whether you're a student planning your future, a professional feeling stuck, or simply curious about optimizing your career, Atlas Assessment offers clarity.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-atlas-teal/20 to-atlas-purple/20 rounded-lg transform -rotate-2"></div>
            <div className="relative bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <img 
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=600&h=400" 
                alt="Person using laptop for assessment" 
                className="w-full h-auto object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">Modern Assessment for Modern Careers</h3>
                <p>
                  Today's career landscape is complex and ever-changing. Atlas Assessment gives you personalized guidance that adapts to your unique situation and evolving goals.
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-primary/20 text-primary font-medium text-sm py-1 px-3 rounded-full">
                      AI-Enhanced
                    </div>
                    <div className="bg-atlas-purple/20 text-atlas-purple font-medium text-sm py-1 px-3 rounded-full ml-2">
                      Expert-Driven
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Beta Access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatIsAtlas;
