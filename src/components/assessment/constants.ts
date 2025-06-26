
// Survey type mapping
export const SURVEY_TYPE_MAPPING: Record<string, string> = {
  'Office / Business Pro - 2025 v1 EN': '00000000-0000-0000-0000-000000000001',
};

export const getSurveyIdFromAccessCode = (accessCodeData: any): string => {
  if (!accessCodeData) {
    console.error('No access code data provided to getSurveyIdFromAccessCode');
    return SURVEY_TYPE_MAPPING['Office / Business Pro - 2025 v1 EN'];
  }
  
  const surveyType = accessCodeData?.survey_type || 'Office / Business Pro - 2025 v1 EN';
  const surveyId = SURVEY_TYPE_MAPPING[surveyType] || SURVEY_TYPE_MAPPING['Office / Business Pro - 2025 v1 EN'];
  console.log('Survey ID for access code:', { surveyType, surveyId });
  return surveyId;
};
