
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Ensure profile exists for authenticated user
async function ensureProfile(user: User) {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingProfile) {
    // Extract name from user metadata (OAuth providers)
    const metadata = user.user_metadata || {};
    const firstName = metadata.given_name || metadata.first_name ||
      (metadata.full_name ? metadata.full_name.split(' ')[0] : null) ||
      (metadata.name ? metadata.name.split(' ')[0] : null);
    const lastName = metadata.family_name || metadata.last_name ||
      (metadata.full_name && metadata.full_name.includes(' ') ? metadata.full_name.split(' ').slice(1).join(' ') : null) ||
      (metadata.name && metadata.name.includes(' ') ? metadata.name.split(' ').slice(1).join(' ') : null);

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        auth_provider: user.app_metadata?.provider || 'email',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Failed to create profile:', error);
    }
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Ensure profile exists when user signs in
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => ensureProfile(session.user), 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Also ensure profile on initial load
      if (session?.user) {
        setTimeout(() => ensureProfile(session.user), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
