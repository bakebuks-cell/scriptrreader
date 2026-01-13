import { useState } from 'react';
import { useAdminCoinRequests } from '@/hooks/useCoinRequests';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Minus,
  Users,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export default function CoinManagement() {
  const {
    allRequests,
    pendingRequests,
    isLoading: requestsLoading,
    approveRequest,
    rejectRequest,
    addCoins,
    deductCoins,
    isApproving,
    isRejecting,
    isAddingCoins,
    isDeductingCoins,
  } = useAdminCoinRequests();

  const { users, isLoading: usersLoading } = useAdminUsers();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [coinsAmount, setCoinsAmount] = useState(5);
  const [reason, setReason] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeductDialogOpen, setIsDeductDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await approveRequest({ requestId });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await rejectRequest({ requestId });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddCoins = async () => {
    if (!selectedUserId) return;
    await addCoins({ userId: selectedUserId, coins: coinsAmount, reason });
    setIsAddDialogOpen(false);
    setSelectedUserId('');
    setCoinsAmount(5);
    setReason('');
  };

  const handleDeductCoins = async () => {
    if (!selectedUserId) return;
    await deductCoins({ userId: selectedUserId, coins: coinsAmount, reason });
    setIsDeductDialogOpen(false);
    setSelectedUserId('');
    setCoinsAmount(5);
    setReason('');
  };

  if (requestsLoading || usersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            <Coins className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users with 0 Coins</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {users.filter(u => u.coins === 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Trading blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Coin Management */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Manual Coin Management
          </CardTitle>
          <CardDescription>
            Add or deduct coins from user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Add Coins Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Coins
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Coins to User</DialogTitle>
                  <DialogDescription>
                    Select a user and specify the number of coins to add.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border">
                        {users.filter(u => u.role !== 'admin').map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.email} ({user.coins} coins)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Coins to Add</Label>
                    <Input
                      type="number"
                      min={1}
                      value={coinsAmount}
                      onChange={(e) => setCoinsAmount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason (Optional)</Label>
                    <Textarea
                      placeholder="Reason for adding coins"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAddCoins}
                    disabled={!selectedUserId || isAddingCoins}
                  >
                    {isAddingCoins ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Coins
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Deduct Coins Dialog */}
            <Dialog open={isDeductDialogOpen} onOpenChange={setIsDeductDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Minus className="h-4 w-4" />
                  Deduct Coins
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deduct Coins from User</DialogTitle>
                  <DialogDescription>
                    Select a user and specify the number of coins to deduct.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select User</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border">
                        {users.filter(u => u.role !== 'admin' && u.coins > 0).map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.email} ({user.coins} coins)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Coins to Deduct</Label>
                    <Input
                      type="number"
                      min={1}
                      value={coinsAmount}
                      onChange={(e) => setCoinsAmount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason (Optional)</Label>
                    <Textarea
                      placeholder="Reason for deducting coins"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={handleDeductCoins}
                    disabled={!selectedUserId || isDeductingCoins}
                  >
                    {isDeductingCoins ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deducting...
                      </>
                    ) : (
                      <>
                        <Minus className="h-4 w-4 mr-2" />
                        Deduct Coins
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="dashboard-card border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Coin Requests
            </CardTitle>
            <CardDescription>
              Review and approve or reject user requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const requestUser = users.find(u => u.user_id === request.user_id);
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{requestUser?.email || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">
                        Requesting <span className="font-semibold text-foreground">{request.requested_coins}</span> coins
                      </p>
                      {request.reason && (
                        <p className="text-sm text-muted-foreground">
                          Reason: {request.reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id && isApproving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id && isRejecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Requests History */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>All coin requests from users</CardDescription>
        </CardHeader>
        <CardContent>
          {allRequests.length === 0 ? (
            <div className="empty-state py-12">
              <Coins className="empty-state-icon" />
              <p className="empty-state-title">No requests yet</p>
              <p className="empty-state-description">
                Coin requests from users will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Coins</th>
                    <th className="pb-3 font-medium">Reason</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allRequests.map((request) => {
                    const requestUser = users.find(u => u.user_id === request.user_id);
                    return (
                      <tr key={request.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3">{requestUser?.email || 'Unknown'}</td>
                        <td className="py-3 font-medium">{request.requested_coins}</td>
                        <td className="py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {request.reason || '-'}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              request.status === 'approved'
                                ? 'default'
                                : request.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="gap-1"
                          >
                            {request.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                            {request.status === 'rejected' && <XCircle className="h-3 w-3" />}
                            {request.status === 'pending' && <Clock className="h-3 w-3" />}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
