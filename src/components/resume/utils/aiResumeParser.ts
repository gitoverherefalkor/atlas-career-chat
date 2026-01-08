import { supabase } from '@/integrations/supabase/client';

// Correct question mapping based on your actual survey structure
const QUESTION_MAPPINGS = {
  name: '11111111-1111-1111-1111-11111111111a',
  pronoun: '11111111-1111-1111-1111-11111111111b',
  age: '11111111-1111-1111-1111-111111111113',
  region: '11111111-1111-1111-1111-111111111114',
  goals: '11111111-1111-1111-1111-111111111115',
  education: '11111111-1111-1111-1111-111111111116',
  study_subject: '11111111-1111-1111-1111-111111111117',
  years_experience: '11111111-1111-1111-1111-111111111118',
  career_situation: '11111111-1111-1111-1111-111111111119',
  job_title: '11111111-1111-1111-1111-111111111110',
  employer_size: '11111111-1111-1111-1111-11111111111c',
  industry: '11111111-1111-1111-1111-11111111111e',
  achievement: '11111111-1111-1111-1111-11111111111f',
  interests: '11111111-1111-1111-1111-111111111120',
  specialized_skills: '44444444-4444-4444-4444-444444444444',
} as const;

// Define available options for multiple choice questions
const SURVEY_OPTIONS = {
  pronoun: ['She / Her', 'He / Him', 'They / Them', 'Not defined'],

  region: [
    'Northern and Western Europe',
    'Southern and Eastern Europe',
    'United Kingdom (London)',
    'United Kingdom (Other)',
    'United States (High-Cost Regions)',
    'United States (Average-Cost Regions)',
    'United States (Lower-Cost Regions)',
    'Canada',
    'Australia and New Zealand',
    'Switzerland'
  ],

  goals: [
    'Looking for guidance on my first job or career path',
    'Finding a new career path that better suits my skills and interests',
    'Exploring a promotion or advancement within my current field or company',
    'Assessing my work preferences and values for a better work-life balance',
    'Identifying strengths and areas for improvement for professional growth',
    'Considering a career change due to burnout or lack of fulfillment',
    'Other'
  ],

  education: [
    'No formal education',
    'High school diploma or equivalent',
    "Associate's degree (e.g., technical college or vocational training)",
    "Bachelor's degree",
    "Master's degree",
    'Doctorate or professional degree (e.g., PhD, MD, JD)'
  ],

  career_situation: [
    'Non-leadership or individual contributor role (no direct reports)',
    'Managerial or leadership role (Managing 1-4 direct reports, focusing on team coordination and supervision)',
    'Senior managerial role (Managing 5 or more direct reports, involved in strategic decision-making and broader team oversight)',
    'Executive function (VP to C-suite roles or equivalent senior leadership positions with comprehensive organizational responsibilities)',
    'Entrepreneur seeking an employed role',
    'Currently on a career break or transition',
    'Looking to re-enter the workforce'
  ],

  employer_size: [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1,000',
    '1,001-5,000',
    '5,001-10,000',
    'More than 10,000'
  ]
} as const;

interface CareerHistoryEntry {
  title: string;
  companyName: string;
  companySize: string;
  companyCulture: string;
  sector: string;
  yearsInRole: number | '';
  startYear: number | '';
  endYear: number | '';
  isCurrent: boolean;
}

interface ExtractedResumeData {
  name?: string;
  pronoun?: string;
  age?: number;
  region?: string;
  goals?: string[];
  education?: string;
  study_subject?: string;
  years_experience?: number;
  career_situation?: string;
  job_title?: string;  // Legacy - single job
  career_history?: CareerHistoryEntry[];  // New - up to 3 jobs
  employer_size?: string;
  industry?: string;
  achievement?: string;
  interests?: string;
  specialized_skills?: string;
}

