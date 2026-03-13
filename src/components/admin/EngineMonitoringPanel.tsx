import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wrench,
  Shield,
  XCircle,
  Clock,
  Info,
} from 'lucide-react';

interface EngineLog {
  id: string;
  log_type: string;
  category: string;
  user_id: string | null;
  script_id: string | null;
  symbol: string | null;
  timeframe: string | null;
  message: string;
  details: Record<string, any>;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

const LOG_TYPE_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  INFO: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Info, label: 'Info' },
  WARN: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', icon: AlertTriangle, label: 'Warning' },
  ERROR: { color: 'bg-destructive/10 text-destructive border-destructive/30', icon: XCircle, label: 'Error' },
  REPAIR: { color: 'bg-green-500/10 text-green-500 border-green-500/30', icon: Wrench, label: 'Repaired' },
};

const CATEGORY_LABELS: Record<string, string> = {
  SIGNAL: 'Signal',
  TRADE_EXECUTION: 'Trade Execution',
  RECONCILE: 'Reconciliation',
  FLIP: 'Position Flip',
  CIRCUIT_BREAKER: 'Circuit Breaker',
  STARTUP: 'Startup',
  STATE_SYNC: 'State Sync',
  API_ERROR: 'API Error',
  AUTO_REPAIR: 'Auto Repair',
};

export default function EngineMonitoringPanel() {
  const [logs, setLogs] = useState<EngineLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    setRefreshing(true);
    try {
      let query = supabase
        .from('engine_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (activeFilter === 'repairs') {
        query = query.eq('log_type', 'REPAIR');
      } else if (activeFilter === 'errors') {
        query = query.in('log_type', ['ERROR', 'WARN']);
      } else if (activeFilter === 'trades') {
        query = query.in('category', ['TRADE_EXECUTION', 'FLIP']);
      } else if (activeFilter === 'monitoring') {
        query = query.in('category', ['CIRCUIT_BREAKER', 'RECONCILE', 'STATE_SYNC']);
      }

      const { data, error } = await query;
      if (!error && data) {
        setLogs(data as unknown as EngineLog[]);
      }
    } catch (e) {
      console.error('Failed to fetch engine logs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeFilter]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('engine-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'engine_logs' }, (payload) => {
        setLogs(prev => [payload.new as unknown as EngineLog, ...prev].slice(0, 200));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = {
    total: logs.length,
    repairs: logs.filter(l => l.log_type === 'REPAIR').length,
    errors: logs.filter(l => l.log_type === 'ERROR').length,
    warnings: logs.filter(l => l.log_type === 'WARN').length,
    trades: logs.filter(l => ['TRADE_EXECUTION', 'FLIP'].includes(l.category)).length,
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const renderLogTypeBadge = (logType: string) => {
    const config = LOG_TYPE_CONFIG[logType] || LOG_TYPE_CONFIG.INFO;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Repairs</CardTitle>
            <Wrench className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.repairs}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.errors}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.warnings}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trades</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trades}</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Engine Monitoring & Logs
              </CardTitle>
              <CardDescription>Live monitoring, auto-repair actions, and error tracking</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={refreshing} className="gap-1">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Logs</TabsTrigger>
              <TabsTrigger value="repairs" className="gap-1">
                <Wrench className="h-3 w-3" /> Repairs
              </TabsTrigger>
              <TabsTrigger value="errors" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> Errors
              </TabsTrigger>
              <TabsTrigger value="trades" className="gap-1">
                <Activity className="h-3 w-3" /> Trades
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="gap-1">
                <Shield className="h-3 w-3" /> Monitoring
              </TabsTrigger>
            </TabsList>

            <div className="overflow-x-auto">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No logs yet</p>
                  <p className="text-sm">Engine logs will appear here as the system runs</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Time</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[130px]">Category</TableHead>
                      <TableHead className="w-[100px]">Symbol</TableHead>
                      <TableHead className="w-[60px]">TF</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="group">
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(log.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>{renderLogTypeBadge(log.log_type)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {CATEGORY_LABELS[log.category] || log.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">
                          {log.symbol || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.timeframe || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm truncate">{log.message}</p>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <details className="mt-1">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  Details
                                </summary>
                                <pre className="text-xs bg-muted/50 p-2 rounded mt-1 overflow-x-auto max-h-32">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.log_type === 'REPAIR' ? (
                            <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-500 border-green-500/30">
                              <CheckCircle2 className="h-3 w-3" />
                              Fixed
                            </Badge>
                          ) : log.resolved ? (
                            <Badge variant="outline" className="gap-1 bg-muted text-muted-foreground">
                              Resolved
                            </Badge>
                          ) : log.log_type === 'ERROR' || log.log_type === 'WARN' ? (
                            <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                              Open
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
