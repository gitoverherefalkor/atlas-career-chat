import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useReportSections, type ReportSection } from '@/hooks/useReportSections';
import { useProfile } from '@/hooks/useProfile';
import { extractAIImpact } from './CareerScoreCard';

// Career Signature Card — closing artifact shown at the end of the chat
// session and persisted on the dashboard. Designed to be screenshot-able
// and shareable on LinkedIn, so the layout favors a bold headline career,
// supporting top 2 + top 3, and visible Atlas branding.

const AI_IMPACT_LEVELS = ['Safe', 'Augmented', 'Transforming', 'At Risk'] as const;
type AIImpactLevel = typeof AI_IMPACT_LEVELS[number];

const IMPACT_COLOR: Record<AIImpactLevel, { hex: string; bg: string; text: string }> = {
  Safe:         { hex: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Augmented:    { hex: '#0ea5e9', bg: 'bg-sky-50',     text: 'text-sky-700' },
  Transforming: { hex: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-700' },
  'At Risk':    { hex: '#ef4444', bg: 'bg-red-50',     text: 'text-red-700' },
};

interface SignatureCareer {
  rank: 1 | 2 | 3;
  title: string;
  score: number;
  aiImpact: AIImpactLevel | null;
}

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, '').replace(/\*\*/g, '').trim();
}

function getCareer(sections: ReportSection[], type: string, rank: 1 | 2 | 3): SignatureCareer | null {
  const s = sections.find((x) => x.section_type === type);
  if (!s) return null;
  const score = s.score != null ? Number(s.score) : NaN;
  if (!Number.isFinite(score)) return null;
  return {
    rank,
    title: stripHtml(s.title || 'Untitled'),
    score,
    aiImpact: extractAIImpact(s.content || ''),
  };
}

// Small pill — Match score with teal→emerald fill bar.
const MatchPill: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'sm' }) => {
  const isLg = size === 'lg';
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-atlas-teal/30 bg-white shadow-sm ${
        isLg ? 'px-3.5 py-2' : 'px-2.5 py-1'
      }`}
    >
      <span
        className={`uppercase tracking-wider font-semibold text-gray-500 ${
          isLg ? 'text-[10px]' : 'text-[9px]'
        }`}
      >
        Match
      </span>
      <span
        className={`font-bold text-atlas-teal leading-none ${isLg ? 'text-xl' : 'text-sm'}`}
      >
        {score}
      </span>
      <span className={`text-gray-400 ${isLg ? 'text-[10px]' : 'text-[9px]'}`}>/100</span>
    </div>
  );
};

// Small pill — AI Impact tier.
const ImpactPill: React.FC<{ level: AIImpactLevel; size?: 'sm' | 'lg' }> = ({ level, size = 'sm' }) => {
  const c = IMPACT_COLOR[level];
  const isLg = size === 'lg';
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${c.bg} shadow-sm ${
        isLg ? 'px-3.5 py-2' : 'px-2.5 py-1'
      }`}
      style={{ borderColor: `${c.hex}55` }}
    >
      <span
        className={`uppercase tracking-wider font-semibold text-gray-500 ${
          isLg ? 'text-[10px]' : 'text-[9px]'
        }`}
      >
        AI Impact
      </span>
      <span
        className={`font-bold ${c.text} leading-none ${isLg ? 'text-sm' : 'text-xs'}`}
      >
        {level}
      </span>
      <span className="inline-block rounded-full" style={{ background: c.hex, width: 8, height: 8 }} />
    </div>
  );
};

interface CareerSignatureCardProps {
  reportId: string;
  className?: string;
  // 'compact' renders a tighter card sized to fit a dashboard hero column.
  // 'full' is the standalone closing-screen / modal expansion.
  variant?: 'full' | 'compact';
  // Optional click handler — when set, the whole card becomes interactive
  // (cursor pointer + hover lift). Used by the dashboard to open a modal
  // with the full-size version.
  onClick?: () => void;
}

