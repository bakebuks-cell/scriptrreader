import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity, Target, DollarSign, BarChart3 } from 'lucide-react';
import { ScriptAnalytics } from '@/hooks/useScriptAnalytics';

interface ScriptPerformanceCardProps {
  analytics: ScriptAnalytics;
  onClick?: () => void;
  selected?: boolean;
}

export default function ScriptPerformanceCard({ 
  analytics, 
  onClick,
  selected = false 
}: ScriptPerformanceCardProps) {
  const isProfit = analytics.netPnL >= 0;
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base truncate flex-1">{analytics.scriptName}</CardTitle>
          <Badge 
            variant={isProfit ? 'default' : 'destructive'}
            className={isProfit ? 'bg-green-600' : ''}
          >
            {isProfit ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isProfit ? '+' : ''}{analytics.netPnL.toFixed(2)}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {analytics.totalTrades} trades • {analytics.closedTrades} closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Win Rate */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Win Rate
            </span>
            <span className={analytics.winRate >= 50 ? 'text-green-600' : 'text-red-500'}>
              {analytics.winRate.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={analytics.winRate} 
            className={`h-1.5 ${analytics.winRate >= 50 ? '[&>div]:bg-green-600' : '[&>div]:bg-red-500'}`}
          />
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-muted-foreground">Won:</span>
            <span className="text-green-600">{analytics.winningTrades}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span className="text-muted-foreground">Lost:</span>
            <span className="text-red-500">{analytics.losingTrades}</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-blue-500" />
            <span className="text-muted-foreground">Open:</span>
            <span>{analytics.openTrades}</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3 text-orange-500" />
            <span className="text-muted-foreground">PF:</span>
            <span>{analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Profit/Loss Summary */}
        <div className="flex justify-between text-xs pt-2 border-t">
          <div>
            <span className="text-muted-foreground">Profit: </span>
            <span className="text-green-600">+{analytics.totalProfit.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Loss: </span>
            <span className="text-red-500">-{analytics.totalLoss.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
