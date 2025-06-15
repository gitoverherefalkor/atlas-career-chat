
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardCheck, MessageCircle, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Hero = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();

  return (
    <section 
      ref={heroRef}
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-atlas-navy pt-20 pb-32 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-atlas-blue rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-atlas-purple rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-atlas-teal rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container-atlas relative z-10">
        {/* Headings at the top */}
        <div className={`mb-10 transition-all duration-1000 transform ${heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-center lg:text-6xl">
            <span className="bg-gradient-to-r from-atlas-blue to-atlas-navy bg-clip-text text-transparent text-center">
              Stop Guessing. Start Thriving.
            </span>
          </h1>
          <h2 className={`text-2xl font-semibold mb-6 text-gray-800 text-center py-[40px] md:text-4xl transition-all duration-1000 transform ${heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            Discover your ideal career path
          </h2>
        </div>
        
        {/* Two columns layout */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left column: Woman image */}
          <div className={`flex flex-col transition-all duration-1000 transform ${heroVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
            <div className="relative rounded-lg overflow-hidden group">
              <img 
                src="/lovable-uploads/e7ac5431-129d-4524-81ab-eb01d34a3b11.png" 
                alt="Woman at career crossroads" 
                className="w-full object-cover rounded-lg shadow-md transition-transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-atlas-navy/40 to-transparent py-0 transition-opacity duration-300 group-hover:opacity-75"></div>
            </div>
          </div>
          
          {/* Right column: Text and Cards */}
          <div className={`flex flex-col py-0 transition-all duration-1000 transform ${heroVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`} style={{ transitionDelay: '600ms' }}>
            {/* Introductory text */}
            <div className="mb-8">
              <p className="text-lg text-gray-700 mb-6">
                <span className="font-bold text-xl">Many of us were influenced early on by school subjects, expectations, or limited options, leading to choices that shaped our studies, our first job, and eventually our career path.</span>
              </p>
              <p className="text-lg text-gray-700 mb-6">
                As life unfolds and your interests, values, and priorities change, it's completely natural to question whether your current direction still fits.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Atlas Assessment makes professional career guidance more accessible and affordable, offering personalized insights based on who you are today.
              </p>
            </div>

            {/* Your Path to Clarity section - moved to top (was orange bordered) */}
            <div className="space-y-4 my-0 px-0 py-0 mb-8 border-2 border-atlas-orange rounded-lg p-6">
              {[
                { icon: ClipboardCheck, title: "Complete Assessment", desc: "Take our comprehensive personality and career assessment" },
                { icon: MessageCircle, title: "AI-Powered Insights", desc: "Receive personalized career recommendations through AI chat" },
                { icon: Target, title: "Take Action", desc: "Get actionable steps for your career transition" }
              ].map((item, index) => (
                <Card key={index} className="border-l-4 border-l-atlas-blue transform transition-all duration-700 hover:scale-105 hover:shadow-lg hover:border-l-atlas-teal">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <item.icon className="h-6 w-6 text-atlas-blue mt-1 flex-shrink-0 transition-colors duration-300" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1 text-lg">{item.title}</h4>
                        <p className="text-gray-600 text-base">{item.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA buttons and beta text - moved to bottom (was blue background) */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-atlas-navy rounded-lg p-6 border-2 border-atlas-blue">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <Button asChild className="btn-primary text-lg flex items-center justify-center gap-2 h-12 col-span-3 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <a href="#pricing" className="py-0">
                    Get Your Atlas Assessment Now
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </Button>
                <a href="#how-it-works" className="btn-outline text-sm flex items-center justify-center h-12 col-span-1 transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                  Learn More
                </a>
              </div>
              <p className="text-white text-center text-lg">
                Currently in Beta. Get full access at an introductory price.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
