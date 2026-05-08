import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, User, Save, FileText, CheckCircle, Bell, Download, Trash2, Shield } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user } = useAuth();
  const { profile, updateProfile, isUpdating } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    country: profile?.country || '',
    region: profile?.region || '',
    pronouns: profile?.pronouns || '',
    age_range: profile?.age_range || '',
  });

  const [emailReminders, setEmailReminders] = useState(
    (profile as any)?.email_reminders_enabled ?? true
  );

  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        country: profile.country || '',
        region: profile.region || '',
        pronouns: profile.pronouns || '',
        age_range: profile.age_range || '',
      });
      setEmailReminders((profile as any)?.email_reminders_enabled ?? true);
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data');
      if (error) throw error;

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cairnly-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Data exported', description: 'Your data has been downloaded as a JSON file.' });
    } catch (err: any) {
      console.error('Export error:', err);
      toast({ title: 'Export failed', description: 'Something went wrong. Please try again or contact support.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user-data');
      if (error) throw error;

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({ title: 'Deletion failed', description: 'Something went wrong. Please contact support at privacy@cairnly.io', variant: 'destructive' });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Redirect in useEffect, not during render (prevents blank page flash)
  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-atlas-navy">Profile Settings</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Resume Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Resume/CV Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.resume_uploaded_at ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium">Resume uploaded successfully</p>
                      <p className="text-sm text-gray-500">
                        Uploaded on {new Date(profile.resume_uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      const { error } = await supabase
                        .from('profiles')
                        .update({
                          resume_data: null,
                          resume_parsed_data: null,
                          resume_uploaded_at: null,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', user?.id);
                      
                      if (!error) {
                        window.location.reload();
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Want to upload a new resume?</strong> You can upload a new resume when starting a new Cairnly Assessment for the best pre-filling experience.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                    <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium">No resume uploaded</p>
                    <p className="text-sm text-gray-500">
                      Upload your resume when starting your next Cairnly Assessment for automatic pre-filling
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed from this page
                </p>
              </div>

              <div>
                <label htmlFor="auth_provider" className="block text-sm font-medium mb-2">
                  Sign-in Method
                </label>
                <Input
                  id="auth_provider"
                  value={
                    profile?.auth_provider === 'google' ? 'Google' :
                    profile?.auth_provider === 'linkedin_oidc' ? 'LinkedIn' :
                    profile?.auth_provider === 'email' ? 'Email/Password' :
                    'Email/Password'
                  }
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The authentication method used to create your account
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium mb-2">
                    Country
                  </label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Enter your country"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    From payment form
                  </p>
                </div>
                <div>
                  <label htmlFor="region" className="block text-sm font-medium mb-2">
                    Region
                  </label>
                  <Input
                    id="region"
                    value={formData.region}
                    disabled
                    className="bg-gray-50"
                    placeholder="No region set"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    From survey Section 1
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="pronouns" className="block text-sm font-medium mb-2">
                  Pronouns
                </label>
                <Select value={formData.pronouns} onValueChange={(value) => handleInputChange('pronouns', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your pronouns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="he/him">he/him</SelectItem>
                    <SelectItem value="she/her">she/her</SelectItem>
                    <SelectItem value="they/them">they/them</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="age_range" className="block text-sm font-medium mb-2">
                  Age Range
                </label>
                <Select value={formData.age_range} onValueChange={(value) => handleInputChange('age_range', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-24">18-24</SelectItem>
                    <SelectItem value="25-34">25-34</SelectItem>
                    <SelectItem value="35-44">35-44</SelectItem>
                    <SelectItem value="45-54">45-54</SelectItem>
                    <SelectItem value="55-64">55-64</SelectItem>
                    <SelectItem value="65+">65+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Email Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Email Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Email Reminders</p>
                <p className="text-sm text-gray-500">
                  Receive helpful reminders to continue your assessment and explore your career insights
                </p>
              </div>
              <Switch
                checked={emailReminders}
                onCheckedChange={async (checked) => {
                  setEmailReminders(checked);
                  // Save immediately — no need to hit Save button
                  const { error } = await supabase
                    .from('profiles')
                    .update({
                      email_reminders_enabled: checked,
                      updated_at: new Date().toISOString()
                    } as any)
                    .eq('id', user?.id);

                  if (error) {
                    console.error('Failed to update email preference:', error);
                    setEmailReminders(!checked); // revert on error
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Your Data (GDPR) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Your Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              You have the right to download a copy of all your personal data, or request its permanent deletion.
              See our <a href="/privacy-policy" className="text-atlas-blue underline">Privacy Policy</a> for more details.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download My Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showDeleteConfirm ? (
              <>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all associated data including assessment results,
                  career reports, chat history, and uploaded documents. This action cannot be undone.
                </p>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                <p className="text-sm font-medium text-red-800">
                  Are you sure? This will permanently delete:
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>Your profile and personal information</li>
                  <li>All assessment responses</li>
                  <li>Career reports and recommendations</li>
                  <li>Chat conversation history</li>
                  <li>Uploaded resume/CV files</li>
                </ul>
                <p className="text-sm text-red-800 font-medium">
                  This cannot be undone. You will be signed out immediately.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete Everything'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
