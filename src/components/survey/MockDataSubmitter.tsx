
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MockDataSubmitter: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const mockResponses = [
    {
      // Sample response 1 - Career-focused individual
      "q1": "Software Engineering",
      "q2": "Bachelor's Degree",
      "q3": 5,
      "q4": ["Problem Solving", "Creativity", "Leadership"],
      "q5": "Technology",
      "q6": "I love building innovative solutions and working with cutting-edge technologies.",
      "q7": 8,
      "q8": ["Innovation", "Work-Life Balance", "Growth Opportunities"],
      "q9": "Remote",
      "q10": "Large Corporation"
    },
    {
      // Sample response 2 - Creative professional
      "q1": "Graphic Design",
      "q2": "Master's Degree", 
      "q3": 3,
      "q4": ["Creativity", "Communication", "Attention to Detail"],
      "q5": "Arts & Design",
      "q6": "I'm passionate about visual storytelling and creating beautiful, functional designs.",
      "q7": 9,
      "q8": ["Creative Freedom", "Flexibility", "Recognition"],
      "q9": "Hybrid",
      "q10": "Small Company"
    },
    {
      // Sample response 3 - Business-oriented person
      "q1": "Marketing",
      "q2": "Bachelor's Degree",
      "q3": 7,
      "q4": ["Leadership", "Communication", "Strategic Thinking"],
      "q5": "Business",
      "q6": "I enjoy developing strategies that drive growth and connecting with customers.",
      "q7": 7,
      "q8": ["Leadership Opportunities", "High Salary", "Impact"],
      "q9": "Office",
      "q10": "Medium Company"
    }
  ];

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
        title: "Mock Data Submitted",
        description: `Successfully submitted ${mockResponses.length} sample survey responses!`
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
        <CardTitle>Test Survey Data</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Click the button below to submit {mockResponses.length} sample survey responses to see how the data appears in Supabase.
        </p>
        <Button 
          onClick={submitMockData} 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Mock Data"}
        </Button>
      </CardContent>
    </Card>
  );
};
