import { User, Briefcase } from 'lucide-react';

// Chapter structure for navigation - content comes from database report_sections
export const chapters = [
  {
    id: 'about-you',
    title: 'About You',
    icon: User,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=300&fit=crop',
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        description: 'Overview of your strengths, challenges, and career positioning.',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=300&fit=crop'
      },
      {
        id: 'personality-team',
        title: 'Personality and Team Dynamics',
        description: 'How you interact with teams and leadership considerations.',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=300&fit=crop'
      },
      {
        id: 'strengths',
        title: 'Your Strengths',
        description: 'Key capabilities and how to leverage them effectively.',
        imageUrl: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=300&fit=crop'
      },
      {
        id: 'growth',
        title: 'Opportunities for Growth',
        description: 'Areas for development and strategic improvement recommendations.',
        imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=300&fit=crop'
      },
      {
        id: 'values',
        title: 'Your (Career) Values',
        description: 'Core professional values and how they shape your career choices.',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=300&fit=crop'
      }
    ]
  },
  {
    id: 'career-suggestions',
    title: 'Career Suggestions for You',
    icon: Briefcase,
    imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=300&fit=crop',
    sections: [
      {
        id: 'top-careers',
        title: 'Top Career Suggestions',
        description: 'Strategic leadership roles best suited to your profile.',
        imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=300&fit=crop',
        isCollapsible: true,
        careers: [
          { id: 'first-career', title: 'Primary Career Match' },
          { id: 'second-career', title: 'Second Career Match' },
          { id: 'third-career', title: 'Third Career Match' }
        ]
      },
      {
        id: 'runner-up',
        title: 'Runner-up Careers',
        description: 'Additional career options organized by function and industry.',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=300&fit=crop'
      },
      {
        id: 'outside-box',
        title: 'Outside-the-Box Careers',
        description: 'Creative career combinations based on your unique interests.',
        imageUrl: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=600&h=300&fit=crop'
      },
      {
        id: 'dream-jobs',
        title: 'Dream Job Analysis',
        description: 'Feasibility analysis of your ideal career aspirations.',
        imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=300&fit=crop'
      }
    ]
  }
];
