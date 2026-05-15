import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  Play,
  Camera,
  Film,
  Monitor,
  MessageSquare,
  BarChart3,
  FileText,
  Shield,
  Lock,
  Trash2
} from 'lucide-react';
import CairnlyWordmarkInverted from '@/logos/cairnly-logo/cairnly_logo_wordmark_inverted.png';
import CairnlyWordmark from '@/logos/cairnly-logo/cairnly_logo_wordmark.png';
import CairnlySymbol from '@/logos/cairnly-logo/cairnly_logo_symbol_only.png';
import CairnSymbolInvert from '@/logos/cairnly-logo/cairn_symbol_invert.png';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// --- Reusable UI ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-[#2ABFBF] hover:bg-[#27A1A1] text-white shadow-xl shadow-teal-500/40 hover:shadow-teal-400/60 hover:-translate-y-0.5',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm',
    outline: 'border-2 border-[#3989AF] text-[#3989AF] hover:bg-[#3989AF] hover:text-white',
  };
  return (
    <button className={`px-8 py-4 rounded-full font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Career Path Background ---
// A single still scene: a grey "guessing" path that rises gently then flattens
// into stagnation, a cairn marking the turning point, and a gold "thriving"
// path climbing away from it. Only soft opacity animations - nothing draws or
// reveals geometry, so every line stays whole and connected to the cairn.
const CareerPathBg = () => {
  const cx = 720; // cairn x - the change-of-direction point
  const cy = 430; // cairn y

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* grey gentle-rise: faint off-screen, brightening toward the cairn */}
          <linearGradient id="cpbRise" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9AA7B0" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#9AA7B0" stopOpacity="0.42" />
          </linearGradient>
          {/* grey plateau: solid through the cairn, fading out shortly past it */}
          <linearGradient id="cpbFlat" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9AA7B0" stopOpacity="0.42" />
            <stop offset="60%" stopColor="#9AA7B0" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#9AA7B0" stopOpacity="0.06" />
          </linearGradient>
          {/* gold thriving path: brightest at the cairn, fading as it climbs */}
          <linearGradient id="cpbGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EFC457" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#E3B04D" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#E3B04D" stopOpacity="0.42" />
          </linearGradient>
        </defs>

        <g className="cpb-scene">
          {/* ---- Grey "guessing" path: gentle rise easing into stagnation ---- */}
          <path
            d="M-160 566 C 110 524, 210 430, 400 430"
            stroke="url(#cpbRise)" strokeWidth="2.5" strokeLinecap="round" fill="none"
          />
          <path
            d="M400 430 C 560 430, 760 430, 980 430"
            stroke="url(#cpbFlat)" strokeWidth="2.5" strokeLinecap="round" fill="none"
          />
          {/* dotted continuation - stagnation petering out */}
          <path
            d="M980 430 C 1130 430, 1300 430, 1520 430"
            stroke="#9AA7B0" strokeWidth="2.5" strokeOpacity="0.2"
            strokeLinecap="round" strokeDasharray="0.5 17" fill="none"
          />
          {/* milestone dots along the grey path */}
          {[[40, 524], [200, 452], [350, 431], [560, 430], [770, 430]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.4" fill="#9AA7B0" fillOpacity="0.32" />
          ))}

          {/* ---- Gold "thriving" path: climbing away from the cairn ---- */}
          <path
            d={`M${cx} ${cy} C 824 356, 944 262, 1046 178 C 1148 94, 1268 0, 1392 -86`}
            stroke="url(#cpbGold)" strokeWidth="2.25" strokeLinecap="round" fill="none"
          />
          {/* gold step dots */}
          {[[872, 312], [1046, 178], [1222, 38]].map(([x, y], i) => (
            <circle
              key={i} cx={x} cy={y} r="3" fill="#E3B04D"
              className={`cpb-twinkle cpb-tw${i + 1}`}
            />
          ))}

          {/* ---- Spark + cairn: the change-of-direction point ---- */}
          <circle cx={cx} cy={cy} r="34" fill="#E3B04D" className="cpb-glow" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const r1 = 30;
            const r2 = 41 + (i % 2) * 8;
            return (
              <line
                key={angle}
                x1={cx + Math.cos(rad) * r1} y1={cy + Math.sin(rad) * r1}
                x2={cx + Math.cos(rad) * r2} y2={cy + Math.sin(rad) * r2}
                stroke="#E3B04D" strokeWidth={i % 2 === 0 ? 1.5 : 1}
                strokeLinecap="round" strokeOpacity="0.5"
              />
            );
          })}
          <image
            href={CairnSymbolInvert}
            x={cx - 15} y={cy - 27}
            width="30" height="54"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      </svg>

      <style>{`
        .cpb-scene { opacity: 0; animation: cpb-fade-in 1.6s ease-out 0.25s forwards; }
        @keyframes cpb-fade-in { to { opacity: 1; } }

        .cpb-glow { fill-opacity: 0.12; animation: cpb-breathe 5s ease-in-out infinite; }
        @keyframes cpb-breathe {
          0%, 100% { fill-opacity: 0.09; }
          50% { fill-opacity: 0.17; }
        }

        .cpb-twinkle { fill-opacity: 0.65; animation: cpb-twinkle-kf 3.8s ease-in-out infinite; }
        .cpb-tw1 { animation-delay: 0s; }
        .cpb-tw2 { animation-delay: 1.3s; }
        .cpb-tw3 { animation-delay: 2.6s; }
        @keyframes cpb-twinkle-kf {
          0%, 100% { fill-opacity: 0.5; }
          50% { fill-opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};

// --- Placeholder Components ---

// VIDEO placeholder - prominent, hero-adjacent
const VideoPlaceholder = () => (
  <div className="relative w-full bg-[#0a1f3d] rounded-2xl border-2 border-dashed border-white/20 overflow-hidden group cursor-pointer hover:border-[#27A1A1]/50 transition-all">
    {/* Fake video thumbnail background */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#0a2a52] to-[#27A1A1]/20 opacity-80" />
    {/* Main content area */}
    <div className="relative z-10 flex flex-col items-center gap-4 py-16 md:py-20 px-6">
      <div className="w-20 h-20 rounded-full bg-[#27A1A1]/90 flex items-center justify-center shadow-2xl shadow-teal-500/30 group-hover:scale-110 transition-transform">
        <Play className="w-8 h-8 text-white ml-1" />
      </div>
      <div className="text-center">
        <p className="text-white/90 font-bold text-lg">Product Video</p>
        <p className="text-blue-200/50 text-sm font-medium">Coming soon - 60-90 second explainer</p>
      </div>
    </div>
    {/* Dev note - hidden on mobile, visible on larger screens */}
    <div className="relative z-10 mx-3 mb-3 bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-white/10 hidden md:block">
      <p className="text-[10px] text-blue-200/60 font-mono leading-relaxed">
        <Film className="w-3 h-3 inline mr-1" />
        VIDEO: Show the user journey - take assessment, see AI analysis in action, chat with AI coach, get concrete career paths. Emphasize speed (15 min) and specificity (actual job titles, salary data). End with the "aha moment" of seeing personalized results.
      </p>
    </div>
  </div>
);

// SCREENSHOT placeholder - for product screens
const ScreenshotPlaceholder: React.FC<{
  title: string;
  description: string;
  aspect?: string;
  className?: string;
}> = ({ title, description, aspect = 'aspect-[4/3]', className = '' }) => (
  <div className={`relative w-full ${aspect} bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden ${className}`}>
    <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A]/10 flex items-center justify-center">
        <Camera className="w-6 h-6 text-[#1A1A1A]/40" />
      </div>
      <div>
        <p className="text-[#1A1A1A]/70 font-bold text-sm">{title}</p>
        <p className="text-gray-400 text-xs font-medium mt-1 max-w-xs leading-relaxed">{description}</p>
      </div>
    </div>
    {/* Corner tag */}
    <div className="absolute top-3 right-3 bg-[#D4A024]/10 text-[#D4A024] px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider">
      Screenshot needed
    </div>
  </div>
);

// IMAGE placeholder - for generated images
const ImagePlaceholder: React.FC<{
  prompt: string;
  aspect?: string;
  className?: string;
}> = ({ prompt, aspect = 'aspect-video', className = '' }) => (
  <div className={`relative w-full ${aspect} bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center overflow-hidden ${className}`}>
    <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-indigo-400" />
      </div>
      <p className="text-indigo-400 font-bold text-xs">AI-Generated Image</p>
    </div>
    <div className="absolute bottom-3 left-3 right-3 bg-indigo-900/10 backdrop-blur-sm rounded-lg p-3">
      <p className="text-[10px] text-indigo-500/70 font-mono leading-relaxed">
        PROMPT: {prompt}
      </p>
    </div>
    <div className="absolute top-3 right-3 bg-indigo-100 text-indigo-500 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider">
      Generate image
    </div>
  </div>
);


// --- Main Page ---
const Index = () => {
  const { t } = useTranslation(['common', 'landing']);
  const [scrolled, setScrolled] = useState(false);
  const [founderExpanded, setFounderExpanded] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('common:nav.howItWorks'), href: "#how-it-works" },
    { name: t('common:nav.pricing'), href: "#pricing" },
    { name: t('common:nav.aboutUs'), href: "#about" },
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
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-[#374151] font-sans selection:bg-[#27A1A1] selection:text-white overflow-x-hidden">

      {/* ========== NAVIGATION ========== */}
      <nav className={`fixed w-full z-[100] transition-all duration-500 ${scrolled ? 'bg-[#213F4F]/95 backdrop-blur-xl py-1 shadow-2xl border-b border-white/5' : 'bg-transparent py-2'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="cursor-pointer flex flex-col items-start" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={CairnlyWordmarkInverted} alt="Cairnly" className="h-28 w-auto" />
            <p className="-mt-8 ml-[52px] text-[10px] font-normal tracking-[0.22em] text-[#D4A024]">career path clarity.</p>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`font-bold text-xs uppercase tracking-widest transition-colors ${scrolled ? 'text-blue-100 hover:text-white' : 'text-blue-100/70 hover:text-white'}`}
              >
                {link.name}
              </a>
            ))}
            {!user && (
              <button
                onClick={() => navigate('/auth')}
                className={`font-bold text-xs uppercase tracking-widest transition-colors ${scrolled ? 'text-blue-100 hover:text-white' : 'text-blue-100/70 hover:text-white'}`}
              >
                {t('common:nav.signIn')}
              </button>
            )}
            <LanguageSwitcher className="text-blue-100 hover:text-white" />
            <Button className="py-2.5 px-6 text-xs uppercase tracking-tighter" onClick={handleGetStarted}>
              {user ? t('common:nav.dashboard') : t('common:nav.getStarted')}
            </Button>
          </div>

          <button className="lg:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Sidebar */}
        <div className={`fixed inset-0 bg-[#213F4F] z-[101] transition-transform duration-500 transform ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} lg:hidden`}>
          <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <img src={CairnlyWordmarkInverted} alt="Cairnly" className="h-12 w-auto" />
              <X className="text-white w-8 h-8 cursor-pointer" onClick={() => setMobileMenuOpen(false)} />
            </div>
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-white text-2xl font-bold tracking-tight hover:text-[#27A1A1] transition-colors"
                >
                  {link.name}
                </a>
              ))}
              {!user && (
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}
                  className="text-white text-2xl font-bold tracking-tight hover:text-[#27A1A1] transition-colors text-left"
                >
                  {t('common:nav.signIn')}
                </button>
              )}
              <Button className="w-full text-base py-4 mt-4" onClick={handleGetStarted}>
                {user ? t('common:nav.dashboard') : t('common:nav.getStarted')}
              </Button>
              <div className="mt-4">
                <LanguageSwitcher className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center bg-[#213F4F] pt-28 pb-20 md:py-20 overflow-hidden">
        {/* Subtle teal gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#27A1A1]/12 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#27A1A1]/20 rounded-full blur-[120px] -mr-96 -mt-96" />
        <CareerPathBg />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Copy */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[0.95] tracking-tighter">
                Stop Guessing. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C8891A] to-[#F0C040]">Start Thriving.</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-blue-100/60 mb-10 max-w-xl font-medium leading-relaxed">
                Comprehensive AI coaching session discussing personality and career goals resulting in up to 10 suitable career titles.
              </p>

              <div className="space-y-3 mb-10 text-blue-100/80 font-medium">
                {[
                  "15-minute assessment",
                  "AI analysis built with career coaches",
                  "Interactive AI coaching chat",
                  "Concrete career recommendations with salary data"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 justify-center lg:justify-start">
                    <div className="w-5 h-5 rounded-full bg-[#27A1A1]/20 flex items-center justify-center">
                      <ArrowRight className="text-[#27A1A1] w-3 h-3" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button className="text-lg" onClick={handleGetStarted}>Get Started - €39</Button>
                <Button variant="secondary" className="text-lg" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                  See How It Works
                </Button>
              </div>
            </div>

            {/* Right: Video Placeholder (hidden until real video is ready) */}
            {/* <div className="lg:w-1/2 w-full max-w-xl">
              <VideoPlaceholder />
            </div> */}
          </div>
        </div>
      </section>

      {/* ========== TRUST STRIP ========== */}
      <section className="py-10 bg-[#fcfdfe] border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { Icon: Shield, title: 'GDPR compliant', desc: 'European servers. Your data stays in Europe.' },
              { Icon: Lock, title: 'Payments by Stripe', desc: 'We never see your card.' },
              { Icon: Trash2, title: 'One-click delete', desc: 'Your data is yours. Take it back anytime.' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-[#27A1A1] to-[#3989AF] rounded-xl flex items-center justify-center text-white shrink-0">
                  <item.Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-sm text-[#1A1A1A]">{item.title}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="py-24 md:py-32 bg-white scroll-mt-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-6 leading-tight tracking-tight">From Assessment to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#27A1A1] to-[#3989AF]">Action</span></h2>
            <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">Four steps. Fifteen minutes. Concrete career paths that actually fit who you are today.</p>
          </div>

          <div className="max-w-5xl mx-auto space-y-20">

            {/* Step 1 */}
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="md:w-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#27A1A1] to-[#3989AF] text-white flex items-center justify-center text-xl font-black shrink-0 shadow-lg shadow-teal-500/30">1</div>
                  <h3 className="text-2xl font-black text-[#1A1A1A]">Take the Assessment</h3>
                </div>
                <p className="text-gray-500 text-lg leading-relaxed font-medium ml-16">
                  Answer questions about your background, skills, work style, values, and goals. Designed to capture what actually matters for career fit - not just personality types.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse gap-10 items-center">
              <div className="md:w-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#27A1A1] to-[#3989AF] text-white flex items-center justify-center text-xl font-black shrink-0 shadow-lg shadow-teal-500/30">2</div>
                  <h3 className="text-2xl font-black text-[#1A1A1A]">AI Analyzes Your Profile</h3>
                </div>
                <p className="text-gray-500 text-lg leading-relaxed font-medium ml-16">
                  Multiple specialized AI workflows analyze your responses, generate your personality profile, and match you to specific careers with personalized justifications.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="md:w-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#27A1A1] to-[#3989AF] text-white flex items-center justify-center text-xl font-black shrink-0 shadow-lg shadow-teal-500/30">3</div>
                  <h3 className="text-2xl font-black text-[#1A1A1A]">Chat With Your AI Coach</h3>
                </div>
                <p className="text-gray-500 text-lg leading-relaxed font-medium ml-16">
                  Discuss your results one-on-one. Ask follow-up questions, explore specific careers in depth, and get honest answers about fit, trade-offs, and next steps.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col md:flex-row-reverse gap-10 items-center">
              <div className="md:w-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#27A1A1] to-[#3989AF] text-white flex items-center justify-center text-xl font-black shrink-0 shadow-lg shadow-teal-500/30">4</div>
                  <h3 className="text-2xl font-black text-[#1A1A1A]">Get Your Report</h3>
                </div>
                <p className="text-gray-500 text-lg leading-relaxed font-medium ml-16">
                  Your complete career report - incorporating chat feedback - with personality analysis, all career recommendations, salary data, AI impact ratings, and concrete next steps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHAT MAKES ATLAS DIFFERENT (compact) ========== */}
      <section className="py-24 md:py-32 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">Not another <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#27A1A1] to-[#3989AF]">personality test</span></h2>
            <p className="text-xl text-gray-300 font-medium max-w-2xl mx-auto">Cairnly gives you actual job titles, salary data, and honest reality checks - not vague personality insights you'll forget by tomorrow.</p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: MessageSquare, title: "Interactive, not static", desc: "An AI coach walks you through results and answers your questions. No PDF you read once and forget." },
              { icon: BarChart3, title: "Future-aware", desc: "Every career includes an AI impact assessment showing how that role evolves by 2027-2028." },
              { icon: CheckCircle2, title: "Honest, not flattering", desc: "Reality checks on challenges, trade-offs, and skills you'd need to develop. No cheerleading." },
              { icon: FileText, title: "Specific, not vague", desc: "10+ career recommendations with salary ranges, day-to-day breakdowns, and personalized fit explanations." },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 flex gap-5 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-[#27A1A1] to-[#3989AF] rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-500/20">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#1A1A1A] mb-2">{item.title}</h4>
                  <p className="text-gray-500 leading-relaxed font-medium text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section id="pricing" className="relative py-24 md:py-32 bg-[#213F4F] text-white scroll-mt-24 overflow-hidden">
        {/* Subtle teal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tl from-[#27A1A1]/8 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
            {/* Value Side */}
            <div className="p-10 md:p-16 flex-1 text-[#1A1A1A]">
              <div className="text-[#27A1A1] font-black uppercase tracking-[0.2em] text-[10px] mb-4">The Package</div>
              <h2 className="text-3xl md:text-4xl font-black mb-10 tracking-tighter">Everything you need to find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#27A1A1] to-[#3989AF]">right path</span></h2>
              <div className="space-y-5">
                {[
                  "Complete personality and career assessment",
                  "AI analysis tailored to your goals",
                  "Interactive coaching chat with follow-up questions",
                  "Up to 14 careers in 4 categories",
                  "Role details and localized salary ranges",
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
                  <span className="text-sm leading-tight">Like the suggestions? We help you land the job (beta)</span>
                </div>
              </div>
            </div>

            {/* Action Side */}
            <div className="bg-slate-50 p-10 md:p-16 md:w-[380px] flex flex-col justify-center items-center text-center border-t md:border-t-0 md:border-l border-gray-100">
              <div className="bg-[#D4A024] text-[#1A1A1A] px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8">Beta Access</div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-gray-300 line-through text-2xl font-bold">€79</span>
                <span className="text-6xl font-black text-[#1A1A1A] tracking-tighter">€39</span>
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-10">Introductory Price</p>
              <Button className="w-full py-6 text-xl tracking-tight shadow-xl" onClick={() => navigate('/payment')}>Get Beta Access</Button>
              <p className="text-gray-400 text-xs font-medium mt-6">Full refund if you're not satisfied.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHO THIS IS FOR / NOT FOR ========== */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-2xl font-black text-[#1A1A1A] mb-8 flex items-center gap-4">
                <CheckCircle2 className="text-[#27A1A1] w-7 h-7 shrink-0" />
                <span>You're in the right place if:</span>
              </h3>
              <ul className="space-y-5">
                {[
                  "You're questioning whether your current career still fits",
                  "You made career choices based on limited information or others' expectations",
                  "You're facing a career transition and want data-backed options",
                  "You're open to exploring directions you haven't seriously considered before",
                  "You want concrete next steps, not vague personality insights"
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 text-gray-700 font-bold leading-snug">
                    <span className="text-[#27A1A1]">•</span> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#1A1A1A] mb-8 flex items-center gap-4">
                <XCircle className="text-red-400 w-7 h-7 shrink-0" />
                <span>This probably isn't for you if:</span>
              </h3>
              <ul className="space-y-5">
                {[
                  "You're mainly looking to get promoted or advance within your current field (Cairnly explores new directions, not optimizes existing ones)",
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

      {/* ========== FOUNDER ========== */}
      <section id="about" className="py-24 md:py-32 bg-gray-50 border-t border-gray-100 scroll-mt-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">Why I <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#27A1A1] to-[#3989AF]">Built This</span></h2>
          </div>
          <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-[#1A1A1A] rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-xl">SG</div>
                <div>
                  <div className="font-black text-[#1A1A1A] text-2xl tracking-tighter">Sjoerd Geurts</div>
                  <div className="text-[#27A1A1] uppercase tracking-[0.25em] text-[10px] font-black">Founder, Cairnly</div>
                </div>
              </div>
              <img src={CairnlySymbol} alt="Cairnly" className="w-28 h-28 md:w-36 md:h-36 object-contain hidden sm:block" />
            </div>
            <div className="space-y-6 text-gray-600 leading-relaxed font-medium text-lg">
              <p>I've watched too many smart people stuck in careers they fell into by accident. Myself included.</p>
              <div className={`space-y-6 overflow-hidden transition-all duration-700 ${founderExpanded ? 'max-h-[2000px]' : 'max-h-[140px] relative'}`}>
                <p>Most of us made career decisions based on what we were "supposed" to do, what subjects we happened to be good at, or what seemed safe at the time. Then life happens - your priorities shift, the market changes, AI starts eating jobs - and suddenly you're questioning everything.</p>
                <p>Traditional career coaching is expensive and often just as confused about the future as you are. Generic career tests give you personality types and vague suggestions. You need something that actually helps.</p>
                <p>Cairnly combines proven career coaching methodology with AI analysis to give you concrete, honest career recommendations based on who you are right now - not who your parents expected you to become.</p>
                <p className="font-black text-[#1A1A1A]">Currently in beta. Your feedback shapes what this becomes.</p>
                {!founderExpanded && <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-white to-transparent" />}
              </div>
              <button onClick={() => setFounderExpanded(!founderExpanded)} className="text-[#27A1A1] font-black text-sm flex items-center gap-2 group tracking-widest uppercase py-4">
                {founderExpanded ? "Read Less" : "Read Full Story"} <ChevronDown className={`w-4 h-4 transition-transform group-hover:translate-y-1 ${founderExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CAREER CRISIS (collapsible, accessible but not prominent) ========== */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-3xl">
          <button
            onClick={() => setCrisisOpen(!crisisOpen)}
            className="w-full flex items-center justify-between py-4 group"
          >
            <div className="flex items-center gap-4">
              <BarChart3 className="w-6 h-6 text-[#1A1A1A]/40" />
              <div className="text-left">
                <h3 className="text-lg font-black text-[#1A1A1A]">The Career Uncertainty Crisis</h3>
                <p className="text-sm text-gray-400 font-medium">85% global disengagement. 66% career regret. See the data.</p>
              </div>
            </div>
            {crisisOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          <div className={`overflow-hidden transition-all duration-700 ${crisisOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pt-6 pb-4">
              <div className="bg-[#213F4F] rounded-2xl p-8 md:p-12 text-white mb-8">
                <div className="text-[#27A1A1] font-black uppercase tracking-[0.2em] text-[10px] mb-4">2025 Career Satisfaction Report</div>
                <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight">85% Global Disengagement</h3>
                <p className="text-blue-100/60 font-medium leading-relaxed max-w-lg">Workers report feeling disconnected from their daily purpose and long-term career trajectory.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-white mb-2">66%</div>
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Career Regret</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-white mb-2">50%</div>
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Actively Looking</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-white mb-2">54%</div>
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Job Stress</p>
                </div>
              </div>

              <p className="text-gray-500 font-medium leading-relaxed mb-6">
                The problem starts early - career decisions based on limited information, parental expectations, or what subjects you happened to be good at in school. Now those choices show up as stress, regret, and Sunday night dread.
              </p>

              <Button variant="outline" className="text-sm py-3 px-6" onClick={() => window.open('https://www.cairnly.io/report', '_blank')}>
                Read the Full Research Report <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-32 md:py-40 bg-[#213F4F] text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#213F4F] via-transparent to-[#27A1A1]/10 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#C8891A] to-[#F0C040]">Ready to Stop Guessing?</h2>
          <p className="text-lg md:text-xl text-blue-100/70 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Take the assessment, get honest recommendations, make informed decisions.
          </p>
          <div className="flex justify-center">
            <Button className="text-xl md:text-2xl py-7 px-14 mb-6 uppercase tracking-widest shadow-[0_0_50px_rgba(39,161,161,0.3)]" onClick={() => navigate('/payment')}>
              Get career path clarity now!
            </Button>
          </div>
          <p className="text-blue-100/70 text-[10px] font-black uppercase tracking-[0.4em] mt-4">During beta full refund if you're not satisfied!</p>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src={CairnlyWordmark} alt="Cairnly" className="h-10 w-auto" />
            </div>
            <p className="text-gray-500 font-bold text-[10px] tracking-[0.3em] uppercase">© 2026 CAIRNLY</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
            <a href="/privacy-policy" className="hover:text-[#27A1A1] transition-colors">Privacy Policy</a>
            <a href="/terms-conditions" className="hover:text-[#27A1A1] transition-colors">Terms of Service</a>
            <a href="/cookie-policy" className="hover:text-[#27A1A1] transition-colors">Cookie Policy</a>
            <a href="/support" className="hover:text-[#27A1A1] transition-colors">Support</a>
            <a href="/security" className="hover:text-[#27A1A1] transition-colors">Security</a>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-4">Built in the Netherlands. GDPR compliant. Payments by Stripe.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
