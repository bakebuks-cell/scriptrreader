import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  BarChart3, 
  History,
  Trophy,
  AlertTriangle
} from 'lucide-react';
import { useScriptAnalytics, ScriptAnalytics } from '@/hooks/useScriptAnalytics';
import ScriptPerformanceCard from './ScriptPerformanceCard';
import { format } from 'date-fns';

export default function ScriptAnalyticsDashboard() {
  const { scriptAnalytics, overallAnalytics, isLoading } = useScriptAnalytics();
  const [selectedScript, setSelectedScript] = useState<ScriptAnalytics | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const displayedScript = selectedScript || (scriptAnalytics.length > 0 ? scriptAnalytics[0] : null);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Scripts</p>
                <p className="text-2xl font-bold">{overallAnalytics.totalScripts}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallAnalytics.activeScripts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{overallAnalytics.totalTrades}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Win Rate</p>
                <p className={`text-2xl font-bold ${overallAnalytics.winRate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                  {overallAnalytics.winRate.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Net P&L</p>
                <p className={`text-2xl font-bold ${overallAnalytics.netPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {overallAnalytics.netPnL >= 0 ? '+' : ''}{overallAnalytics.netPnL.toFixed(2)}
                </p>
              </div>
              {overallAnalytics.netPnL >= 0 
                ? <TrendingUp className="h-8 w-8 text-green-600/50" />
                : <TrendingDown className="h-8 w-8 text-red-500/50" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best/Worst Performers */}
      {(overallAnalytics.bestPerformingScript || overallAnalytics.worstPerformingScript) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overallAnalytics.bestPerformingScript && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-green-600" />
                  Best Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{overallAnalytics.bestPerformingScript.scriptName}</p>
                <p className="text-green-600 text-lg font-bold">
                  +{overallAnalytics.bestPerformingScript.netPnL.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {overallAnalytics.bestPerformingScript.winRate.toFixed(1)}% win rate • 
                  {overallAnalytics.bestPerformingScript.totalTrades} trades
                </p>
              </CardContent>
            </Card>
          )}
          
          {overallAnalytics.worstPerformingScript && overallAnalytics.worstPerformingScript.netPnL < 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{overallAnalytics.worstPerformingScript.scriptName}</p>
                <p className="text-red-500 text-lg font-bold">
                  {overallAnalytics.worstPerformingScript.netPnL.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {overallAnalytics.worstPerformingScript.winRate.toFixed(1)}% win rate • 
                  {overallAnalytics.worstPerformingScript.totalTrades} trades
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {scriptAnalytics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No trading data yet</p>
            <p className="text-sm text-muted-foreground">
              Start trading with your scripts to see performance analytics
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Trade History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Script Cards */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Script Performance</CardTitle>
                    <CardDescription>Click a script to view detailed stats</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scriptAnalytics.map(analytics => (
                        <ScriptPerformanceCard 
                          key={analytics.scriptId}
                          analytics={analytics}
                          selected={displayedScript?.scriptId === analytics.scriptId}
                          onClick={() => setSelectedScript(analytics)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div>
                {displayedScript ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{displayedScript.scriptName}</CardTitle>
                      <CardDescription>Detailed Statistics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Total Trades</p>
                          <p className="font-medium">{displayedScript.totalTrades}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Win Rate</p>
                          <p className={`font-medium ${displayedScript.winRate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                            {displayedScript.winRate.toFixed(1)}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Avg Win</p>
                          <p className="font-medium text-green-600">+{displayedScript.averageProfit.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Avg Loss</p>
                          <p className="font-medium text-red-500">-{displayedScript.averageLoss.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Largest Win</p>
                          <p className="font-medium text-green-600">+{displayedScript.largestWin.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Largest Loss</p>
                          <p className="font-medium text-red-500">-{displayedScript.largestLoss.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Profit Factor</p>
                          <p className="font-medium">
                            {displayedScript.profitFactor === Infinity ? '∞' : displayedScript.profitFactor.toFixed(2)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Net P&L</p>
                          <p className={`font-medium ${displayedScript.netPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {displayedScript.netPnL >= 0 ? '+' : ''}{displayedScript.netPnL.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Trade Breakdown */}
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Trade Breakdown</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {displayedScript.winningTrades} Won
                          </Badge>
                          <Badge variant="outline" className="text-red-500 border-red-500">
                            {displayedScript.losingTrades} Lost
                          </Badge>
                          <Badge variant="outline" className="text-blue-500 border-blue-500">
                            {displayedScript.openTrades} Open
                          </Badge>
                          {displayedScript.failedTrades > 0 && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              {displayedScript.failedTrades} Failed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Select a script to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trade History</CardTitle>
                <CardDescription>
                  {displayedScript 
                    ? `Showing trades for ${displayedScript.scriptName}`
                    : 'All recent trades'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Script</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Entry</TableHead>
                        <TableHead>Exit</TableHead>
                        <TableHead>P&L</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(displayedScript?.trades || scriptAnalytics.flatMap(s => s.trades))
                        .slice(0, 50)
                        .map(trade => {
                          const pnl = trade.entry_price && trade.exit_price
                            ? trade.signal_type === 'BUY' 
                              ? trade.exit_price - trade.entry_price 
                              : trade.entry_price - trade.exit_price
                            : null;
                          
                          return (
                            <TableRow key={trade.id}>
                              <TableCell className="text-xs">
                                {format(new Date(trade.created_at), 'MMM dd, HH:mm')}
                              </TableCell>
                              <TableCell className="text-xs truncate max-w-[100px]">
                                {scriptAnalytics.find(s => s.scriptId === trade.script_id)?.scriptName || '-'}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{trade.symbol}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={trade.signal_type === 'BUY' ? 'default' : 'secondary'}
                                  className={trade.signal_type === 'BUY' ? 'bg-green-600' : 'bg-red-500'}
                                >
                                  {trade.signal_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {trade.entry_price?.toFixed(2) || '-'}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {trade.exit_price?.toFixed(2) || '-'}
                              </TableCell>
                              <TableCell className={`font-mono text-xs ${
                                pnl === null ? '' : pnl >= 0 ? 'text-green-600' : 'text-red-500'
                              }`}>
                                {pnl !== null ? `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {trade.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
