
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Trash2 } from 'lucide-react';

export const MockDataSubmitter = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
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

  const cleanupTestReports = async () => {
    setIsCleaning(true);
    
    try {
      console.log('Cleaning up old test reports...');
      
      const { data, error } = await supabase.functions.invoke('cleanup-test-reports');

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Cleanup Complete!",
          description: data.message,
        });
        console.log('Cleanup result:', data);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error cleaning up test reports:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup test reports. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Report Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Manage test reports for sjn.geurts@gmail.com dashboard testing.
          </p>
          
          <div className="space-y-3">
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

            <Button 
              onClick={cleanupTestReports}
              disabled={isCleaning}
              className="w-full"
              variant="outline"
            >
              {isCleaning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cleaning up...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cleanup Old Test Reports
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
