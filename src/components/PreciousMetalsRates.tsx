import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface MetalPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdate: Date;
}

const PRECIOUS_METALS = [
  { symbol: 'PAXGUSDT', name: 'PAX Gold', shortName: 'PAXG', icon: '🥇' },
  { symbol: 'XAUTUSDT', name: 'Tether Gold', shortName: 'XAUT', icon: '🏆' },
];

export default function PreciousMetalsRates({ className }: { className?: string }) {
  const [prices, setPrices] = useState<Record<string, MetalPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchPrices = async () => {
    try {
      setError(null);
      const symbols = PRECIOUS_METALS.map(m => m.symbol).join(',');
      
      // Use edge function to avoid CORS issues
      const { data, error: fetchError } = await supabase.functions.invoke('binance-api', {
        body: null,
        headers: {},
      });

      // Construct URL with query params for GET-like behavior
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/binance-api?action=ticker&symbols=${symbols}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ticker data');
      }

      const tickerData = await response.json();
      const results: Record<string, MetalPrice> = {};

      if (tickerData.tickers) {
        tickerData.tickers.forEach((data: any) => {
          const metal = PRECIOUS_METALS.find(m => m.symbol === data.symbol);
          if (metal && data) {
            results[metal.symbol] = {
              symbol: metal.symbol,
              name: metal.name,
              price: parseFloat(data.lastPrice),
              change24h: parseFloat(data.priceChange),
              changePercent24h: parseFloat(data.priceChangePercent),
              high24h: parseFloat(data.highPrice),
              low24h: parseFloat(data.lowPrice),
              volume24h: parseFloat(data.quoteVolume),
              lastUpdate: new Date(),
            };
          }
        });
      }

      setPrices(results);
      setLastRefresh(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching precious metals rates:', err);
      setError('Failed to fetch prices');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchPrices, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(6);
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(2) + 'K';
    return vol.toFixed(2);
  };

  if (isLoading) {
    return (
      <Card className={cn("dashboard-card", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            🪙 Precious Metals Live Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRECIOUS_METALS.map((metal) => (
              <div key={metal.symbol} className="p-4 rounded-lg bg-muted/50">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("dashboard-card", className)}>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPrices} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("dashboard-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            🪙 Precious Metals Live Rates
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={fetchPrices}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRECIOUS_METALS.map((metal) => {
            const data = prices[metal.symbol];
            if (!data) return null;

            const isPositive = data.changePercent24h > 0;
            const isNeutral = data.changePercent24h === 0;

            return (
              <div 
                key={metal.symbol} 
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{metal.icon}</span>
                    <div>
                      <p className="font-medium">{metal.shortName}</p>
                      <p className="text-xs text-muted-foreground">{metal.name}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={isPositive ? 'default' : isNeutral ? 'secondary' : 'destructive'}
                    className={cn(
                      "gap-1",
                      isPositive && "bg-buy hover:bg-buy/90",
                      !isPositive && !isNeutral && "bg-sell hover:bg-sell/90"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : isNeutral ? (
                      <Minus className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isPositive ? '+' : ''}{data.changePercent24h.toFixed(2)}%
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono">
                      ${formatPrice(data.price)}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      isPositive ? "text-buy" : isNeutral ? "text-muted-foreground" : "text-sell"
                    )}>
                      {isPositive ? '+' : ''}${formatPrice(data.change24h)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">24h High</p>
                      <p className="font-mono text-buy">${formatPrice(data.high24h)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">24h Low</p>
                      <p className="font-mono text-sell">${formatPrice(data.low24h)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Volume</p>
                      <p className="font-mono">${formatVolume(data.volume24h)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Gold-backed tokens on Binance. 1 PAXG/XAUT ≈ 1 troy ounce of gold.
        </p>
      </CardContent>
    </Card>
  );
}
