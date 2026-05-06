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
// Two flavors of axis depending on data source:
//   - V2 (preferred): 5 AI-judged dimensions stored in
//     report_sections.metadata.personality_scores on the approach row.
//     Each is 1-10 and represents an interpretive judgment over the full
//     personality picture, not a regurgitation of survey answers.
//   - V1 (fallback): 5 categorical survey answers parsed from
//     init_summary content via regex. Used when V2 metadata isn't
//     present (older reports generated before WF1 emitted scores).
type AxisV2 =
  | 'Strategic Depth'
  | 'Execution'
  | 'People Intuition'
  | 'Ambiguity Tolerance'
  | 'Recognition Pull';

type AxisV1 = 'Decisiveness' | 'Social Energy' | 'Autonomy' | 'Risk Tolerance' | 'Action Bias';

type Axis = AxisV1 | AxisV2;

// Map the snake_case keys the AI emits to the human-readable axis labels
// shown on the radar.
const V2_KEY_TO_LABEL: Record<string, AxisV2> = {
  strategic_depth: 'Strategic Depth',
  execution_bias: 'Execution',
  people_intuition: 'People Intuition',
  ambiguity_tolerance: 'Ambiguity Tolerance',
  recognition_pull: 'Recognition Pull',
};

// Order of V2 axes around the radar. Chosen so opposing dimensions sit
// across from each other when possible (recognition vs depth, action vs
// reflection-adjacent).
const V2_AXIS_ORDER: AxisV2[] = [
  'Strategic Depth',
  'Execution',
  'People Intuition',
  'Ambiguity Tolerance',
  'Recognition Pull',
];

// Phrase → 1-5 mapping. Lower-case + trim during lookup. Phrases here are
// the verbatim option labels the survey produces, mirrored in the
// init_summary section content.
//
// IMPORTANT: order specific BEFORE broad. The first matching pattern
// wins, so "Leaning Decisive" must be checked before "Decisive" (which
// would otherwise match "Leaning Decisive" via the \bdecisive\b regex).
const AXIS_VOCAB: Record<AxisV1, Array<{ match: RegExp; value: number }>> = {
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
const AXIS_SOURCE: Record<AxisV1, RegExp> = {
  Decisiveness: /decision speed[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
  'Social Energy': /social energy[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
  Autonomy: /environment structure[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
  'Risk Tolerance': /risk tolerance[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
  'Action Bias': /stress response[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
};

interface RadarPoint {
  axis: Axis;
  // V2 scores are 1-10; V1 are 1-5. We normalize both to a 0-5 scale
  // for the chart so the polar grid + filled polygon look consistent.
  value: number;
}

function parseAxis(content: string, axis: AxisV1): number | null {
  const sourceMatch = content.match(AXIS_SOURCE[axis]);
  if (!sourceMatch) return null;
  const phrase = sourceMatch[1];
  for (const entry of AXIS_VOCAB[axis]) {
    if (entry.match.test(phrase)) return entry.value;
  }
  return null;
}

// V2 path: read AI-judged scores from approach.metadata.personality_scores.
// 1-10 scale — divide by 2 to land on the same 0-5 axis as V1 so the chart
// rendering doesn't have to branch on data source.
function buildRadarDataV2(sections: ReportSection[] | undefined): RadarPoint[] {
  if (!sections) return [];
  const approach = sections.find((s) => s.section_type === 'approach');
  const scores = approach?.metadata?.personality_scores;
  if (!scores || typeof scores !== 'object') return [];

  const out: RadarPoint[] = [];
  for (const axis of V2_AXIS_ORDER) {
    const key = Object.keys(V2_KEY_TO_LABEL).find((k) => V2_KEY_TO_LABEL[k] === axis);
    if (!key) continue;
    const raw = scores[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    out.push({ axis, value: Math.max(0, Math.min(5, raw / 2)) });
  }
  return out;
}

// V1 path: regex-parse init_summary for the canonical survey-answer phrases.
// Used as a fallback when V2 metadata isn't present (older reports
// generated before WF1 emitted scores).
function buildRadarDataV1(sections: ReportSection[] | undefined): RadarPoint[] {
  if (!sections) return [];
  const init = sections.find((s) => s.section_type === 'init_summary');
  if (!init) return [];
  const text = (init.content || '').replace(/<[^>]+>/g, ' ');
  const axes: AxisV1[] = ['Decisiveness', 'Social Energy', 'Autonomy', 'Risk Tolerance', 'Action Bias'];
  const out: RadarPoint[] = [];
  for (const axis of axes) {
    const v = parseAxis(text, axis);
    if (v != null) out.push({ axis, value: v });
  }
  return out;
}

function buildRadarData(sections: ReportSection[] | undefined): RadarPoint[] {
  // V2 wins when present — interpretive AI scoring is more meaningful
  // than survey-direct categorical answers.
  const v2 = buildRadarDataV2(sections);
  if (v2.length >= 3) return v2;
  return buildRadarDataV1(sections);
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
  // Bare mode CANNOT use h-full / flex-1 because the parent ChapterCard
  // has no fixed height — Recharts' ResponsiveContainer would measure 0
  // and bail. Use an explicit min-height instead.
  const wrapperClass = bare
    ? 'p-5 min-h-[320px] flex flex-col'
    : 'rounded-2xl border border-atlas-navy/10 bg-white p-5 shadow-sm h-full flex flex-col';
  const placeholderWrapperClass = bare
    ? 'p-5 min-h-[320px] flex flex-col'
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
        {/* Explicit height so Recharts' ResponsiveContainer has something
            to measure. flex-1 broke when the parent ChapterCard didn't
            constrain height — measured 0 and silently rendered nothing. */}
        <div className="w-full" style={{ height: 260 }}>
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
