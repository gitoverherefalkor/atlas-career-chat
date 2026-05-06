
import React from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import type { JobSearchResult } from '@/hooks/useJobSearch';

interface SearchProgressProps {
  results: JobSearchResult[];
  currentIndex: number;
}

const SearchProgress: React.FC<SearchProgressProps> = ({ results, currentIndex }) => {
  if (results.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
        Search Progress
      </h3>

      <div className="space-y-3">
        {results.map((result, idx) => (
          <div key={result.sectionType} className="flex items-center gap-3">
            {/* Status icon */}
            <div className="shrink-0">
              {result.status === 'searching' && (
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-atlas-teal animate-spin" />
                </div>
              )}
              {result.status === 'done' && (
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
              )}
              {result.status === 'error' && (
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              )}
              {result.status === 'idle' && (
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-400">{idx + 1}</span>
                </div>
              )}
            </div>

            {/* Career info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                result.status === 'searching' ? 'text-atlas-teal' :
                result.status === 'done' ? 'text-gray-900' :
                result.status === 'error' ? 'text-red-600' :
                'text-gray-400'
              }`}>
                {result.careerTitle}
              </p>
              {result.status === 'searching' && (
                <p className="text-xs text-gray-500">Searching job boards...</p>
              )}
              {result.status === 'done' && (
                <p className="text-xs text-emerald-600">
                  {result.totalCount} {result.totalCount === 1 ? 'job' : 'jobs'} found
                  {result.cached && ' (cached)'}
                </p>
              )}
              {result.status === 'error' && (
                <p className="text-xs text-red-500">{result.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-atlas-teal rounded-full transition-all duration-500"
            style={{
              width: `${(results.filter(r => r.status === 'done' || r.status === 'error').length / results.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchProgress;
