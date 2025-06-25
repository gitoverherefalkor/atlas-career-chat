
-- Clear survey session data for sjn.geurts@gmail.com
-- First, delete answers linked to access codes used by this user
DELETE FROM answers 
WHERE access_code_id IN (
  SELECT ac.id FROM access_codes ac 
  JOIN profiles p ON ac.user_id = p.id
  WHERE p.email = 'sjn.geurts@gmail.com'
);

-- Clear any draft/incomplete reports for this user
DELETE FROM reports 
WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'sjn.geurts@gmail.com'
)
AND status != 'completed';

-- Clear any incomplete report sections for this user
DELETE FROM report_sections 
WHERE report_id IN (
  SELECT r.id FROM reports r 
  JOIN profiles p ON r.user_id = p.id 
  WHERE p.email = 'sjn.geurts@gmail.com' 
  AND r.status != 'completed'
);
