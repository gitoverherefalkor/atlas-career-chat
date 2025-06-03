
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface SectionIntroductionProps {
  sectionNumber: number;
  sectionTitle: string;
  description: string;
  onContinue: () => void;
}

export const SectionIntroduction: React.FC<SectionIntroductionProps> = ({
  sectionNumber,
  sectionTitle,
  description,
  onContinue
}) => {
  // Function to format text with emphasis and line breaks
  const formatTextWithEmphasis = (text: string) => {
    // Replace **text** with <strong>text</strong> and \n with <br>
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\\n/g, '<br>');
    return { __html: formattedText };
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="text-center py-12 px-8">
          <h2 className="text-3xl font-bold text-atlas-navy mb-4">
            Section {sectionNumber}
          </h2>
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
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
