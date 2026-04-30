import {
  Users,
  Swords,
  Layers,
  Lightbulb,
  Sparkles,
  Brain,
  TrendingUp,
  Sprout,
  ArrowUpRight,
  Mountain,
  Compass,
  Scale,
  type LucideIcon,
} from 'lucide-react';

// Map of sub-section subheader text → icon component.
// The agent's prompts produce these exact h5 strings on the personality
// sections (approach / strengths / development / values), so an exact-match
// dictionary is reliable. Anything not in the map renders without an icon
// — that's fine, no decorative noise on unmatched headers.
//
// Match is case-insensitive and trimmed; punctuation is preserved in keys
// to keep the lookup obvious. Update here when the prompt is edited.
const ICON_MAP: Record<string, LucideIcon> = {
  // approach
  'personality and interaction style': Users,
  'your conflict style': Swords,
  'impact in different environments': Layers,

  // strengths
  'identifying your core strengths': Sparkles,
  'how you think': Brain,
  'leveraging strengths in your career': TrendingUp,

  // development
  'understanding potential growth areas': Sprout,
  'implications for your growth': ArrowUpRight,
  'your growth edge': Mountain,

  // values
  'identifying your core values': Compass,
  'values in career decisions': Scale,

  // shared closer across all four personality sections
  'key insight': Lightbulb,
};

export function iconForSubsection(title: string): LucideIcon | null {
  if (!title) return null;
  const key = title.trim().toLowerCase().replace(/\s+/g, ' ');
  return ICON_MAP[key] ?? null;
}
