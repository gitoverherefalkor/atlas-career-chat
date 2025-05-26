
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardCheck, MessageCircle, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-atlas-navy pt-20 pb-32">
      <div className="container-atlas">
        {/* Headings at the top */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-center lg:text-6xl">
            <span className="bg-gradient-to-r from-atlas-blue to-atlas-navy bg-clip-text text-transparent text-center">
              Stop Guessing. Start Thriving.
            </span>
          </h1>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center md:text-4xl">
            Discover your ideal career path
          </h2>
        </div>
        
        {/* Two columns layout */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left column: Woman image */}
          <div className="flex flex-col">
            <div className="relative rounded-lg overflow-hidden">
              <img src="/lovable-uploads/e7ac5431-129d-4524-81ab-eb01d34a3b11.png" alt="Woman at career crossroads" className="w-full object-cover rounded-lg shadow-md" />
              <div className="absolute inset-0 bg-gradient-to-t from-atlas-navy/40 to-transparent"></div>
            </div>
          </div>
          
          {/* Right column: Text and Cards */}
          <div className="flex flex-col">
            {/* Introductory text */}
            <div className="mb-8">
              <p className="text-lg text-gray-700 mb-6">
                <span className="font-bold">Many of us were influenced early on by school subjects, expectations, or limited options, leading to choices that shaped our studies, our first job, and eventually our career path.</span> As life unfolds and your interests, values, and priorities change, it's completely natural to question whether your current direction still fits.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Atlas Assessment makes professional career guidance more accessible and affordable, offering personalized insights based on who you are today.
              </p>
            </div>

            {/* Your Path to Clarity section */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Your Path to Clarity</h3>
              
              <div className="space-y-4">
                <Card className="border-l-4 border-l-atlas-blue">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <ClipboardCheck className="h-6 w-6 text-atlas-blue mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Complete Assessment</h4>
                        <p className="text-gray-600 text-sm">Take our comprehensive personality and career assessment</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-atlas-blue">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-6 w-6 text-atlas-blue mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Insights</h4>
                        <p className="text-gray-600 text-sm">Receive personalized career recommendations through AI chat</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-atlas-blue">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Target className="h-6 w-6 text-atlas-blue mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Take Action</h4>
                        <p className="text-gray-600 text-sm">Get actionable steps for your career transition</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* CTA buttons */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Button asChild className="btn-primary text-lg flex items-center justify-center gap-2 h-12">
                <a href="#pricing">
                  Get Your Atlas Assessment Now
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
              <a href="#how-it-works" className="btn-outline text-lg flex items-center justify-center h-12">
                Learn More
              </a>
            </div>
            <p className="text-slate-50 text-base text-center mt-4">
              Currently in Beta. Get full access at an introductory price.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
