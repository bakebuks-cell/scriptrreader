import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  PieChart,
  Activity,
  BarChart3,
  Clock,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  PerformanceDashboardData, 
  PairExposure, 
  PnLMetrics, 
  InventoryMetrics,
  SessionPerformance,
  PairPerformance 
} from '@/types/market-maker-advanced';

interface PerformanceDashboardProps {
  botId: string;
}

// Mock data generator for demo purposes
const generateMockData = (): PerformanceDashboardData => ({
  exposures: [
    { symbol: 'BTCUSDT', baseBalance: 0.5, quoteBalance: 15000, netExposure: 15000, exposurePercent: 50, direction: 'long' },
    { symbol: 'ETHUSDT', baseBalance: 5, quoteBalance: 8000, netExposure: -2000, exposurePercent: -25, direction: 'short' },
    { symbol: 'BNBUSDT', baseBalance: 20, quoteBalance: 6000, netExposure: 1000, exposurePercent: 15, direction: 'long' },
  ],
  pnl: {
    floatingPnL: 245.67,
    realizedPnL: 1234.56,
    totalPnL: 1480.23,
    totalFees: 89.45,
    netPnL: 1390.78,
    slippageImpact: -23.40,
    avgSlippagePercent: 0.12,
  },
  inventory: {
    currentRatio: 0.55,
    targetRatio: 0.50,
    imbalance: 0.05,
    imbalancePercent: 10,
    baseValue: 30000,
    quoteValue: 29000,
    totalValue: 59000,
  },
  sessions: [
    { sessionId: '1', startTime: new Date(Date.now() - 3600000).toISOString(), tradesCount: 45, winRate: 62, pnl: 456.78, fees: 23.45, volume: 25000, avgTradeSize: 555.56, maxDrawdown: 2.5, sharpeRatio: 1.8 },
    { sessionId: '2', startTime: new Date(Date.now() - 7200000).toISOString(), endTime: new Date(Date.now() - 3600000).toISOString(), tradesCount: 38, winRate: 58, pnl: 234.56, fees: 18.90, volume: 18000, avgTradeSize: 473.68, maxDrawdown: 3.2, sharpeRatio: 1.4 },
  ],
  pairPerformance: [
    { symbol: 'BTCUSDT', tradesCount: 28, buyVolume: 12000, sellVolume: 11500, pnl: 567.89, fees: 34.56, avgSpread: 0.08, winRate: 64, profitFactor: 1.8 },
    { symbol: 'ETHUSDT', tradesCount: 22, buyVolume: 8000, sellVolume: 7800, pnl: 345.67, fees: 21.34, avgSpread: 0.12, winRate: 59, profitFactor: 1.5 },
    { symbol: 'BNBUSDT', tradesCount: 15, buyVolume: 4500, sellVolume: 4200, pnl: 178.90, fees: 11.23, avgSpread: 0.15, winRate: 53, profitFactor: 1.2 },
  ],
  lastUpdated: new Date().toISOString(),
});

