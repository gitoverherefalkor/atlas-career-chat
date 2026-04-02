import { User, Briefcase, ClipboardList, Compass, Zap, TrendingUp, Heart, Trophy, Award, Lightbulb, Sparkles } from 'lucide-react';

// Chapter structure for navigation - content comes from database report_sections
export const chapters = [
  {
    id: 'about-you',
    title: 'About You',
    icon: User,
    imageUrl: '/images/about_you.webp',
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        icon: ClipboardList,
        description: 'Who you are professionally and what drives your career.',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=300&fit=crop'
      },
      {
        id: 'personality-team',
        title: 'Your Approach',
        icon: Compass,
        description: 'How you work, lead, and navigate challenges.',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=300&fit=crop'
      },
      {
        id: 'strengths',
        title: 'Your Strengths',
        icon: Zap,
        description: 'What sets you apart and how to use these capabilities strategically.',
        imageUrl: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=300&fit=crop'
      },
      {
        id: 'growth',
        title: 'Development Areas',
        icon: TrendingUp,
        description: 'Growth opportunities that will help you reach your goals.',
        imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=300&fit=crop'
      },
      {
        id: 'values',
        title: 'Your (Career) Values',
        icon: Heart,
        description: 'What matters most to you and how it shapes the right career fit.',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=300&fit=crop'
      }
    ]
  },
  {
    id: 'career-suggestions',
    title: 'Career Suggestions for You',
    icon: Briefcase,
    imageUrl: '/images/career_suggestions.webp',
    sections: [
      {
        id: 'top-careers',
        title: 'Top Career Suggestions',
        icon: Trophy,
        description: 'Three roles that best match your profile, skills, and goals.',
        imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=300&fit=crop',
        careers: [
          { id: 'first-career', title: 'Primary Career Match', iconLabel: '1' },
          { id: 'second-career', title: 'Second Career Match', iconLabel: '2' },
          { id: 'third-career', title: 'Third Career Match', iconLabel: '3' }
        ]
      },
      {
        id: 'runner-up',
        title: 'Runner-up Careers',
        icon: Award,
        description: 'Strong alternative paths worth considering.',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=300&fit=crop'
      },
      {
        id: 'outside-box',
        title: 'Outside-the-Box Careers',
        icon: Lightbulb,
        description: 'Unconventional options aligned with your interests and strengths.',
        imageUrl: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=600&h=300&fit=crop'
      },
      {
        id: 'dream-jobs',
        title: 'Dream Job Analysis',
        icon: Sparkles,
        description: 'Reality check on your ideal career and what it takes to get there.',
        imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=300&fit=crop'
      }
    ]
  }
];
