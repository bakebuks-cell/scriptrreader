import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  Users, 
  AlertTriangle,
  AlertOctagon,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Eye,
  Pause,
  Play,
  Ban,
  RefreshCw,
  Search,
  Zap,
  Clock,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle2,
  XCircle,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BotInfo {
  id: string;
  name: string;
  user_id: string;
  user_email?: string;
  is_active: boolean;
  created_at: string;
  exposure?: number;
  pnl?: number;
  volume?: number;
}

interface SystemHealth {
  apiLatency: number;
  dbLatency: number;
  activeBots: number;
  totalVolume: number;
  systemLoad: number;
  memoryUsage: number;
}

interface SuspiciousActivity {
  id: string;
  user_id: string;
  user_email: string;
  type: 'high_frequency' | 'large_exposure' | 'unusual_pattern' | 'api_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
}

export default function AdminMarketMakerControl() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [globalPaused, setGlobalPaused] = useState(false);
  
  // Bots data
  const [bots, setBots] = useState<BotInfo[]>([]);
  
  // Global risk limits
  const [maxExposurePerUser, setMaxExposurePerUser] = useState('10000');
  const [maxLossPerSession, setMaxLossPerSession] = useState('500');
  const [maxDailyVolume, setMaxDailyVolume] = useState('100000');
  const [maxConcurrentBots, setMaxConcurrentBots] = useState('50');
  
  // System health
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    apiLatency: 45,
    dbLatency: 12,
    activeBots: 0,
    totalVolume: 0,
    systemLoad: 35,
    memoryUsage: 62,
  });
  
  // Suspicious activities
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  
  // User logs
  const [userLogs, setUserLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchAllBots();
    // Simulate system health polling
    const interval = setInterval(() => {
      setSystemHealth(prev => ({
        ...prev,
        apiLatency: Math.max(10, Math.min(200, prev.apiLatency + (Math.random() - 0.5) * 20)),
        systemLoad: Math.max(10, Math.min(90, prev.systemLoad + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(30, Math.min(95, prev.memoryUsage + (Math.random() - 0.5) * 5)),
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAllBots = async () => {
    setIsLoading(true);
    try {
      const { data: botsData, error } = await supabase
        .from('market_maker_bots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user emails for each bot
      const botsWithEmails: BotInfo[] = await Promise.all(
        (botsData || []).map(async (bot) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', bot.user_id)
            .maybeSingle();

          return {
            ...bot,
            user_email: profile?.email || 'Unknown',
            exposure: Math.random() * 5000,
            pnl: (Math.random() - 0.4) * 1000,
            volume: Math.random() * 50000,
          };
        })
      );

      setBots(botsWithEmails);
      setSystemHealth(prev => ({
        ...prev,
        activeBots: botsWithEmails.filter(b => b.is_active).length,
        totalVolume: botsWithEmails.reduce((sum, b) => sum + (b.volume || 0), 0),
      }));

      // Generate mock suspicious activities
      if (botsWithEmails.length > 0) {
        generateMockSuspiciousActivities(botsWithEmails);
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Market Maker bots',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockSuspiciousActivities = (botsData: BotInfo[]) => {
    const types: SuspiciousActivity['type'][] = ['high_frequency', 'large_exposure', 'unusual_pattern', 'api_abuse'];
    const severities: SuspiciousActivity['severity'][] = ['low', 'medium', 'high', 'critical'];
    
    const activities: SuspiciousActivity[] = botsData.slice(0, 3).map((bot, index) => ({
      id: `activity-${index}`,
      user_id: bot.user_id,
      user_email: bot.user_email || 'Unknown',
      type: types[index % types.length],
      severity: severities[Math.floor(Math.random() * severities.length)],
      description: getActivityDescription(types[index % types.length]),
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    }));
    
    setSuspiciousActivities(activities);
  };

  const getActivityDescription = (type: SuspiciousActivity['type']): string => {
    switch (type) {
      case 'high_frequency': return 'Unusually high order frequency detected (>100 orders/min)';
      case 'large_exposure': return 'Exposure exceeds 80% of configured limit';
      case 'unusual_pattern': return 'Order pattern suggests potential wash trading';
      case 'api_abuse': return 'API rate limit repeatedly exceeded';
      default: return 'Unknown activity';
    }
  };

  const handleGlobalPause = async () => {
    try {
      // Update all active bots to inactive
      const { error } = await supabase
        .from('market_maker_bots')
        .update({ is_active: false })
        .eq('is_active', true);

      if (error) throw error;

      setGlobalPaused(true);
      setBots(prev => prev.map(b => ({ ...b, is_active: false })));
      
      toast({
        title: 'Global Pause Activated',
        description: 'All Market Maker bots have been paused',
      });
    } catch (error) {
      console.error('Error pausing bots:', error);
      toast({
        title: 'Error',
        description: 'Failed to pause bots',
        variant: 'destructive',
      });
    }
  };

  const handleGlobalResume = async () => {
    setGlobalPaused(false);
    toast({
      title: 'Global Pause Deactivated',
      description: 'Users can now resume their bots',
    });
  };

  const handleForceStopBot = async (botId: string) => {
    try {
      const { error } = await supabase
        .from('market_maker_bots')
        .update({ is_active: false })
        .eq('id', botId);

      if (error) throw error;

      setBots(prev => prev.map(b => 
        b.id === botId ? { ...b, is_active: false } : b
      ));
      
      toast({
        title: 'Bot Stopped',
        description: 'Market Maker bot has been force stopped',
      });
    } catch (error) {
      console.error('Error stopping bot:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop bot',
        variant: 'destructive',
      });
    }
  };

  const filteredBots = bots.filter(bot => 
    bot.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (severity: SuspiciousActivity['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-500/10 text-blue-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'high': return 'bg-orange-500/10 text-orange-500';
      case 'critical': return 'bg-destructive/10 text-destructive';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Emergency Controls */}
      <Card className={globalPaused ? 'border-destructive' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-destructive" />
            Emergency Controls
          </CardTitle>
          <CardDescription>
            Global controls for all Market Maker bots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {globalPaused ? (
              <Button onClick={handleGlobalResume} variant="default" size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                Resume All Bots
              </Button>
            ) : (
              <Button onClick={handleGlobalPause} variant="destructive" size="lg" className="gap-2">
                <Pause className="h-5 w-5" />
                Global Pause (All Bots)
              </Button>
            )}
            <Button variant="outline" size="lg" className="gap-2" onClick={fetchAllBots}>
              <RefreshCw className="h-5 w-5" />
              Refresh Data
            </Button>
          </div>
          
          {globalPaused && (
            <Alert variant="destructive" className="mt-4">
              <AlertOctagon className="h-4 w-4" />
              <AlertTitle>Global Pause Active</AlertTitle>
              <AlertDescription>
                All Market Maker bots are currently paused. Users cannot start new bots.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* System Health Monitor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Wifi className={`h-5 w-5 mx-auto mb-2 ${systemHealth.apiLatency < 100 ? 'text-green-500' : 'text-orange-500'}`} />
              <p className="text-sm text-muted-foreground">API Latency</p>
              <p className="text-xl font-bold">{Math.round(systemHealth.apiLatency)}ms</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <HardDrive className={`h-5 w-5 mx-auto mb-2 ${systemHealth.dbLatency < 50 ? 'text-green-500' : 'text-orange-500'}`} />
              <p className="text-sm text-muted-foreground">DB Latency</p>
              <p className="text-xl font-bold">{Math.round(systemHealth.dbLatency)}ms</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Activity className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Active Bots</p>
              <p className="text-xl font-bold">{systemHealth.activeBots}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-xl font-bold">${(systemHealth.totalVolume / 1000).toFixed(1)}K</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Cpu className={`h-5 w-5 mx-auto mb-2 ${systemHealth.systemLoad < 70 ? 'text-green-500' : 'text-orange-500'}`} />
              <p className="text-sm text-muted-foreground">System Load</p>
              <p className="text-xl font-bold">{Math.round(systemHealth.systemLoad)}%</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Server className={`h-5 w-5 mx-auto mb-2 ${systemHealth.memoryUsage < 80 ? 'text-green-500' : 'text-orange-500'}`} />
              <p className="text-sm text-muted-foreground">Memory</p>
              <p className="text-xl font-bold">{Math.round(systemHealth.memoryUsage)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="bots" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bots" className="gap-2">
            <Activity className="h-4 w-4" />
            All Bots
          </TabsTrigger>
          <TabsTrigger value="exposure" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Exposure
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
            {suspiciousActivities.length > 0 && (
              <Badge variant="destructive" className="ml-1">{suspiciousActivities.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Limits
          </TabsTrigger>
        </TabsList>

        {/* All Bots Tab */}
        <TabsContent value="bots">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Market Maker Bots</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user or bot..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredBots.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No Market Maker bots found</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredBots.map((bot) => (
                      <div
                        key={bot.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${bot.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                          <div>
                            <p className="font-medium">{bot.name}</p>
                            <p className="text-sm text-muted-foreground">{bot.user_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Exposure</p>
                            <p className="font-medium">${bot.exposure?.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">P&L</p>
                            <p className={`font-medium ${(bot.pnl || 0) >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                              ${bot.pnl?.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedUser(bot.user_id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {bot.is_active && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleForceStopBot(bot.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exposure Tab */}
        <TabsContent value="exposure">
          <Card>
            <CardHeader>
              <CardTitle>Per-User Exposure Monitoring</CardTitle>
              <CardDescription>Track real-time exposure across all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bots.map((bot) => (
                  <div key={bot.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{bot.user_email}</span>
                      <span className="text-sm text-muted-foreground">
                        ${bot.exposure?.toFixed(2)} / ${maxExposurePerUser}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          ((bot.exposure || 0) / parseFloat(maxExposurePerUser)) > 0.8
                            ? 'bg-destructive'
                            : ((bot.exposure || 0) / parseFloat(maxExposurePerUser)) > 0.5
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, ((bot.exposure || 0) / parseFloat(maxExposurePerUser)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Activity Detection</CardTitle>
              <CardDescription>Automated monitoring for unusual patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousActivities.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">No suspicious activities detected</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {suspiciousActivities.map((activity) => (
                      <Alert key={activity.id} className={getSeverityColor(activity.severity)}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="flex items-center justify-between">
                          <span>{activity.user_email}</span>
                          <Badge variant="outline" className={getSeverityColor(activity.severity)}>
                            {activity.severity.toUpperCase()}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <p>{activity.description}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Global Risk Limits</CardTitle>
              <CardDescription>Set platform-wide risk parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Max Exposure Per User ($)</Label>
                  <Input
                    type="number"
                    value={maxExposurePerUser}
                    onChange={(e) => setMaxExposurePerUser(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum position exposure per user</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Loss Per Session ($)</Label>
                  <Input
                    type="number"
                    value={maxLossPerSession}
                    onChange={(e) => setMaxLossPerSession(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Auto-pause bot if exceeded</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Daily Volume ($)</Label>
                  <Input
                    type="number"
                    value={maxDailyVolume}
                    onChange={(e) => setMaxDailyVolume(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Platform-wide daily volume cap</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Concurrent Bots</Label>
                  <Input
                    type="number"
                    value={maxConcurrentBots}
                    onChange={(e) => setMaxConcurrentBots(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Maximum active bots allowed</p>
                </div>
              </div>

              <Separator />

              <Button className="w-full">
                Save Global Limits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
