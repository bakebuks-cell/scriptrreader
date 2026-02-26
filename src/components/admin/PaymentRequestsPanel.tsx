import { useState } from 'react';
import { useAdminPaymentRequests } from '@/hooks/usePaymentRequests';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Receipt,
  Copy
} from 'lucide-react';

export default function PaymentRequestsPanel() {
  const { requests, isLoading, reviewPayment, isReviewing } = useAdminPaymentRequests();
  const { users } = useAdminUsers();
  const { toast } = useToast();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const getUserEmail = (userId: string) => {
    return users.find(u => u.user_id === userId)?.email ?? userId.slice(0, 8) + '...';
  };

  const handleReview = async (id: string, status: 'CONFIRMED' | 'REJECTED') => {
    try {
      await reviewPayment({ id, status, admin_notes: adminNotes[id] });
      toast({
        title: status === 'CONFIRMED' ? 'Payment Confirmed' : 'Payment Rejected',
        description: status === 'CONFIRMED'
          ? 'Subscription activated for 1 month.'
          : 'User can submit a new payment.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to review',
        variant: 'destructive',
      });
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({ title: 'Copied!', description: 'Transaction hash copied.' });
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const reviewedRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
          <CardDescription>Payment requests awaiting admin confirmation</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No pending payment requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="p-4 rounded-lg border bg-card space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{getUserEmail(req.user_id)}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.amount} {req.crypto_symbol} · {new Date(req.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      PENDING
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 rounded bg-muted text-xs font-mono break-all">
                      {req.tx_hash}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => copyHash(req.tx_hash)} className="shrink-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Admin notes (optional)..."
                      value={adminNotes[req.id] ?? ''}
                      onChange={(e) => setAdminNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(req.id, 'CONFIRMED')}
                        disabled={isReviewing}
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReview(req.id, 'REJECTED')}
                        disabled={isReviewing}
                        className="gap-1"
                      >
                        <XCircle className="h-3 w-3" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {reviewedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Previously reviewed payment requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">TX Hash</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Reviewed</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedRequests.map(req => (
                    <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 text-sm">{getUserEmail(req.user_id)}</td>
                      <td className="py-3 text-sm">{req.amount} {req.crypto_symbol}</td>
                      <td className="py-3">
                        <code className="text-xs font-mono">{req.tx_hash.slice(0, 16)}...</code>
                      </td>
                      <td className="py-3">
                        <Badge variant={req.status === 'CONFIRMED' ? 'default' : 'destructive'}>
                          {req.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
