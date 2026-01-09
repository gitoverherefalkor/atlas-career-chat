-- Remove obsolete questions that are now covered by career_history
-- 1. Company size question (now part of career_history entries)
-- 2. Industry experience question (now part of career_history entries)

DELETE FROM questions
WHERE id IN (
  '11111111-1111-1111-1111-11111111111c', -- company size
  '11111111-1111-1111-1111-11111111111e'  -- industry experience
);
