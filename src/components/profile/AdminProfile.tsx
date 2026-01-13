import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Lock,
  Shield,
  Loader2,
  Infinity,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminProfile() {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Info Card */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Admin Profile
          </CardTitle>
          <CardDescription>
            Your administrator account details
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

          {/* Role Badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Account Role</span>
            </div>
            <Badge variant="default" className="gap-1">
              <Shield className="h-3 w-3" />
              Administrator
            </Badge>
          </div>

          {/* Unlimited Coins Indicator */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Infinity className="h-4 w-4 text-primary" />
              <span className="text-sm">Trading Coins</span>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Infinity className="h-3 w-3" />
              Unlimited
            </Badge>
          </div>

          {/* Admin Privileges */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h4 className="font-medium text-sm">Admin Privileges</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Manage all users and their coin balances</li>
              <li>• View and copy all Pine Scripts</li>
              <li>• Approve or reject coin requests</li>
              <li>• Monitor all trades and wallets</li>
              <li>• Control feature flags</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your administrator password
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
