
import { supabase } from '@/integrations/supabase/client';

// Define the exact question mapping from your survey using the real UUIDs
const QUESTION_MAPPINGS = {
  name: '11111111-1111-1111-1111-111111111112',           // "Your name"
  pronoun: '11111111-1111-1111-1111-111111111113',        // "Your pronoun" 
  age: '11111111-1111-1111-1111-111111111114',            // "Your age"
  region: '11111111-1111-1111-1111-111111111115',         // "What region are you based?"
  education: '11111111-1111-1111-1111-111111111117',      // "What is the highest level of education you have completed?"
  study_subject: '11111111-1111-1111-1111-111111111118',  // "What subject or specialization did you study?"
  years_experience: '11111111-1111-1111-1111-111111111119', // "How many years of professional experience do you have?"
  career_situation: '11111111-1111-1111-1111-11111111111a', // "What best describes your current career situation?"
  job_title: '11111111-1111-1111-1111-11111111111b',      // "What is your current or last serious job title..."
  employer_size: '11111111-1111-1111-1111-11111111111c',  // "What is the approximate size of your current or most recent employer..."
  industry: '11111111-1111-1111-1111-11111111111e',       // "In which industry/industries do you have 2 or more years experience?"
  achievement: '11111111-1111-1111-1111-11111111111f',    // "Describe a professional achievement or skill you are most proud of"
  interests: '11111111-1111-1111-1111-111111111120',      // "List any personal interests or hobbies important to you"
} as const;

interface ExtractedResumeData {
  name?: string;
  pronoun?: string;
  age?: number;
  region?: string;
  education?: string;
  study_subject?: string;
  years_experience?: number;
  career_situation?: string;
  job_title?: string;
  employer_size?: string;
  industry?: string;
  achievement?: string;
  interests?: string;
}

export const parseResumeWithAI = async (resumeText: string): Promise<Record<string, any>> => {
  const prompt = `
You are an expert resume parser. Extract the following information from this resume text and return it as a JSON object. Only include fields where you have high confidence in the data. If information is not clearly available, omit that field.

Resume text:
"""
${resumeText}
"""

Extract these fields:
- name: Full name of the person
- pronoun: Preferred pronouns (e.g., "he/him", "she/her", "they/them") - only if explicitly stated
- age: Age in years (number only, if mentioned or can be calculated from graduation dates)
- region: Geographic region/location (country, state, city)
- education: Highest level of education (e.g., "Bachelor's degree", "Master's degree", "PhD", "High school diploma", "Associate degree", "Professional certification")
- study_subject: Field of study or major (e.g., "Computer Science", "Business Administration", "Engineering")
- years_experience: Total years of professional experience (number only, calculate from work history)
- career_situation: Current career status (e.g., "Employed full-time", "Seeking employment", "Student", "Self-employed", "Between jobs")
- job_title: Current or most recent job title (e.g., "Software Engineer", "Marketing Manager", "Sales Representative")
- employer_size: Size of current/recent employer (choose from: "1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "501-1000 employees", "1000+ employees")
- industry: Primary industry or field of work (e.g., "Technology", "Healthcare", "Finance", "Education", "Manufacturing")
- achievement: Most significant professional achievement or accomplishment (brief description)
- interests: Personal interests or hobbies (comma-separated list)

Return only a valid JSON object with the extracted data. Do not include any explanations or additional text.
`;

  try {
    console.log('Calling AI resume parser...');
    
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
    
    // Convert to survey question format using real UUIDs
    const surveyData: Record<string, any> = {};
    
    Object.entries(extractedData).forEach(([key, value]) => {
      const questionId = QUESTION_MAPPINGS[key as keyof typeof QUESTION_MAPPINGS];
      if (questionId && value !== undefined && value !== null && value !== '') {
        surveyData[questionId] = value;
      }
    });

    console.log('Mapped survey data with real UUIDs:', surveyData);
    
    return surveyData;
    
  } catch (error) {
    console.error('Error parsing resume with AI:', error);
    throw new Error('Failed to parse resume with AI');
  }
};
