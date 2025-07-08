
import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, Lightbulb, Target, Star, TreePine, Mountain, Sunrise } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const HpTryout = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) observer.observe(heroRef.current);
    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Organic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Diagonal Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-900/50 to-slate-900/80"></div>
        
        {/* Diagonal Content Layout */}
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-12 gap-8 items-center min-h-screen">
            {/* Left Side - Angled Content */}
            <div className="col-span-12 lg:col-span-7 transform -skew-y-1 bg-gradient-to-r from-slate-800/80 to-transparent p-8 rounded-3xl backdrop-blur-sm">
              <div className="transform skew-y-1">
                <div className="flex items-center gap-3 mb-6">
                  <TreePine className="h-8 w-8 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold tracking-wide">ATLAS ASSESSMENT</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-400 to-violet-400">
                    Transform
                  </span>
                  <span className="block text-white">Your Career</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400">
                    Journey
                  </span>
                </h1>
                
                <p className="text-xl text-slate-300 mb-8 max-w-2xl">
                  Move beyond conventional career paths. Our AI-powered assessment reveals 
                  hidden opportunities that align with your authentic self.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-4 text-lg rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-2xl">
                    Begin Your Transformation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="outline" className="border-2 border-violet-400 text-violet-400 hover:bg-violet-400 hover:text-white px-8 py-4 text-lg rounded-2xl transform hover:scale-105 transition-all duration-300">
                    Explore the Journey
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Right Side - Floating Elements */}
            <div className="col-span-12 lg:col-span-5 relative">
              <div className="relative">
                {/* Floating Cards */}
                <Card className="absolute top-0 right-0 w-48 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm border-emerald-400/30 transform rotate-6 hover:rotate-12 transition-transform duration-500">
                  <CardContent className="p-4">
                    <Mountain className="h-8 w-8 text-emerald-400 mb-2" />
                    <p className="text-emerald-300 text-sm font-medium">Reach New Heights</p>
                  </CardContent>
                </Card>
                
                <Card className="absolute top-32 left-8 w-48 bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-sm border-amber-400/30 transform -rotate-6 hover:-rotate-12 transition-transform duration-500">
                  <CardContent className="p-4">
                    <Sunrise className="h-8 w-8 text-amber-400 mb-2" />
                    <p className="text-amber-300 text-sm font-medium">Dawn of Clarity</p>
                  </CardContent>
                </Card>
                
                <Card className="absolute top-64 right-12 w-48 bg-gradient-to-br from-violet-500/20 to-purple-600/20 backdrop-blur-sm border-violet-400/30 transform rotate-3 hover:rotate-6 transition-transform duration-500">
                  <CardContent className="p-4">
                    <Star className="h-8 w-8 text-violet-400 mb-2" />
                    <p className="text-violet-300 text-sm font-medium">Unlock Potential</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curved Section Divider */}
      <div className="relative -mt-20">
        <svg className="w-full h-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" 
                fill="rgb(15 23 42)" fillOpacity="0.8"></path>
        </svg>
      </div>

      {/* Journey Steps - Organic Flow */}
      <section ref={addToRefs} className="py-20 bg-slate-900/80 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-violet-400">
                Your Transformation Path
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              A personalized journey designed to uncover your authentic career direction
            </p>
          </div>

          {/* Diagonal Flow Layout */}
          <div className="relative">
            {/* Path Line */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-emerald-400 via-amber-400 to-violet-400 opacity-30 transform rotate-12"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
              {/* Step 1 - Offset up */}
              <div className="transform lg:-translate-y-8">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm border-emerald-400/30 hover:border-emerald-400/60 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Compass className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-400 mb-4">Discover</h3>
                    <p className="text-slate-300 leading-relaxed">
                      Deep psychological assessment that goes beyond surface-level career tests. 
                      Uncover your core values, hidden strengths, and authentic motivations.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Step 2 - Center */}
              <div className="transform lg:translate-y-0">
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 backdrop-blur-sm border-amber-400/30 hover:border-amber-400/60 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Lightbulb className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-amber-400 mb-4">Illuminate</h3>
                    <p className="text-slate-300 leading-relaxed">
                      AI-powered insights reveal unexpected career paths that perfectly align 
                      with your unique profile. See opportunities you never considered.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Step 3 - Offset down */}
              <div className="transform lg:translate-y-8">
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 backdrop-blur-sm border-violet-400/30 hover:border-violet-400/60 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-violet-400 mb-4">Transform</h3>
                    <p className="text-slate-300 leading-relaxed">
                      Get your personalized roadmap with concrete next steps. Interactive AI coaching 
                      guides your transition with confidence and clarity.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Organic Shape */}
      <section ref={addToRefs} className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/50 via-amber-900/50 to-violet-900/50"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-6xl font-bold mb-8">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-400 to-violet-400">
                Ready to Transform?
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands who've discovered their authentic career path. 
              Your transformation journey begins with a single step.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button className="bg-gradient-to-r from-emerald-500 via-amber-500 to-violet-500 hover:from-emerald-600 hover:via-amber-600 hover:to-violet-600 text-white px-12 py-6 text-xl rounded-full transform hover:scale-110 transition-all duration-300 shadow-2xl">
                Start Your Journey - €39
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
            
            <p className="text-slate-400 mt-8 text-sm">
              Beta access • 50% off regular price • Instant results
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HpTryout;
