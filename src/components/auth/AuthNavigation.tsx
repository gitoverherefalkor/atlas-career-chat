
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AuthNavigation = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-6 text-center">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="text-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Homepage
      </Button>
    </div>
  );
};

export default AuthNavigation;
