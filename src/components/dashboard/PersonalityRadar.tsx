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

type Axis = 'Decisiveness' | 'Social Energy' | 'Autonomy' | 'Risk Tolerance' | 'Structure' | 'Action Bias';

// Phrase → 1-5 mapping. Lower-case + trim during lookup. Phrases here are
// the verbatim option labels the survey produces, mirrored in the
// init_summary section content.
const AXIS_VOCAB: Record<Axis, Array<{ match: RegExp; value: number }>> = {
  Decisiveness: [
    { match: /\bdecisive\b/i, value: 5 },
    { match: /leaning decisive/i, value: 4 },
    { match: /balanced/i, value: 3 },
    { match: /cautious/i, value: 2 },
    { match: /hesitant/i, value: 1 },
  ],
  'Social Energy': [
    { match: /\benergized\b(?!\s*\(somewhat)/i, value: 5 },
    { match: /somewhat energized/i, value: 4 },
    { match: /neutral/i, value: 3 },
    { match: /limited energy|drained \(some/i, value: 2 },
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
    { match: /comfortable/i, value: 4 },
    { match: /neutral/i, value: 3 },
    { match: /cautious/i, value: 2 },
    { match: /very cautious/i, value: 1 },
  ],
  Structure: [
    // Inverse of Autonomy — higher = more structure preference. Kept as a
    // separate axis because users with high autonomy may still want some
    // structural anchors. Currently derived from the same field with
    // inverted mapping; will split once intake provides a separate signal.
    { match: /highly structured/i, value: 5 },
    { match: /leaning structure/i, value: 4 },
    { match: /balanced/i, value: 3 },
    { match: /leaning flexible/i, value: 2 },
    { match: /highly flexible/i, value: 1 },
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
  Structure: /environment structure[^:]*:\s*([^[\n]+?)(?:\s*\[|\n|$)/i,
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
  const axes: Axis[] = ['Decisiveness', 'Social Energy', 'Autonomy', 'Risk Tolerance', 'Structure', 'Action Bias'];
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
}

export const PersonalityRadar: React.FC<PersonalityRadarProps> = ({ sections, className }) => {
  const data = useMemo(() => buildRadarData(sections), [sections]);

  if (data.length < 4) {
    // Not enough axes parsed to make the radar meaningful — render a soft
    // placeholder so the dashboard hero row stays balanced. The init_summary
    // is usually populated within seconds of the report completing, so this
    // state should be brief.
    return (
      <div className={className}>
        <div className="rounded-2xl border border-atlas-navy/10 bg-white/60 backdrop-blur-sm p-5 h-full flex flex-col">
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
      <div className="rounded-2xl border border-atlas-navy/10 bg-white p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-atlas-teal">
            <Activity className="w-4 h-4" strokeWidth={2.25} />
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">
              Personality Radar
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-atlas-navy/40">
            6 axes
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">
          How you operate, plotted across six core dimensions.
        </p>
        <div className="flex-1 min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="78%">
              <PolarGrid stroke="#E5E7EB" />
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
