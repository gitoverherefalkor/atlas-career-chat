
import React, { useState } from 'react';
import SocialAuthButtons from './SocialAuthButtons';
import AuthFormDivider from './AuthFormDivider';
import EmailPasswordForm from './EmailPasswordForm';

interface AuthFormProps {
  isLogin: boolean;
}

const AuthForm = ({ isLogin }: AuthFormProps) => {
  const [error, setError] = useState('');

  return (
    <div className="space-y-4">
      <SocialAuthButtons 
        onError={setError}
      />

      <AuthFormDivider />

      <EmailPasswordForm 
        isLogin={isLogin}
      />
    </div>
  );
};

export default AuthForm;
