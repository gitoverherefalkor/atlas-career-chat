
import React from 'react';

interface AuthHeaderProps {
  isLogin: boolean;
}

const AuthHeader = ({ isLogin }: AuthHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-atlas-navy mb-2">
        Atlas Assessment
      </h1>
      <p className="text-gray-600 mb-2">
        {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
      </p>
      {!isLogin && (
        <p className="text-sm text-red-600 max-w-md mx-auto">
          <span className="font-medium">Why create an account?</span> Your personal info stays secure in the survey, and you can easily find your results later.
        </p>
      )}
    </div>
  );
};

export default AuthHeader;
