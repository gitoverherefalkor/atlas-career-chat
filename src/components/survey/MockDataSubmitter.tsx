
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MockDataSubmitter: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestSubmitting, setIsTestSubmitting] = useState(false);
  const { toast } = useToast();

  const mockResponses = [
    {
      // Profile 1: Tech-savvy Software Engineer
      // Personal Information
      "personal_name": "Alex Chen",
      "personal_age": 28,
      "personal_education": "Bachelor's Degree",
      "personal_experience": 5,
      "personal_location": "San Francisco, CA",
      
      // Current Role & Industry
      "current_role": "Software Engineer",
      "current_industry": "Technology",
      "current_company_size": "Large Corporation (1000+ employees)",
      "current_satisfaction": 7,
      "current_challenges": "Limited growth opportunities and repetitive tasks",
      
      // Skills & Strengths
      "skills_technical": ["Programming", "System Design", "Database Management", "Cloud Computing"],
      "skills_soft": ["Problem Solving", "Analytical Thinking", "Team Collaboration"],
      "skills_rating_communication": 8,
      "skills_rating_leadership": 6,
      "skills_rating_creativity": 9,
      "skills_rating_analytical": 10,
      "skills_rating_interpersonal": 7,
      
      // Interests & Values
      "interests_primary": ["Technology", "Innovation", "Continuous Learning"],
      "interests_activities": "Building side projects, contributing to open source, attending tech meetups",
      "values_ranking": ["Innovation", "Growth Opportunities", "Work-Life Balance", "High Salary", "Job Security", "Recognition", "Autonomy", "Social Impact"],
      "values_work_environment": "Collaborative and innovative",
      
      // Career Goals
      "goals_short_term": "Become a senior software engineer and lead technical projects",
      "goals_long_term": "Start my own tech company or become a CTO",
      "goals_industries_interested": ["Technology", "Fintech", "Healthcare Tech"],
      "goals_preferred_role_type": "Individual contributor with some leadership",
      "goals_work_preference": "Hybrid",
      
      // Personality & Work Style
      "personality_work_style": "I prefer working independently on complex problems but enjoy collaborating during design phases",
      "personality_decision_making": "Data-driven with careful analysis",
      "personality_stress_management": "I break down problems into smaller parts and take short breaks when needed",
      "personality_motivation": "Learning new technologies and solving challenging problems",
      "personality_team_role": "The technical expert who provides innovative solutions",
      
      // Additional Insights
      "additional_ideal_day": "Working on challenging technical problems, learning new frameworks, mentoring junior developers",
      "additional_avoid": "Repetitive manual tasks and excessive meetings",
      "additional_learning_style": "Hands-on experimentation and online courses",
      "additional_feedback": "I appreciate direct, constructive feedback focused on technical growth"
    },
    
    {
      // Profile 2: Creative Marketing Professional
      // Personal Information
      "personal_name": "Maria Rodriguez",
      "personal_age": 32,
      "personal_education": "Master's Degree",
      "personal_experience": 8,
      "personal_location": "Austin, TX",
      
      // Current Role & Industry
      "current_role": "Marketing Manager",
      "current_industry": "Digital Marketing",
      "current_company_size": "Medium Company (100-999 employees)",
      "current_satisfaction": 6,
      "current_challenges": "Limited creative freedom and budget constraints",
      
      // Skills & Strengths
      "skills_technical": ["Digital Marketing", "Content Creation", "Data Analytics", "Social Media Management"],
      "skills_soft": ["Creativity", "Communication", "Strategic Thinking", "Project Management"],
      "skills_rating_communication": 10,
      "skills_rating_leadership": 8,
      "skills_rating_creativity": 10,
      "skills_rating_analytical": 7,
      "skills_rating_interpersonal": 9,
      
      // Interests & Values
      "interests_primary": ["Creative Arts", "Brand Strategy", "Consumer Psychology"],
      "interests_activities": "Photography, writing blog posts, attending creative workshops",
      "values_ranking": ["Creative Freedom", "Recognition", "Growth Opportunities", "Work-Life Balance", "Autonomy", "High Salary", "Social Impact", "Job Security"],
      "values_work_environment": "Creative and collaborative with room for innovation",
      
      // Career Goals
      "goals_short_term": "Lead a major brand campaign and expand my team",
      "goals_long_term": "Become a Creative Director or start my own creative agency",
      "goals_industries_interested": ["Advertising", "Entertainment", "Fashion", "Lifestyle Brands"],
      "goals_preferred_role_type": "Leadership role managing creative teams",
      "goals_work_preference": "Hybrid",
      
      // Personality & Work Style
      "personality_work_style": "I thrive in collaborative brainstorming sessions and enjoy bringing creative visions to life",
      "personality_decision_making": "Intuitive with market research backing",
      "personality_stress_management": "I step away to get inspiration and discuss challenges with my team",
      "personality_motivation": "Creating campaigns that resonate with people and drive results",
      "personality_team_role": "The creative visionary who inspires and guides the team",
      
      // Additional Insights
      "additional_ideal_day": "Brainstorming creative concepts, reviewing campaign performance, and mentoring team members",
      "additional_avoid": "Micromanagement and overly rigid processes that stifle creativity",
      "additional_learning_style": "Visual learning through case studies and hands-on workshops",
      "additional_feedback": "I value feedback that balances creative vision with business objectives"
    },
    
    {
      // Profile 3: People-focused HR Professional
      // Personal Information
      "personal_name": "David Kim",
      "personal_age": 35,
      "personal_education": "Bachelor's Degree",
      "personal_experience": 10,
      "personal_location": "Chicago, IL",
      
      // Current Role & Industry
      "current_role": "HR Business Partner",
      "current_industry": "Human Resources",
      "current_company_size": "Large Corporation (1000+ employees)",
      "current_satisfaction": 8,
      "current_challenges": "Balancing employee needs with business requirements",
      
      // Skills & Strengths
      "skills_technical": ["Employee Relations", "Talent Acquisition", "Performance Management", "HR Analytics"],
      "skills_soft": ["Empathy", "Communication", "Conflict Resolution", "Strategic Thinking"],
      "skills_rating_communication": 10,
      "skills_rating_leadership": 9,
      "skills_rating_creativity": 6,
      "skills_rating_analytical": 8,
      "skills_rating_interpersonal": 10,
      
      // Interests & Values
      "interests_primary": ["People Development", "Organizational Psychology", "Workplace Culture"],
      "interests_activities": "Volunteering, reading psychology books, attending HR conferences",
      "values_ranking": ["Social Impact", "Work-Life Balance", "Job Security", "Growth Opportunities", "Recognition", "Autonomy", "High Salary", "Innovation"],
      "values_work_environment": "Supportive and people-centered with focus on development",
      
      // Career Goals
      "goals_short_term": "Implement a comprehensive employee development program",
      "goals_long_term": "Become Chief People Officer and transform organizational culture",
      "goals_industries_interested": ["Healthcare", "Education", "Non-profit", "Technology"],
      "goals_preferred_role_type": "Leadership role focused on strategic HR initiatives",
      "goals_work_preference": "Office-based with some flexibility",
      
      // Personality & Work Style
      "personality_work_style": "I enjoy building relationships and creating solutions that benefit both employees and the organization",
      "personality_decision_making": "People-centered with data to support decisions",
      "personality_stress_management": "I talk through challenges with trusted colleagues and focus on solutions",
      "personality_motivation": "Helping people grow in their careers and creating positive workplace experiences",
      "personality_team_role": "The supportive leader who facilitates collaboration and development",
      
      // Additional Insights
      "additional_ideal_day": "Coaching employees, working on strategic initiatives, and collaborating with leadership on people strategies",
      "additional_avoid": "Purely transactional work and environments that don't value employee wellbeing",
      "additional_learning_style": "Interactive discussions and real-world application",
      "additional_feedback": "I appreciate feedback that helps me better support others and improve processes"
    },
    
    {
      // Profile 4: Analytical Finance Professional
      // Personal Information
      "personal_name": "Sarah Johnson",
      "personal_age": 29,
      "personal_education": "Master's Degree",
      "personal_experience": 6,
      "personal_location": "New York, NY",
      
      // Current Role & Industry
      "current_role": "Financial Analyst",
      "current_industry": "Finance",
      "current_company_size": "Large Corporation (1000+ employees)",
      "current_satisfaction": 7,
      "current_challenges": "Long hours and high pressure environment",
      
      // Skills & Strengths
      "skills_technical": ["Financial Modeling", "Data Analysis", "Risk Assessment", "Investment Analysis"],
      "skills_soft": ["Analytical Thinking", "Attention to Detail", "Problem Solving", "Time Management"],
      "skills_rating_communication": 7,
      "skills_rating_leadership": 6,
      "skills_rating_creativity": 5,
      "skills_rating_analytical": 10,
      "skills_rating_interpersonal": 6,
      
      // Interests & Values
      "interests_primary": ["Financial Markets", "Economic Trends", "Investment Strategy"],
      "interests_activities": "Reading financial news, analyzing market trends, taking online finance courses",
      "values_ranking": ["High Salary", "Job Security", "Growth Opportunities", "Recognition", "Work-Life Balance", "Innovation", "Autonomy", "Social Impact"],
      "values_work_environment": "Professional and results-oriented with clear expectations",
      
      // Career Goals
      "goals_short_term": "Get promoted to Senior Financial Analyst and specialize in investment banking",
      "goals_long_term": "Become a Portfolio Manager or start my own investment advisory firm",
      "goals_industries_interested": ["Investment Banking", "Asset Management", "Private Equity", "Fintech"],
      "goals_preferred_role_type": "Individual contributor with potential for team leadership",
      "goals_work_preference": "Office-based",
      
      // Personality & Work Style
      "personality_work_style": "I work best with clear data and structured processes, preferring independent work with periodic collaboration",
      "personality_decision_making": "Highly analytical with thorough research and risk assessment",
      "personality_stress_management": "I organize my tasks methodically and take breaks to clear my mind",
      "personality_motivation": "Achieving accurate financial insights and contributing to successful investment decisions",
      "personality_team_role": "The analytical expert who provides detailed research and risk assessments",
      
      // Additional Insights
      "additional_ideal_day": "Analyzing financial data, building models, and presenting insights to stakeholders",
      "additional_avoid": "Ambiguous requirements and environments without clear success metrics",
      "additional_learning_style": "Structured learning with practical applications and case studies",
      "additional_feedback": "I prefer specific, actionable feedback with clear performance metrics"
    },
    
    {
      // Profile 5: Entrepreneurial Sales Professional
      // Personal Information
      "personal_name": "Mike Thompson",
      "personal_age": 31,
      "personal_education": "Bachelor's Degree",
      "personal_experience": 9,
      "personal_location": "Miami, FL",
      
      // Current Role & Industry
      "current_role": "Sales Director",
      "current_industry": "SaaS/Software",
      "current_company_size": "Medium Company (100-999 employees)",
      "current_satisfaction": 9,
      "current_challenges": "Scaling the sales team while maintaining quality",
      
      // Skills & Strengths
      "skills_technical": ["CRM Management", "Sales Analytics", "Lead Generation", "Contract Negotiation"],
      "skills_soft": ["Persuasion", "Relationship Building", "Leadership", "Adaptability"],
      "skills_rating_communication": 10,
      "skills_rating_leadership": 9,
      "skills_rating_creativity": 8,
      "skills_rating_analytical": 7,
      "skills_rating_interpersonal": 10,
      
      // Interests & Values
      "interests_primary": ["Business Development", "Networking", "Market Strategy"],
      "interests_activities": "Attending networking events, reading business books, mentoring young professionals",
      "values_ranking": ["High Salary", "Recognition", "Growth Opportunities", "Autonomy", "Innovation", "Leadership Opportunities", "Work-Life Balance", "Social Impact"],
      "values_work_environment": "Fast-paced and results-driven with entrepreneurial spirit",
      
      // Career Goals
      "goals_short_term": "Build and lead a top-performing sales organization",
      "goals_long_term": "Become a Chief Revenue Officer or start my own company",
      "goals_industries_interested": ["Technology", "SaaS", "Consulting", "Real Estate"],
      "goals_preferred_role_type": "Senior leadership role with P&L responsibility",
      "goals_work_preference": "Hybrid with frequent travel",
      
      // Personality & Work Style
      "personality_work_style": "I thrive on building relationships and driving results through team motivation and strategic thinking",
      "personality_decision_making": "Quick and intuitive with market validation",
      "personality_stress_management": "I channel stress into motivation and seek advice from mentors",
      "personality_motivation": "Exceeding targets and building successful teams that achieve great results",
      "personality_team_role": "The motivational leader who drives performance and builds winning cultures",
      
      // Additional Insights
      "additional_ideal_day": "Meeting with key clients, coaching my team, and strategizing on new market opportunities",
      "additional_avoid": "Bureaucratic processes and environments that discourage risk-taking",
      "additional_learning_style": "Learning through real-world experience and peer discussions",
      "additional_feedback": "I value direct feedback focused on results and team development"
    }
  ];

  const submitTestResponse = async () => {
    setIsTestSubmitting(true);
    try {
      console.log('Starting test response submission...');
      
      // Submit just the first mock response for testing
      const testResponse = mockResponses[0];
      console.log('Test response data:', testResponse);
      
      const { data, error } = await supabase
        .from('answers')
        .insert({
          survey_id: "00000000-0000-0000-0000-000000000001",
          payload: testResponse
        })
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Insert successful:', data);
      
      toast({
        title: "Test Response Sent!",
        description: "Alex Chen's profile has been sent to Relevance AI. Check your agent dashboard and edge function logs!"
      });
      
      console.log('Test response submitted successfully. The database trigger should now call the edge function.');
    } catch (error) {
      console.error('Detailed error submitting test response:', error);
      
      // More specific error handling
      let errorMessage = "Failed to submit test response.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Test Submission Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTestSubmitting(false);
    }
  };

  const submitMockData = async () => {
    setIsSubmitting(true);
    try {
      // Submit all mock responses
      for (const mockResponse of mockResponses) {
        const { error } = await supabase
          .from('answers')
          .insert({
            survey_id: "00000000-0000-0000-0000-000000000001",
            payload: mockResponse
          });
        
        if (error) throw error;
      }

      toast({
        title: "Comprehensive Mock Data Submitted",
        description: `Successfully submitted ${mockResponses.length} complete survey responses with all sections covered!`
      });
    } catch (error) {
      console.error('Error submitting mock data:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit mock data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Survey Test Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Test Single Response</h3>
          <p className="text-sm text-gray-600 mb-3">
            Send one test response (Alex Chen - Software Engineer) to verify Relevance AI integration:
          </p>
          <Button 
            onClick={submitTestResponse} 
            disabled={isTestSubmitting}
            className="w-full mb-4"
            variant="outline"
          >
            {isTestSubmitting ? "Sending Test..." : "Send Test Response to Agent"}
          </Button>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Full Mock Dataset</h3>
          <p className="text-sm text-gray-600 mb-4">
            Submit {mockResponses.length} comprehensive survey responses covering all personality profiles:
          </p>
          <ul className="text-xs text-gray-500 mb-4 space-y-1">
            <li>• Tech-savvy Software Engineer</li>
            <li>• Creative Marketing Professional</li>
            <li>• People-focused HR Professional</li>
            <li>• Analytical Finance Professional</li>
            <li>• Entrepreneurial Sales Professional</li>
          </ul>
          <Button 
            onClick={submitMockData} 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit All Mock Data"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
