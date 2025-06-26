
interface ResumeData {
  personal_info?: {
    full_name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  professional_summary?: string;
  current_role?: {
    title?: string;
    company?: string;
    duration?: string;
  };
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills?: string[];
  key_achievements?: string[];
  interests?: string[];
  accomplishments_most_proud?: string[];
  industries?: string[];
}

export const mapResumeToSurveyAnswers = (resumeData: ResumeData): Record<string, any> => {
  if (!resumeData) return {};

  const mappedAnswers: Record<string, any> = {};

  // Direct mappings
  if (resumeData.personal_info?.full_name) {
    // Split full name for first/last name fields if needed
    const nameParts = resumeData.personal_info.full_name.split(' ');
    if (nameParts.length >= 2) {
      mappedAnswers['first_name'] = nameParts[0];
      mappedAnswers['last_name'] = nameParts.slice(1).join(' ');
    }
    mappedAnswers['full_name'] = resumeData.personal_info.full_name;
  }

  if (resumeData.personal_info?.email) {
    mappedAnswers['email'] = resumeData.personal_info.email;
  }

  if (resumeData.current_role?.title) {
    mappedAnswers['current_job_title'] = resumeData.current_role.title;
  }

  if (resumeData.current_role?.company) {
    mappedAnswers['current_organization'] = resumeData.current_role.company;
  }

  // Calculate years of experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    const totalYears = calculateTotalExperience(resumeData.experience);
    if (totalYears > 0) {
      mappedAnswers['years_of_experience'] = totalYears;
    }
  }

  // Education level mapping
  if (resumeData.education && resumeData.education.length > 0) {
    const highestEducation = getHighestEducationLevel(resumeData.education);
    if (highestEducation) {
      mappedAnswers['education_level'] = highestEducation;
    }
  }

  // AI-deduced fields
  if (resumeData.interests && resumeData.interests.length > 0) {
    mappedAnswers['interests'] = resumeData.interests;
  }

  if (resumeData.accomplishments_most_proud && resumeData.accomplishments_most_proud.length > 0) {
    mappedAnswers['most_proud_accomplishment'] = resumeData.accomplishments_most_proud;
  }

  if (resumeData.industries && resumeData.industries.length > 0) {
    mappedAnswers['industry_experience'] = resumeData.industries;
  }

  // Skills mapping
  if (resumeData.skills && resumeData.skills.length > 0) {
    mappedAnswers['skills'] = resumeData.skills;
  }

  console.log('Mapped resume data to survey answers:', mappedAnswers);
  return mappedAnswers;
};

const calculateTotalExperience = (experience: Array<{ duration: string }>): number => {
  // Simple calculation - count unique years mentioned
  // This is a basic implementation, could be enhanced
  let totalYears = 0;
  
  experience.forEach(exp => {
    const duration = exp.duration.toLowerCase();
    
    // Look for year patterns like "2020-2023", "3 years", etc.
    const yearMatch = duration.match(/(\d+)\s*year/);
    if (yearMatch) {
      totalYears += parseInt(yearMatch[1]);
    } else {
      // Try to extract year ranges
      const rangeMatch = duration.match(/(\d{4})\s*-\s*(\d{4}|present|current)/);
      if (rangeMatch) {
        const startYear = parseInt(rangeMatch[1]);
        const endYear = rangeMatch[2].match(/\d{4}/) ? parseInt(rangeMatch[2]) : new Date().getFullYear();
        totalYears += (endYear - startYear);
      }
    }
  });

  return Math.min(totalYears, 50); // Cap at 50 years for sanity
};

const getHighestEducationLevel = (education: Array<{ degree: string }>): string | null => {
  const degreeHierarchy = {
    'phd': 8,
    'doctorate': 8,
    'doctoral': 8,
    'master': 6,
    'masters': 6,
    'mba': 6,
    'bachelor': 4,
    'bachelors': 4,
    'associate': 2,
    'diploma': 1,
    'certificate': 1
  };

  let highestLevel = 0;
  let highestDegree = null;

  education.forEach(edu => {
    const degree = edu.degree.toLowerCase();
    for (const [key, level] of Object.entries(degreeHierarchy)) {
      if (degree.includes(key) && level > highestLevel) {
        highestLevel = level;
        highestDegree = key;
      }
    }
  });

  // Map back to survey-friendly terms
  switch (highestDegree) {
    case 'phd':
    case 'doctorate':
    case 'doctoral':
      return 'Doctorate/PhD';
    case 'master':
    case 'masters':
    case 'mba':
      return 'Master\'s degree';
    case 'bachelor':
    case 'bachelors':
      return 'Bachelor\'s degree';
    case 'associate':
      return 'Associate degree';
    case 'diploma':
    case 'certificate':
      return 'High school/Certificate';
    default:
      return null;
  }
};
