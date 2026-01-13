import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { usePineScripts } from '@/hooks/usePineScripts';
import { useAllTrades } from '@/hooks/useTrades';
import { useAdminFeatureFlags } from '@/hooks/useFeatureFlags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Code, BarChart3, LogOut, Shield, Coins, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, role, signOut, loading: authLoading } = useAuth();
  const { users, isLoading: usersLoading } = useAdminUsers();
  const { scripts, isLoading: scriptsLoading } = usePineScripts();
  const { trades, isLoading: tradesLoading } = useAllTrades();
  const { flags, toggleFlag, isToggling } = useAdminFeatureFlags();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, role, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  const totalCoins = users.reduce((sum, u) => sum + u.coins, 0);
  const activeBots = users.filter(u => u.bot_enabled).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">PineTrader</span>
            <Badge variant="secondary" className="ml-2">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{activeBots} with active bots</p>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pine Scripts</CardTitle>
              <Code className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{scripts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{scripts.filter(s => s.is_active).length} active</p>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
              <BarChart3 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{trades.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Coins</CardTitle>
              <Coins className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCoins}</div>
              <p className="text-xs text-muted-foreground mt-1">Available across users</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="scripts">Pine Scripts</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left text-sm text-muted-foreground">
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3">Coins</th>
                          <th className="pb-3">Bot</th>
                          <th className="pb-3">Timeframes</th>
                          <th className="pb-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-border/50">
                            <td className="py-3">{u.email}</td>
                            <td className="py-3">
                              <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role || 'user'}</Badge>
                            </td>
                            <td className="py-3">{u.coins}</td>
                            <td className="py-3">
                              <Badge variant={u.bot_enabled ? 'default' : 'outline'}>
                                {u.bot_enabled ? 'On' : 'Off'}
                              </Badge>
                            </td>
                            <td className="py-3">{u.selected_timeframes?.length ?? 0}</td>
                            <td className="py-3 text-sm text-muted-foreground">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scripts">
            <Card>
              <CardHeader>
                <CardTitle>Pine Script Manager</CardTitle>
                <CardDescription>Manage trading scripts (never exposed to users)</CardDescription>
              </CardHeader>
              <CardContent>
                {scriptsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12" />
                  </div>
                ) : scripts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No scripts created yet</p>
                ) : (
                  <div className="space-y-4">
                    {scripts.map((script) => (
                      <div key={script.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{script.name}</h4>
                            <p className="text-sm text-muted-foreground">{script.symbol} • {script.allowed_timeframes.join(', ')}</p>
                          </div>
                          <Badge variant={script.is_active ? 'default' : 'outline'}>
                            {script.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Webhook: {script.webhook_secret.slice(0, 8)}...</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Trade Monitor</CardTitle>
                <CardDescription>All trades across users</CardDescription>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12" />
                  </div>
                ) : trades.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No trades yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left text-sm text-muted-foreground">
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Symbol</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Coin Used</th>
                          <th className="pb-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.slice(0, 20).map((trade) => (
                          <tr key={trade.id} className="border-b border-border/50">
                            <td className="py-3">
                              <Badge variant={trade.signal_type === 'BUY' ? 'default' : 'destructive'}>
                                {trade.signal_type}
                              </Badge>
                            </td>
                            <td className="py-3">{trade.symbol}</td>
                            <td className="py-3">
                              <Badge variant="outline">{trade.status}</Badge>
                            </td>
                            <td className="py-3">{trade.coin_consumed ? 'Yes' : 'No'}</td>
                            <td className="py-3 text-sm text-muted-foreground">
                              {new Date(trade.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>Control system-wide features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {flags.map((flag) => (
                  <div key={flag.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">{flag.name.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                    </div>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(enabled) => toggleFlag({ name: flag.name, enabled })}
                      disabled={isToggling}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
