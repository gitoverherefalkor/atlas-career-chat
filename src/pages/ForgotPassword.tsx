
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(t('common:errors.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/atlas-logo.png" alt="Cairnly" className="h-12 w-auto mx-auto mb-2" />
          <p className="text-gray-600">{t('forgotPasswordPage.title')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {success ? t('forgotPasswordPage.checkYourEmail') : t('forgotPasswordPage.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <Alert>
                  <AlertDescription className="text-center" dangerouslySetInnerHTML={{ __html: t('forgotPasswordPage.resetSent', { email }) }} />
                </Alert>
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  {t('forgotPasswordPage.backToSignIn')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  {t('forgotPasswordPage.sendResetLink')}
                </p>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    {t('forgotPasswordPage.emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('forgotPasswordPage.sendResetLink')}
                    </>
                  ) : (
                    t('forgotPasswordPage.sendResetLink')
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('forgotPasswordPage.backToSignIn')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
