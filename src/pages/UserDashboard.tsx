import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTrades } from '@/hooks/useTrades';
import { useSignals } from '@/hooks/useSignals';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Coins, Bot, Clock, LogOut, ArrowUp, ArrowDown, Shield } from 'lucide-react';
import { AVAILABLE_TIMEFRAMES, MAX_SELECTED_TIMEFRAMES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, role, signOut, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, toggleBot, updateTimeframes, isUpdating } = useProfile();
  const { trades, activeTrades, isLoading: tradesLoading } = useTrades();
  const { signals, isLoading: signalsLoading } = useSignals();
  const { isPaidModeEnabled } = useFeatureFlags();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && role === 'admin') {
      navigate('/admin');
    }
  }, [user, role, authLoading, navigate]);

  const handleTimeframeChange = async (timeframe: string, checked: boolean) => {
    if (!profile) return;
    
    let newTimeframes: string[];
    if (checked) {
      if (profile.selected_timeframes.length >= MAX_SELECTED_TIMEFRAMES) {
        toast({ title: 'Limit reached', description: `Maximum ${MAX_SELECTED_TIMEFRAMES} timeframes allowed`, variant: 'destructive' });
        return;
      }
      newTimeframes = [...profile.selected_timeframes, timeframe];
    } else {
      newTimeframes = profile.selected_timeframes.filter(t => t !== timeframe);
    }
    
    await updateTimeframes(newTimeframes);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
  const canTrade = coinsRemaining > 0 && profile?.bot_enabled;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coins Card */}
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Coins Remaining</CardTitle>
              <Coins className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{coinsRemaining}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {coinsRemaining === 0 ? 'No trades available' : `${coinsRemaining} trades remaining`}
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
                  <div className={`w-3 h-3 rounded-full ${profile?.bot_enabled ? 'bg-primary animate-pulse-subtle' : 'bg-muted-foreground'}`} />
                  <span className="text-lg font-semibold">{profile?.bot_enabled ? 'Active' : 'Inactive'}</span>
                </div>
                <Switch
                  checked={profile?.bot_enabled ?? false}
                  onCheckedChange={toggleBot}
                  disabled={isUpdating || coinsRemaining === 0}
                />
              </div>
              {coinsRemaining === 0 && (
                <p className="text-xs text-destructive mt-2">No coins - trading disabled</p>
              )}
            </CardContent>
          </Card>

          {/* Active Trades Card */}
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Trades</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeTrades.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {trades.length} total trades
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Paid Mode Banner */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeframe Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeframes
              </CardTitle>
              <CardDescription>
                Select up to {MAX_SELECTED_TIMEFRAMES} timeframes ({profile?.selected_timeframes?.length ?? 0}/{MAX_SELECTED_TIMEFRAMES})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_TIMEFRAMES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                    <Checkbox
                      checked={profile?.selected_timeframes?.includes(value) ?? false}
                      onCheckedChange={(checked) => handleTimeframeChange(value, checked as boolean)}
                      disabled={isUpdating}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Signals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Signals</CardTitle>
              <CardDescription>Latest trading signals received</CardDescription>
            </CardHeader>
            <CardContent>
              {signalsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : signals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No signals yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {signals.slice(0, 5).map((signal) => (
                    <div key={signal.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                      <div className="flex items-center gap-3">
                        {signal.signal_type === 'BUY' ? (
                          <ArrowUp className="h-5 w-5 text-buy" />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-sell" />
                        )}
                        <div>
                          <p className="font-medium">{signal.symbol}</p>
                          <p className="text-xs text-muted-foreground">{signal.timeframe}</p>
                        </div>
                      </div>
                      <Badge variant={signal.signal_type === 'BUY' ? 'default' : 'destructive'}>
                        {signal.signal_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trade History */}
        <Card>
          <CardHeader>
            <CardTitle>Trade History</CardTitle>
            <CardDescription>Your executed trades and coin usage</CardDescription>
          </CardHeader>
          <CardContent>
            {tradesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : trades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No trades yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Symbol</th>
                      <th className="pb-3">Timeframe</th>
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
                            {trade.signal_type}
                          </Badge>
                        </td>
                        <td className="py-3 font-medium">{trade.symbol}</td>
                        <td className="py-3">{trade.timeframe}</td>
                        <td className="py-3">
                          <Badge variant="outline">{trade.status}</Badge>
                        </td>
                        <td className="py-3 text-sm">
                          {trade.stop_loss?.toFixed(2)} / {trade.take_profit?.toFixed(2)}
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
      </main>
    </div>
  );
}
