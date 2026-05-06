
import React from 'react';
import { Heart, ExternalLink, MapPin, Building2, Trash2 } from 'lucide-react';
import type { SavedJob } from '@/hooks/useSavedJobs';

interface SavedJobsListProps {
  savedJobs: SavedJob[];
  onUnsave: (externalJobId: string) => void;
}

const SavedJobsList: React.FC<SavedJobsListProps> = ({ savedJobs, onUnsave }) => {
  if (savedJobs.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-xl">
        <Heart className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No saved jobs yet.</p>
        <p className="text-muted-foreground/70 text-xs mt-1">Search for jobs and save the ones you like.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {savedJobs.map((job) => (
        <div
          key={job.id}
          className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-base mb-1">{job.job_title}</h4>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                {job.company_name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.company_name}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </span>
                )}
              </div>

              {job.description_snippet && (
                <p className="text-sm text-gray-600 line-clamp-2">{job.description_snippet}</p>
              )}
            </div>

            <button
              onClick={() => onUnsave(job.external_job_id)}
              className="shrink-0 w-9 h-9 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
              title="Remove from saved"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {job.apply_url && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <a
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-atlas-teal hover:text-atlas-teal/80 transition-colors"
              >
                View & Apply
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SavedJobsList;
