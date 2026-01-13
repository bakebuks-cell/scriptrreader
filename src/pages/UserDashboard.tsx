import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTrades } from '@/hooks/useTrades';
import { usePineScripts } from '@/hooks/usePineScripts';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Coins, Bot, LogOut, ArrowUp, ArrowDown, Shield, Code, Wallet, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PineScriptEditor from '@/components/PineScriptEditor';
import WalletCard from '@/components/WalletCard';
import BinanceApiKeyForm from '@/components/BinanceApiKeyForm';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, role, signOut, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, toggleBot, isUpdating } = useProfile();
  const { trades, activeTrades, isLoading: tradesLoading } = useTrades();
  const { scripts, isLoading: scriptsLoading, createScript, updateScript, deleteScript, isCreating, isUpdating: isScriptUpdating } = usePineScripts();
  const { isPaidModeEnabled } = useFeatureFlags();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && role === 'admin') {
      navigate('/admin');
    }
  }, [user, role, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveScript = async (scriptData: any) => {
    await createScript(scriptData);
  };

  const handleUpdateScript = async (id: string, updates: any) => {
    await updateScript({ id, ...updates });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  const coinsRemaining = profile?.coins ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">PineTrader</span>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Coins</CardTitle>
              <Coins className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{coinsRemaining}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {coinsRemaining === 0 ? 'No trades available' : `${coinsRemaining} trades remaining`}
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bot</CardTitle>
              <Bot className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${profile?.bot_enabled ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                  <span className="text-lg font-semibold">{profile?.bot_enabled ? 'Active' : 'Off'}</span>
                </div>
                <Switch
                  checked={profile?.bot_enabled ?? false}
                  onCheckedChange={toggleBot}
                  disabled={isUpdating || coinsRemaining === 0}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scripts</CardTitle>
              <Code className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{scripts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{scripts.filter(s => s.is_active).length} active</p>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trades</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeTrades.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{trades.length} total</p>
            </CardContent>
          </Card>
        </div>

        {!isPaidModeEnabled && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Upgrade to Premium</p>
                  <p className="text-sm text-muted-foreground">Unlimited coins and advanced features</p>
                </div>
              </div>
              <Button variant="outline" disabled>Coming Soon</Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="scripts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="scripts">Pine Scripts</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="scripts">
            <PineScriptEditor
              scripts={scripts}
              onSave={handleSaveScript}
              onUpdate={handleUpdateScript}
              onDelete={deleteScript}
              isLoading={scriptsLoading}
              isSaving={isCreating || isScriptUpdating}
            />
          </TabsContent>

          <TabsContent value="wallet">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WalletCard />
              <BinanceApiKeyForm />
            </div>
          </TabsContent>

          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>Your executed trades</CardDescription>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <Skeleton className="h-24" />
                ) : trades.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No trades yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-muted-foreground">
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Symbol</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">SL / TP</th>
                          <th className="pb-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.slice(0, 10).map((trade) => (
                          <tr key={trade.id} className="border-b border-border/50">
                            <td className="py-3">
                              <Badge variant={trade.signal_type === 'BUY' ? 'default' : 'destructive'}>
                                {trade.signal_type === 'BUY' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                                {trade.signal_type}
                              </Badge>
                            </td>
                            <td className="py-3 font-medium">{trade.symbol}</td>
                            <td className="py-3"><Badge variant="outline">{trade.status}</Badge></td>
                            <td className="py-3 text-sm">{trade.stop_loss?.toFixed(2)} / {trade.take_profit?.toFixed(2)}</td>
                            <td className="py-3 text-sm text-muted-foreground">{new Date(trade.created_at).toLocaleDateString()}</td>
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
            <BinanceApiKeyForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
