
import React from 'react';
import { Heart, ExternalLink, MapPin, Building2, Calendar } from 'lucide-react';
import type { JobListing } from '@/hooks/useJobSearch';

interface JobCardProps {
  job: JobListing;
  isSaved: boolean;
  onSave: () => void;
  onUnsave: () => void;
}

// AI relevance badge — color tier:
//   8-10 → emerald (strong match)
//   5-7  → amber (decent / adjacent)
//   0-4  → slate (weak / cross-domain)
// Gray tier uses slate explicitly because bg-gray-100 is globally remapped
// to the dark canvas in dark mode, which would make the badge invisible on
// the cream card. Slate isn't remapped, so it works in both modes.
// Hovering reveals the AI's one-line reason.
const MatchScoreBadge: React.FC<{ score?: number | null; reason?: string | null }> = ({ score, reason }) => {
  if (score == null) return null;
  const safe = Math.max(0, Math.min(10, score));
  const tone =
    safe >= 8 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    safe >= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-100 text-slate-600 border-slate-200 dark:bg-stone-300 dark:text-stone-700 dark:border-stone-400';
  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${tone}`}
      title={reason || `Match score: ${safe}/10`}
    >
      {safe}<span className="opacity-60">/10</span>
    </span>
  );
};

// Format salary range for display
function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;

  const fmt = (n: number) => {
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return n.toLocaleString();
  };

  if (min && max) return `$${fmt(min)} – $${fmt(max)}`;
  if (min) return `From $${fmt(min)}`;
  if (max) return `Up to $${fmt(max)}`;
  return null;
}

// Format relative date
function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return null;
  }
}

// Truncate description to ~150 chars at word boundary
function truncateDescription(text: string, maxLen = 150): string {
  if (!text || text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 80 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

const JobCard: React.FC<JobCardProps> = ({ job, isSaved, onSave, onUnsave }) => {
  const salary = formatSalary(job.salary_min, job.salary_max);
  const postedDate = formatDate(job.posted_date);

  return (
    <div className="group border border-gray-200 rounded-xl p-5 bg-white hover:shadow-md hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title + AI match score */}
          <div className="flex items-start gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-base line-clamp-1 flex-1">{job.title}</h4>
            <MatchScoreBadge score={job.match_score} reason={job.match_reason} />
          </div>

          {/* Company + Location */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
            {job.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
          </div>

          {/* Salary + Date row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
            {salary && (
              <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {salary}
              </span>
            )}
            {postedDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {postedDate}
              </span>
            )}
          </div>

          {/* Description snippet */}
          {job.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {truncateDescription(job.description)}
            </p>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            isSaved ? onUnsave() : onSave();
          }}
          className={`
            shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all
            ${isSaved
              ? 'bg-red-50 text-red-500 hover:bg-red-100'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-400'
            }
          `}
          title={isSaved ? 'Remove from saved' : 'Save job'}
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Apply button */}
      {job.apply_url && (
        <div className="mt-4 pt-3 border-t border-gray-100">
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
  );
};

export default JobCard;
