
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import JobDissatisfactionStats from '@/components/JobDissatisfactionStats';
import WhatIsAtlas from '@/components/WhatIsAtlas';
import HowItWorks from '@/components/HowItWorks';
import WhyAtlas from '@/components/WhyAtlas';
import Pricing from '@/components/Pricing';
import Examples from '@/components/Examples';
import Testimonials from '@/components/Testimonials';
import About from '@/components/About';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <Hero />
        <JobDissatisfactionStats />
        <WhatIsAtlas />
        <HowItWorks />
        <WhyAtlas />
        <Pricing />
        <Examples />
        <Testimonials />
        <About />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
