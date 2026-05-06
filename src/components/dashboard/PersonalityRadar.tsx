import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import type { ReportSection } from '@/hooks/useReportSections';

// Personality Radar — 6-axis snapshot built from the canonical labels the
// agent surfaces in the init_summary section. Each axis maps a categorical
// survey response to a 1-5 numeric value. The chart renders nothing if
// fewer than 4 axes can be parsed reliably.

// Five real axes — each maps to a distinct survey field. We had a sixth
// "Structure" axis briefly but it was just the inverse of Autonomy, so
// the chart was mathematically redundant. Adding a sixth real signal
// requires a new survey field; keeping it at 5 honest axes for now.
type Axis = 'Decisiveness' | 'Social Energy' | 'Autonomy' | 'Risk Tolerance' | 'Action Bias';

// Phrase → 1-5 mapping. Lower-case + trim during lookup. Phrases here are
// the verbatim option labels the survey produces, mirrored in the
// init_summary section content.
//
// IMPORTANT: order specific BEFORE broad. The first matching pattern
// wins, so "Leaning Decisive" must be checked before "Decisive" (which
// would otherwise match "Leaning Decisive" via the \bdecisive\b regex).
const AXIS_VOCAB: Record<Axis, Array<{ match: RegExp; value: number }>> = {
  Decisiveness: [
    { match: /leaning decisive/i, value: 4 },
    { match: /\bdecisive\b/i, value: 5 },
    { match: /balanced/i, value: 3 },
    { match: /very cautious/i, value: 1 },
    { match: /cautious/i, value: 2 },
    { match: /hesitant/i, value: 1 },
  ],
  'Social Energy': [
    { match: /somewhat energized/i, value: 4 },
    { match: /\benergized\b/i, value: 5 },
    { match: /neutral/i, value: 3 },
    { match: /somewhat drained|limited energy/i, value: 2 },
    { match: /\bdrained\b/i, value: 1 },
  ],
  Autonomy: [
    { match: /highly flexible/i, value: 5 },
    { match: /leaning flexible/i, value: 4 },
    { match: /balanced/i, value: 3 },
    { match: /leaning structure/i, value: 2 },
    { match: /highly structured/i, value: 1 },
  ],
  'Risk Tolerance': [
    { match: /very comfortable/i, value: 5 },
    { match: /\bcomfortable\b/i, value: 4 },
    { match: /neutral/i, value: 3 },
    { match: /very cautious/i, value: 1 },
    { match: /\bcautious\b/i, value: 2 },
  ],
  'Action Bias': [
    { match: /leaning action/i, value: 4 },
    { match: /\baction\b/i, value: 5 },
    { match: /balanced/i, value: 3 },
    { match: /leaning reflect/i, value: 2 },
    { match: /\breflect\b/i, value: 1 },
  ],
};

// Source-line patterns inside init_summary. Each axis is keyed off a
// distinct prefix the agent uses verbatim ("Decision speed:", "Social
// energy:" etc.).
const AXIS_SOURCE: Record<Axis, RegExp> = {
  Decisiveness: /decision speed[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
  'Social Energy': /social energy[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
  Autonomy: /environment structure[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
  'Risk Tolerance': /risk tolerance[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
  'Action Bias': /stress response[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
};

interface RadarPoint {
  axis: Axis;
  value: number;
}

function parseAxis(content: string, axis: Axis): number | null {
  const sourceMatch = content.match(AXIS_SOURCE[axis]);
  if (!sourceMatch) return null;
  const phrase = sourceMatch[1];
  for (const entry of AXIS_VOCAB[axis]) {
    if (entry.match.test(phrase)) return entry.value;
  }
  return null;
}

function buildRadarData(sections: ReportSection[] | undefined): RadarPoint[] {
  if (!sections) return [];
  const init = sections.find((s) => s.section_type === 'init_summary');
  if (!init) return [];
  const text = (init.content || '').replace(/<[^>]+>/g, ' ');
  const axes: Axis[] = ['Decisiveness', 'Social Energy', 'Autonomy', 'Risk Tolerance', 'Action Bias'];
  const out: RadarPoint[] = [];
  for (const axis of axes) {
    const v = parseAxis(text, axis);
    if (v != null) out.push({ axis, value: v });
  }
  return out;
}

interface PersonalityRadarProps {
  sections: ReportSection[] | undefined;
  className?: string;
  // 'bare' = strip the outer rounded-border wrapper so the chart can sit
  // inside another card (e.g. as a ChapterCard customHeader) without a
  // double border. The inner content (label, chart, legend) stays the
  // same — only the wrapping <div> changes.
  bare?: boolean;
}

export const PersonalityRadar: React.FC<PersonalityRadarProps> = ({ sections, className, bare = false }) => {
  const data = useMemo(() => buildRadarData(sections), [sections]);

  // Tailwind classes for the wrapping element. When `bare`, drop the
  // border + shadow + radius so the parent card owns the visual frame.
  const wrapperClass = bare
    ? 'p-5 h-full flex flex-col'
    : 'rounded-2xl border border-atlas-navy/10 bg-white p-5 shadow-sm h-full flex flex-col';
  const placeholderWrapperClass = bare
    ? 'p-5 h-full flex flex-col'
    : 'rounded-2xl border border-atlas-navy/10 bg-white/60 backdrop-blur-sm p-5 h-full flex flex-col';

  if (data.length < 3) {
    // Not enough axes parsed to make the radar meaningful — render a soft
    // placeholder so the dashboard hero row stays balanced. The init_summary
    // is usually populated within seconds of the report completing, so this
    // state should be brief.
    return (
      <div className={className}>
        <div className={placeholderWrapperClass}>
          <div className="flex items-center gap-2 mb-2 text-atlas-teal">
            <Activity className="w-4 h-4" strokeWidth={2.25} />
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">
              Personality Radar
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400 italic min-h-[180px]">
            Calibrating your profile…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={wrapperClass}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-atlas-teal">
            <Activity className="w-4 h-4" strokeWidth={2.25} />
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">
              Personality Radar
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-atlas-navy/40">
            5 axes
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">
          How you operate, plotted across five core dimensions.
        </p>
        <div className="flex-1 min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="78%">
              {/* Bumped to a darker neutral so the polar grid actually shows
                  on the warm-paper background. Previously #E5E7EB
                  disappeared into the card. */}
              <PolarGrid stroke="#9CA3AF" strokeOpacity={0.45} strokeWidth={1} />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
              />
              <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="#27A1A1"
                fill="#27A1A1"
                fillOpacity={0.35}
                strokeWidth={2}
                isAnimationActive
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
