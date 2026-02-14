import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
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
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const activeTrades = propActiveTrades ?? tradeHook.activeTrades;
  const closeAllFn = propCloseAll ?? tradeHook.closeAllTrades;
  const isClosing = propIsClosing ?? tradeHook.isClosingAll ?? closing;

  const handleCloseAll = async () => {
    setClosing(true);
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
    } finally {
      setClosing(false);
      setOpen(false);
    }
  };

  if (activeTrades.length === 0) return null;

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!isClosing) setOpen(v); }}>
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
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isClosing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleCloseAll}
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
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
