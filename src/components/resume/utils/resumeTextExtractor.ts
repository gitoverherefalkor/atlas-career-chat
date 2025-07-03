
export const extractDataFromResumeText = (resumeText: string): Record<string, any> => {
  const preFillData: Record<string, any> = {};
  
  console.log('Extracting data from resume text...');
  console.log('Resume text length:', resumeText.length);
  
  // Try to extract email
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    preFillData['email'] = emailMatch[0];
    console.log('Extracted email:', emailMatch[0]);
  }
  
  // Try to extract phone number
  const phoneMatch = resumeText.match(/(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
  if (phoneMatch) {
    preFillData['phone'] = phoneMatch[0];
    console.log('Extracted phone:', phoneMatch[0]);
  }
  
  // Look for common job titles
  const jobTitlePatterns = [
    /\b(senior\s+)?manager\b/i,
    /\b(senior\s+)?director\b/i,
    /\b(data\s+|business\s+|financial\s+)?analyst\b/i,
    /\b(software\s+|web\s+|frontend\s+|backend\s+)?developer\b/i,
    /\b(software\s+|systems\s+|data\s+)?engineer\b/i,
    /\b(marketing\s+|project\s+|program\s+)?coordinator\b/i,
    /\b(technical\s+|marketing\s+|sales\s+)?specialist\b/i,
    /\b(business\s+|management\s+|technical\s+)?consultant\b/i,
    /\b(system\s+|database\s+|network\s+)?administrator\b/i,
    /\b(product\s+|operations\s+|general\s+)?manager\b/i
  ];
  
  for (const pattern of jobTitlePatterns) {
    const match = resumeText.match(pattern);
    if (match) {
      preFillData['current_job_title'] = match[0];
      console.log('Extracted job title:', match[0]);
      break;
    }
  }
  
  // Try to extract name (look for lines that might be names)
  const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    if (line.length < 50 && /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line)) {
      const nameParts = line.split(/\s+/);
      if (nameParts.length >= 2) {
        preFillData['first_name'] = nameParts[0];
        preFillData['last_name'] = nameParts.slice(1).join(' ');
        preFillData['full_name'] = line;
        console.log('Extracted name:', line);
        break;
      }
    }
  }
  
  // Try to extract company names (look for common company patterns)
  const companyPatterns = [
    /\b([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Corporation|Company|Ltd|Limited)\.?)\b/g,
    /\b([A-Z][a-zA-Z]+\s+(?:Technologies|Technology|Solutions|Systems|Group|Services))\b/g
  ];
  
  for (const pattern of companyPatterns) {
    const matches = resumeText.match(pattern);
    if (matches && matches.length > 0) {
      preFillData['current_organization'] = matches[0];
      console.log('Extracted company:', matches[0]);
      break;
    }
  }
  
  console.log('Final extracted data:', preFillData);
  return preFillData;
};