// Sanitize text to prevent JSON parsing issues
function sanitizeForJson(text: string): string {
  return text
    // Replace smart quotes with regular quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Replace em-dashes and en-dashes with regular dashes
    .replace(/[\u2013\u2014]/g, '-')
    // Replace other problematic Unicode
    .replace(/[\u2022\u2023\u2043]/g, '-') // bullets
    .replace(/[\u00A0]/g, ' ') // non-breaking space
    // Remove null bytes and control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Limit consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const parseResumeWithAI = async (resumeText: string): Promise<Record<string, any>> => {
  // Sanitize the resume text first
  const cleanedText = sanitizeForJson(resumeText);

  // Truncate if too long (keep first 8000 chars to avoid token limits)
  const truncatedText = cleanedText.length > 8000
    ? cleanedText.substring(0, 8000) + '\n[... truncated for processing]'
    : cleanedText;

  const prompt = `Parse this LinkedIn profile/resume and extract data as JSON.

RESUME:
${truncatedText}

Extract these fields (use null if not found):

{
  "name": "Full name",
  "education": "MUST be one of: No formal education | High school diploma or equivalent | Associate's degree (e.g., technical college or vocational training) | Bachelor's degree | Master's degree | Doctorate or professional degree (e.g., PhD, MD, JD)",
  "study_subject": "Field of study",
  "years_experience": number (calculate from earliest job year to 2026),
  "region": "MUST be one of: Northern and Western Europe | Southern and Eastern Europe | United Kingdom (London) | United Kingdom (Other) | United States (High-Cost Regions) | United States (Average-Cost Regions) | United States (Lower-Cost Regions) | Canada | Australia and New Zealand | Switzerland",
  "career_history": [
    { "title": "Job title", "companyName": "Company name", "sector": "Industry sector", "startYear": 2020, "endYear": null, "isCurrent": true },
    { "title": "...", "companyName": "...", "sector": "...", "startYear": 2018, "endYear": 2020, "isCurrent": false },
    { "title": "...", "companyName": "...", "sector": "...", "startYear": 2015, "endYear": 2018, "isCurrent": false }
  ],
  "career_situation": "MUST be one of: Non-leadership or individual contributor role (no direct reports) | Managerial or leadership role (Managing 1-4 direct reports, focusing on team coordination and supervision) | Senior managerial role (Managing 5 or more direct reports, involved in strategic decision-making and broader team oversight) | Executive function (VP to C-suite roles or equivalent senior leadership positions with comprehensive organizational responsibilities) | Entrepreneur seeking an employed role | Currently on a career break or transition | Looking to re-enter the workforce",
  "industry": "Primary industry (e.g. Technology, Healthcare, Finance, Consulting)",
  "specialized_skills": "Key skills comma-separated",
  "achievement": "Most notable achievement (max 200 chars)"
}

RULES:
- Netherlands/Germany/France/Belgium = Northern and Western Europe
- Founder/CEO/COO/CTO = Executive function
- career_history should have 1-5 entries, most recent first (current role first)
- Extract actual company names (e.g., "Google", "Stripe", "Acme Corp")
- sector examples: Technology, Legal Tech, FinTech, Healthcare, Consulting, Retail, Manufacturing, Media, SaaS
- startYear/endYear: Extract the YEAR from job dates (e.g., "Jan 2020 - Present" → startYear: 2020, endYear: null, isCurrent: true)
- isCurrent: true if job says "Present" or is the current/most recent role, false otherwise
- If endYear is null or missing, isCurrent should be true
- Return ONLY valid JSON, no markdown, no explanation`;

  try {
    const { data, error } = await supabase.functions.invoke('parse-resume-ai', {
      body: {
        resumeText: truncatedText,
        prompt
      }
    });

    if (error) {
      console.error('AI parsing error:', error);
      throw new Error('Failed to parse resume with AI');
    }

    if (!data.success) {
      console.error('AI parsing failed:', data.error);
      throw new Error(data.error || 'Failed to parse resume');
    }

    const extractedData = data.extractedData as ExtractedResumeData;
    console.log('Extracted data from AI:', extractedData);

    // Convert to survey question format with validation
    const surveyData: Record<string, any> = {};

    // Name (text field)
    if (extractedData.name) {
      surveyData[QUESTION_MAPPINGS.name] = extractedData.name;
    }

    // Pronoun - skip, rarely in resumes

    // Age - skip, rarely in resumes

    // Region - validate and map
    if (extractedData.region) {
      const matchedRegion = SURVEY_OPTIONS.region.find(r =>
        r.toLowerCase() === extractedData.region?.toLowerCase() ||
        extractedData.region?.toLowerCase().includes(r.toLowerCase())
      );
      if (matchedRegion) {
        surveyData[QUESTION_MAPPINGS.region] = matchedRegion;
      }
    }

    // Education - validate and map
    if (extractedData.education) {
      const edu = extractedData.education.toLowerCase();
      let matchedEducation: string | undefined;

      if (edu.includes('doctorate') || edu.includes('phd') || edu.includes('md') || edu.includes('jd')) {
        matchedEducation = SURVEY_OPTIONS.education[5];
      } else if (edu.includes('master')) {
        matchedEducation = SURVEY_OPTIONS.education[4];
      } else if (edu.includes('bachelor')) {
        matchedEducation = SURVEY_OPTIONS.education[3];
      } else if (edu.includes('associate')) {
        matchedEducation = SURVEY_OPTIONS.education[2];
      } else if (edu.includes('high school') || edu.includes('diploma')) {
        matchedEducation = SURVEY_OPTIONS.education[1];
      }

      if (matchedEducation) {
        surveyData[QUESTION_MAPPINGS.education] = matchedEducation;
      }
    }

    // Study subject (text field)
    if (extractedData.study_subject) {
      surveyData[QUESTION_MAPPINGS.study_subject] = extractedData.study_subject;
    }

    // Years experience (number)
    if (extractedData.years_experience && typeof extractedData.years_experience === 'number') {
      surveyData[QUESTION_MAPPINGS.years_experience] = extractedData.years_experience;
    }

    // Career situation - validate and map
    if (extractedData.career_situation) {
      const situation = extractedData.career_situation.toLowerCase();
      let matchedSituation: string | undefined;

      if (situation.includes('executive') || situation.includes('c-suite') || situation.includes('vp')) {
        matchedSituation = SURVEY_OPTIONS.career_situation[3];
      } else if (situation.includes('entrepreneur')) {
        matchedSituation = SURVEY_OPTIONS.career_situation[4];
      } else if (situation.includes('senior') && situation.includes('manager')) {
        matchedSituation = SURVEY_OPTIONS.career_situation[2];
      } else if (situation.includes('manager') || situation.includes('leadership')) {
        matchedSituation = SURVEY_OPTIONS.career_situation[1];
      } else if (situation.includes('individual') || situation.includes('non-leadership')) {
        matchedSituation = SURVEY_OPTIONS.career_situation[0];
      } else if (situation.includes('break') || situation.includes('transition')) {
        matchedSituation = SURVEY_OPTIONS.career_situation[5];
      }

      if (matchedSituation) {
        surveyData[QUESTION_MAPPINGS.career_situation] = matchedSituation;
      }
    }

    // Career history (new format - array of objects with company details and dates)
    // Always create 3 entries to match the UI expectation
    const emptyCareerEntry = {
      title: '',
      companyName: '',
      companySize: '',
      companyCulture: '',
      sector: '',
      yearsInRole: '',
      startYear: '',
      endYear: '',
      isCurrent: false
    };

    if (extractedData.career_history && Array.isArray(extractedData.career_history)) {
      // Filter to valid entries only and take up to 5
      const validHistory = extractedData.career_history
        .filter(entry => entry && entry.title)
        .slice(0, 5)
        .map(entry => ({
          title: entry.title || '',
          companyName: entry.companyName || '',
          companySize: '', // User must select - not inferred from resume
          companyCulture: '', // User must select - not inferred from resume
          sector: entry.sector || '',
          yearsInRole: entry.yearsInRole || '',
          startYear: entry.startYear || '',
          endYear: entry.isCurrent ? '' : (entry.endYear || ''),
          isCurrent: entry.isCurrent || false
        }));

      // Pad to 5 entries
      while (validHistory.length < 5) {
        validHistory.push({ ...emptyCareerEntry });
      }

      surveyData[QUESTION_MAPPINGS.job_title] = validHistory;
    } else if (extractedData.job_title) {
      // Legacy fallback - single job title (convert to new format)
      surveyData[QUESTION_MAPPINGS.job_title] = [
        {
          title: extractedData.job_title,
          companyName: '',
          companySize: '',
          companyCulture: '',
          sector: extractedData.industry || '',
          yearsInRole: '',
          startYear: '',
          endYear: '',
          isCurrent: true  // Assume current if only one job
        },
        { ...emptyCareerEntry },
        { ...emptyCareerEntry },
        { ...emptyCareerEntry },
        { ...emptyCareerEntry }
      ];
    }

    // Industry (text field)
    if (extractedData.industry) {
      surveyData[QUESTION_MAPPINGS.industry] = extractedData.industry;
    }

    // Achievement (text field, max 420 chars)
    if (extractedData.achievement) {
      const truncatedAchievement = extractedData.achievement.length > 420
        ? extractedData.achievement.substring(0, 417) + '...'
        : extractedData.achievement;
      surveyData[QUESTION_MAPPINGS.achievement] = truncatedAchievement;
    }

    // Specialized skills (text field)
    if (extractedData.specialized_skills) {
      surveyData[QUESTION_MAPPINGS.specialized_skills] = extractedData.specialized_skills;
    }

    console.log('Mapped survey data:', surveyData);
    return surveyData;

  } catch (error: any) {
    console.error('Error parsing resume with AI:', error);
    throw new Error('Failed to parse resume with AI: ' + error.message);
  }
};
