import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, Save, FileText, CheckCircle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { user } = useAuth();
  const { profile, updateProfile, isUpdating } = useProfile();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    country: profile?.country || '',
    region: profile?.region || '',
    pronouns: profile?.pronouns || '',
    age_range: profile?.age_range || '',
  });

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

  if (!user) {
    navigate('/auth');
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
                    <strong>Want to upload a new resume?</strong> You can upload a new resume when starting a new Atlas Assessment for the best pre-filling experience.
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
                      Upload your resume when starting your next Atlas Assessment for automatic pre-filling
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
      </div>
    </div>
  );
};

export default Profile;
