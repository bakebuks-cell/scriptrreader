import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { XCircle, Loader2 } from 'lucide-react';
import { useTrades } from '@/hooks/useTrades';
import { useToast } from '@/hooks/use-toast';

interface ManualCloseTradesButtonProps {
  activeTrades?: any[];
  onCloseAll?: () => Promise<void>;
  isClosing?: boolean;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function ManualCloseTradesButton({
  activeTrades: propActiveTrades,
  onCloseAll: propCloseAll,
  isClosing: propIsClosing,
  variant = 'outline',
  size = 'sm',
  className,
}: ManualCloseTradesButtonProps) {
  const tradeHook = useTrades();
  const { toast } = useToast();

  const activeTrades = propActiveTrades ?? tradeHook.activeTrades;
  const closeAllFn = propCloseAll ?? tradeHook.closeAllTrades;
  const isClosing = propIsClosing ?? tradeHook.isClosingAll;

  const handleCloseAll = async () => {
    try {
      await closeAllFn();
      toast({
        title: 'Success',
        description: `Closed ${activeTrades.length} active trade(s)`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close trades',
        variant: 'destructive',
      });
    }
  };

  if (activeTrades.length === 0) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <XCircle className="h-4 w-4 mr-2" />
          Close All Trades ({activeTrades.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close All Active Trades?</AlertDialogTitle>
          <AlertDialogDescription>
            This will close {activeTrades.length} active trade(s). This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCloseAll}
            className="bg-destructive text-destructive-foreground"
            disabled={isClosing}
          >
            {isClosing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Closing...
              </>
            ) : (
              'Close All Trades'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
