import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface DeleteUserButtonProps {
  userId: string;
  userEmail: string;
}

export default function DeleteUserButton({ userId, userEmail }: DeleteUserButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTrades, setActiveTrades] = useState<any[] | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeleteClick = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });

      if (error) throw error;

      if (data.warning) {
        setActiveTrades(data.active_trades);
        setShowWarning(true);
      } else if (data.success) {
        toast({ title: 'Success', description: 'User account deleted successfully' });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to process request', variant: 'destructive' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleForceDelete = async () => {
    setIsDeleting(true);
    try {
      // First close all trades
      await supabase
        .from('trades')
        .update({ status: 'CLOSED' as const, closed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('status', ['OPEN', 'PENDING']);

      // Then delete
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });

      if (error) throw error;

      if (data.success) {
        toast({ title: 'Success', description: 'User account deleted successfully' });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        setShowWarning(false);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete user', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for <strong>{userEmail}</strong> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClick}
              className="bg-destructive text-destructive-foreground"
              disabled={isChecking}
            >
              {isChecking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Active trades warning dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Active Trades Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                <strong>{userEmail}</strong> has {activeTrades?.length} active trade(s) that must be closed first:
              </p>
              <div className="space-y-1">
                {activeTrades?.map((trade: any) => (
                  <div key={trade.id} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{trade.symbol}</Badge>
                    <Badge variant={trade.status === 'OPEN' ? 'default' : 'secondary'}>{trade.status}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-amber-600 font-medium">
                Force closing all trades and deleting the account cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Close Trades & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
