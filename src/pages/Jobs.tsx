
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Heart, Briefcase, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useReports } from '@/hooks/useReports';
import { useReportSections, SECTION_TYPE_MAP } from '@/hooks/useReportSections';
import { useJobSearch } from '@/hooks/useJobSearch';
import { useSavedJobs } from '@/hooks/useSavedJobs';
import CareerSelector from '@/components/jobs/CareerSelector';
import LocationInput, { profileCountryToCode } from '@/components/jobs/LocationInput';
import SearchProgress from '@/components/jobs/SearchProgress';
import JobResultsList from '@/components/jobs/JobResultsList';
import SavedJobsList from '@/components/jobs/SavedJobsList';

// Strip HTML tags (same util as CareerSection)
const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, '').trim();

// Career section IDs that represent actual career recommendations
const CAREER_SECTION_IDS = ['first-career', 'second-career', 'third-career', 'runner-up', 'outside-box'];

// Descriptions for career types
const CAREER_DESCRIPTIONS: Record<string, string> = {
  'first-career': 'Your top career match',
  'second-career': 'Strong alternative career',
  'third-career': 'Another well-suited option',
  'runner-up': 'Worth considering',
  'outside-box': 'Creative career path',
};

type Tab = 'search' | 'saved';

const Jobs = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { reports, isLoading: reportsLoading } = useReports();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get latest report
  const latestReport = reports?.length ? reports[0] : null;
  const { sections, isLoading: sectionsLoading } = useReportSections(latestReport?.id);

  // Job search state
  const { results, currentIndex, isSearching, searchJobs, clearResults } = useJobSearch();
  const { savedJobs, isLoading: savedLoading, saveJob, unsaveJob, isJobSaved } = useSavedJobs();

  // UI state
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [country, setCountry] = useState('us');
  const [city, setCity] = useState('');

  // Build career options from report sections
  const careerOptions = useMemo(() => {
    const options: { sectionType: string; title: string; description: string }[] = [];

    for (const sectionId of CAREER_SECTION_IDS) {
      const sectionData = sections.filter(s => {
        const mapped = SECTION_TYPE_MAP[s.section_type];
        return mapped === sectionId;
      });

      if (sectionData.length === 0) continue;

      if (['runner-up', 'outside-box'].includes(sectionId)) {
        // Multi-career sections: each section becomes a separate option
        sectionData.forEach((s) => {
          const title = s.title ? stripHtml(s.title).replace(/\*+/g, '').trim() : '';
          if (title) {
            options.push({
              sectionType: `${sectionId}__${s.id}`,
              title,
              description: CAREER_DESCRIPTIONS[sectionId] || '',
            });
          }
        });
      } else {
        // Single career sections (top 3)
        const title = sectionData[0].title ? stripHtml(sectionData[0].title).replace(/\*+/g, '').trim() : '';
        if (title) {
          options.push({
            sectionType: sectionId,
            title,
            description: CAREER_DESCRIPTIONS[sectionId] || '',
          });
        }
      }
    }

    return options;
  }, [sections]);

  // Pre-fill country from profile
  useEffect(() => {
    if (profile?.country) {
      setCountry(profileCountryToCode(profile.country));
    }
  }, [profile?.country]);

  // Pre-select career from query param
  useEffect(() => {
    const preselect = searchParams.get('career');
    if (preselect && careerOptions.length > 0) {
      // Find matching career(s) by section type prefix
      const matches = careerOptions
        .filter(c => c.sectionType === preselect || c.sectionType.startsWith(preselect + '__'))
        .map(c => c.sectionType)
        .slice(0, 3);
      if (matches.length > 0) {
        setSelectedCareers(matches);
      }
    }
  }, [searchParams, careerOptions]);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Toggle career selection
  const handleToggle = (sectionType: string) => {
    setSelectedCareers(prev =>
      prev.includes(sectionType)
        ? prev.filter(s => s !== sectionType)
        : [...prev, sectionType]
    );
  };

  // Trigger search
  const handleSearch = () => {
    const careers = selectedCareers.map(st => {
      const option = careerOptions.find(c => c.sectionType === st);
      return {
        careerTitle: option?.title || '',
        sectionType: st,
      };
    }).filter(c => c.careerTitle);

    searchJobs(careers, country, city || undefined);
  };

  // Loading states
  const isPageLoading = authLoading || profileLoading || reportsLoading || sectionsLoading;

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-atlas-teal" />
      </div>
    );
  }

  // No report yet
  if (!latestReport || latestReport.status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete your assessment first</h2>
          <p className="text-gray-600 mb-6">
            You need a completed career report before searching for jobs.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-atlas-teal text-white rounded-lg hover:bg-atlas-teal/90 transition-colors font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const hasResults = results.some(r => r.status === 'done');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Find Job Openings</h1>
            <p className="text-sm text-gray-500">Discover jobs matching your career recommendations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => setActiveTab('search')}
            className={`
              px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
              ${activeTab === 'search'
                ? 'border-atlas-teal text-atlas-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <Search className="h-4 w-4" />
            Search Jobs
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`
              px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
              ${activeTab === 'saved'
                ? 'border-atlas-teal text-atlas-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <Heart className="h-4 w-4" />
            Saved Jobs
            {savedJobs.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                {savedJobs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'search' && (
          <>
            {/* Career selector */}
            <CareerSelector
              careers={careerOptions}
              selected={selectedCareers}
              onToggle={handleToggle}
              maxSelections={3}
              disabled={isSearching}
            />

            {/* Location */}
            <LocationInput
              country={country}
              onCountryChange={setCountry}
              city={city}
              onCityChange={setCity}
              disabled={isSearching}
            />

            {/* Search button */}
            <button
              onClick={handleSearch}
              disabled={selectedCareers.length === 0 || isSearching}
              className={`
                w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2
                ${selectedCareers.length === 0 || isSearching
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-atlas-teal hover:bg-atlas-teal/90 shadow-sm hover:shadow'
                }
              `}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search {selectedCareers.length} {selectedCareers.length === 1 ? 'career' : 'careers'}
                </>
              )}
            </button>

            {/* Progress indicator */}
            {results.length > 0 && (
              <SearchProgress results={results} currentIndex={currentIndex} />
            )}

            {/* Results */}
            {hasResults && (
              <JobResultsList
                results={results}
                isJobSaved={isJobSaved}
                onSaveJob={saveJob}
                onUnsaveJob={unsaveJob}
              />
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <SavedJobsList
            savedJobs={savedJobs}
            onUnsave={unsaveJob}
          />
        )}
      </div>
    </div>
  );
};

export default Jobs;
