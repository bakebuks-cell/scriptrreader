import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTrades } from '@/hooks/useTrades';
import { usePineScripts } from '@/hooks/usePineScripts';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useUserWallets } from '@/hooks/useWallets';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Coins, 
  Bot, 
  TrendingUp, 
  Code, 
  ArrowUp, 
  ArrowDown, 
  AlertTriangle,
  Wallet,
  Activity,
  CheckCircle2,
  XCircle,
  BarChart3,
  Key
} from 'lucide-react';
import PineScriptEditor from '@/components/PineScriptEditor';
import WalletCard from '@/components/WalletCard';
import BinanceApiKeyForm from '@/components/BinanceApiKeyForm';
import UserProfile from '@/components/profile/UserProfile';
import TradingChart from '@/components/TradingChart';
import ScriptAnalyticsDashboard from '@/components/analytics/ScriptAnalyticsDashboard';
import ScriptExportButton from '@/components/ScriptExportButton';
import PreciousMetalsRates from '@/components/PreciousMetalsRates';
import UserOnboarding from '@/components/onboarding/UserOnboarding';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);
  const { user, role, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, toggleBot, isUpdating } = useProfile();
  const { trades, activeTrades, isLoading: tradesLoading } = useTrades();
  const { hasWallets, activeWallet } = useUserWallets();
  const { 
    scripts, 
    ownScripts,
    adminScripts,
    isLoading: scriptsLoading, 
    createScript, 
    updateScript, 
    deleteScript, 
    toggleActivation,
    isCreating, 
    isUpdating: isScriptUpdating,
    isToggling,
    canEditScript,
    isAdminScript
  } = usePineScripts();
  const { isPaidModeEnabled } = useFeatureFlags();
  
  // Check if user has API keys configured
  const hasApiKeys = hasWallets && activeWallet?.api_key_encrypted;
  
  // Check if user needs onboarding (new user with no scripts and no API keys)
  const needsOnboarding = !dismissedOnboarding && !scriptsLoading && ownScripts.length === 0 && !hasApiKeys;
  
  // Show onboarding if user is new or explicitly triggered
  const shouldShowOnboarding = showOnboarding || needsOnboarding;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    // Only redirect to admin if explicitly admin role - allow 'user' role or null to stay
    if (!authLoading && user && role === 'admin') {
      navigate('/admin');
    }
  }, [user, role, authLoading, navigate]);

  const handleOnboardingComplete = (choice: 'preinstalled' | 'custom') => {
    setShowOnboarding(false);
    setDismissedOnboarding(true);
    if (choice === 'custom') {
      setActiveTab('scripts');
    } else {
      // For pre-installed, stay on overview - admin scripts are already visible
      setActiveTab('overview');
    }
  };

  const handleSaveScript = async (scriptData: any) => {
    await createScript(scriptData);
  };

  const handleUpdateScript = async (id: string, updates: any) => {
    await updateScript({ id, ...updates });
  };

  const handleToggleActivation = async (id: string, is_active: boolean) => {
    await toggleActivation({ id, is_active });
  };

  if (authLoading || profileLoading) {
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

  // Show onboarding for new users
  if (shouldShowOnboarding) {
    return (
      <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <UserOnboarding 
          onComplete={handleOnboardingComplete}
          hasApiKeys={!!hasApiKeys}
          onAddApiKeys={() => {
            setShowOnboarding(false);
            setDismissedOnboarding(true);
            setActiveTab('wallet');
          }}
        />
      </DashboardLayout>
    );
  }

  const coinsRemaining = profile?.coins ?? 0;
  const recentTrades = trades.slice(0, 5);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Coins Card */}
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Available Coins</CardTitle>
                  <Coins className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{coinsRemaining}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {coinsRemaining === 0 ? (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        No trades remaining
                      </span>
                    ) : (
                      `${coinsRemaining} trade${coinsRemaining !== 1 ? 's' : ''} remaining`
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Bot Status Card */}
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Trading Bot</CardTitle>
                  <Bot className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`status-dot ${profile?.bot_enabled && hasApiKeys ? 'status-dot-active' : 'status-dot-inactive'}`} />
                      <span className="text-lg font-semibold">{profile?.bot_enabled && hasApiKeys ? 'Active' : 'Inactive'}</span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Switch
                              checked={profile?.bot_enabled ?? false}
                              onCheckedChange={toggleBot}
                              disabled={isUpdating || coinsRemaining === 0 || !hasApiKeys}
                            />
                          </span>
                        </TooltipTrigger>
                        {!hasApiKeys && (
                          <TooltipContent>
                            <p>Add Binance API keys to enable the trading bot</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {!hasApiKeys && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      API keys required
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Scripts Card */}
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Your Scripts</CardTitle>
                  <Code className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{scripts.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scripts.filter(s => s.is_active).length} active
                  </p>
                </CardContent>
              </Card>

              {/* Active Trades Card */}
              <Card className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Open Trades</CardTitle>
                  <Activity className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeTrades.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trades.length} total executed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Warning if no coins */}
            {coinsRemaining === 0 && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="flex items-center gap-4 py-4">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">No Coins Remaining</p>
                    <p className="text-sm text-muted-foreground">
                      You've used all your free trades. Trading is currently disabled.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning if no API keys */}
            {!hasApiKeys && (
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardContent className="flex items-center gap-4 py-4">
                  <Key className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-600 dark:text-amber-400">Binance API Keys Required</p>
                    <p className="text-sm text-muted-foreground">
                      Connect your Binance account to enable automated trading.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('wallet')}
                    className="shrink-0"
                  >
                    Add API Keys
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wallet Snapshot */}
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Wallet Snapshot
                  </CardTitle>
                  <CardDescription>Your connected Binance wallet</CardDescription>
                </CardHeader>
                <CardContent>
                  <WalletCard compact />
                </CardContent>
              </Card>

              {/* Recent Trades */}
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent Trades
                  </CardTitle>
                  <CardDescription>Your last 5 trades</CardDescription>
                </CardHeader>
                <CardContent>
                  {tradesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10" />
                      <Skeleton className="h-10" />
                    </div>
                  ) : recentTrades.length === 0 ? (
                    <div className="empty-state py-8">
                      <TrendingUp className="empty-state-icon" />
                      <p className="empty-state-title">No trades yet</p>
                      <p className="empty-state-description">
                        Enable your bot and create a Pine Script to start trading
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentTrades.map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded ${trade.signal_type === 'BUY' ? 'bg-buy/10 text-buy' : 'bg-sell/10 text-sell'}`}>
                              {trade.signal_type === 'BUY' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{trade.symbol}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(trade.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant={
                            trade.status === 'OPEN' ? 'default' :
                            trade.status === 'CLOSED' ? 'secondary' :
                            trade.status === 'FAILED' ? 'destructive' : 'outline'
                          }>
                            {trade.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'charts':
        return (
          <div className="space-y-6">
            <PreciousMetalsRates />
            <TradingChart className="dashboard-card" showIndicators={true} />
          </div>
        );

      case 'scripts':
        return (
          <div className="space-y-6">
            <Tabs defaultValue="editor" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="editor" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
                <ScriptExportButton scripts={scripts} />
              </div>
              
              <TabsContent value="editor">
                <Card className="dashboard-card">
                  <CardHeader>
                    <CardTitle>Pine Script Editor</CardTitle>
                    <CardDescription>
                      Manage your trading strategies. Admin scripts are read-only templates you can reference.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PineScriptEditor
                      scripts={scripts}
                      onSave={handleSaveScript}
                      onUpdate={handleUpdateScript}
                      onDelete={deleteScript}
                      onToggleActivation={handleToggleActivation}
                      isLoading={scriptsLoading}
                      isSaving={isCreating || isScriptUpdating}
                      isToggling={isToggling}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics">
                <ScriptAnalyticsDashboard />
              </TabsContent>
            </Tabs>
          </div>
        );

      case 'wallet':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WalletCard />
            <BinanceApiKeyForm />
          </div>
        );

      case 'trades':
        return (
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>All your executed trades</CardDescription>
            </CardHeader>
            <CardContent>
              {tradesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : trades.length === 0 ? (
                <div className="empty-state py-12">
                  <TrendingUp className="empty-state-icon" />
                  <p className="empty-state-title">No trades yet</p>
                  <p className="empty-state-description">
                    Your trade history will appear here once you start trading
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Side</th>
                        <th className="pb-3 font-medium">Symbol</th>
                        <th className="pb-3 font-medium">Entry</th>
                        <th className="pb-3 font-medium">SL</th>
                        <th className="pb-3 font-medium">TP</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade) => (
                        <tr key={trade.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3">
                            <Badge variant={trade.signal_type === 'BUY' ? 'default' : 'destructive'} className="gap-1">
                              {trade.signal_type === 'BUY' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              {trade.signal_type}
                            </Badge>
                          </td>
                          <td className="py-3 font-medium">{trade.symbol}</td>
                          <td className="py-3 font-mono text-sm">{trade.entry_price?.toFixed(2) || '-'}</td>
                          <td className="py-3 font-mono text-sm text-sell">{trade.stop_loss?.toFixed(2) || '-'}</td>
                          <td className="py-3 font-mono text-sm text-buy">{trade.take_profit?.toFixed(2) || '-'}</td>
                          <td className="py-3">
                            <Badge variant={
                              trade.status === 'OPEN' ? 'default' :
                              trade.status === 'CLOSED' ? 'secondary' :
                              trade.status === 'FAILED' ? 'destructive' : 'outline'
                            }>
                              {trade.status === 'OPEN' && <Activity className="h-3 w-3 mr-1" />}
                              {trade.status === 'CLOSED' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {trade.status === 'FAILED' && <XCircle className="h-3 w-3 mr-1" />}
                              {trade.status}
                            </Badge>
                          </td>
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
        );

      case 'settings':
        return (
          <div className="max-w-2xl space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Binance API Configuration</CardTitle>
                <CardDescription>
                  Connect your Binance account to enable automated trading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BinanceApiKeyForm />
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Bot Configuration</CardTitle>
                <CardDescription>Control your trading bot settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Trading Bot</p>
                    <p className="text-sm text-muted-foreground">
                      {!hasApiKeys 
                        ? 'Add Binance API keys above to enable trading'
                        : profile?.bot_enabled 
                          ? 'Bot is actively monitoring and trading' 
                          : 'Bot is currently disabled'}
                    </p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Switch
                            checked={profile?.bot_enabled ?? false}
                            onCheckedChange={toggleBot}
                            disabled={isUpdating || coinsRemaining === 0 || !hasApiKeys}
                          />
                        </span>
                      </TooltipTrigger>
                      {!hasApiKeys && (
                        <TooltipContent>
                          <p>Add Binance API keys to enable the trading bot</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {!hasApiKeys && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                    <Key className="h-4 w-4" />
                    <span>API keys are required to enable the trading bot</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'profile':
        return <UserProfile />;

      case 'analytics':
        return <ScriptAnalyticsDashboard />;

      default:
        return null;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
