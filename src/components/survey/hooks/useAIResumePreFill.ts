import { useEffect, useRef } from 'react';

interface UseAIResumePreFillProps {
  isSessionLoaded: boolean;
  responses: Record<string, any>;
  setResponses: (responses: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  surveyId: string;
}

export const useAIResumePreFill = ({
  isSessionLoaded,
  responses,
  setResponses,
  surveyId
}: UseAIResumePreFillProps) => {
  const hasAttemptedPreFill = useRef(false);

  useEffect(() => {
    // Only run once when session is loaded and we haven't attempted prefill yet
    if (!isSessionLoaded || hasAttemptedPreFill.current) {
      return;
    }

    // Check if we have any existing responses (except empty objects)
    const existingResponseKeys = Object.keys(responses).filter(key => 
      responses[key] !== undefined && 
      responses[key] !== null && 
      responses[key] !== ''
    );
    if (existingResponseKeys.length > 0) {
      console.log('[Pre-fill] User has existing responses, skipping AI pre-fill');
      hasAttemptedPreFill.current = true;
      return;
    }

    // Look for parsed resume data in multiple locations
    let parsedData = null;
    // First check sessionStorage (primary location)
    const sessionData = sessionStorage.getItem('resume_parsed_data');
    if (sessionData) {
      try {
        parsedData = JSON.parse(sessionData);
        console.log('[Pre-fill] Found resume data in sessionStorage:', parsedData);
      } catch (e) {
        console.error('[Pre-fill] Failed to parse sessionStorage data:', e);
      }
    }
    // Fallback to localStorage if not found in sessionStorage
    if (!parsedData) {
      const localData = localStorage.getItem('resume_parsed_data');
      if (localData) {
        try {
          parsedData = JSON.parse(localData);
          console.log('[Pre-fill] Found resume data in localStorage:', parsedData);
        } catch (e) {
          console.error('[Pre-fill] Failed to parse localStorage data:', e);
        }
      }
    }
    if (!parsedData) {
      console.log('[Pre-fill] No resume_parsed_data found.');
      hasAttemptedPreFill.current = true;
      return;
    }
    console.log('[Pre-fill] Starting AI resume pre-fill with data:', parsedData);
    // The parsed data might be in different formats:
    // 1. Direct UUID mapping: { "11111111-1111-1111-1111-111111111112": "Sjoerd Geurts" }
    // 2. Field name mapping: { "name": "Sjoerd Geurts" }
    let preFillResponses: Record<string, any> = {};
    // Check if the data is already in UUID format (from surveyPreFillData)
    const hasUUIDs = Object.keys(parsedData).some(key => 
      key.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    );
    if (hasUUIDs) {
      // Data is already mapped to question IDs, use directly
      console.log('[Pre-fill] Data contains UUID mappings, using directly');
      preFillResponses = { ...parsedData };
    } else {
      // Data needs to be mapped from field names to question IDs
      console.log('[Pre-fill] Data needs field mapping');
      // Based on your survey question IDs from the logs:
      const fieldToQuestionIdMap: Record<string, string> = {
        // Personal Information
        'name': '11111111-1111-1111-1111-11111111111a',
        'full_name': '11111111-1111-1111-1111-11111111111a',
        'pronoun': '11111111-1111-1111-1111-11111111111b',
        'age': '11111111-1111-1111-1111-111111111113',
        // Location
        'region': '11111111-1111-1111-1111-111111111114',
        'location': '11111111-1111-1111-1111-111111111114',
        // Goals
        'goals': '11111111-1111-1111-1111-111111111115',
        'primary_goals': '11111111-1111-1111-1111-111111111115',
        // Education
        'education': '11111111-1111-1111-1111-111111111116',
        'education_level': '11111111-1111-1111-1111-111111111116',
        'study_subject': '11111111-1111-1111-1111-111111111117',
        'major': '11111111-1111-1111-1111-111111111117',
        // Experience
        'years_experience': '11111111-1111-1111-1111-111111111118',
        'professional_experience': '11111111-1111-1111-1111-111111111118',
        // Career
        'career_situation': '11111111-1111-1111-1111-111111111119',
        'job_title': '11111111-1111-1111-1111-111111111110',
        'current_role': '11111111-1111-1111-1111-111111111110',
        // Company
        'company_size': '11111111-1111-1111-1111-11111111111c',
        'role_happiness': '11111111-1111-1111-1111-11111111111d',
        // Industry & Skills
        'industries': '11111111-1111-1111-1111-11111111111e',
        'achievement': '11111111-1111-1111-1111-11111111111f',
        'interests': '11111111-1111-1111-1111-111111111120',
        'hobbies': '11111111-1111-1111-1111-111111111120',
      };
      // Map the fields to question IDs
      Object.entries(parsedData).forEach(([fieldName, value]) => {
        const questionId = fieldToQuestionIdMap[fieldName];
        if (questionId && value !== undefined && value !== null && value !== '') {
          preFillResponses[questionId] = value;
          console.log(`[Pre-fill] Mapped ${fieldName} -> ${questionId}:`, value);
        } else if (!questionId) {
          console.log(`[Pre-fill] No mapping found for field: ${fieldName}`);
        }
      });
    }
    // Handle special transformations
    Object.entries(preFillResponses).forEach(([questionId, value]) => {
      // Convert years of experience to number if needed
      if (questionId === '11111111-1111-1111-1111-111111111118' && typeof value === 'string') {
        const years = parseInt(value, 10);
        if (!isNaN(years)) {
          preFillResponses[questionId] = years;
        }
      }
      // Handle array fields (convert to string if needed)
      if (Array.isArray(value)) {
        preFillResponses[questionId] = value.join(', ');
      }
    });
    // Log the final pre-fill data
    console.log('[Pre-fill] Final pre-fill responses:', preFillResponses);
    // Update the responses with the pre-filled data
    if (Object.keys(preFillResponses).length > 0) {
      setResponses(prev => ({
        ...prev,
        ...preFillResponses
      }));
      console.log('[Pre-fill] Successfully pre-filled', Object.keys(preFillResponses).length, 'fields');
      // Mark in storage that we've completed pre-fill
      sessionStorage.setItem('ai_prefill_completed', 'true');
    } else {
      console.log('[Pre-fill] No matching fields found to pre-fill');
    }
    hasAttemptedPreFill.current = true;
  }, [isSessionLoaded, responses, setResponses, surveyId]);

  // Cleanup function to clear resume data after successful prefill
  useEffect(() => {
    return () => {
      // Only clear if we successfully pre-filled
      const prefillCompleted = sessionStorage.getItem('ai_prefill_completed');
      if (prefillCompleted === 'true') {
        sessionStorage.removeItem('resume_parsed_data');
        sessionStorage.removeItem('ai_prefill_completed');
        console.log('[Pre-fill] Cleaned up resume data from session storage');
      }
    };
  }, []);
}; 