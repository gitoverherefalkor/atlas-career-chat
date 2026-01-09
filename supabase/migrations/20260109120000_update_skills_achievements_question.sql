-- Update question 11111111-1111-1111-1111-11111111111f to be skills_achievements type
-- This question now combines top skills, certifications, and achievements

UPDATE questions
SET
  type = 'skills_achievements',
  label = 'Skills & Achievements',
  config = jsonb_build_object(
    'description', 'Tell us about your professional skills and notable achievements. This helps us understand your strengths and accomplishments.'
  )
WHERE id = '11111111-1111-1111-1111-11111111111f';
