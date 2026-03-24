import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, SeriesMarker, Time } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useSignals } from '@/hooks/useSignals';
import { useTrades } from '@/hooks/useTrades';
import { useTheme } from '@/hooks/useTheme';

interface SignalChartProps {
  symbol?: string;
  timeframe?: string;
  candleType?: string;
  scriptId?: string;
  height?: number;
  className?: string;
}

// Binance kline interval mapping
const TIMEFRAME_TO_INTERVAL: Record<string, string> = {
  '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m',
  '1h': '1h', '2h': '2h', '4h': '4h', '6h': '6h', '8h': '8h',
  '12h': '12h', '1d': '1d', '1w': '1w', '1M': '1M',
};

function convertToHeikinAshi(candles: CandlestickData<Time>[]): CandlestickData<Time>[] {
  if (candles.length === 0) return [];
  const ha: CandlestickData<Time>[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (i === 0) {
      const haClose = (c.open + c.high + c.low + c.close) / 4;
      const haOpen = (c.open + c.close) / 2;
      ha.push({ time: c.time, open: haOpen, high: Math.max(c.high, haOpen, haClose), low: Math.min(c.low, haOpen, haClose), close: haClose });
    } else {
      const prev = ha[i - 1];
      const haClose = (c.open + c.high + c.low + c.close) / 4;
      const haOpen = (prev.open + prev.close) / 2;
      ha.push({ time: c.time, open: haOpen, high: Math.max(c.high, haOpen, haClose), low: Math.min(c.low, haOpen, haClose), close: haClose });
    }
  }
  return ha;
}

export default function SignalChart({ symbol = 'BNBUSDT', timeframe = '5m', candleType = 'regular', scriptId, height = 700, className }: SignalChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { signals } = useSignals();
  const { trades } = useTrades();

  // Filter signals/trades for current symbol
  const relevantSignals = useMemo(() => {
    return signals.filter(s => {
      const match = s.symbol === symbol;
      return scriptId ? match && s.script_id === scriptId : match;
    });
  }, [signals, symbol, scriptId]);

  const relevantTrades = useMemo(() => {
    return trades.filter(t => {
      const match = t.symbol === symbol;
      return scriptId ? match && t.script_id === scriptId : match;
    });
  }, [trades, symbol, scriptId]);

  // Stats
  const buySignals = relevantSignals.filter(s => s.signal_type === 'BUY').length;
  const sellSignals = relevantSignals.filter(s => s.signal_type === 'SELL').length;
  const openTrades = relevantTrades.filter(t => t.status === 'OPEN').length;
  const closedTrades = relevantTrades.filter(t => t.status === 'CLOSED').length;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? 'hsl(222, 47%, 8%)' : 'hsl(0, 0%, 100%)' },
        textColor: isDark ? 'hsl(210, 40%, 75%)' : 'hsl(222, 47%, 25%)',
      },
      grid: {
        vertLines: { color: isDark ? 'hsl(222, 30%, 15%)' : 'hsl(220, 14%, 92%)' },
        horzLines: { color: isDark ? 'hsl(222, 30%, 15%)' : 'hsl(220, 14%, 92%)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: height - 90, // Account for header
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: isDark ? 'hsl(222, 30%, 20%)' : 'hsl(220, 14%, 85%)',
      },
      rightPriceScale: {
        borderColor: isDark ? 'hsl(222, 30%, 20%)' : 'hsl(220, 14%, 85%)',
      },
      crosshair: {
        mode: 0,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    // Fetch candles from Binance Futures
    const interval = TIMEFRAME_TO_INTERVAL[timeframe] || '5m';
    fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=200`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setError('Failed to fetch candle data');
          setLoading(false);
          return;
        }

        let candles: CandlestickData<Time>[] = data.map((k: any[]) => ({
          time: (k[0] / 1000) as Time,
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        }));

        // Convert to Heikin Ashi if needed
        if (candleType === 'heikin_ashi' || candleType === 'heikinashi') {
          candles = convertToHeikinAshi(candles);
        }

        candleSeries.setData(candles);

        // Build markers from signals and trades
        const markers: SeriesMarker<Time>[] = [];

        // Add signal markers
        relevantSignals.forEach(signal => {
          const ts = Math.floor(new Date(signal.candle_timestamp).getTime() / 1000) as Time;
          if (signal.signal_type === 'BUY') {
            markers.push({
              time: ts,
              position: 'belowBar',
              color: '#22c55e',
              shape: 'arrowUp',
              text: `BUY ${signal.price ? '@' + signal.price.toFixed(2) : ''}`,
            });
          } else {
            markers.push({
              time: ts,
              position: 'aboveBar',
              color: '#ef4444',
              shape: 'arrowDown',
              text: `SELL ${signal.price ? '@' + signal.price.toFixed(2) : ''}`,
            });
          }
        });

        // Add trade OPEN/CLOSE markers
        relevantTrades.forEach(trade => {
          if (trade.opened_at && trade.entry_price) {
            const ts = Math.floor(new Date(trade.opened_at).getTime() / 1000) as Time;
            markers.push({
              time: ts,
              position: trade.signal_type === 'BUY' ? 'belowBar' : 'aboveBar',
              color: '#3b82f6',
              shape: 'circle',
              text: `OPEN @${trade.entry_price.toFixed(2)}`,
            });
          }
          if (trade.closed_at && trade.exit_price) {
            const ts = Math.floor(new Date(trade.closed_at).getTime() / 1000) as Time;
            const pnlStr = trade.pnl != null ? ` P&L:${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '';
            markers.push({
              time: ts,
              position: trade.signal_type === 'BUY' ? 'aboveBar' : 'belowBar',
              color: trade.pnl != null && trade.pnl >= 0 ? '#22c55e' : '#f59e0b',
              shape: 'square',
              text: `CLOSE @${trade.exit_price.toFixed(2)}${pnlStr}`,
            });
          }
        });

        // Sort markers by time (required by lightweight-charts)
        markers.sort((a, b) => (a.time as number) - (b.time as number));
        if (markers.length > 0) {
          candleSeries.setMarkers(markers);
        }

        chart.timeScale().fitContent();
        setLoading(false);
      })
      .catch(err => {
        console.error('SignalChart fetch error:', err);
        setError('Failed to load chart data');
        setLoading(false);
      });

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol, timeframe, candleType, theme, relevantSignals, relevantTrades, height]);

  return (
    <Card className={className}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Signal & Trade Markers
            <Badge variant="outline" className="text-[10px]">{symbol}</Badge>
            {(candleType === 'heikin_ashi' || candleType === 'heikinashi') && (
              <Badge variant="secondary" className="text-[10px]">Heikin Ashi</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {buySignals} Buy
            </Badge>
            <Badge variant="outline" className="text-[10px] gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              {sellSignals} Sell
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {openTrades} Open
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {closedTrades} Closed
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        <div ref={chartContainerRef} style={{ height: `${height - 90}px` }} />
      </CardContent>
    </Card>
  );
}