export function PerformanceDashboard({ botId }: PerformanceDashboardProps) {
  const [data, setData] = useState<PerformanceDashboardData>(generateMockData());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateMockData());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setData(generateMockData());
      setIsRefreshing(false);
    }, 500);
  };

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  };

  const getDirectionIcon = (direction: 'long' | 'short' | 'neutral') => {
    switch (direction) {
      case 'long': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'short': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Performance Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(data.lastUpdated).toLocaleTimeString()}
            </Badge>
            <button 
              onClick={handleRefresh}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickStat
            label="Net P&L"
            value={formatCurrency(data.pnl.netPnL)}
            subValue={`Fees: $${data.pnl.totalFees.toFixed(2)}`}
            positive={data.pnl.netPnL >= 0}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <QuickStat
            label="Floating P&L"
            value={formatCurrency(data.pnl.floatingPnL)}
            subValue="Unrealized"
            positive={data.pnl.floatingPnL >= 0}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <QuickStat
            label="Inventory"
            value={formatPercent(data.inventory.imbalancePercent)}
            subValue={`Target: ${(data.inventory.targetRatio * 100).toFixed(0)}%`}
            positive={Math.abs(data.inventory.imbalancePercent) < 15}
            icon={<PieChart className="h-4 w-4" />}
          />
          <QuickStat
            label="Total Value"
            value={`$${data.inventory.totalValue.toLocaleString()}`}
            subValue="Portfolio"
            positive={true}
            icon={<BarChart3 className="h-4 w-4" />}
          />
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="exposure" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="exposure" className="text-xs sm:text-sm py-2">Exposure</TabsTrigger>
            <TabsTrigger value="pnl" className="text-xs sm:text-sm py-2">P&L</TabsTrigger>
            <TabsTrigger value="sessions" className="text-xs sm:text-sm py-2">Sessions</TabsTrigger>
            <TabsTrigger value="pairs" className="text-xs sm:text-sm py-2">Pairs</TabsTrigger>
          </TabsList>

          <TabsContent value="exposure" className="mt-4">
            <ExposureTable exposures={data.exposures} getDirectionIcon={getDirectionIcon} formatCurrency={formatCurrency} />
          </TabsContent>

          <TabsContent value="pnl" className="mt-4">
            <PnLBreakdown pnl={data.pnl} formatCurrency={formatCurrency} />
          </TabsContent>

          <TabsContent value="sessions" className="mt-4">
            <SessionsTable sessions={data.sessions} formatCurrency={formatCurrency} />
          </TabsContent>

          <TabsContent value="pairs" className="mt-4">
            <PairPerformanceTable pairs={data.pairPerformance} formatCurrency={formatCurrency} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Sub-components
function QuickStat({ label, value, subValue, positive, icon }: {
  label: string;
  value: string;
  subValue: string;
  positive: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={cn("text-lg font-bold", positive ? "text-green-500" : "text-red-500")}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{subValue}</p>
    </div>
  );
}

function ExposureTable({ exposures, getDirectionIcon, formatCurrency }: {
  exposures: PairExposure[];
  getDirectionIcon: (direction: 'long' | 'short' | 'neutral') => React.ReactNode;
  formatCurrency: (value: number) => string;
}) {
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {exposures.map((exp) => (
          <div key={exp.symbol} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              {getDirectionIcon(exp.direction)}
              <div>
                <p className="font-medium">{exp.symbol}</p>
                <p className="text-xs text-muted-foreground">
                  Base: {exp.baseBalance} | Quote: ${exp.quoteBalance.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn("font-semibold", exp.netExposure >= 0 ? "text-green-500" : "text-red-500")}>
                {formatCurrency(exp.netExposure)}
              </p>
              <p className="text-xs text-muted-foreground">{exp.exposurePercent}% exposure</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function PnLBreakdown({ pnl, formatCurrency }: {
  pnl: PnLMetrics;
  formatCurrency: (value: number) => string;
}) {
  const items = [
    { label: 'Realized P&L', value: pnl.realizedPnL },
    { label: 'Floating P&L', value: pnl.floatingPnL },
    { label: 'Total Fees', value: -pnl.totalFees },
    { label: 'Slippage Impact', value: pnl.slippageImpact },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{item.label}</span>
          <span className={cn("font-medium", item.value >= 0 ? "text-green-500" : "text-red-500")}>
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
      <div className="border-t border-border pt-3 flex items-center justify-between">
        <span className="font-semibold">Net P&L</span>
        <span className={cn("font-bold text-lg", pnl.netPnL >= 0 ? "text-green-500" : "text-red-500")}>
          {formatCurrency(pnl.netPnL)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        Avg Slippage: {pnl.avgSlippagePercent.toFixed(3)}%
      </div>
    </div>
  );
}

function SessionsTable({ sessions, formatCurrency }: {
  sessions: SessionPerformance[];
  formatCurrency: (value: number) => string;
}) {
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {sessions.map((session) => (
          <div key={session.sessionId} className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {new Date(session.startTime).toLocaleString()}
              </span>
              <Badge variant={session.pnl >= 0 ? 'default' : 'destructive'}>
                {formatCurrency(session.pnl)}
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div>Trades: {session.tradesCount}</div>
              <div>Win: {session.winRate}%</div>
              <div>Vol: ${(session.volume / 1000).toFixed(1)}k</div>
              <div>DD: {session.maxDrawdown}%</div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function PairPerformanceTable({ pairs, formatCurrency }: {
  pairs: PairPerformance[];
  formatCurrency: (value: number) => string;
}) {
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {pairs.map((pair) => (
          <div key={pair.symbol} className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{pair.symbol}</span>
              <span className={cn("font-semibold", pair.pnl >= 0 ? "text-green-500" : "text-red-500")}>
                {formatCurrency(pair.pnl)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div>Trades: {pair.tradesCount}</div>
              <div>Win: {pair.winRate}%</div>
              <div>Spread: {pair.avgSpread}%</div>
              <div>PF: {pair.profitFactor.toFixed(2)}</div>
            </div>
            <Progress value={pair.winRate} className="h-1 mt-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
