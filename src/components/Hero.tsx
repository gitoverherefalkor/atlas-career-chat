
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
const Hero = () => {
  return <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-atlas-navy pt-20 pb-32">
      <div className="container-atlas">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Stop Guessing. <br />
              <span className="bg-gradient-to-r from-atlas-blue to-atlas-navy bg-clip-text text-transparent">
                Start Thriving.
              </span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800">
              Discover Your Ideal Career Path
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Atlas Assessment combines deep psychometric principles with state-of-the-art AI in a unique, interactive chat experience. Get personalized, actionable insights to navigate your professional future with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="btn-primary text-lg flex items-center gap-2">
                <a href="https://www.sendowl.com/s/consulting/career-assessment-personality-test-career-coaching/atlas-assessment-career-exploration-2025-regular-by-atlas-assessments/" target="_blank" rel="noopener noreferrer">
                  Get Your Atlas Assessment Now
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
              <a href="#how-it-works" className="btn-outline text-lg flex items-center justify-center">
                Learn More
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Currently in Beta. Get full access at an introductory price.
            </p>
          </div>
          <div className="lg:w-1/2">
            <div className="relative">
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
                    <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                      <p className="text-gray-800 text-base font-normal">
                        Hi, and great to have you here!<br /><br />
                        
                        Welcome to your career insights session. My goal is to walk you through your <strong>personality profile</strong> and career recommendations in a way that's clear, engaging, and actionable.<br /><br />
                        
                        Here's how this will work:<br />
                        - We'll start with a quick Executive Summary.<br />
                        - Then do a deeper dive into your <strong>Personality Insights</strong> - exploring what drives you, how you work best, and key takeaways that shape your career direction.<br /><br />
                        
                        Then, we'll move on to your <strong>Career matches</strong>:<br />
                        - Top 3 best fits<br />
                        - Suitable Runner-up suggestions<br />
                        - Some Out-of-the-box careers you might not have considered<br />
                        - And an assessment on your Dream job(s) you provided<br /><br />
                        
                        No need to take notes - you'll receive a full report with all the details at the end of this session!<br /><br />
                        
                        Feel free to ask anything along the way - whether it's clarification, exploring a career further, or sharing feedback on your results.<br /><br />
                        
                        Ok, let's get to it. Let me know when you're ready!
                      </p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 max-w-[80%] ml-auto">
                      <p className="text-gray-800">Can you tell me more about what specific career paths would fit these skills?</p>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;
