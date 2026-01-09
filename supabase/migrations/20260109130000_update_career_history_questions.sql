-- Update interests/hobbies question to use new interests_hobbies type
UPDATE questions
SET
  type = 'interests_hobbies',
  config = jsonb_build_object(
    'description', 'Provide up to 3'
  )
WHERE id = '11111111-1111-1111-1111-111111111120';

-- Note: Company Size and Company Culture are now marked as required fields with red asterisks in the UI
-- The validation will be handled client-side
