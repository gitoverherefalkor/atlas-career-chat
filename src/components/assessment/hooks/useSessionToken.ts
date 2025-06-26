
import { useState } from 'react';

export const useSessionToken = () => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const generateSessionToken = () => {
    const token = Date.now().toString(36) + Math.random().toString(36).substr(2);
    console.log('Generated session token:', token);
    return token;
  };

  const createNewSession = () => {
    const token = generateSessionToken();
    setSessionToken(token);
    return token;
  };

  const clearSession = () => {
    setSessionToken(null);
  };

  return {
    sessionToken,
    setSessionToken,
    generateSessionToken,
    createNewSession,
    clearSession
  };
};
