import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts';
import type { ReportSection } from '@/hooks/useReportSections';

// Plain-English descriptions for each radar axis. Shown in the hover
// tooltip so users don't have to guess what "Recognition Pull" means.
const AXIS_HELP: Record<string, string> = {
  // V2 (AI-judged)
  'Strategic Depth':
    'How much you naturally think in long arcs and systems vs in the moment.',
  Execution:
    'How fast you ship vs how much you deliberate before committing.',
  'People Intuition':
    'How well you read social dynamics, politics, and interpersonal subtext.',
  'Ambiguity Tolerance':
    'How comfortably you operate when the path is unclear or undefined.',
  'Recognition Pull':
    'How much you draw motivation from external visibility vs internal craft.',
  // V1 (survey-direct fallback)
  Decisiveness: 'How quickly you commit to decisions when the call needs to be made.',
  'Social Energy': 'Whether time with people charges or drains you.',
  Autonomy: 'How much independence you need to perform at your best.',
  'Risk Tolerance': 'How comfortable you are taking calculated risks.',
  'Action Bias': 'Whether your default under pressure is to act or to reflect.',
};

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

// V2 path: read AI-judged scores from any personality section's
// metadata.personality_scores. Scoring is holistic so the prompt allows
// recalibration on feedback to any of the 4 personality sections. The
// scores end up on whichever row was last edited; we pick the most
// recent so the latest feedback wins.
// 1-10 scale — divide by 2 to land on the same 0-5 axis as V1 so the chart
// rendering doesn't have to branch on data source.
const PERSONALITY_SECTION_TYPES = new Set([
  'approach',
  'strengths',
  'development',
  'values',
]);

function buildRadarDataV2(sections: ReportSection[] | undefined): RadarPoint[] {
  if (!sections) return [];
  const candidates = sections
    .filter(
      (s) =>
        PERSONALITY_SECTION_TYPES.has(s.section_type) &&
        s.metadata?.personality_scores &&
        typeof s.metadata.personality_scores === 'object',
    )
    .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  const winner = candidates[0];
  const scores = winner?.metadata?.personality_scores;
  if (!scores) return [];

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

// Hover tooltip for radar points. Shows the axis name, the score in
// human-readable form (out of 10), and a one-line plain-English
// description so the labels themselves don't have to carry the load.
//
// Note: V1 scores live on a 1-5 scale and V2 on a 1-10 scale, but we
// normalize both to 0-5 for the chart's polar axis. The tooltip undoes
// that normalization for V2 so the user sees the raw "/10" rating.
const RadarTooltip: React.FC<{ active?: boolean; payload?: any[] }> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as RadarPoint;
  const v2Axes: AxisV2[] = [...V2_AXIS_ORDER];
  const isV2 = v2Axes.includes(point.axis as AxisV2);
  const displayScore = isV2 ? Math.round(point.value * 2) : Math.round(point.value);
  const max = isV2 ? 10 : 5;
  const help = AXIS_HELP[point.axis as string];
  return (
    <div className="rounded-lg border border-atlas-navy/10 bg-white px-3 py-2 shadow-lg max-w-[260px]">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className="font-semibold text-atlas-navy text-sm">{point.axis}</span>
        <span className="text-atlas-teal font-bold text-sm">
          {displayScore}
          <span className="text-gray-400 font-normal text-xs">/{max}</span>
        </span>
      </div>
      {help && <p className="text-[11px] text-gray-600 leading-snug">{help}</p>}
    </div>
  );
};

interface PersonalityRadarProps {
  sections: ReportSection[] | undefined;
  className?: string;
  // 'bare' = strip the outer rounded-border wrapper so the chart can sit
  // inside another card (e.g. as a ChapterCard customHeader) without a
  // double border. The inner content (label, chart, legend) stays the
  // same — only the wrapping <div> changes.
  bare?: boolean;
  // 'locked' = user hasn't run an assessment yet. Render the empty web
  // (polar grid + axis labels) without the filled polygon, so the user
  // gets a preview of the shape they'll fill in. Distinct from the
  // sections-empty placeholder which says "Calibrating…" (used during
  // the transient post-assessment processing window).
  locked?: boolean;
}

