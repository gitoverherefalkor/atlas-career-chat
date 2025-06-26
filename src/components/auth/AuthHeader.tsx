
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
      <p className="text-gray-600">
        {isLogin ? 'Welcome back!' : 'Create your account to get started'}
      </p>
    </div>
  );
};

export default AuthHeader;
