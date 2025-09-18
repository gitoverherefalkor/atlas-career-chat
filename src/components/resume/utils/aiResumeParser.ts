import { supabase } from '@/integrations/supabase/client';

// Correct question mapping based on your actual survey structure
const QUESTION_MAPPINGS = {
  name: '11111111-1111-1111-1111-11111111111a',           // Your name
  pronoun: '11111111-1111-1111-1111-11111111111b',        // Your pronoun  
  age: '11111111-1111-1111-1111-111111111113',            // Your age
  region: '11111111-1111-1111-1111-111111111114',         // What region are you based?
  goals: '11111111-1111-1111-1111-111111111115',          // Primary goals
  education: '11111111-1111-1111-1111-111111111116',      // Education level
  study_subject: '11111111-1111-1111-1111-111111111117',  // Subject/specialization
  years_experience: '11111111-1111-1111-1111-111111111118', // Years of experience
  career_situation: '11111111-1111-1111-1111-111111111119', // Current career situation
  job_title: '11111111-1111-1111-1111-111111111110',      // Job title and organization
  employer_size: '11111111-1111-1111-1111-11111111111c',  // Employer size
  industry: '11111111-1111-1111-1111-11111111111e',       // Industry experience (2+ years)
  achievement: '11111111-1111-1111-1111-11111111111f',    // Professional achievement
  interests: '11111111-1111-1111-1111-111111111120',      // Personal interests
  specialized_skills: '44444444-4444-4444-4444-444444444444', // Specialized skills
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
    'Associate\'s degree (e.g., technical college or vocational training)',
    'Bachelor\'s degree',
    'Master\'s degree',
    'Doctorate or professional degree (e.g., PhD, MD, JD)'
  ],
  
  career_situation: [
    'Non-leadership or individual contributor role (no direct reports)',
    'Managerial or leadership role (Managing 1–4 direct reports, focusing on team coordination and supervision)',
    'Senior managerial role (Managing 5 or more direct reports, involved in strategic decision-making and broader team oversight)',
    'Executive function (VP to C-suite roles or equivalent senior leadership positions with comprehensive organizational responsibilities)',
    'Entrepreneur seeking an employed role',
    'Currently on a career break or transition',
    'Looking to re-enter the workforce'
  ],
  
  employer_size: [
    '1–10',
    '11–50',
    '51–200', 
    '201–500',
    '501–1,000',
    '1,001–5,000',
    '5,001–10,000',
    'More than 10,000'
  ]
} as const;

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
  job_title?: string;
  employer_size?: string;
  industry?: string;
  achievement?: string;
  interests?: string;
  specialized_skills?: string;
}

