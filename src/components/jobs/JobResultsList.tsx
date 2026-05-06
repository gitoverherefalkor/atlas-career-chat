
import React from 'react';
import { Briefcase } from 'lucide-react';
import JobCard from './JobCard';
import type { JobSearchResult } from '@/hooks/useJobSearch';
import type { JobListing } from '@/hooks/useJobSearch';

interface JobResultsListProps {
  results: JobSearchResult[];
  isJobSaved: (id: string) => boolean;
  onSaveJob: (job: JobListing) => void;
  onUnsaveJob: (externalJobId: string) => void;
}

const JobResultsList: React.FC<JobResultsListProps> = ({
  results,
  isJobSaved,
  onSaveJob,
  onUnsaveJob,
}) => {
  // Only show results that have completed
  const completedResults = results.filter(r => r.status === 'done');

  if (completedResults.length === 0) return null;

  return (
    <div className="space-y-8">
      {completedResults.map((result) => (
        <div key={result.sectionType}>
          {/* Career heading */}
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-atlas-teal" />
            <h3 className="text-lg font-semibold text-foreground">{result.careerTitle}</h3>
            <span className="text-sm text-muted-foreground">
              ({result.totalCount} {result.totalCount === 1 ? 'job' : 'jobs'})
            </span>
          </div>

          {/* Jobs or empty state */}
          {result.jobs.length > 0 ? (
            <div className="grid gap-3">
              {result.jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={isJobSaved(job.id)}
                  onSave={() => onSaveJob(job)}
                  onUnsave={() => onUnsaveJob(job.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground text-sm">No job openings found for this career in your area.</p>
              <p className="text-muted-foreground/70 text-xs mt-1">Try expanding your search location or check back later.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default JobResultsList;