export const PersonalityRadar: React.FC<PersonalityRadarProps> = ({ sections, className, bare = false, locked = false }) => {
  const data = useMemo(() => buildRadarData(sections), [sections]);
  // Locked-state data: V2 axis names at value 0 so the polar grid still
  // renders with labeled corners, but the Radar (filled polygon) is
  // omitted entirely below.
  const lockedData = useMemo<RadarPoint[]>(
    () => V2_AXIS_ORDER.map((axis) => ({ axis, value: 0 })),
    [],
  );

  // Tailwind classes for the wrapping element. When `bare`, drop the
  // border + shadow + radius so the parent card owns the visual frame.
  // Locked to h-[380px] so this column-header lines up exactly with
  // CareerQuadrant's bare wrapper across the two columns — that puts
  // the divider underneath both cards on the same horizontal line.
  // Avoid h-full / flex-1: ChapterCard has no fixed height, so Recharts
  // would measure 0 and bail.
  const wrapperClass = bare
    ? 'p-5 h-[380px] flex flex-col'
    : 'rounded-2xl border border-atlas-navy/10 bg-white p-5 shadow-sm h-full flex flex-col';
  const placeholderWrapperClass = bare
    ? 'p-5 h-[380px] flex flex-col'
    : 'rounded-2xl border border-atlas-navy/10 bg-white/60 backdrop-blur-sm p-5 h-full flex flex-col';

  // Pre-assessment users see the empty web (labels + polar grid, no
  // filled polygon). Don't fall through to the "Calibrating…" placeholder
  // — that's the transient post-assessment state.
  if (!locked && data.length < 3) {
    return (
      <div className={className}>
        <div className={placeholderWrapperClass}>
          <div className="flex items-center gap-2 mb-2 text-atlas-teal">
            <Activity className="w-4 h-4" strokeWidth={2.25} />
            <span className="text-xs uppercase tracking-[0.16em] font-semibold">
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

  // Locked uses placeholder axis data so the polar grid + labels render
  // at full structure; the data layer (filled polygon) is skipped below.
  const chartData = locked ? lockedData : data;

  return (
    <div className={className}>
      <div className={wrapperClass}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-atlas-teal">
            <Activity className="w-4 h-4" strokeWidth={2.25} />
            <span className="text-xs uppercase tracking-[0.16em] font-semibold">
              Personality Radar
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-atlas-navy/40">
            5 axes
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">
          {locked
            ? 'Available after your assessment.'
            : 'How you operate, plotted across five core dimensions.'}
        </p>
        {/* Explicit height so Recharts' ResponsiveContainer has something
            to measure. flex-1 broke when the parent ChapterCard didn't
            constrain height — measured 0 and silently rendered nothing.
            280px lets the radar fill the 380px wrapper after the header,
            description, and padding take their share. */}
        <div className="w-full" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="78%">
              {/* Bumped to a darker neutral so the polar grid actually shows
                  on the warm-paper background. Previously #E5E7EB
                  disappeared into the card. */}
              <PolarGrid stroke="#9CA3AF" strokeOpacity={0.45} strokeWidth={1} />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 10, fill: locked ? '#9CA3AF' : '#374151', fontWeight: 600 }}
              />
              <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
              {/* Tooltip + filled polygon only on populated data. Locked
                  state intentionally renders just the empty web so users
                  see the shape that's coming without anything to hover. */}
              {!locked && <Tooltip content={<RadarTooltip />} cursor={false} />}
              {!locked && (
                <Radar
                  dataKey="value"
                  stroke="#27A1A1"
                  fill="#27A1A1"
                  fillOpacity={0.35}
                  strokeWidth={2}
                  isAnimationActive
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
