import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Search, FileText, Mail, ArrowRight, type LucideIcon } from 'lucide-react';
import type { ResolvedFeature } from '@/hooks/useReferralStatus';

const ICONS: Record<ResolvedFeature['key'], LucideIcon> = {
  jobs: Search,
  resume: FileText,
  'cover-letter': Mail,
};

interface FeatureTeaserCardProps {
  feature: ResolvedFeature;
  onInviteClick: () => void;
}

/**
 * A single feature teaser card. Three states:
 *  - unlocked + built  → actionable button that opens the feature
 *  - unlocked + unbuilt → "Coming soon"
 *  - locked            → invite CTA
 */
export const FeatureTeaserCard = ({ feature, onInviteClick }: FeatureTeaserCardProps) => {
  const navigate = useNavigate();
  const Icon = ICONS[feature.key];
  const isActionable = feature.unlocked && feature.builtYet && !!feature.route;

  return (
    <Card>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-start space-x-4 mb-3">
          <div className={`p-3 rounded-full ${feature.unlocked ? 'bg-atlas-teal/10' : 'bg-gray-100'}`}>
            {feature.unlocked ? (
              <Icon className="h-6 w-6 text-atlas-teal" />
            ) : (
              <Lock className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{feature.title}</h3>
            {!feature.unlocked && (
              <p className="text-xs text-gray-500 mt-0.5">
                Invite {feature.requiredReferrals}{' '}
                {feature.requiredReferrals === 1 ? 'friend' : 'friends'} to unlock
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 flex-1">{feature.description}</p>

        {isActionable ? (
          <Button
            onClick={() => navigate(feature.route!)}
            className="w-full bg-atlas-teal hover:bg-atlas-teal/90"
          >
            Open
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : feature.unlocked ? (
          <Button disabled variant="outline" className="w-full">
            Coming soon
          </Button>
        ) : (
          <Button variant="outline" onClick={onInviteClick} className="w-full">
            <Lock className="h-4 w-4 mr-1.5" />
            Invite a friend to unlock
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
