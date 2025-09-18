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
  const [isTestingN8N, setIsTestingN8N] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createTestReport = async () => {
    setIsSubmitting(true);
    
    try {
      console.log('Creating test report for dashboard testing...');
      
      const { data, error } = await supabase.functions.invoke('create-test-report', {
        body: { email: user?.email }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Success!",
          description: `Test report created successfully for ${user?.email}. You can now test the dashboard view.`,
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
      
      const { data, error } = await supabase.functions.invoke('cleanup-test-reports', {
        body: { email: user?.email }
      });

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

  const testN8NIntegration = async () => {
    setIsTestingN8N(true);
    
    try {
      console.log('Testing N8N integration with mock data...');
      
      const { data, error } = await supabase.functions.invoke('test-n8n-integration');

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "N8N Test Successful!",
          description: "Mock survey data sent to N8N workflow successfully. Check your N8N logs.",
        });
        console.log('N8N test result:', data);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error testing N8N integration:', error);
      toast({
        title: "N8N Test Failed",
        description: "Failed to send test data to N8N. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsTestingN8N(false);
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
            Manage test reports for your account. Uses your current login email.
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

      <Card>
        <CardHeader>
          <CardTitle>N8N Integration Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Test the N8N workflow with mock survey data from Sjoerd Geurts. Data is sent in proper question order (Q1, Q2, Q3, etc.) for LLM processing.
          </p>
          
          <Button 
            onClick={testN8NIntegration}
            disabled={isTestingN8N}
            className="w-full"
            variant="default"
          >
            {isTestingN8N ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending to N8N...
              </>
            ) : (
              'Test N8N Workflow with Mock Data'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
