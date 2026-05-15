
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ClipboardList, Brain, Compass, Briefcase, Users, HeartHandshake, Target, type LucideIcon } from 'lucide-react';

interface SectionIntroductionProps {
  sectionNumber: number;
  sectionTitle: string;
  description: string;
  onContinue: () => void;
}

// Icon per section (1-indexed) — shown at the top of each section intro so the
// topic is recognisable at a glance.
const SECTION_ICONS: LucideIcon[] = [
  ClipboardList,  // 1 — Intake Questions
  Brain,          // 2 — Personality and Decision-Making
  Compass,        // 3 — Values and Motivations
  Briefcase,      // 4 — Professional Interests and Skills
  Users,          // 5 — Work Environment and Team Preferences
  HeartHandshake, // 6 — Emotional Intelligence
  Target,         // 7 — Career Goals and Development
];

export const SectionIntroduction: React.FC<SectionIntroductionProps> = ({
  sectionNumber,
  sectionTitle,
  description,
  onContinue
}) => {
  const Icon = SECTION_ICONS[sectionNumber - 1];

  // Function to format text with emphasis and line breaks
  const formatTextWithEmphasis = (text: string) => {
    // Replace **text** with <strong>text</strong> and \n with <br>
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\\n/g, '<br>');
    return { __html: formattedText };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="text-center py-12 px-8">
          {Icon && (
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-atlas-teal/10">
              <Icon className="h-8 w-8 text-atlas-teal" />
            </div>
          )}
          <h2 className="text-3xl font-medium text-atlas-navy mb-4">
            Section {sectionNumber}
          </h2>
          <h3 className="text-xl font-semibold text-atlas-teal mb-6">
            {sectionTitle}
          </h3>
          <div 
            className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto"
            dangerouslySetInnerHTML={formatTextWithEmphasis(description)}
          />
          <Button
            onClick={onContinue}
            className="bg-atlas-teal hover:bg-atlas-teal/90 px-8 py-3 text-lg"
          >
            Continue
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
