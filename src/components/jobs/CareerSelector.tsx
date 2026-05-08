
import React from 'react';
import { Check, Award, Lightbulb } from 'lucide-react';

export type CareerTier = 'top-1' | 'top-2' | 'top-3' | 'runner-up' | 'outside-box';

interface CareerOption {
  sectionType: string;
  title: string;
  tier: CareerTier;
}

interface CareerSelectorProps {
  careers: CareerOption[];
  selected: string[];
  onToggle: (sectionType: string) => void;
  maxSelections?: number;
  disabled?: boolean;
}

// Per-tier label, icon, and accent — mirrors the report sidebar/dashboard
// styling so the Jobs page reads as part of the same product.
const TIER_META: Record<CareerTier, {
  label: string;
  badge: 'number' | 'icon';
  icon?: typeof Award;
  number?: number;
}> = {
  'top-1': { label: 'Top Career #1', badge: 'number', number: 1 },
  'top-2': { label: 'Top Career #2', badge: 'number', number: 2 },
  'top-3': { label: 'Top Career #3', badge: 'number', number: 3 },
  'runner-up': { label: 'Runner-up', badge: 'icon', icon: Award },
  'outside-box': { label: 'Outside the Box', badge: 'icon', icon: Lightbulb },
};

const CareerSelector: React.FC<CareerSelectorProps> = ({
  careers,
  selected,
  onToggle,
  maxSelections = 3,
  disabled = false,
}) => {
  const isSelected = (sectionType: string) => selected.includes(sectionType);
  const isMaxed = selected.length >= maxSelections;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Select careers to explore</h3>
        <span className="text-sm text-muted-foreground">{selected.length} / {maxSelections} selected</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {careers.map((career) => {
          const active = isSelected(career.sectionType);
          const cantSelect = !active && isMaxed;
          const meta = TIER_META[career.tier];
          const Icon = meta.icon;

          return (
            <button
              key={career.sectionType}
              onClick={() => !disabled && !cantSelect && onToggle(career.sectionType)}
              disabled={disabled || cantSelect}
              className={`
                relative text-left p-4 rounded-xl border-2 transition-all
                ${active
                  ? 'border-atlas-teal bg-blue-50 shadow-sm'
                  : cantSelect
                    ? 'border-gray-200 bg-white opacity-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
              `}
            >
              {/* Selection indicator (top right) */}
              <div className={`
                absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center
                ${active ? 'bg-atlas-teal text-white' : 'border-2 border-gray-300'}
              `}>
                {active && <Check className="h-4 w-4" />}
              </div>

              {/* Category label + tier icon */}
              <div className="flex items-center gap-2 mb-2 pr-8">
                {meta.badge === 'number' && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-atlas-teal/15 text-atlas-teal dark:text-teal-400 text-[11px] font-bold">
                    {meta.number}
                  </span>
                )}
                {meta.badge === 'icon' && Icon && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-atlas-teal/15 text-atlas-teal dark:text-teal-400">
                    <Icon className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                  {meta.label}
                </span>
              </div>

              {/* Career title — min-h reserves space for ~2 lines so a 1-line
                  title doesn't look stranded next to 2-line ones in the same grid row */}
              <h4 className="font-heading font-semibold text-atlas-navy leading-snug line-clamp-3 min-h-[2.75rem]">
                {career.title}
              </h4>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CareerSelector;
