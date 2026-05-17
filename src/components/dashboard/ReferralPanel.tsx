import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Gift, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReferralStatus, REFERRAL_DISCOUNT_PERCENT } from '@/hooks/useReferralStatus';

/**
 * Dashboard invite panel — shows the user's personal invite code, a shareable
 * link, copy buttons, and how many features they've unlocked so far.
 */
export const ReferralPanel = () => {
  const { referralCode, referralLink, referralCount, features, isLoading } = useReferralStatus();
  const { toast } = useToast();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const copy = async (value: string, what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
      toast({ title: 'Copied', description: `Your invite ${what} is on your clipboard.` });
    } catch {
      toast({
        title: "Couldn't copy",
        description: 'Please copy it manually.',
        variant: 'destructive',
      });
    }
  };

  const unlockedCount = features.filter((f) => f.unlocked).length;
  const totalFeatures = features.length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className="bg-atlas-teal/10 p-3 rounded-full">
            <Gift className="h-6 w-6 text-atlas-teal" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Invite friends, unlock features</h3>
            <p className="text-sm text-gray-600">
              Share your code. Every friend who joins gets {REFERRAL_DISCOUNT_PERCENT}% off,
              and each one unlocks another feature for you.
            </p>
          </div>
        </div>

        {isLoading || !referralCode ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating your invite code...
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Your invite code
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg font-mono text-lg tracking-widest text-gray-900">
                    {referralCode}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy(referralCode, 'code')}
                    aria-label="Copy invite code"
                  >
                    {copied === 'code' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {referralLink && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Share link
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-700 truncate">
                      {referralLink}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copy(referralLink, 'link')}
                      aria-label="Copy share link"
                    >
                      {copied === 'link' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{referralCount}</span>{' '}
                {referralCount === 1 ? 'friend has' : 'friends have'} joined —{' '}
                <span className="font-semibold text-gray-900">
                  {unlockedCount} of {totalFeatures}
                </span>{' '}
                features unlocked.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
