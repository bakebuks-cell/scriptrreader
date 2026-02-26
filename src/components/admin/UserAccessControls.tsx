import { useState } from 'react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Shield, UserX, Bot } from 'lucide-react';

export default function UserAccessControls() {
  const { users, isLoading } = useAdminUsers();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggle = async (userId: string, field: 'feature_access' | 'login_access', value: boolean) => {
    setUpdating(userId + field);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('user_id', userId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Updated',
        description: `${field === 'login_access' ? 'Login access' : 'Feature access'} ${value ? 'enabled' : 'disabled'}.`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  // Filter out admin users
  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          User Access Controls
        </CardTitle>
        <CardDescription>
          Control login and feature access per user. Login OFF = account suspended. Feature OFF = bot disabled even if paid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {nonAdminUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No users to manage</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium text-center">Login Access</th>
                  <th className="pb-3 font-medium text-center">Feature Access</th>
                  <th className="pb-3 font-medium text-center">Bot Status</th>
                </tr>
              </thead>
              <tbody>
                {nonAdminUsers.map(u => {
                  const profileData = u as typeof u & { login_access?: boolean; feature_access?: boolean };
                  return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium text-sm">{u.email}</td>
                      <td className="py-3 text-center">
                        <Switch
                          checked={profileData.login_access !== false}
                          onCheckedChange={(v) => handleToggle(u.user_id, 'login_access', v)}
                          disabled={updating === u.user_id + 'login_access'}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <Switch
                          checked={profileData.feature_access !== false}
                          onCheckedChange={(v) => handleToggle(u.user_id, 'feature_access', v)}
                          disabled={updating === u.user_id + 'feature_access'}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant={u.bot_enabled ? 'default' : 'secondary'} className="gap-1">
                          <Bot className="h-3 w-3" />
                          {u.bot_enabled ? 'Active' : 'Off'}
                        </Badge>
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
  );
}
