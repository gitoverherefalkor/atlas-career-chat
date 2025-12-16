
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

const AILegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-6 border border-orange-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          <span className="font-semibold text-orange-800">AI Impact Legend</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-orange-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-orange-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-5 bg-white text-sm text-gray-700 space-y-4">
          <p className="text-gray-600">
            These ratings show how AI is expected to reshape each career by 2027-2028.
            The percentages reflect how much of the role's core work AI can handle on its own.
          </p>

          <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-green-700 mb-1">Safe (0-20% Impact)</h5>
              <p className="text-gray-600">
                This role depends on things AI can't replicate: deep empathy, complex physical work,
                high-stakes judgment, or nuanced people skills. AI might help with research or admin tasks,
                but human expertise drives all the important outcomes.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-blue-700 mb-1">Augmented (21-50% Impact)</h5>
              <p className="text-gray-600">
                AI handles a lot of the heavy lifting like data work, research, drafting, and initial problem-solving.
                You become the editor and decision-maker. Your productivity goes up, but your judgment, creativity,
                and oversight are still what make the work valuable.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-amber-700 mb-1">Transforming (51-80% Impact)</h5>
              <p className="text-gray-600">
                The role is changing fundamentally. AI does most of the execution work independently,
                from analysis to implementation. Your job becomes managing AI systems, checking outputs,
                handling edge cases, and making strategic calls. You'll need to retrain significantly
                to become an effective "manager of AI agents."
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-red-700 mb-1">At Risk (81-100% Impact)</h5>
              <p className="text-gray-600">
                The main work of this role (basic coding, translation, data entry, standard reports, routine analysis)
                can be fully automated by AI systems that are faster, more accurate, and more consistent.
                Human involvement becomes minimal or unnecessary for most tasks that traditionally defined this position.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            <strong>Note:</strong> These projections assume AI capabilities keep advancing, especially systems
            that can plan, execute complex tasks, and learn from feedback. Actual impact will vary based on
            how quickly organizations adopt AI, regulatory changes, and specific industry factors.
          </p>
        </div>
      )}
    </div>
  );
};

export default AILegend;
