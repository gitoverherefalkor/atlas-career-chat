import React from 'react';

// AI Impact rating scale, ordered low → high.
// Phrases the n8n prompts produce: "Supporting", "Augmented", "Moderate",
// "Substantial", "Transforming". "Low"/"High" appear occasionally as
// shorthand and map to the nearest level.
const AI_IMPACT_LEVELS = ['Supporting', 'Augmented', 'Moderate', 'Substantial', 'Transforming'] as const;
type AIImpactLevel = typeof AI_IMPACT_LEVELS[number];

const AI_IMPACT_ALIASES: Record<string, AIImpactLevel> = {
  supporting: 'Supporting',
  low: 'Supporting',
  augmented: 'Augmented',
  moderate: 'Moderate',
  medium: 'Moderate',
  substantial: 'Substantial',
  high: 'Substantial',
  transforming: 'Transforming',
  transformative: 'Transforming',
};

// Pull an AI Impact rating out of free-text section content.
// We try multiple shapes the prompt produces:
//   "Rating: Supporting."
//   "AI Impact: Moderate"
//   "carries a Moderate AI impact rating"
//   "**Substantial:** Generative AI is..."
export function extractAIImpact(body: string): AIImpactLevel | null {
  if (!body) return null;
  const text = body.replace(/<[^>]+>/g, ' '); // strip any inline html tags

  const patterns: RegExp[] = [
    /(?:ai\s*impact[^.\n]{0,40}?)(supporting|augmented|moderate|substantial|transforming|low|high)/i,
    /(?:rating)\s*[:\-]\s*(supporting|augmented|moderate|substantial|transforming|low|high)/i,
    /carries?\s+a\s+(supporting|augmented|moderate|substantial|transforming|low|high)\s+ai\s*impact/i,
    /\*\*(supporting|augmented|moderate|substantial|transforming):/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const key = m[1].toLowerCase();
      if (AI_IMPACT_ALIASES[key]) return AI_IMPACT_ALIASES[key];
    }
  }
  return null;
}

// Compact pill showing match score 0-100 with a subtle progress bar.
const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const safe = Math.max(0, Math.min(100, score));

  // Score color tier — neutral teal for everything; orange for outstanding.
  const barClass =
    safe >= 85 ? 'bg-atlas-orange' : safe >= 70 ? 'bg-atlas-teal' : 'bg-atlas-blue';

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-atlas-navy/10 bg-white px-3 py-1.5 shadow-sm">
      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        Match
      </span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-base font-bold text-atlas-navy leading-none">{safe}</span>
        <span className="text-[10px] text-gray-400 leading-none">/100</span>
      </div>
      <div className="h-1.5 w-14 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barClass} rounded-full transition-all duration-500`}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
};

// 5-step badge: filled dots up to and including the role's level.
const AIImpactBadge: React.FC<{ level: AIImpactLevel }> = ({ level }) => {
  const idx = AI_IMPACT_LEVELS.indexOf(level);
  if (idx < 0) return null;

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-atlas-navy/10 bg-white px-3 py-1.5 shadow-sm">
      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        AI Impact
      </span>
      <span className="text-xs font-semibold text-atlas-navy">{level}</span>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {AI_IMPACT_LEVELS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i <= idx ? 'bg-atlas-gold' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

interface CareerScoreCardProps {
  score?: number | null;
  aiImpact?: AIImpactLevel | null;
}

// Renders score + AI impact in a single row above a career section heading.
// Renders nothing if neither value is available, so prose-only careers stay clean.
export const CareerScoreCard: React.FC<CareerScoreCardProps> = ({ score, aiImpact }) => {
  if (score == null && !aiImpact) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-2 mt-1">
      {score != null && <ScoreGauge score={score} />}
      {aiImpact && <AIImpactBadge level={aiImpact} />}
    </div>
  );
};
