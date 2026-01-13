import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Activity, Target, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradeSignal {
  action: 'BUY' | 'SELL' | 'CLOSE' | 'NONE';
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
}

interface IndicatorData {
  ema9: number[];
  ema21: number[];
  rsi: number[];
  macd: { macd: number[]; signal: number[] };
}

interface SignalPreviewProps {
  signal: TradeSignal;
  currentPrice: number;
  indicators: IndicatorData;
  symbol: string;
  isLoading?: boolean;
}

export default function SignalPreview({ 
  signal, 
  currentPrice, 
  indicators, 
  symbol,
  isLoading 
}: SignalPreviewProps) {
  const getSignalColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'text-green-500';
      case 'SELL': return 'text-red-500';
      case 'CLOSE': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getSignalBg = (action: string) => {
    switch (action) {
      case 'BUY': return 'bg-green-500/10 border-green-500/30';
      case 'SELL': return 'bg-red-500/10 border-red-500/30';
      case 'CLOSE': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-muted/50 border-border';
    }
  };

  const getSignalIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <TrendingUp className="h-8 w-8 text-green-500" />;
      case 'SELL': return <TrendingDown className="h-8 w-8 text-red-500" />;
      case 'CLOSE': return <AlertCircle className="h-8 w-8 text-yellow-500" />;
      default: return <Minus className="h-8 w-8 text-muted-foreground" />;
    }
  };

  // Get latest indicator values
  const latestEma9 = indicators.ema9?.[indicators.ema9.length - 1];
  const latestEma21 = indicators.ema21?.[indicators.ema21.length - 1];
  const latestRsi = indicators.rsi?.[indicators.rsi.length - 1];
  const latestMacd = indicators.macd?.macd?.[indicators.macd.macd.length - 1];
  const latestMacdSignal = indicators.macd?.signal?.[indicators.macd.signal.length - 1];

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Signal Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-24 bg-muted rounded-lg" />
          <div className="h-20 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="pb-3 bg-accent/30">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Live Signal Preview
          <Badge variant="outline" className="ml-auto">{symbol}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Main Signal Display */}
        <div className={cn(
          "p-4 rounded-xl border-2 flex items-center gap-4",
          getSignalBg(signal.action)
        )}>
          <div className="p-3 rounded-full bg-background/50">
            {getSignalIcon(signal.action)}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className={cn("text-2xl font-bold", getSignalColor(signal.action))}>
                {signal.action === 'NONE' ? 'NO SIGNAL' : signal.action}
              </span>
              {signal.action !== 'NONE' && (
                <span className="text-lg text-muted-foreground">
                  @ ${signal.price.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{signal.reason}</p>
          </div>
        </div>

        {/* Price & Levels */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-accent/30 text-center">
            <p className="text-xs text-muted-foreground mb-1">Current Price</p>
            <p className="font-mono font-semibold">${currentPrice.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ShieldAlert className="h-3 w-3 text-red-500" />
              <p className="text-xs text-muted-foreground">Stop Loss</p>
            </div>
            <p className="font-mono font-semibold text-red-500">
              {signal.stopLoss ? `$${signal.stopLoss.toFixed(2)}` : '—'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-3 w-3 text-green-500" />
              <p className="text-xs text-muted-foreground">Take Profit</p>
            </div>
            <p className="font-mono font-semibold text-green-500">
              {signal.takeProfit ? `$${signal.takeProfit.toFixed(2)}` : '—'}
            </p>
          </div>
        </div>

        {/* Indicators */}
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">INDICATORS</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between p-2 rounded bg-accent/20">
              <span className="text-muted-foreground">EMA 9</span>
              <span className="font-mono">{latestEma9?.toFixed(2) || '—'}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-accent/20">
              <span className="text-muted-foreground">EMA 21</span>
              <span className="font-mono">{latestEma21?.toFixed(2) || '—'}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-accent/20">
              <span className="text-muted-foreground">RSI</span>
              <span className={cn(
                "font-mono",
                latestRsi > 70 ? "text-red-500" : latestRsi < 30 ? "text-green-500" : ""
              )}>
                {latestRsi?.toFixed(1) || '—'}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-accent/20">
              <span className="text-muted-foreground">MACD</span>
              <span className={cn(
                "font-mono",
                latestMacd > latestMacdSignal ? "text-green-500" : "text-red-500"
              )}>
                {latestMacd?.toFixed(2) || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Risk/Reward Calculation */}
        {signal.action !== 'NONE' && signal.stopLoss && signal.takeProfit && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Risk/Reward Ratio</span>
              <Badge variant="secondary" className="font-mono">
                1:{((Math.abs(signal.takeProfit - signal.price) / Math.abs(signal.price - signal.stopLoss))).toFixed(1)}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
