import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CrosshairMode, LineStyle } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TradingChartProps {
  symbol?: string;
  className?: string;
  showIndicators?: boolean;
}

const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' },
  { value: 'SOLUSDT', label: 'SOL/USDT' },
  { value: 'XRPUSDT', label: 'XRP/USDT' },
  { value: 'ADAUSDT', label: 'ADA/USDT' },
  { value: 'DOGEUSDT', label: 'DOGE/USDT' },
];

const INTERVALS = [
  { value: '1m', label: '1m', binanceValue: '1m' },
  { value: '5m', label: '5m', binanceValue: '5m' },
  { value: '15m', label: '15m', binanceValue: '15m' },
  { value: '30m', label: '30m', binanceValue: '30m' },
  { value: '1h', label: '1H', binanceValue: '1h' },
  { value: '4h', label: '4H', binanceValue: '4h' },
  { value: '1d', label: '1D', binanceValue: '1d' },
  { value: '1w', label: '1W', binanceValue: '1w' },
];

export default function TradingChart({ 
  symbol: defaultSymbol = 'BTCUSDT', 
  className,
  showIndicators = true 
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [symbol, setSymbol] = useState(defaultSymbol);
  const [interval, setInterval] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [highPrice, setHighPrice] = useState<number>(0);
  const [lowPrice, setLowPrice] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  // Calculate EMA
  const calculateEMA = (data: number[], period: number): number[] => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for the first EMA value
    let sum = 0;
    for (let i = 0; i < period && i < data.length; i++) {
      sum += data[i];
    }
    ema.push(sum / Math.min(period, data.length));
    
    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
      ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
    }
    
    return ema;
  };

  // Format price based on value
  const formatPrice = (price: number): string => {
    if (price >= 10000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (price >= 100) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(6);
  };

  // Format volume
  const formatVolume = (vol: number): string => {
    if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(2) + 'K';
    return vol.toFixed(2);
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = document.documentElement.classList.contains('dark');
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? '#a1a1aa' : '#52525b',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          style: LineStyle.Dashed,
          labelBackgroundColor: isDark ? '#27272a' : '#f4f4f5',
        },
        horzLine: {
          width: 1,
          color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          style: LineStyle.Dashed,
          labelBackgroundColor: isDark ? '#27272a' : '#f4f4f5',
        },
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#60a5fa',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Add EMA lines if indicators enabled
    if (showIndicators) {
      const ema20Series = chart.addLineSeries({
        color: '#fbbf24',
        lineWidth: 1,
        title: 'EMA 20',
      });
      ema20SeriesRef.current = ema20Series;

      const ema50Series = chart.addLineSeries({
        color: '#a855f7',
        lineWidth: 1,
        title: 'EMA 50',
      });
      ema50SeriesRef.current = ema50Series;
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Theme observer
    const observer = new MutationObserver(() => {
      const isDarkNow = document.documentElement.classList.contains('dark');
      if (chartRef.current) {
        chartRef.current.applyOptions({
          layout: {
            textColor: isDarkNow ? '#a1a1aa' : '#52525b',
          },
          grid: {
            vertLines: { color: isDarkNow ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
            horzLines: { color: isDarkNow ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
          },
        });
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      chart.remove();
    };
  }, [showIndicators]);

  // Fetch and update data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`
      );
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      
      const candleData: CandlestickData<Time>[] = data.map((k: any) => ({
        time: (k[0] / 1000) as Time,
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
      }));

      const volumeData = data.map((k: any) => ({
        time: (k[0] / 1000) as Time,
        value: parseFloat(k[5]),
        color: parseFloat(k[4]) >= parseFloat(k[1]) 
          ? 'rgba(34, 197, 94, 0.3)' 
          : 'rgba(239, 68, 68, 0.3)',
      }));

      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(candleData);
      }

      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(volumeData);
      }

      // Calculate and set EMAs
      if (showIndicators && candleData.length > 0) {
        const closes = candleData.map(c => c.close);
        
        const ema20Values = calculateEMA(closes, 20);
        const ema50Values = calculateEMA(closes, 50);
        
        if (ema20SeriesRef.current) {
          const ema20Data = ema20Values.map((value, i) => ({
            time: candleData[i + 20 - 1]?.time || candleData[candleData.length - 1].time,
            value,
          })).filter((_, i) => i < candleData.length - 19);
          ema20SeriesRef.current.setData(ema20Data as any);
        }

        if (ema50SeriesRef.current) {
          const ema50Data = ema50Values.map((value, i) => ({
            time: candleData[i + 50 - 1]?.time || candleData[candleData.length - 1].time,
            value,
          })).filter((_, i) => i < candleData.length - 49);
          ema50SeriesRef.current.setData(ema50Data as any);
        }
      }

      // Update stats
      if (candleData.length > 0) {
        const latest = candleData[candleData.length - 1];
        const first = candleData[0];
        setCurrentPrice(latest.close);
        setPriceChange(((latest.close - first.open) / first.open) * 100);
        setHighPrice(Math.max(...candleData.map(c => c.high)));
        setLowPrice(Math.min(...candleData.map(c => c.low)));
        setVolume24h(data.reduce((sum: number, k: any) => sum + parseFloat(k[5]) * parseFloat(k[4]), 0));
      }

      // Fit content
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }

    } catch (error: any) {
      toast({
        title: 'Error fetching data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [symbol, interval, showIndicators, toast]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    fetchData();

    // Close existing WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.k && candlestickSeriesRef.current) {
        const kline = data.k;
        const candle: CandlestickData<Time> = {
          time: (kline.t / 1000) as Time,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };
        
        candlestickSeriesRef.current.update(candle);
        setCurrentPrice(candle.close);

        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: candle.time,
            value: parseFloat(kline.v),
            color: candle.close >= candle.open 
              ? 'rgba(34, 197, 94, 0.3)' 
              : 'rgba(239, 68, 68, 0.3)',
          });
        }
      }
    };

    ws.onerror = () => {
      console.error('WebSocket error');
    };

    return () => {
      ws.close();
    };
  }, [symbol, interval, fetchData]);

  // Zoom controls
  const handleZoomIn = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const logicalRange = timeScale.getVisibleLogicalRange();
      if (logicalRange) {
        const newRange = {
          from: logicalRange.from + (logicalRange.to - logicalRange.from) * 0.1,
          to: logicalRange.to - (logicalRange.to - logicalRange.from) * 0.1,
        };
        timeScale.setVisibleLogicalRange(newRange);
      }
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const logicalRange = timeScale.getVisibleLogicalRange();
      if (logicalRange) {
        const newRange = {
          from: logicalRange.from - (logicalRange.to - logicalRange.from) * 0.2,
          to: logicalRange.to + (logicalRange.to - logicalRange.from) * 0.2,
        };
        timeScale.setVisibleLogicalRange(newRange);
      }
    }
  };

  const handleFitContent = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const selectedSymbol = SYMBOLS.find(s => s.value === symbol);

  return (
    <Card className={cn("overflow-hidden", className, isFullscreen && "fixed inset-4 z-50")}>
      <CardHeader className="pb-2 border-b border-border">
        {/* Header Row 1: Symbol & Price */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{selectedSymbol?.label || symbol}</CardTitle>
            </div>
            
            {currentPrice && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono">${formatPrice(currentPrice)}</span>
                <Badge 
                  variant={priceChange >= 0 ? 'default' : 'destructive'}
                  className="gap-1"
                >
                  {priceChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex border rounded-md overflow-hidden">
              {INTERVALS.slice(0, 5).map(i => (
                <button
                  key={i.value}
                  onClick={() => setInterval(i.value)}
                  className={cn(
                    "px-2 py-1 text-xs font-medium transition-colors",
                    interval === i.value 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  {i.label}
                </button>
              ))}
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger className="w-[60px] border-0 rounded-none">
                  <SelectValue placeholder="..." />
                </SelectTrigger>
                <SelectContent>
                  {INTERVALS.map(i => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Header Row 2: Stats & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>H: <span className="text-buy font-mono">{formatPrice(highPrice)}</span></span>
            <span>L: <span className="text-sell font-mono">{formatPrice(lowPrice)}</span></span>
            <span>Vol: <span className="font-mono">${formatVolume(volume24h)}</span></span>
            {showIndicators && (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  EMA 20
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  EMA 50
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFitContent}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">Loading chart...</span>
            </div>
          </div>
        )}
        <div 
          ref={chartContainerRef} 
          className={cn(
            "w-full",
            isFullscreen ? "h-[calc(100vh-12rem)]" : "h-[400px] sm:h-[500px]"
          )}
        />
      </CardContent>
    </Card>
  );
}