export const CareerSignatureCard: React.FC<CareerSignatureCardProps> = ({
  reportId,
  className,
  variant = 'full',
  onClick,
}) => {
  const isCompact = variant === 'compact';
  const { sections } = useReportSections(reportId);
  const { profile } = useProfile();

  const { hero, second, third, totalScored } = useMemo(() => {
    const list = sections || [];
    const hero = getCareer(list, 'top_career_1', 1);
    const second = getCareer(list, 'top_career_2', 2);
    const third = getCareer(list, 'top_career_3', 3);
    const totalScored = list.filter((s) =>
      ['top_career_1', 'top_career_2', 'top_career_3', 'runner_ups', 'outside_box'].includes(s.section_type)
        && s.score != null,
    ).length;
    return { hero, second, third, totalScored };
  }, [sections]);

  if (!hero) return null;

  const firstName = profile?.first_name || '';

  return (
    <div className={className}>
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        // Warm-paper card that pops on the dark teal-navy chat background.
        // The radial highlight on top creates a soft "spotlight" feel without
        // overwhelming the editorial palette.
        className={`relative overflow-hidden rounded-3xl border border-atlas-navy/10 shadow-xl ${
          onClick ? 'cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-2xl' : ''
        }`}
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, #ffffff 0%, #FAF6EC 45%, #ECE4D2 100%)',
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between ${isCompact ? 'px-4 pt-4 pb-3' : 'px-5 sm:px-7 pt-6 pb-4'}`}>
          <div className="flex items-center gap-2 text-atlas-teal">
            <Sparkles className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={2.25} />
            <span className={`uppercase tracking-[0.18em] font-semibold ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
              Your Career Signature
            </span>
          </div>
          <span className={`uppercase tracking-wider font-semibold text-atlas-navy/50 ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
            ATLAS
          </span>
        </div>

        {/* Hero — top career #1 */}
        <div className={isCompact ? 'px-4 pb-4' : 'px-5 sm:px-7 pb-6'}>
          <div className={`uppercase tracking-[0.2em] font-semibold text-gray-500 ${isCompact ? 'text-[9px] mb-1.5' : 'text-[10px] mb-2'}`}>
            Strongest Match {firstName ? `· ${firstName}` : ''}
          </div>
          <h2
            className={`font-heading leading-tight font-bold text-atlas-navy ${
              isCompact
                ? 'text-[1.15rem] mb-2 line-clamp-2'
                : 'text-[1.65rem] sm:text-[2rem] mb-3'
            }`}
          >
            {hero.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <MatchPill score={hero.score} size={isCompact ? 'sm' : 'lg'} />
            {hero.aiImpact && <ImpactPill level={hero.aiImpact} size={isCompact ? 'sm' : 'lg'} />}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-atlas-navy/10" />

        {/* Top 2 + 3 grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-atlas-navy/10 ${isCompact ? '[&>*]:px-4 [&>*]:py-3' : ''}`}>
          {[second, third].map((c, i) =>
            c ? (
              <div key={c.rank} className={isCompact ? '' : 'px-5 sm:px-7 py-5'}>
                <div className={`uppercase tracking-[0.2em] font-semibold text-gray-500 ${isCompact ? 'text-[9px] mb-1' : 'text-[10px] mb-1.5'}`}>
                  {c.rank === 2 ? 'Top Career #2' : 'Top Career #3'}
                </div>
                <div
                  className={`font-heading leading-snug font-semibold text-atlas-navy line-clamp-2 ${
                    isCompact ? 'text-[0.9rem] mb-1.5' : 'text-[1.05rem] sm:text-[1.15rem] mb-2.5'
                  }`}
                >
                  {c.title}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <MatchPill score={c.score} />
                  {c.aiImpact && <ImpactPill level={c.aiImpact} />}
                </div>
              </div>
            ) : (
              // Empty cell keeps layout balanced if WF4 hasn't filled this rank yet.
              <div key={`empty-${i}`} className={`opacity-50 ${isCompact ? '' : 'px-5 sm:px-7 py-5'}`}>
                <div className={`uppercase tracking-[0.2em] font-semibold text-gray-400 ${isCompact ? 'text-[9px] mb-1' : 'text-[10px] mb-1.5'}`}>
                  {i === 0 ? 'Top Career #2' : 'Top Career #3'}
                </div>
                <div className="text-sm text-gray-400 italic">Pending</div>
              </div>
            ),
          )}
        </div>

        {/* Footer */}
        <div
          className={`border-t border-atlas-navy/10 flex items-center justify-between bg-white/40 ${
            isCompact ? 'px-4 py-2.5' : 'px-5 sm:px-7 py-3.5'
          }`}
        >
          <span className={`text-atlas-navy/60 ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
            {totalScored > 0
              ? `${totalScored} role${totalScored === 1 ? '' : 's'} analyzed`
              : 'From your Atlas Assessment'}
          </span>
          <span className={`font-semibold text-atlas-teal ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
            {isCompact ? 'View →' : 'atlas-assessments.com'}
          </span>
        </div>
      </div>
    </div>
  );
};
