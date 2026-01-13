import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCoinRequests } from '@/hooks/useCoinRequests';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Lock,
  Coins,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UserProfile() {
  const { user, role } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile, isUpdating } = useProfile();
  const { myRequests, hasPendingRequest, createRequest, isCreating } = useCoinRequests();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [requestCoins, setRequestCoins] = useState(5);
  const [requestReason, setRequestReason] = useState('');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ display_name: displayName });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestCoins = async () => {
    try {
      await createRequest({
        requestedCoins: requestCoins,
        reason: requestReason,
      });
      setIsRequestDialogOpen(false);
      setRequestCoins(5);
      setRequestReason('');
    } catch (error) {
      // Error handled in hook
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Info Card */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your account details and role information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>

          {/* Role Badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm">Account Role</span>
            </div>
            <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
              {role === 'admin' ? 'Admin' : 'User'}
            </Badge>
          </div>

          {/* Coin Balance */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm">Coin Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{profile?.coins || 0}</span>
              <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={hasPendingRequest}
                  >
                    {hasPendingRequest ? 'Request Pending' : 'Request Coins'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Coins</DialogTitle>
                    <DialogDescription>
                      Submit a request for additional coins. An admin will review your request.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Number of Coins</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={requestCoins}
                        onChange={(e) => setRequestCoins(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason (Optional)</Label>
                      <Textarea
                        placeholder="Why do you need additional coins?"
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleRequestCoins}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Button onClick={handleUpdateProfile} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Coin Request History */}
      {myRequests.length > 0 && (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Coin Request History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{request.requested_coins} coins requested</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                    )}
                  </div>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Password Card */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !newPassword || !confirmPassword}
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing Password...
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
