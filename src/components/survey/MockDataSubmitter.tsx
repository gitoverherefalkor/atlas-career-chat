import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const MockDataSubmitter = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sjoerdTestData = {
    "personal_name": "Sjoerd Geurts",
    "personal_pronoun": "He / Him",
    "personal_age": 40,
    "personal_region": "Northern and Western Europe",
    "personal_goals": ["Assessing my work preferences and values for a better work-life balance"],
    "education_level": "Master's degree",
    "education_subject": "BSc in BA, MSc in Entrepreneurship and New Business ventures",
    "experience_years": 16,
    "current_situation": "Entrepreneur seeking an employed role",
    "current_role": "Chief of staff at a clean tech start up. Also, AI Consultant creating smart solutions for placement and recruiting and career coaches",
    "company_size": "1–10",
    "current_happiness": 8,
    "industry_experience": "AI, Video game publishing, data platforms, automotive, crowd finance",
    "professional_achievement": "using state of the art AI models and professional insights, I created from A-Z an AI agent that preforms a comprehensive, highly accurate personality assessment to guides people towards fulfilling future careers at a fraction of the costs of current alternatives",
    "personal_interests": "i like AI, and new innovative tech. Always reading about it. it's my business and want to explore it further\n2 building things with my kids, lego, forts, etc. getting creative with games.\nGardening and DIY. it relaxes me. i find it both creative and analytical: \"How to best approach this construction or outdoor space to make it my own\". I employ research and AI in this to help me get the best results.",
    "recharge_style": "I usually need some alone time to recharge but enjoy smaller gatherings now and then.",
    "decision_attention": "The immediate, practical details and data",
    "decision_style": "I plan things out carefully but stay flexible if new info comes up.",
    "communication_style": "Speak directly and to the point",
    "uncertainty_handling": "I embrace the unknown as a chance to innovate.",
    "conflict_approach": "I address issues assertively and focus on finding a balanced solution.",
    "work_style": "Flexible environment with room for creativity",
    "risk_comfort": "Comfortable",
    "stress_response": "Feel stressed but jump straight into fixing the issue",
    "work_hindrances": ["Perfectionism leading to delays", "Taking on too much responsibility", "Procrastination"],
    "career_values_ranking": [
      "Job Satisfaction (e.g., enjoying daily tasks, feeling engaged and motivated by work)",
      "Autonomy (e.g., having independence in work, making decisions)",
      "Creativity (e.g., having the freedom to innovate, engaging in creative problem-solving)",
      "Work-Life Balance (e.g., balancing personal and professional life, flexible hours)",
      "Job Stability & Financial Security (e.g., long-term stability, financial reliability)",
      "Personal Growth & Challenge (e.g., learning new skills, overcoming difficult challenges, pushing personal and professional limits)",
      "Helping Others & Making an Impact (e.g., contributing to a cause, supporting colleagues or clients)",
      "Accomplishment & Recognition (e.g., reaching significant milestones, excelling in work, receiving awards)"
    ],
    "employer_values_alignment": "Neutral",
    "work_life_balance_importance": "Very",
    "schedule_preference": "Flexible hours",
    "salary_importance": "Moderately important—I value salary but also consider other factors",
    "compensation_range": "75,000–100,000",
    "compensation_priority": "High salary",
    "career_aspects_to_avoid": [
      "Limited learning or growth opportunities (e.g., repetitive tasks, no clear professional development path)",
      "Highly structured or bureaucratic environments (e.g., rigid processes, slow decision-making, excessive red tape)",
      "Routine and repetitive tasks (e.g., work that lacks variety, heavily structured workflows, little creative freedom)",
      "Work that feels meaningless or lacks impact (e.g., tasks that seem unimportant, little connection to larger goals, lack of purpose)",
      "Data-heavy or analytical roles (e.g., working extensively with spreadsheets, statistics, or research-heavy tasks)",
      "Finance-related work (e.g., financial analysis, accounting, budgeting, or investment-related roles)"
    ],
    "interest_areas": ["Business and Entrepreneurship", "Science and Technology", "Environmental and Sustainability"],
    "archetypes": ["The Visionary (creative, thinks outside the box, envisions new possibilities)", "The Organizer (plans tasks, sets priorities, keeps structure)"],
    "company_culture": "Innovative and forward-thinking.",
    "specialized_knowledge": "AI agentic workflows, genAI for business, project management, fundraising, process optimalisation, presentations",
    "ai_familiarity": "Extremely familiar—I work with AI technologies professionally",
    "workshop_topics": [
      "Artificial Intelligence and Automation (e.g., implementing AI solutions, the future of automation in business)",
      "Innovation and Product Development (e.g., fostering a culture of innovation, developing new products)"
    ],
    "industries_to_avoid": [
      "Finance and Banking",
      "Sales and Business Development",
      "Legal Professions",
      "Healthcare and Wellness",
      "Retail, Hospitality, and Customer Service",
      "Nonprofits and Social Work"
    ],
    "team_role": "Contribute ideas and collaborate",
    "team_motivation": "Achieving common goals",
    "preferred_team_size": "Medium (6-10 people)",
    "team_disagreement_handling": "Address them directly to find a solution",
    "team_challenges": ["Challenges with delegation", "Managing different work styles", "Trusting team members to complete tasks"],
    "deadline_approach": "I meet deadlines but like having flexibility until the last minute.",
    "leadership_preference": "Delegating autonomy and trusting me to figure things out",
    "manager_disagreement": "Approach them privately to share your point of view",
    "feedback_handling": "I'm open to it but may feel defensive initially.",
    "giving_criticism": "Are direct and focus solely on the facts.",
    "colleague_stress_support": "Provide practical help or solutions.",
    "conflict_emotion_management": "Feel upset but try to keep your feelings in check.",
    "stress_management": "Internalize stress without specific coping strategies.",
    "relationship_building": "Engage actively, show interest in their work and personal lives, and participate in after-work activities.",
    "emotional_intelligence_challenges": ["Empathizing with others", "Receiving criticism without defensiveness"],
    "short_term_goals": ["Develop new skills or certifications.", "Expand my professional network."],
    "long_term_goals": ["Establish expertise and recognition in my field.", "Own or run a successful business."],
    "career_barriers": ["Work-life balance constraints or family commitments", "Gaps in skills or professional development"],
    "new_skills_interest": "Yes, always seeking new skills.",
    "skills_to_develop": ["Sales, Relationship-Building & Networking", "Technical & Digital Skills"]
  };

  const submitSjoerdData = async () => {
    setIsSubmitting(true);
    
    try {
      console.log('Submitting Sjoerd test data:', sjoerdTestData);
      
      // First ensure survey exists
      const surveyId = "00000000-0000-0000-0000-000000000001";
      
      const { data: existingSurvey, error: surveyCheckError } = await supabase
        .from('surveys')
        .select('id')
        .eq('id', surveyId)
        .maybeSingle();
      
      if (!existingSurvey && (!surveyCheckError || surveyCheckError.code === 'PGRST116')) {
        console.log('Creating survey...');
        const { error: createError } = await supabase
          .from('surveys')
          .insert({
            id: surveyId,
            title: "Atlas Career Assessment"
          });
        
        if (createError) {
          console.error('Error creating survey:', createError);
          throw createError;
        }
        console.log('Survey created successfully');
      }

      // Insert Sjoerd's responses - only include columns that exist in the answers table
      console.log('Inserting Sjoerd test response...');
      const answerData = {
        survey_id: surveyId,
        payload: sjoerdTestData
      };

      console.log('Answer data being inserted:', answerData);

      const { data, error } = await supabase
        .from('answers')
        .insert(answerData)
        .select();

      if (error) {
        console.error('Error inserting Sjoerd test response:', error);
        throw error;
      }

      console.log('Sjoerd test response inserted successfully:', data);
      console.log('Database trigger should now call forward-to-relevance function');

      toast({
        title: "Success!",
        description: "Sjoerd's test data has been submitted successfully and analysis should be starting.",
      });

    } catch (error) {
      console.error('Error submitting Sjoerd test data:', error);
      toast({
        title: "Error",
        description: "Failed to submit test data. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTestData = async () => {
    setIsSubmitting(true);
    
    try {
      console.log('Calling test survey integration function...');
      
      const response = await fetch('/functions/v1/test-survey-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Test data submitted successfully. Check the logs for details.",
        });
        console.log('Test data submission result:', result);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error submitting test data:', error);
      toast({
        title: "Error",
        description: "Failed to submit test data. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Sjoerd's Real Survey Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This will submit Sjoerd's actual survey responses to test the real flow with authentic data.
          </p>
          <Button 
            onClick={submitSjoerdData}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Sjoerd's Data...
              </>
            ) : (
              'Submit Sjoerd\'s Survey Answers'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submit Mock Test Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This will submit the original Alex Chen test data to the survey system and trigger the Relevance AI analysis.
          </p>
          <Button 
            onClick={submitTestData}
            disabled={isSubmitting}
            className="w-full"
            variant="outline"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Mock Data...
              </>
            ) : (
              'Submit Alex Chen Test Data'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
