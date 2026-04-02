import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Bridges i18next language state with the user's Supabase profile.
 * - On login: syncs the profile's preferred_language to i18next
 * - On language change (while logged in): saves to profile
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  // On login, sync profile language → i18next
  useEffect(() => {
    if (!user) return;

    const syncFromProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .maybeSingle();

      // Only override if the profile has a saved preference
      // and it differs from the current i18next language
      if (data?.preferred_language && data.preferred_language !== i18n.language) {
        i18n.changeLanguage(data.preferred_language);
      }
    };

    syncFromProfile();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // When language changes, persist to profile if logged in
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (!user) return;

      supabase
        .from('profiles')
        .update({ preferred_language: lng } as any)
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.error('Failed to save language preference:', error);
        });
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [user?.id, i18n]);

  return {
    currentLanguage: i18n.language,
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
  };
}
