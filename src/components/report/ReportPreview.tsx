import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { chapters } from './reportData';
import { PersonalityRadar } from '@/components/dashboard/PersonalityRadar';
import { CareerQuadrant } from '@/components/dashboard/CareerQuadrant';

interface ReportPreviewProps {
  // Kept for backwards compatibility — the inline CTA was dropped in
  // favor of the standalone "Start Your Assessment" card on Dashboard.
  onStartAssessment?: () => void;
}

// Pre-assessment dashboard skeleton. Mirrors the populated layout
// (chart cards as chapter headers + section list) so the user sees
// the same shape they'll have after the assessment, just without data.
// PersonalityRadar / CareerQuadrant render their built-in placeholder
// states ("Calibrating your profile…", "Mapping your matches…") when
// passed undefined sections.
const ReportPreview: React.FC<ReportPreviewProps> = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {chapters.map((chapter) => {
        const isAboutYou = chapter.id === 'about-you';
        return (
          <Card key={chapter.id} className="overflow-hidden">
            {/* Chart placeholder where the populated dashboard renders the
                radar / map. The bolder teal divider below matches the
                populated layout's chapter-header look. */}
            <div className="border-b-2 border-atlas-teal/60">
              {isAboutYou ? (
                <PersonalityRadar sections={undefined} bare locked />
              ) : (
                <CareerQuadrant sections={undefined} variant="compact" bare locked />
              )}
            </div>

            {/* Locked section list — same titles users will see post-
                assessment, lock icon trailing each row so the gating is
                obvious. Section titles + descriptions come from the
                shared chapters data so wording stays in sync with the
                live report. */}
            <CardContent className="p-0">
              <div className="space-y-0">
                {chapter.sections.map((section) => (
                  <div
                    key={section.id}
                    className="p-4 border-b last:border-b-0 bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-700 text-sm">
                          {section.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                          {section.description}
                        </p>
                      </div>
                      <Lock className="h-4 w-4 text-gray-400 shrink-0" />
                    </div>

                    {/* Top-careers section in the right column has nested
                        career titles. Show them as locked sub-rows so the
                        "you'll get top 3 + runner-ups" expectation is
                        clear before the user starts. */}
                    {section.careers && (
                      <div className="mt-3 space-y-1.5 pl-4 border-l-2 border-gray-200">
                        {section.careers.map((career) => (
                          <div
                            key={career.id}
                            className="flex items-center gap-2 text-xs text-gray-500"
                          >
                            <Lock className="h-3 w-3" />
                            <span>{career.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ReportPreview;
