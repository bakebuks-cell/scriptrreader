import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  symbol?: string;
  className?: string;
}

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];
const INTERVALS = [
  { value: '1m', label: '1M' },
  { value: '5m', label: '5M' },
  { value: '15m', label: '15M' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
];

export default function CandlestickChart({ symbol: defaultSymbol = 'BTCUSDT', className }: CandlestickChartProps) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [selectedInterval, setSelectedInterval] = useState('1h');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const { toast } = useToast();

  const fetchCandles = async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/binance-api?action=klines&symbol=${symbol}&interval=${selectedInterval}&limit=50`
      );
      
      if (!response.ok) throw new Error('Failed to fetch candles');
      
      const { klines: data } = await response.json();
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data received');
      }
      
      const parsedCandles: Candle[] = data.map((k: any) => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));
      
      setCandles(parsedCandles);
      
      if (parsedCandles.length > 0) {
        const latest = parsedCandles[parsedCandles.length - 1];
        const first = parsedCandles[0];
        setCurrentPrice(latest.close);
        setPriceChange(((latest.close - first.open) / first.open) * 100);
      }
    } catch (error: any) {
      console.error('Candle fetch error:', error);
      toast({
        title: 'Error fetching data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandles();
    
    // Poll for updates every 30 seconds instead of WebSocket
    const pollInterval = setInterval(() => {
      fetchCandles();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [symbol, selectedInterval]);

  // Calculate chart dimensions and scaling
  const chartData = useMemo(() => {
    if (candles.length === 0) return null;

    const minPrice = Math.min(...candles.map(c => c.low));
    const maxPrice = Math.max(...candles.map(c => c.high));
    const priceRange = maxPrice - minPrice || 1;
    const padding = priceRange * 0.1;
    
    return {
      candles,
      minPrice: minPrice - padding,
      maxPrice: maxPrice + padding,
      priceRange: priceRange + padding * 2,
    };
  }, [candles]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(6);
  };

  if (isLoading && candles.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Price Chart
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {currentPrice && (
                  <>
                    <span className="text-2xl font-bold">${formatPrice(currentPrice)}</span>
                    <Badge 
                      variant={priceChange >= 0 ? 'default' : 'destructive'}
                      className="gap-1"
                    >
                      {priceChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedInterval} onValueChange={setSelectedInterval}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map(i => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={fetchCandles}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {chartData ? (
          <div className="relative h-64 w-full bg-muted/20 rounded-lg overflow-hidden">
            {/* Price labels */}
            <div className="absolute right-0 top-0 h-full w-16 flex flex-col justify-between py-2 pr-2 text-xs text-muted-foreground">
              <span>${formatPrice(chartData.maxPrice)}</span>
              <span>${formatPrice((chartData.maxPrice + chartData.minPrice) / 2)}</span>
              <span>${formatPrice(chartData.minPrice)}</span>
            </div>
            
            {/* Chart area */}
            <svg 
              className="w-[calc(100%-4rem)] h-full" 
              viewBox={`0 0 ${chartData.candles.length * 12} 256`}
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <g stroke="currentColor" strokeOpacity="0.1">
                <line x1="0" y1="64" x2={chartData.candles.length * 12} y2="64" />
                <line x1="0" y1="128" x2={chartData.candles.length * 12} y2="128" />
                <line x1="0" y1="192" x2={chartData.candles.length * 12} y2="192" />
              </g>
              
              {/* Candles */}
              {chartData.candles.map((candle, i) => {
                const x = i * 12 + 6;
                const candleWidth = 8;
                const wickWidth = 1;
                
                const yHigh = ((chartData.maxPrice - candle.high) / chartData.priceRange) * 256;
                const yLow = ((chartData.maxPrice - candle.low) / chartData.priceRange) * 256;
                const yOpen = ((chartData.maxPrice - candle.open) / chartData.priceRange) * 256;
                const yClose = ((chartData.maxPrice - candle.close) / chartData.priceRange) * 256;
                
                const isBullish = candle.close >= candle.open;
                const color = isBullish ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-5))';
                
                const bodyTop = Math.min(yOpen, yClose);
                const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1);
                
                return (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={yHigh}
                      x2={x}
                      y2={yLow}
                      stroke={color}
                      strokeWidth={wickWidth}
                    />
                    {/* Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={isBullish ? color : color}
                      stroke={color}
                      strokeWidth={0.5}
                    />
                  </g>
                );
              })}
            </svg>
            
            {/* Current price line */}
            {currentPrice && (
              <div 
                className="absolute left-0 right-16 h-px bg-primary/50"
                style={{
                  top: `${((chartData.maxPrice - currentPrice) / chartData.priceRange) * 100}%`
                }}
              >
                <span className="absolute right-0 -translate-y-1/2 bg-primary text-primary-foreground text-xs px-1 rounded">
                  ${formatPrice(currentPrice)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
        
        {/* Volume indicator */}
        {chartData && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              24h Vol: {candles.length > 0 
                ? (candles.reduce((sum, c) => sum + c.volume, 0) / 1e6).toFixed(2) + 'M'
                : '-'
              }
            </span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--chart-1))' }} />
                Bullish
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: 'hsl(var(--chart-5))' }} />
                Bearish
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
