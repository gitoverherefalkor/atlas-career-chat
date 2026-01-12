import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  BrainCircuit,
  ChevronRight,
  Target,
  MessageSquare,
  FileText,
  Zap,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Star,
  Layers,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  Sparkles,
  BarChart3,
  Globe,
  Compass,
  Lightbulb,
  Heart,
  Crown,
  MousePointer2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// TypeScript Interfaces
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  light?: boolean;
  center?: boolean;
  id?: string;
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

// --- Neural Pop Career Visual (Hero) ---
// Features optimized exclusion zones and balanced spawn rates
const CareerOrbit = () => {
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [activeItems, setActiveItems] = useState<Array<{ id: number; label: string; x: number; y: number }>>([]);
  const [categoryVisible, setCategoryVisible] = useState(true);
  const [lastZone, setLastZone] = useState(-1);

  const categories = useMemo(() => [
    {
      id: "top",
      title: "Top careers",
      subtitle: "High Alignment",
      icon: Crown,
      color: "#27A1A1",
      careers: ["AI Product Manager", "Business Transformation Consultant", "Employee Experience Architect", "Chief of Staff", "Enterprise Solutions Architect"]
    },
    {
      id: "runner",
      title: "runner-up careers",
      subtitle: "High Potential",
      icon: Target,
      color: "#3989AF",
      careers: ["Innovation Program Manager", "Customer Success Director", "Change Management Consultant", "Product Marketing Manager", "Skills Navigator/Talent Architect"]
    },
    {
      id: "box",
      title: "outside the box",
      subtitle: "Unique Fit",
      icon: Lightbulb,
      color: "#D4A024",
      careers: ["Storytelling Lead", "Executive Coach", "Future Strategist", "Culture Architect", "Workplace Designer"]
    },
    {
      id: "dream",
      title: "Dream job evaluation",
      subtitle: "Personal Passion",
      icon: Heart,
      color: "#E11D48",
      careers: ["Podcaster / Content Creator", "Relationship Therapist", "Travel Writer", "Cooking Class Instructor", "Documentary Filmmaker"]
    }
  ], []);

  useEffect(() => {
    const categoryTimer = setInterval(() => {
      setCategoryVisible(false);
      setTimeout(() => {
        setCategoryIndex((prev) => (prev + 1) % categories.length);
        setCategoryVisible(true);
        setActiveItems([]);
      }, 1000);
    }, 8500);
    return () => clearInterval(categoryTimer);
  }, [categories]);

  const spawnItem = useCallback(() => {
    if (!categoryVisible) return;
    const category = categories[categoryIndex];
    const label = category.careers[Math.floor(Math.random() * category.careers.length)];

    // Quadrant Logic with Strict Central Exclusion Zones
    let zone = Math.floor(Math.random() * 4);
    if (zone === lastZone) zone = (zone + 1) % 4;
    setLastZone(zone);

    let x, y;
    const jitter = () => Math.random() * 8;

    switch(zone) {
      case 0: x = -42 + jitter(); y = -30 + jitter(); break; // Top Left
      case 1: x = 32 + jitter(); y = -30 + jitter(); break; // Top Right
      case 2: x = 38 + jitter(); y = 10 + jitter(); break; // Mid Right
      case 3: x = -48 + jitter(); y = 10 + jitter(); break; // Mid Left
      default: x = 0; y = 0;
    }

    const newItem = { id: Math.random(), label, x, y };
    setActiveItems(prev => [...prev.slice(-2), newItem]); // Max 3 active for visual clarity
  }, [categoryIndex, categoryVisible, categories, lastZone]);

  useEffect(() => {
    const spawnTimer = setInterval(spawnItem, 1800); // Balanced processing speed
    return () => clearInterval(spawnTimer);
  }, [spawnItem]);

  const activeCategory = categories[categoryIndex];
  const ActiveIcon = activeCategory.icon;

  return (
    <div className="relative w-full h-[450px] md:h-[550px] flex items-center justify-center overflow-visible select-none">
      {/* Central Hub Area */}
      <div className="relative z-20 flex flex-col items-center">
        <div
          className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center border border-white/10 transition-all duration-1000 shadow-2xl mb-8 ${categoryVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
          style={{
            background: `radial-gradient(circle at center, ${activeCategory.color}cc, #012F64)`,
            boxShadow: `0 0 60px ${activeCategory.color}33`
          }}
        >
          <ActiveIcon className="text-white w-12 h-12 md:w-16 md:h-16" />
        </div>

        <div className={`text-center transition-all duration-1000 ${categoryVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-2 bg-white/5 border border-white/10" style={{ color: activeCategory.color }}>
            {activeCategory.subtitle}
          </div>
          <h3 className="text-white text-2xl md:text-3xl font-black tracking-tighter uppercase leading-tight">
            {activeCategory.title}
          </h3>
        </div>
      </div>

      {/* Pop Animation Elements */}
      {activeItems.map((item) => (
        <div
          key={item.id}
          className="absolute z-10 pointer-events-none animate-neural-pop"
          style={{ left: `calc(50% + ${item.x}%)`, top: `calc(50% + ${item.y}%)` }}
        >
          <div
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl flex items-center gap-2"
            style={{ borderLeft: `3px solid ${activeCategory.color}` }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeCategory.color }} />
            <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest whitespace-nowrap">
              {item.label}
            </span>
          </div>
        </div>
      ))}

      <div className="absolute inset-0 blur-[120px] rounded-full opacity-20 transition-all duration-1000 pointer-events-none" style={{ backgroundColor: activeCategory.color }} />

      <style>{`
        @keyframes neural-pop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
        }
        .animate-neural-pop {
          animation: neural-pop 3.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

// --- Reusable UI Elements ---
const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-[#27A1A1] hover:bg-[#1f8282] text-white shadow-lg shadow-teal-900/40 hover:-translate-y-0.5',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm',
    outline: 'border-2 border-[#3989AF] text-[#3989AF] hover:bg-[#3989AF] hover:text-white',
  };
  return (
    <button className={`px-8 py-4 rounded-full font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle, light = false, center = false, id }) => (
  <div id={id} className={`mb-16 scroll-mt-24 ${center ? 'text-center mx-auto' : 'text-left'}`}>
    <h2 className={`text-4xl md:text-5xl font-black mb-6 leading-tight ${light ? 'text-white' : 'text-[#012F64]'}`}>
      {title}
    </h2>
    {subtitle && <p className={`text-xl max-w-2xl ${center ? 'mx-auto' : ''} ${light ? 'text-blue-100/70' : 'text-gray-500 font-medium'}`}>{subtitle}</p>}
  </div>
);

const GlassCard: React.FC<GlassCardProps> = ({ children, className = "" }) => (
  <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- Main Page Component ---
const Index = () => {
  const [scrolled, setScrolled] = useState(false);
  const [founderExpanded, setFounderExpanded] = useState(false);
  const [infographicExpanded, setInfographicExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "Problem", href: "#problem" },
    { name: "Solution", href: "#solution" },
    { name: "Process", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "About", href: "#About" }
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/payment');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-[#374151] font-sans selection:bg-[#27A1A1] selection:text-white overflow-x-hidden">

      {/* Navigation */}
      <nav className={`fixed w-full z-[100] transition-all duration-500 ${scrolled ? 'bg-[#012F64]/95 backdrop-blur-xl py-4 shadow-2xl border-b border-white/5' : 'bg-transparent py-8'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 bg-gradient-to-tr from-[#27A1A1] to-[#3989AF] rounded-xl flex items-center justify-center shadow-lg">
              <Layers className="text-white w-6 h-6" />
            </div>
            <span className={`text-2xl font-black tracking-tighter ${scrolled ? 'text-white' : 'text-[#012F64]'}`}>ATLAS</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`font-bold text-xs uppercase tracking-widest transition-colors ${scrolled ? 'text-blue-100 hover:text-white' : 'text-[#012F64]/70 hover:text-[#27A1A1]'}`}
              >
                {link.name}
              </a>
            ))}
            <Button className="py-2.5 px-6 text-xs uppercase tracking-tighter" onClick={handleGetStarted}>Get Started</Button>
          </div>

          <button className={`lg:hidden p-2 ${scrolled ? 'text-white' : 'text-[#012F64]'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation Sidebar */}
        <div className={`fixed inset-0 bg-[#012F64] z-[101] transition-transform duration-500 transform ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} lg:hidden`}>
           <div className="p-8 h-full flex flex-col">
             <div className="flex justify-between items-center mb-16">
               <span className="text-white text-2xl font-black tracking-tighter">ATLAS</span>
               <X className="text-white w-8 h-8 cursor-pointer" onClick={() => setMobileMenuOpen(false)} />
             </div>
             <div className="flex flex-col gap-10">
               {navLinks.map((link) => (
                 <a
                   key={link.name}
                   href={link.href}
                   onClick={(e) => handleNavClick(e, link.href)}
                   className="text-white text-5xl font-black tracking-tighter hover:text-[#27A1A1] transition-colors"
                 >
                   {link.name}
                 </a>
               ))}
               <Button className="w-full text-xl py-6 mt-4" onClick={handleGetStarted}>Get Started</Button>
             </div>
           </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center bg-[#012F64] pt-28 pb-20 md:py-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#27A1A1]/10 rounded-full blur-[120px] -mr-96 -mt-96" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-[0.95] tracking-tighter">
                Stop Guessing. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#27A1A1] to-[#3989AF]">Start Thriving.</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100/60 mb-10 max-w-xl font-medium leading-relaxed">
                Find a career path that actually fits you, not the one you thought you wanted at 16.
              </p>

              <div className="space-y-4 mb-12 text-blue-100/80 font-medium">
                {[
                  "15-minute assessment",
                  "Extensive 170+ step analysis",
                  "Discuss results in AI coaching chat",
                  "Concrete career path recommendations"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 justify-center lg:justify-start">
                    <div className="w-5 h-5 rounded-full bg-[#27A1A1]/20 flex items-center justify-center"><ArrowRight className="text-[#27A1A1] w-3 h-3" /></div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                <Button className="text-lg" onClick={handleGetStarted}>Get Started - €39</Button>
                <Button variant="secondary" className="text-lg" onClick={() => document.getElementById('problem')?.scrollIntoView({behavior: 'smooth'})}>Learn More</Button>
              </div>
            </div>

            <div className="lg:w-1/2 w-full flex justify-center lg:justify-end">
              <CareerOrbit />
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM (Stats Section) */}
      <section className="py-32 bg-white scroll-mt-24">
        <div className="container mx-auto px-6 text-center">
          <SectionHeading id="problem" title="The Career Uncertainty Crisis" subtitle="Millions of professionals worldwide are stuck in careers that don't fit. The data tells the story:" center />

          <div className="relative w-full max-w-2xl mx-auto mb-16 rounded-3xl overflow-hidden shadow-2xl bg-gray-100 border border-gray-200 group">
             <div className={`transition-all duration-700 ease-in-out ${infographicExpanded ? 'max-h-[2500px]' : 'max-h-[600px]'} relative overflow-hidden bg-white`}>
                <div className="w-full flex flex-col items-center">
                   <div className="w-full bg-[#012F64] py-16 px-10 text-white text-left">
                      <div className="text-[#27A1A1] font-black uppercase tracking-[0.2em] text-[10px] mb-4">2025 Career Satisfaction Report</div>
                      <h3 className="text-4xl md:text-5xl font-black mb-6 leading-tight">85% Global<br/>Disengagement</h3>
                      <p className="text-blue-100/60 max-w-sm font-medium leading-relaxed">Workers report feeling disconnected from their daily purpose and long-term career trajectory.</p>
                   </div>
                   <div className="w-full py-16 px-10 bg-slate-50 border-b border-gray-100 flex flex-col items-center">
                      <div className="flex justify-center gap-6 items-end h-40 mb-10 w-full max-w-md">
                         <div className="flex-1 bg-gray-200 h-[35%] rounded-t-xl" />
                         <div className="flex-1 bg-[#3989AF] h-[65%] rounded-t-xl" />
                         <div className="flex-1 bg-[#27A1A1] h-[90%] rounded-t-xl shadow-xl" />
                      </div>
                      <h4 className="text-2xl md:text-3xl font-black text-[#012F64]">66% Report Career Regret</h4>
                      <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[10px]">Statistical Workforce Sentiment</p>
                   </div>
                   <div className="w-full py-16 px-10 bg-white">
                      <div className="max-w-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                         <div className="space-y-2">
                           <div className="text-4xl font-black text-[#012F64]">50%</div>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">Watching for a new job actively</p>
                         </div>
                         <div className="space-y-2">
                           <div className="text-4xl font-black text-[#012F64]">54%</div>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">Stress from job insecurity</p>
                         </div>
                      </div>
                   </div>
                </div>
                {!infographicExpanded && (
                  <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white to-transparent flex items-end justify-center pb-8">
                    <button onClick={() => setInfographicExpanded(true)} className="bg-[#012F64] text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-[#27A1A1] transition-colors flex items-center gap-2">
                      View Full Research Paper <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
             </div>
             {infographicExpanded && (
                <div className="bg-gray-50 p-6 border-t border-gray-200">
                  <button onClick={() => setInfographicExpanded(false)} className="text-[#012F64] font-bold text-sm flex items-center justify-center gap-2 w-full hover:text-[#27A1A1] transition-colors">
                    Collapse Report <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
             )}
          </div>

          <p className="text-xl max-w-3xl mx-auto text-gray-500 font-medium mb-10 leading-relaxed">
            The problem starts early - you made career decisions based on limited information, parental expectations, or what subjects you happened to be good at in school. Now you're paying for those choices with stress, regret, and Sunday night dread.
          </p>
          <Button className="mx-auto" onClick={() => window.open('https://www.atlas-assessments.com/report', '_blank')}>Read the Full Report</Button>
        </div>
      </section>

      {/* THE SOLUTION */}
      <section id="solution" className="py-32 bg-gray-50 scroll-mt-24">
        <div className="container mx-auto px-6">
          <SectionHeading title="What the Atlas Assessment actually does" subtitle="Atlas uses proven career assessment methods to match you with careers that fit who you are now - not who you were supposed to become." />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {[
               { title: "Built for business professionals", desc: "Office and knowledge workers in corporate, tech, finance, and service industries. (Assessments for other professions in development.)", icon: Globe },
               { title: "Honest and specific", desc: "You get 10+ career recommendations ranked by fit, complete with why they match, this role's day-to-day, salary ranges, AI impact ratings, and honest reality checks.", icon: Target },
               { title: "Interactive coaching", desc: "An AI coach walks you through your results, answers questions, and digs deeper into specific careers. No static PDF that you read once and forget.", icon: MessageSquare },
               { title: "AI impact ratings", desc: "Each career includes a detailed AI impact assessment showing how automation will reshape that role by 2027-2028. You'll understand which skills become more valuable, what gets automated, and how to position yourself.", icon: BrainCircuit }
             ].map((item, i) => (
               <div key={i} className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex gap-6 hover:shadow-xl transition-all">
                 <div className="w-14 h-14 bg-[#27A1A1]/10 rounded-2xl flex items-center justify-center text-[#27A1A1] shrink-0">
                   <item.icon className="w-7 h-7" />
                 </div>
                 <div>
                   <h4 className="text-xl font-bold text-[#012F64] mb-3">{item.title}</h4>
                   <p className="text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-32 bg-white scroll-mt-24">
        <div className="container mx-auto px-6">
          <SectionHeading title="From Assessment to Action" center />

          <div className="max-w-4xl mx-auto space-y-24 relative">
            {/* Desktop Connective Line */}
            <div className="hidden md:block absolute top-20 left-8 bottom-20 w-0.5 bg-gray-100 -z-10" />

            <div className="flex flex-col md:flex-row gap-10 items-start">
               <div className="w-16 h-16 rounded-full bg-[#012F64] text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-xl border-4 border-white">1</div>
               <div>
                 <h3 className="text-2xl font-black text-[#012F64] mb-4">Step 1: Thoughtful Assessment</h3>
                 <p className="text-gray-500 text-lg leading-relaxed font-medium">Answer questions about your background, skills, work style, values, and goals. Thoughtfully designed to capture what actually matters for career fit.</p>
                 {/* Assessment Preview Mockup */}
                 <div className="mt-10 bg-slate-50 border border-gray-100 rounded-3xl p-8 max-w-lg shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Assessment Module 02</span>
                      <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-[#27A1A1]" /><div className="w-2 h-2 rounded-full bg-gray-200" /></div>
                    </div>
                    <p className="text-lg font-bold text-[#012F64] mb-6 leading-tight">"In a high-pressure deadline scenario, I am most likely to focus on..."</p>
                    <div className="space-y-3">
                       <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-[#27A1A1] transition-all">
                          <span className="text-sm font-semibold text-gray-500">Perfecting every detail of the final output</span>
                          <MousePointer2 className="w-4 h-4 text-[#27A1A1] opacity-0 group-hover:opacity-100" />
                       </div>
                       <div className="p-4 bg-[#27A1A1]/5 rounded-2xl border border-[#27A1A1]/30 flex items-center justify-between">
                          <span className="text-sm font-bold text-[#27A1A1]">Ensuring the team maintains clear communication</span>
                          <CheckCircle2 className="w-4 h-4 text-[#27A1A1]" />
                       </div>
                    </div>
                 </div>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-start">
               <div className="w-16 h-16 rounded-full bg-[#012F64] text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-xl border-4 border-white">2</div>
               <div>
                 <h3 className="text-2xl font-black text-[#012F64] mb-4">Step 2: AI Analysis</h3>
                 <p className="text-gray-500 text-lg leading-relaxed font-medium">Your responses are analyzed by AI developed with the help of career coaching professionals, generating your personality profile and matching you to specific roles with personal justification.</p>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-start">
               <div className="w-16 h-16 rounded-full bg-[#012F64] text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-xl border-4 border-white">3</div>
               <div className="w-full">
                 <h3 className="text-2xl font-black text-[#012F64] mb-4">Step 3: Interactive Coaching Chat</h3>
                 <p className="text-gray-500 text-lg leading-relaxed font-medium mb-10">Work through your results with a one on one AI coach who further discusses your personality profile, walks through each career recommendation, and answers any questions about fit and next steps.</p>

                 <div className="bg-gray-100 border border-gray-200 rounded-[2.5rem] p-8 max-w-sm mx-auto md:mx-0 shadow-2xl relative overflow-hidden">
                    <div className="space-y-4">
                       <div className="bg-white p-5 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-600 border border-gray-100 leading-relaxed">
                         "Based on your assessment, your 'Chief of Staff' fit is driven by your operational mastery. However, you mentioned a passion for Travel. Should we cross-reference this with international consultant paths?"
                       </div>
                       <div className="bg-[#27A1A1] p-5 rounded-2xl rounded-tr-none shadow-sm text-sm text-white self-end font-bold">
                         "Yes, exactly! I'd like to see how the salary ranges compare for those travel-heavy roles."
                       </div>
                       <div className="bg-white p-4 rounded-full w-fit flex gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" /><div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce delay-75" /><div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce delay-150" /></div>
                    </div>
                 </div>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-start">
               <div className="w-16 h-16 rounded-full bg-[#012F64] text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-xl border-4 border-white">4</div>
               <div>
                 <h3 className="text-2xl font-black text-[#012F64] mb-4">Step 4: Final Report</h3>
                 <p className="text-gray-500 text-lg leading-relaxed font-medium">Your complete report (incorporating any feedback and deepdives discussed in the chat) is available in your dashboard. Includes personality analysis, all career recommendations with detailed breakdowns, and concrete next steps.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMBINED PRICING & WHAT YOU GET */}
      <section id="pricing" className="py-32 bg-[#012F64] text-white scroll-mt-24">
         <div className="container mx-auto px-6">
           <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
              {/* Value Side */}
              <div className="p-10 md:p-16 flex-1 text-[#012F64]">
                 <div className="text-[#27A1A1] font-black uppercase tracking-[0.2em] text-[10px] mb-4">The Package</div>
                 <h2 className="text-3xl md:text-4xl font-black mb-10 tracking-tighter">Everything You Need for Your Next Move</h2>
                 <div className="space-y-5">
                   {[
                     "Complete personality and career assessment",
                     "AI analysis tailored to your goals",
                     "Interactive coaching chat with follow-up questions",
                     "Up to 14 careers in 4 categories",
                     "Role details and Localized salary ranges",
                     "AI impact ratings on all suggested roles",
                     "Dream job feasibility assessment",
                     "Full report incl. feedback from the chat"
                   ].map((item, i) => (
                     <div key={i} className="flex items-start gap-4 font-bold text-gray-700">
                       <CheckCircle2 className="w-5 h-5 text-[#27A1A1] shrink-0 mt-0.5" />
                       <span className="text-sm leading-tight">{item}</span>
                     </div>
                   ))}
                   <div className="flex items-start gap-4 font-black text-[#D4A024] pt-4">
                     <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                     <span className="text-sm leading-tight">Features to act on recommendations in development!</span>
                   </div>
                 </div>
              </div>

              {/* Action Side */}
              <div className="bg-slate-50 p-10 md:p-16 md:w-[380px] flex flex-col justify-center items-center text-center border-t md:border-t-0 md:border-l border-gray-100">
                 <div className="bg-[#D4A024] text-[#012F64] px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8">Beta Access</div>
                 <div className="flex items-center justify-center gap-4 mb-4">
                   <span className="text-gray-300 line-through text-2xl font-bold">€79</span>
                   <span className="text-6xl font-black text-[#012F64] tracking-tighter">€39</span>
                 </div>
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-10">Introductory Price</p>
                 <Button className="w-full py-6 text-xl tracking-tight shadow-xl" onClick={handleGetStarted}>Get Beta Access</Button>
              </div>
           </div>
         </div>
      </section>

      {/* WHY TRADITIONAL ASSESSMENTS FAIL */}
      <section id="why-atlas" className="py-32 bg-gray-50 scroll-mt-24">
        <div className="container mx-auto px-6">
          <SectionHeading title="Beyond Generic Career Tests" subtitle="Traditional career assessments leave you with overwhelming static reports full of personality types and vague suggestions. Our assessments are different:" center />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { title: "Interactive, not static", desc: "Ask follow-up questions, explore specific careers in depth, discuss concerns about recommendations. Your AI coach adapts to what you need.", icon: MessageSquare },
              { title: "Purpose-built, not generic AI", desc: "This isn't ChatGPT. Atlas uses a specialized 173-step workflow designed specifically for career assessment ensuring consistency and relevance.", icon: BrainCircuit },
              { title: "Specific, not vague", desc: "Get actual job titles with salary data, not 'you'd be good at helping professions.' Understand exactly what the role entails and why it fits.", icon: Target },
              { title: "Honest, not flattering", desc: "Each recommendation includes reality checks about challenges, required trade-offs, and areas where you'll need to develop new skills.", icon: ShieldCheck },
              { title: "Future-aware, not outdated", desc: "Every career includes an AI impact assessment so you understand how the role will evolve by 2027-2028.", icon: Zap },
              { title: "Affordable, not exploitative", desc: "Professional-grade analysis for a fraction of the price of traditional career coaching. Technology makes this accessible. Full Refund if not happy with your recommendations!", icon: Star }
            ].map((item, i) => (
              <div key={i} className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-[#27A1A1] transition-all hover:shadow-xl group">
                <item.icon className="w-10 h-10 text-[#27A1A1] mb-8 group-hover:scale-110 transition-transform" />
                <h4 className="text-2xl font-black text-[#012F64] mb-4 tracking-tight leading-tight">{item.title}</h4>
                <p className="text-gray-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 bg-[#D4A024]/5 border border-[#D4A024]/20 p-10 rounded-3xl max-w-4xl mx-auto text-center">
             <h4 className="text-[#012F64] font-black text-xl mb-2">Practical, Not Just Psychological</h4>
             <p className="text-gray-600 font-medium">Atlas isn't just another psychometric test - it's a practical assessment designed to explore new career paths or gain leverage in your current role through actionable market data</p>
          </div>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <h3 className="text-2xl font-black text-[#012F64] mb-10 flex items-center gap-4"><CheckCircle2 className="text-[#27A1A1] w-8 h-8 shrink-0" /> <span>You're in the right place if:</span></h3>
              <ul className="space-y-6">
                {[
                  "You're questioning whether your current career still fits",
                  "You made career choices based on limited information or others' expectations",
                  "You're facing a career transition and want data-backed options",
                  "You need to understand how AI will impact your field",
                  "You want concrete next steps, not vague personality insights"
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 text-gray-700 font-bold leading-snug">
                    <span className="text-[#27A1A1]">•</span> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#012F64] mb-10 flex items-center gap-4"><XCircle className="text-red-400 w-8 h-8 shrink-0" /> <span>This probably isn't for you if:</span></h3>
              <ul className="space-y-6">
                {[
                  "You need industry-specific technical training (we help you find the right direction first)",
                  "You want validation for a decision you've already made (we give honest assessments, not cheerleading)"
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 text-gray-400 font-bold leading-snug">
                    <span className="text-gray-300">•</span> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* THE FOUNDER (Expandable) */}
      <section id="founder" className="py-32 bg-gray-50 border-t border-gray-100 scroll-mt-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <SectionHeading title="Why I Built This" center />
          <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] border border-gray-100">
             <div className="flex items-center gap-6 mb-10">
               <div className="w-20 h-20 bg-[#012F64] rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-xl">SG</div>
               <div>
                 <div className="font-black text-[#012F64] text-2xl tracking-tighter">Sjoerd Geurts</div>
                 <div className="text-[#27A1A1] uppercase tracking-[0.25em] text-[10px] font-black">Founder, Atlas Assessment</div>
               </div>
             </div>
             <div className="space-y-6 text-gray-600 leading-relaxed font-medium text-lg">
                <p>I've watched too many smart people stuck in careers they fell into by accident. Myself included.</p>
                <div className={`space-y-6 overflow-hidden transition-all duration-700 ${founderExpanded ? 'max-h-[2000px]' : 'max-h-[140px] relative'}`}>
                   <p>Most of us made career decisions based on what we were "supposed" to do, what subjects we happened to be good at, or what seemed safe at the time. Then life happens - your priorities shift, the market changes, AI starts eating jobs - and suddenly you're questioning everything.</p>
                   <p>Traditional career coaching is expensive and often just as confused about the future as you are. Generic career tests give you personality types and vague suggestions. You need something that actually helps.</p>
                   <p>Atlas Assessment combines proven career coaching methodology with AI analysis to give you concrete, honest career recommendations based on who you are right now. Not on what choices you made in high school, nor who your parents expected you to become, nor the field you studied because it seemed practical, nor the career track your first job happened to start you on - who you actually are today.</p>
                   <p>The assessment adapts to your situation, the AI coach explains everything in plain language, and you walk away with specific careers to explore, complete with salary data and reality checks about what it would actually take to make the transition.</p>
                   <p className="font-black text-[#012F64]">Currently in beta. Your feedback shapes what this becomes.</p>
                   {!founderExpanded && <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-white to-transparent" />}
                </div>
                <button onClick={() => setFounderExpanded(!founderExpanded)} className="text-[#27A1A1] font-black text-sm flex items-center gap-2 group tracking-widest uppercase py-4">
                  {founderExpanded ? "Read Less" : "Read Full Story"} <ChevronDown className={`w-4 h-4 transition-transform group-hover:translate-y-1 ${founderExpanded ? 'rotate-180' : ''}`} />
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-40 bg-[#012F64] text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#012F64] via-transparent to-[#27A1A1]/10 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter leading-tight">Ready to Stop Guessing?</h2>
          <p className="text-xl text-blue-100/70 mb-14 max-w-2xl mx-auto font-medium leading-relaxed">Get clarity on your career direction. Take the assessment, get honest recommendations, make informed decisions.</p>
          <Button className="text-2xl py-8 px-16 mb-8 uppercase tracking-widest shadow-[0_0_50px_rgba(39,161,161,0.3)]" onClick={handleGetStarted}>Get Your Atlas Assessment - €39</Button>
          <p className="text-blue-100/30 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Beta access. Full refund if you're not satisfied.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 bg-white border-t border-gray-100">
         <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
               <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                 <div className="w-10 h-10 bg-[#012F64] rounded-xl flex items-center justify-center shadow-xl"><Layers className="text-white w-6 h-6" /></div>
                 <span className="text-2xl font-black tracking-tighter text-[#012F64]">ATLAS</span>
               </div>
               <p className="text-gray-300 font-bold text-[10px] tracking-[0.3em] uppercase">© 2024 ATLAS ASSESSMENT</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
               <a href="/privacy-policy" className="hover:text-[#27A1A1] transition-colors">Privacy Policy</a>
               <a href="/terms-conditions" className="hover:text-[#27A1A1] transition-colors">Terms of Service</a>
               <a href="/cookie-policy" className="hover:text-[#27A1A1] transition-colors">Cookie Policy</a>
               <a href="/support" className="hover:text-[#27A1A1] transition-colors">Support</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default Index;
