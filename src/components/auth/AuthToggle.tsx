
import React from 'react';
import { Button } from '@/components/ui/button';

interface AuthToggleProps {
  isLogin: boolean;
  onToggle: () => void;
}

const AuthToggle = ({ isLogin, onToggle }: AuthToggleProps) => {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-600">
        {isLogin ? "Need to create an account?" : "Already have an account?"}
      </p>
      <Button
        variant="link"
        onClick={onToggle}
        className="p-0 h-auto font-medium"
      >
        {isLogin ? 'Sign up here' : 'Sign in here'}
      </Button>
    </div>
  );
};

export default AuthToggle;
