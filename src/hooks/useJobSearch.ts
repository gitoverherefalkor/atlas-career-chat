
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  description: string;
  apply_url: string;
  posted_date?: string;
  source: string;
  // AI-scored relevance to the recommended career (0-10) + a short reason.
  // Set by the n8n scoring step; null when scoring failed/skipped.
  match_score?: number | null;
  match_reason?: string | null;
}

export interface JobSearchResult {
  careerTitle: string;
  sectionType: string;
  jobs: JobListing[];
  totalCount: number;
  cached: boolean;
  status: 'idle' | 'searching' | 'done' | 'error';
  error?: string;
}

interface SearchCareer {
  careerTitle: string;
  sectionType: string;
  alternateTitles?: string[];
}

// Languages spoken by the user, extracted from the report payload's
// Skills & Achievements answer. Empty array for older reports — backend
// treats this as "no language gating" so legacy users see unchanged behavior.
export interface UserLanguage {
  language: string;
  proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
}

/**
 * Hook for searching jobs sequentially (one career at a time).
 * Returns per-career results and an overall progress state.
 */
export const useJobSearch = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<JobSearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);

  const searchJobs = async (
    careers: SearchCareer[],
    countryCodes: string[],
    location?: string,
    remoteOnly?: boolean,
    userLanguages?: UserLanguage[],
  ) => {
    if (careers.length === 0 || countryCodes.length === 0) return;

    setIsSearching(true);

    // Initialize all results as idle
    const initialResults: JobSearchResult[] = careers.map(c => ({
      careerTitle: c.careerTitle,
      sectionType: c.sectionType,
      jobs: [],
      totalCount: 0,
      cached: false,
      status: 'idle',
    }));
    setResults(initialResults);

    // Process sequentially, one career at a time
    for (let i = 0; i < careers.length; i++) {
      setCurrentIndex(i);

      // Mark current as searching
      setResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'searching' } : r
      ));

      try {
        const { data, error } = await supabase.functions.invoke('search-jobs', {
          body: {
            career_title: careers[i].careerTitle,
            country_codes: countryCodes,
            remote_only: Boolean(remoteOnly),
            location: location || '',
            alternate_titles: careers[i].alternateTitles || [],
            user_languages: userLanguages || [],
          },
        });

        if (error) throw error;

        setResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            jobs: data.jobs || [],
            totalCount: data.total_count || 0,
            cached: data.cached || false,
            status: 'done',
          } : r
        ));
      } catch (err) {
        console.error(`Job search failed for "${careers[i].careerTitle}":`, err);

        setResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: 'error',
            error: 'Search failed. Please try again.',
          } : r
        ));
      }
    }

    setCurrentIndex(-1);
    setIsSearching(false);
  };

  const clearResults = () => {
    setResults([]);
    setCurrentIndex(-1);
    setIsSearching(false);
  };

  return {
    results,
    currentIndex,
    isSearching,
    searchJobs,
    clearResults,
  };
};
