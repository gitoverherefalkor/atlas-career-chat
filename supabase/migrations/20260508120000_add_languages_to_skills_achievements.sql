-- Languages capture lives inside the existing Skills & Achievements question
-- (id ...11111111111f) so the n8n payload shape (one question_id) stays intact.
-- This migration:
--   1) Marks the question required (Languages becomes the mandatory part).
--   2) Adds language-related config keys: presets, proficiency levels, "other" list.
-- The frontend (QuestionRenderer.tsx, skills_achievements case) reads these
-- keys and renders a Languages card under Achievements.

UPDATE questions
SET
  required = true,
  config = config || jsonb_build_object(
    'languages_presets', jsonb_build_array(
      'English',
      'Mandarin Chinese',
      'Hindi',
      'Spanish',
      'French',
      'Arabic',
      'Bengali'
    ),
    'languages_proficiency_levels', jsonb_build_array(
      jsonb_build_object('value', 'native', 'label', 'Native'),
      jsonb_build_object('value', 'fluent', 'label', 'Fluent'),
      jsonb_build_object('value', 'conversational', 'label', 'Conversational'),
      jsonb_build_object('value', 'basic', 'label', 'Basic')
    ),
    'languages_other', jsonb_build_array(
      'Russian','Portuguese','German','Japanese','Korean','Italian','Turkish',
      'Dutch','Swedish','Polish','Vietnamese','Indonesian','Thai','Greek',
      'Hebrew','Ukrainian','Persian (Farsi)','Urdu','Punjabi','Tamil','Telugu',
      'Marathi','Gujarati','Malay','Filipino (Tagalog)','Romanian','Czech',
      'Hungarian','Norwegian','Danish','Finnish','Swahili','Afrikaans',
      'Catalan','Slovak','Bulgarian','Croatian','Serbian','Lithuanian','Latvian','Estonian'
    )
  )
WHERE id = '11111111-1111-1111-1111-11111111111f';
