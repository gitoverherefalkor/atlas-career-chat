
import React from 'react';
import { Check } from 'lucide-react';

interface CareerOption {
  sectionType: string;
  title: string;
  description: string;
  alternateTitles?: string[];
}

interface CareerSelectorProps {
  careers: CareerOption[];
  selected: string[];
  onToggle: (sectionType: string) => void;
  maxSelections?: number;
  disabled?: boolean;
}

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
        <h3 className="text-lg font-semibold text-gray-900">Select careers to explore</h3>
        <span className="text-sm text-gray-500">{selected.length} / {maxSelections} selected</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {careers.map((career) => {
          const active = isSelected(career.sectionType);
          const cantSelect = !active && isMaxed;

          return (
            <button
              key={career.sectionType}
              onClick={() => !disabled && !cantSelect && onToggle(career.sectionType)}
              disabled={disabled || cantSelect}
              className={`
                relative text-left p-4 rounded-xl border-2 transition-all
                ${active
                  ? 'border-atlas-blue bg-blue-50 shadow-sm'
                  : cantSelect
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
              `}
            >
              {/* Selection indicator */}
              <div className={`
                absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center
                ${active ? 'bg-atlas-blue text-white' : 'border-2 border-gray-300'}
              `}>
                {active && <Check className="h-4 w-4" />}
              </div>

              <h4 className="font-semibold text-gray-900 pr-8 mb-1">{career.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{career.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CareerSelector;
