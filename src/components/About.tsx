
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
              <Avatar className="w-24 h-24 border-2 border-gray-200">
                <AvatarImage src="/lovable-uploads/b98f8149-b536-4651-8f90-8dc8870880d0.png" alt="Sjoerd Geurts" />
                <AvatarFallback className="bg-gray-200 text-2xl font-bold text-gray-600">SG</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Sjoerd Geurts</h3>
                <p className="text-gray-500">Founder, Atlas Assessment</p>
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <p>
                Navigating your career path can feel uncertain and daunting, especially with early life decisions, evolving personal circumstances, and today's unpredictable job market pressures. We understand firsthand how confusing it can be to reassess career choices made at a young age or to face new challenges brought about by life changes and technological disruption.
              </p>
              
              <p>
                Atlas Assessment was created to provide clear, empathetic, and actionable career guidance. It's designed not just to deliver insights, but to initiate meaningful career exploration tailored to the evolving realities of your personal and professional life.
              </p>
            </div>

            <div className="mt-10 bg-gray-50 rounded-xl p-8 border border-gray-100">
              <h3 className="text-2xl font-semibold mb-6 text-center">Our Approach</h3>
              <p className="text-lg text-center max-w-4xl mx-auto">
                Our approach combines established career coaching methodologies with innovative AI technologies, ensuring customized, accurate, and continually improving career guidance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
