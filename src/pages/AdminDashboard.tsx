import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAdminPineScripts } from '@/hooks/usePineScripts';
import { useAllTrades } from '@/hooks/useTrades';
import { useAdminFeatureFlags } from '@/hooks/useFeatureFlags';
import { useAdminWallets } from '@/hooks/useWallets';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Code, 
  BarChart3, 
  Bot,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Activity,
  Wallet,
  Settings
} from 'lucide-react';
import ManualCloseTradesButton from '@/components/ManualCloseTradesButton';
import { useToast } from '@/hooks/use-toast';
import CoinManagement from '@/components/admin/CoinManagement';
import AdminProfile from '@/components/profile/AdminProfile';
import AdminPineScriptEditor from '@/components/admin/AdminPineScriptEditor';
import DeleteUserButton from '@/components/admin/DeleteUserButton';
import AdminMarketMakerControl from '@/components/admin/AdminMarketMakerControl';
import SubscriptionSettingsPanel from '@/components/admin/SubscriptionSettingsPanel';
import PaymentRequestsPanel from '@/components/admin/PaymentRequestsPanel';
import LifetimeFreeEmailsPanel from '@/components/admin/LifetimeFreeEmailsPanel';
import UserAccessControls from '@/components/admin/UserAccessControls';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const { user, role, loading: authLoading } = useAuth();
  const { users, isLoading: usersLoading } = useAdminUsers();
  const { scripts, isLoading: scriptsLoading } = useAdminPineScripts();
  const { trades, isLoading: tradesLoading, activeTrades: adminActiveTrades, closeAllTrades, isClosingAll } = useAllTrades();
  const { flags, toggleFlag, isToggling } = useAdminFeatureFlags();
  const { wallets, isLoading: walletsLoading } = useAdminWallets();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    // Only redirect non-admins AFTER role has been fetched (not null)
    if (!authLoading && user && role !== null && role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, role, authLoading, navigate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  // Show loading while auth is loading OR while role is still being fetched for logged in user
  if (authLoading || (user && role === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-6">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Don't render admin content if not admin
  if (role !== 'admin') {
    return null;
  }

  const activeBots = users.filter(u => u.bot_enabled).length;
  const connectedWallets = wallets?.length || 0;

  const renderContent = () => {
    switch (activeTab) {
      case 'coins':
        return <CoinManagement />;

      case 'profile':
        return <AdminProfile />;

      case 'users':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Bots</CardTitle>
                  <Bot className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeBots}</div>
                  <p className="text-xs text-muted-foreground mt-1">Currently running</p>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Connected Wallets</CardTitle>
                  <Wallet className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{connectedWallets}</div>
                  <p className="text-xs text-muted-foreground mt-1">Binance accounts</p>
                </CardContent>
              </Card>
            </div>

            {/* Users Table */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View all registered users and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="empty-state py-12">
                    <Users className="empty-state-icon" />
                    <p className="empty-state-title">No users yet</p>
                    <p className="empty-state-description">Users will appear here when they sign up</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                         <tr className="border-b text-left text-sm text-muted-foreground">
                          <th className="pb-3 font-medium">Email</th>
                          <th className="pb-3 font-medium">Role</th>
                          <th className="pb-3 font-medium">Coins</th>
                          <th className="pb-3 font-medium">Bot Status</th>
                          <th className="pb-3 font-medium">Joined</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 font-medium">{u.email}</td>
                            <td className="py-3">
                              <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                {u.role || 'user'}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <span className={u.coins === 0 ? 'text-destructive' : ''}>{u.coins}</span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className={`status-dot ${u.bot_enabled ? 'status-dot-active' : 'status-dot-inactive'}`} />
                                <span className="text-sm">{u.bot_enabled ? 'Active' : 'Inactive'}</span>
                              </div>
                            </td>
                            <td className="py-3 text-sm text-muted-foreground">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              {u.role !== 'admin' && (
                                <DeleteUserButton userId={u.user_id} userEmail={u.email} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'scripts':
        return <AdminPineScriptEditor />;


      case 'trades':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
                  <BarChart3 className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{trades.length}</div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
                  <Activity className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{trades.filter(t => t.status === 'OPEN').length}</div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
                  <XCircle className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{trades.filter(t => t.status === 'FAILED').length}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="dashboard-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trade Monitor</CardTitle>
                    <CardDescription>All trades across all users</CardDescription>
                  </div>
                  <ManualCloseTradesButton 
                    activeTrades={adminActiveTrades}
                    onCloseAll={closeAllTrades}
                    isClosing={isClosingAll}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                ) : trades.length === 0 ? (
                  <div className="empty-state py-12">
                    <BarChart3 className="empty-state-icon" />
                    <p className="empty-state-title">No trades yet</p>
                    <p className="empty-state-description">Trades will appear here when users start trading</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-muted-foreground">
                          <th className="pb-3 font-medium">Email</th>
                          <th className="pb-3 font-medium">Side</th>
                          <th className="pb-3 font-medium">Symbol</th>
                          <th className="pb-3 font-medium">Entry $</th>
                          <th className="pb-3 font-medium">Exit $</th>
                          <th className="pb-3 font-medium">Qty</th>
                          <th className="pb-3 font-medium">Leverage</th>
                          <th className="pb-3 font-medium">Trade Amt</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Coin Used</th>
                          <th className="pb-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.slice(0, 20).map((trade) => {
                          const tradeUser = users.find(u => u.user_id === trade.user_id);
                          const leverage = trade.leverage ?? 1;
                          const tradeAmount = trade.quantity && trade.entry_price ? (trade.quantity * trade.entry_price) : null;
                          return (
                          <tr key={trade.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 text-sm">{tradeUser?.email || trade.user_id.slice(0, 8) + '...'}</td>
                            <td className="py-3">
                              <Badge variant={trade.signal_type === 'BUY' ? 'default' : 'destructive'} className="gap-1">
                                {trade.signal_type === 'BUY' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                {trade.signal_type}
                              </Badge>
                            </td>
                            <td className="py-3 font-medium">{trade.symbol}</td>
                            <td className="py-3 font-mono text-sm">{trade.entry_price?.toFixed(2) || '-'}</td>
                            <td className="py-3 font-mono text-sm">{trade.exit_price?.toFixed(2) || '-'}</td>
                            <td className="py-3 font-mono text-sm">{trade.quantity ?? '-'}</td>
                            <td className="py-3 font-mono text-sm">{leverage}x</td>
                            <td className="py-3 font-mono text-sm">{tradeAmount !== null ? `$${tradeAmount.toFixed(2)}` : '-'}</td>
                            <td className="py-3">
                              <Badge variant={
                                trade.status === 'OPEN' ? 'default' :
                                trade.status === 'CLOSED' ? 'secondary' :
                                trade.status === 'FAILED' ? 'destructive' : 'outline'
                              }>
                                {trade.status}
                              </Badge>
                            </td>
                            <td className="py-3">
                              {trade.coin_consumed ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </td>
                            <td className="py-3 text-sm text-muted-foreground">
                              {new Date(trade.created_at).toLocaleDateString()}
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

      case 'wallets':
        return (
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Wallet Overview</CardTitle>
              <CardDescription>All connected Binance wallets (read-only)</CardDescription>
            </CardHeader>
            <CardContent>
              {walletsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : !wallets || wallets.length === 0 ? (
                <div className="empty-state py-12">
                  <Wallet className="empty-state-icon" />
                  <p className="empty-state-title">No connected wallets</p>
                  <p className="empty-state-description">User wallets will appear here when they connect their Binance accounts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wallets.map((wallet) => {
                    const walletUser = users.find(u => u.user_id === wallet.user_id);
                    return (
                    <div key={wallet.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{walletUser?.email || wallet.user_id?.slice(0, 8) + '...'}</p>
                          <p className="text-sm text-muted-foreground">
                            Connected: {new Date(wallet.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={wallet.is_active ? 'default' : 'outline'}>
                        {wallet.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'market-maker':
        return <AdminMarketMakerControl />;

      case 'settings':
        return (
          <Card className="dashboard-card max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Feature Flags
              </CardTitle>
              <CardDescription>Control system-wide features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {flags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No feature flags configured</p>
              ) : (
                flags.map((flag) => (
                  <div key={flag.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div>
                      <p className="font-medium">{flag.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p className="text-sm text-muted-foreground">{flag.description || 'No description'}</p>
                    </div>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(enabled) => toggleFlag({ name: flag.name, enabled })}
                      disabled={isToggling}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );

      case 'subscription':
        return (
          <div className="space-y-6">
            <SubscriptionSettingsPanel />
            <LifetimeFreeEmailsPanel />
          </div>
        );

      case 'payments':
        return <PaymentRequestsPanel />;

      case 'access-control':
        return <UserAccessControls />;

      default:
        return null;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}
