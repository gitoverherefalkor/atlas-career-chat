-- Update personality and team questions to 4-point nuanced scale
-- Section 2: Personality & Decisions

-- 2a: Social Energy
UPDATE questions
SET
  label = 'Social Energy',
  config = jsonb_build_object(
    'choices', jsonb_build_array(
      'Energized (I thrive on interaction)',
      'Somewhat Energized (I enjoy it, but have a limit)',
      'Somewhat Drained (I can handle it, but prefer quiet)',
      'Drained (I need significant alone time to reset)'
    ),
    'description', 'How do social interactions affect your energy?'
  )
WHERE id = '22222222-2222-2222-2222-222222222221';

-- 2c: Project Decision Style
UPDATE questions
SET
  label = 'Project Decision Style',
  config = jsonb_build_object(
    'choices', jsonb_build_array(
      'Decisive (Decide immediately to keep moving)',
      'Leaning Decisive (Move forward, but pause for major risks)',
      'Leaning Open (Explore options, but can decide if forced)',
      'Deliberative (Gather data and keep options open as long as possible)'
    ),
    'description', 'How do you typically approach making project decisions?'
  )
WHERE id = '22222222-2222-2222-2222-222222222223';

-- 2e: Handling Change
UPDATE questions
SET
  label = 'Handling Change',
  config = jsonb_build_object(
    'choices', jsonb_build_array(
      'Strong Structure (I prefer clear guidelines and predictability)',
      'Leaning Structure (I prefer guidelines, but can handle some ambiguity)',
      'Leaning Novelty (I embrace the unknown, but like a safety net)',
      'Embrace Novelty (I thrive on the unknown and see it as opportunity)'
    ),
    'description', 'How do you respond to change and uncertainty?'
  )
WHERE id = '22222222-2222-2222-2222-222222222225';

-- 2g: Work Style Preference
UPDATE questions
SET
  label = 'Work Style Preference',
  config = jsonb_build_object(
    'choices', jsonb_build_array(
      'Highly Structured (I need a rigid framework)',
      'Somewhat Structured (I prefer a process but not rigid rules)',
      'Somewhat Flexible (I prefer fluidity but appreciate some process)',
      'Highly Flexible (I find structure stifling)'
    ),
    'description', 'What kind of work environment do you prefer?'
  )
WHERE id = '22222222-2222-2222-2222-222222222227';

-- 2i: Stress Response
UPDATE questions
SET
  label = 'Stress Response',
  config = jsonb_build_object(
    'choices', jsonb_build_array(
      'Action-First (Instinct is to push forward and fix it)',
      'Leaning Action (Tend to act quickly, with a brief pause)',
      'Leaning Analysis (Tend to step back, but can act if urgent)',
      'Analysis-First (Instinct is to stop and analyze deeply)'
    ),
    'description', 'How do you typically respond when under pressure or stress?'
  )
WHERE id = '22222222-2222-2222-2222-222222222229';

-- Section 5: Team & Management

-- 5f: Deadline Approach
UPDATE questions
SET
  label = 'Deadline Approach',
  config = jsonb_build_object(
    'choices', jsonb_build_array(
      'Steady Planner (Plan ahead and avoid last-minute pressure)',
      'Leaning Planner (Work steadily but motivated by deadlines)',
      'Leaning Sprints (Rely on pressure but try to start early)',
      'Pressure Sprinter (Thrive in bursts of focus right before deadlines)'
    ),
    'description', 'How do you approach deadlines and time management?'
  )
WHERE id = '55555555-5555-5555-5555-555555555556';
