
import React from 'react';

interface AuthHeaderProps {
  isLogin: boolean;
}

const AuthHeader = ({ isLogin }: AuthHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <img
        src="/atlas-logo.png"
        alt="Cairnly"
        className="h-12 w-auto mx-auto mb-2"
      />
      <p className="text-gray-600 mb-2">
        {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
      </p>
      {!isLogin && (
        <p className="text-sm text-atlas-teal max-w-md mx-auto">
          <span className="font-medium">Why create an account?</span> Your personal info stays secure in the survey, and you can easily find your results later.
        </p>
      )}
    </div>
  );
};

export default AuthHeader;
