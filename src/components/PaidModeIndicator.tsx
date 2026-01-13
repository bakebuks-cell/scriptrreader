import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Crown, Lock } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface PaidModeIndicatorProps {
  variant?: 'badge' | 'inline';
  className?: string;
}

export function PaidModeIndicator({ variant = 'badge', className }: PaidModeIndicatorProps) {
  const { isPaidModeEnabled } = useFeatureFlags();

  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 text-muted-foreground ${className}`}>
              <Crown className="h-3 w-3" />
              <span className="text-xs">Pro</span>
              {!isPaidModeEnabled && <Lock className="h-2.5 w-2.5" />}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isPaidModeEnabled 
                ? 'Pro features are available' 
                : 'Pro features coming soon'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isPaidModeEnabled ? 'default' : 'outline'} 
            className={`gap-1 cursor-help ${className} ${!isPaidModeEnabled ? 'opacity-60' : ''}`}
          >
            <Crown className="h-3 w-3" />
            Pro
            {!isPaidModeEnabled && <Lock className="h-2.5 w-2.5" />}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isPaidModeEnabled 
              ? 'Pro features are available' 
              : 'Pro features coming soon - Currently in free mode'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
