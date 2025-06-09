
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

  const createTestReport = async () => {
    setIsSubmitting(true);
    
    try {
      console.log('Creating test report for dashboard testing...');
      
      const { data, error } = await supabase.functions.invoke('create-test-report');

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Success!",
          description: "Test report created successfully for sjn.geurts@gmail.com. You can now test the dashboard view.",
        });
        console.log('Test report creation result:', data);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error creating test report:', error);
      toast({
        title: "Error",
        description: "Failed to create test report. Check console for details.",
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
          <CardTitle>Create Test Report for Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create a test report for sjn.geurts@gmail.com so you can test the dashboard view.
          </p>
          <Button 
            onClick={createTestReport}
            disabled={isSubmitting}
            className="w-full"
            variant="secondary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Test Report...
              </>
            ) : (
              'Create Test Report for Dashboard'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