export const parseResumeWithAI = async (resumeText: string): Promise<Record<string, any>> => {
  const prompt = `
You are an expert resume parser. Extract information from this resume and return it as a JSON object. For multiple choice fields, you MUST select from the exact provided options or return null.

Resume text:
"""
${resumeText}
"""

Extract these fields with the following constraints:

1. name: Full name of the person (string)

2. pronoun: Select EXACTLY from: ${JSON.stringify(SURVEY_OPTIONS.pronoun)} (or null if not determinable)

3. age: Age in years (number only, or null if not mentioned/calculable)

4. region: Select EXACTLY from: ${JSON.stringify(SURVEY_OPTIONS.region)} (or null if not determinable)

5. goals: Based on the resume content, select up to 2 that best match from: ${JSON.stringify(SURVEY_OPTIONS.goals)} (return as array, or null)

6. education: Select EXACTLY from: ${JSON.stringify(SURVEY_OPTIONS.education)} (or null if not clear)

7. study_subject: Field of study or major (string, or null if not mentioned)

8. years_experience: Total years of professional experience (number only, calculate from work history start to present, or null if not calculable)

9. career_situation: Select EXACTLY from: ${JSON.stringify(SURVEY_OPTIONS.career_situation)} (or null if not determinable)

10. job_title: Current or most recent job title and organization type as one string (e.g., "Founder at AI Consultant company", or null)

11. employer_size: Select EXACTLY from: ${JSON.stringify(SURVEY_OPTIONS.employer_size)} (or null if not determinable)

12. industry: Primary industry where you have 2+ years experience. ONLY include if you can verify 2+ years in that industry from work history. Examples: "Technology / IT", "Healthcare / Medical", "Finance / Banking", "Education / Training", "Manufacturing", "Retail", "Consulting", "Marketing / Advertising", "Real Estate", "Legal Services" (string, or null)

13. achievement: Most significant professional achievement, max 420 characters (string, or null)

14. interests: Up to 3 personal interests or hobbies (string, or null)

15. specialized_skills: Technical skills, certifications, specialized software, programming languages, or professional competencies mentioned in the resume. Examples: "Python, Machine Learning, AWS", "Project Management, Agile, Scrum", "Excel, PowerBI, SQL", "Adobe Creative Suite, UX Design", "Financial Modeling, Risk Analysis" (string, or null)

IMPORTANT RULES:
- For multiple choice fields, use EXACT text matches from the provided options
- Calculate years_experience from the earliest professional job to present (e.g., if started in 2008 and it's 2025, that's 17 years)
- For region, map countries to regions (Netherlands = "Northern and Western Europe", USA = appropriate US region, etc.)
- For career_situation, base on current role level (Founder/CEO = "Executive function", etc.)
- For employer_size, estimate based on company type (startup = "1–10", large corp = "More than 10,000", etc.)
- Return null for any field you cannot determine with confidence

Return only a valid JSON object. No explanations.
`;

  try {
    console.log('Calling AI resume parser with comprehensive prompt...');
    
    const { data, error } = await supabase.functions.invoke('parse-resume-ai', {
      body: { 
        resumeText,
        prompt 
      }
    });

    if (error) {
      console.error('AI parsing error:', error);
      throw new Error('Failed to parse resume with AI');
    }

    const extractedData = data.extractedData as ExtractedResumeData;
    console.log('AI extracted data:', extractedData);
    
    // Convert to survey question format with validation
    const surveyData: Record<string, any> = {};
    
    // Name (text field)
    if (extractedData.name) {
      surveyData[QUESTION_MAPPINGS.name] = extractedData.name;
    }
    
    // Pronoun (multiple choice - validate against options)
    if (extractedData.pronoun && SURVEY_OPTIONS.pronoun.includes(extractedData.pronoun as any)) {
      surveyData[QUESTION_MAPPINGS.pronoun] = extractedData.pronoun;
    }
    
    // Age (number)
    if (extractedData.age && typeof extractedData.age === 'number') {
      surveyData[QUESTION_MAPPINGS.age] = extractedData.age;
    }
    
    // Region (dropdown - validate against options)
    if (extractedData.region && SURVEY_OPTIONS.region.includes(extractedData.region as any)) {
      surveyData[QUESTION_MAPPINGS.region] = extractedData.region;
    }
    
    // Goals (multiple choice, multiple selection - validate each)
    if (extractedData.goals && Array.isArray(extractedData.goals)) {
      const validGoals = extractedData.goals.filter(goal => 
        SURVEY_OPTIONS.goals.includes(goal as any)
      );
      if (validGoals.length > 0) {
        surveyData[QUESTION_MAPPINGS.goals] = validGoals;
      }
    }
    
    // Education (multiple choice - validate against options)
    if (extractedData.education && SURVEY_OPTIONS.education.includes(extractedData.education as any)) {
      surveyData[QUESTION_MAPPINGS.education] = extractedData.education;
    }
    
    // Study subject (text field)
    if (extractedData.study_subject) {
      surveyData[QUESTION_MAPPINGS.study_subject] = extractedData.study_subject;
    }
    
    // Years experience (number)
    if (extractedData.years_experience && typeof extractedData.years_experience === 'number') {
      surveyData[QUESTION_MAPPINGS.years_experience] = extractedData.years_experience;
    }
    
    // Career situation (multiple choice - validate against options)
    if (extractedData.career_situation && SURVEY_OPTIONS.career_situation.includes(extractedData.career_situation as any)) {
      surveyData[QUESTION_MAPPINGS.career_situation] = extractedData.career_situation;
    }
    
    // Job title (text field)
    if (extractedData.job_title) {
      surveyData[QUESTION_MAPPINGS.job_title] = extractedData.job_title;
    }
    
    // Employer size (multiple choice - validate against options)
    if (extractedData.employer_size && SURVEY_OPTIONS.employer_size.includes(extractedData.employer_size as any)) {
      surveyData[QUESTION_MAPPINGS.employer_size] = extractedData.employer_size;
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
    
    // Interests (text field)
    if (extractedData.interests) {
      surveyData[QUESTION_MAPPINGS.interests] = extractedData.interests;
    }
    
    // Specialized skills (text field)
    if (extractedData.specialized_skills) {
      surveyData[QUESTION_MAPPINGS.specialized_skills] = extractedData.specialized_skills;
    }

    console.log('Final mapped survey data:', surveyData);
    console.log('Successfully mapped fields:', Object.keys(surveyData).length);
    
    return surveyData;
    
  } catch (error) {
    console.error('Error parsing resume with AI:', error);
    throw new Error('Failed to parse resume with AI: ' + error.message);
  }
};
