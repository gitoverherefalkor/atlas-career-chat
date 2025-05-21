import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
const Hero = () => {
  return <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-atlas-navy pt-20 pb-32">
      <div className="container-atlas">
        {/* Headings at the top */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-center lg:text-6xl">
            <span className="bg-gradient-to-r from-atlas-blue to-atlas-navy bg-clip-text text-transparent text-center">
              Stop Guessing. Start Thriving.
            </span>
          </h1>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center md:text-4xl">
            Discover Your Ideal Career Path
          </h2>
        </div>
        
        {/* Two columns with images aligned at top */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left column: Image */}
          <div className="flex flex-col">
            {/* Woman image */}
            <div className="relative rounded-lg overflow-hidden mb-8">
              <img src="/lovable-uploads/e7ac5431-129d-4524-81ab-eb01d34a3b11.png" alt="Woman at career crossroads" className="w-full object-cover rounded-lg shadow-md" />
              <div className="absolute inset-0 bg-gradient-to-t from-atlas-navy/40 to-transparent"></div>
            </div>
            
            {/* Paragraphs under image */}
            <div>
              <p className="text-lg text-gray-700 mb-6 font-bold">
                Many of us chose our career path as teenagers, long before truly knowing ourselves. As life evolves with new interests and values, it's natural to question your current direction.
              </p>
              <p className="text-lg text-gray-700">
                Atlas Assessment makes professional career guidance more accessible and affordable, giving you personalized insights tailored to who you are today.
              </p>
            </div>
          </div>
          
          {/* Right column: Chat example and CTA */}
          <div className="flex flex-col">
            {/* Chat example aligned with woman image */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-atlas-blue/20 to-atlas-navy/20 rounded-lg transform rotate-3"></div>
              <div className="relative bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <div className="ml-2 text-sm text-gray-500">Atlas Assessment Chat</div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4 max-w-[80%] px-[2px]">
                      <p className="text-gray-800 text-base font-normal px-[12px]">
                        Hi, and great to have you here!<br /><br />
                        
                        <strong>Welcome to your career insights session.</strong> My goal is to walk you through your personality profile and career recommendations in a way that's clear, engaging, and actionable.<br /><br />
                        
                        Here's how this will work:<br />
                        - We'll start with a quick Executive Summary.<br />
                        - Then do a deeper dive into your <strong>Personality Insights</strong> - exploring what drives you, how you work best, and key takeaways that shape your career direction.<br /><br />
                        
                        Then, we'll move on to your <strong>Career matches</strong>:<br />
                        - Top 3 best fits<br />
                        - Suitable Runner-up suggestions<br />
                        - Some Out-of-the-box careers you might not have considered<br />
                        - And an assessment on your Dream job(s) you provided<br /><br />
                        
                        No need to take notes - you'll receive a full report with all the details at the end of this session!<br /><br />
                        
                        <strong>Feel free to ask anything along the way</strong> - whether it's clarification, exploring a career further, or sharing feedback on your results.<br /><br />
                        
                        Ok, let's get to it. Let me know when you're ready!
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 max-w-[80%] ml-auto">
                      <p className="text-gray-800">Sounds good. Let's go!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CTA buttons aligned with paragraphs */}
            <div className="flex flex-col">
              <Button asChild className="btn-primary text-lg flex items-center gap-2 mb-4">
                <a href="#pricing">
                  Get Your Atlas Assessment Now
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
              <a href="#how-it-works" className="btn-outline text-lg flex items-center justify-center mb-4">
                Learn More
              </a>
              <p className="text-slate-50 text-base text-center">
                Currently in Beta. Get full access at an introductory price.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;