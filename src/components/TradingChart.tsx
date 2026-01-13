import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CrosshairMode, LineStyle, LineWidth } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  BarChart3,
  Settings2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiOverboughtRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiOversoldRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const signalLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const histogramRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const candleDataRef = useRef<CandlestickData<Time>[]>([]);

  const [symbol, setSymbol] = useState(defaultSymbol);
  const [interval, setInterval] = useState('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [highPrice, setHighPrice] = useState<number>(0);
  const [lowPrice, setLowPrice] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Indicator toggles
  const [showEMA, setShowEMA] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  
  // Current indicator values
  const [currentRSI, setCurrentRSI] = useState<number | null>(null);
  const [currentMACD, setCurrentMACD] = useState<{ macd: number; signal: number; histogram: number } | null>(null);
  
  const { toast } = useToast();

  // Calculate EMA
  const calculateEMA = (data: number[], period: number): number[] => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    let sum = 0;
    for (let i = 0; i < period && i < data.length; i++) {
      sum += data[i];
    }
    ema.push(sum / Math.min(period, data.length));
    
    for (let i = period; i < data.length; i++) {
      ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
    }
    
    return ema;
  };

  // Calculate RSI
  const calculateRSI = (closes: number[], period: number = 14): number[] => {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // First RSI value using SMA
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = 0; i < period; i++) {
      rsi.push(50); // Placeholder for initial values
    }

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    // Subsequent RSI values using EMA
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  };

  // Calculate MACD
  const calculateMACD = (closes: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
    const emaFast = calculateEMA(closes, fastPeriod);
    const emaSlow = calculateEMA(closes, slowPeriod);
    
    // Align arrays
    const startIndex = slowPeriod - fastPeriod;
    const macdLine: number[] = [];
    
    for (let i = 0; i < emaSlow.length; i++) {
      const fastIndex = i + startIndex;
      if (fastIndex >= 0 && fastIndex < emaFast.length) {
        macdLine.push(emaFast[fastIndex] - emaSlow[i]);
      }
    }
    
    const signalLine = calculateEMA(macdLine, signalPeriod);
    
    // Align signal line with MACD line
    const histogram: number[] = [];
    const signalStartIndex = signalPeriod - 1;
    
    for (let i = signalStartIndex; i < macdLine.length; i++) {
      const signalIndex = i - signalStartIndex;
      if (signalIndex < signalLine.length) {
        histogram.push(macdLine[i] - signalLine[signalIndex]);
      }
    }
    
    return { macdLine, signalLine, histogram };
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

  // Create chart options
  const getChartOptions = (isDark: boolean) => ({
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
        width: 1 as LineWidth,
        color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        style: LineStyle.Dashed,
        labelBackgroundColor: isDark ? '#27272a' : '#f4f4f5',
      },
      horzLine: {
        width: 1 as LineWidth,
        color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        style: LineStyle.Dashed,
        labelBackgroundColor: isDark ? '#27272a' : '#f4f4f5',
      },
    },
    rightPriceScale: {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    timeScale: {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      timeVisible: true,
      secondsVisible: false,
    },
    handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
    handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
  });

  // Sync chart timescales
  const syncTimeScales = useCallback(() => {
    const charts = [chartRef.current, rsiChartRef.current, macdChartRef.current].filter(Boolean) as IChartApi[];
    
    if (charts.length < 2) return;

    charts.forEach((chart, index) => {
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) {
          charts.forEach((otherChart, otherIndex) => {
            if (index !== otherIndex) {
              otherChart.timeScale().setVisibleLogicalRange(range);
            }
          });
        }
      });
    });
  }, []);

  // Initialize main chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = document.documentElement.classList.contains('dark');
    
    const chart = createChart(chartContainerRef.current, {
      ...getChartOptions(isDark),
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
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

    // Add EMA lines
    if (showIndicators && showEMA) {
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
          layout: { textColor: isDarkNow ? '#a1a1aa' : '#52525b' },
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
  }, [showIndicators, showEMA]);

  // Initialize RSI chart
  useEffect(() => {
    if (!rsiContainerRef.current || !showIndicators || !showRSI) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    
    const rsiChart = createChart(rsiContainerRef.current, {
      ...getChartOptions(isDark),
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        visible: false,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
    });

    rsiChartRef.current = rsiChart;

    // RSI line
    const rsiSeries = rsiChart.addLineSeries({
      color: '#8b5cf6',
      lineWidth: 2,
      title: 'RSI',
      priceFormat: { type: 'custom', formatter: (price: number) => price.toFixed(1) },
    });
    rsiSeriesRef.current = rsiSeries;

    // Overbought line (70)
    const overboughtSeries = rsiChart.addLineSeries({
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });
    rsiOverboughtRef.current = overboughtSeries;

    // Oversold line (30)
    const oversoldSeries = rsiChart.addLineSeries({
      color: '#22c55e',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });
    rsiOversoldRef.current = oversoldSeries;

    // Handle resize
    const handleResize = () => {
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({
          width: rsiContainerRef.current.clientWidth,
          height: rsiContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    syncTimeScales();

    return () => {
      window.removeEventListener('resize', handleResize);
      rsiChart.remove();
    };
  }, [showIndicators, showRSI, syncTimeScales]);

  // Initialize MACD chart
  useEffect(() => {
    if (!macdContainerRef.current || !showIndicators || !showMACD) {
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    
    const macdChart = createChart(macdContainerRef.current, {
      ...getChartOptions(isDark),
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        visible: true,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    macdChartRef.current = macdChart;

    // MACD histogram
    const histogram = macdChart.addHistogramSeries({
      color: '#60a5fa',
      priceFormat: { type: 'custom', formatter: (price: number) => price.toFixed(4) },
    });
    histogramRef.current = histogram;

    // MACD line
    const macdLine = macdChart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
      title: 'MACD',
    });
    macdLineRef.current = macdLine;

    // Signal line
    const signalLine = macdChart.addLineSeries({
      color: '#f97316',
      lineWidth: 2,
      title: 'Signal',
    });
    signalLineRef.current = signalLine;

    // Handle resize
    const handleResize = () => {
      if (macdContainerRef.current && macdChartRef.current) {
        macdChartRef.current.applyOptions({
          width: macdContainerRef.current.clientWidth,
          height: macdContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    syncTimeScales();

    return () => {
      window.removeEventListener('resize', handleResize);
      macdChart.remove();
    };
  }, [showIndicators, showMACD, syncTimeScales]);

  // Update indicator data
  const updateIndicators = useCallback((candleData: CandlestickData<Time>[]) => {
    if (candleData.length < 50) return;

    const closes = candleData.map(c => c.close);

    // Calculate and set EMAs
    if (showIndicators && showEMA && ema20SeriesRef.current && ema50SeriesRef.current) {
      const ema20Values = calculateEMA(closes, 20);
      const ema50Values = calculateEMA(closes, 50);
      
      const ema20Data = ema20Values.map((value, i) => ({
        time: candleData[i + 19]?.time || candleData[candleData.length - 1].time,
        value,
      })).filter((_, i) => i < candleData.length - 19);
      
      const ema50Data = ema50Values.map((value, i) => ({
        time: candleData[i + 49]?.time || candleData[candleData.length - 1].time,
        value,
      })).filter((_, i) => i < candleData.length - 49);
      
      ema20SeriesRef.current.setData(ema20Data as any);
      ema50SeriesRef.current.setData(ema50Data as any);
    }

    // Calculate and set RSI
    if (showIndicators && showRSI && rsiSeriesRef.current && rsiOverboughtRef.current && rsiOversoldRef.current) {
      const rsiValues = calculateRSI(closes, 14);
      
      const rsiData = rsiValues.map((value, i) => ({
        time: candleData[i]?.time || candleData[candleData.length - 1].time,
        value,
      }));
      
      rsiSeriesRef.current.setData(rsiData as any);
      
      // Set overbought/oversold lines
      const lineData = candleData.map(c => ({ time: c.time }));
      rsiOverboughtRef.current.setData(lineData.map(d => ({ ...d, value: 70 })) as any);
      rsiOversoldRef.current.setData(lineData.map(d => ({ ...d, value: 30 })) as any);
      
      // Update current RSI value
      if (rsiValues.length > 0) {
        setCurrentRSI(rsiValues[rsiValues.length - 1]);
      }
    }

    // Calculate and set MACD
    if (showIndicators && showMACD && macdLineRef.current && signalLineRef.current && histogramRef.current) {
      const { macdLine, signalLine, histogram } = calculateMACD(closes, 12, 26, 9);
      
      const startOffset = 26 - 1; // Slow period offset
      const signalOffset = startOffset + 9 - 1; // Signal period offset
      
      const macdData = macdLine.map((value, i) => ({
        time: candleData[i + startOffset]?.time || candleData[candleData.length - 1].time,
        value,
      })).filter((_, i) => i + startOffset < candleData.length);
      
      const signalData = signalLine.map((value, i) => ({
        time: candleData[i + signalOffset]?.time || candleData[candleData.length - 1].time,
        value,
      })).filter((_, i) => i + signalOffset < candleData.length);
      
      const histogramData = histogram.map((value, i) => ({
        time: candleData[i + signalOffset]?.time || candleData[candleData.length - 1].time,
        value,
        color: value >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)',
      })).filter((_, i) => i + signalOffset < candleData.length);
      
      macdLineRef.current.setData(macdData as any);
      signalLineRef.current.setData(signalData as any);
      histogramRef.current.setData(histogramData as any);
      
      // Update current MACD values
      if (macdLine.length > 0 && signalLine.length > 0 && histogram.length > 0) {
        setCurrentMACD({
          macd: macdLine[macdLine.length - 1],
          signal: signalLine[signalLine.length - 1],
          histogram: histogram[histogram.length - 1],
        });
      }
    }
  }, [showIndicators, showEMA, showRSI, showMACD]);

  // Fetch and update data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=300`
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

      candleDataRef.current = candleData;

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

      // Update all indicators
      updateIndicators(candleData);

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
  }, [symbol, interval, toast, updateIndicators]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    fetchData();

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

        // Update candle data and recalculate indicators on candle close
        if (kline.x) {
          const updatedData = [...candleDataRef.current];
          const lastIndex = updatedData.findIndex(c => c.time === candle.time);
          if (lastIndex >= 0) {
            updatedData[lastIndex] = candle;
          } else {
            updatedData.push(candle);
          }
          candleDataRef.current = updatedData;
          updateIndicators(updatedData);
        }
      }
    };

    ws.onerror = () => {
      console.error('WebSocket error');
    };

    return () => {
      ws.close();
    };
  }, [symbol, interval, fetchData, updateIndicators]);

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

  const getRSIColor = (value: number | null) => {
    if (!value) return 'text-muted-foreground';
    if (value >= 70) return 'text-red-500';
    if (value <= 30) return 'text-green-500';
    return 'text-purple-500';
  };

  const getMACDColor = (value: number | null) => {
    if (!value) return 'text-muted-foreground';
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };

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
          <div className="flex items-center gap-4 flex-wrap">
            <span>H: <span className="text-buy font-mono">{formatPrice(highPrice)}</span></span>
            <span>L: <span className="text-sell font-mono">{formatPrice(lowPrice)}</span></span>
            <span>Vol: <span className="font-mono">${formatVolume(volume24h)}</span></span>
            {showIndicators && showEMA && (
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
            {showIndicators && showRSI && currentRSI !== null && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                RSI: <span className={cn("font-mono font-medium", getRSIColor(currentRSI))}>{currentRSI.toFixed(1)}</span>
              </span>
            )}
            {showIndicators && showMACD && currentMACD && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                MACD: <span className={cn("font-mono font-medium", getMACDColor(currentMACD.histogram))}>{currentMACD.histogram.toFixed(4)}</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {showIndicators && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Indicators</h4>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ema" className="text-xs">EMA (20, 50)</Label>
                      <Switch id="ema" checked={showEMA} onCheckedChange={setShowEMA} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rsi" className="text-xs">RSI (14)</Label>
                      <Switch id="rsi" checked={showRSI} onCheckedChange={setShowRSI} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="macd" className="text-xs">MACD (12, 26, 9)</Label>
                      <Switch id="macd" checked={showMACD} onCheckedChange={setShowMACD} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
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
        
        {/* Main Chart */}
        <div 
          ref={chartContainerRef} 
          className={cn(
            "w-full",
            isFullscreen ? "h-[calc(100vh-20rem)]" : "h-[300px] sm:h-[350px]"
          )}
        />
        
        {/* RSI Chart */}
        {showIndicators && showRSI && (
          <div className="border-t border-border">
            <div className="px-3 py-1 bg-muted/30 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">RSI (14)</span>
              {currentRSI !== null && (
                <span className={cn("text-xs font-mono font-medium", getRSIColor(currentRSI))}>
                  {currentRSI.toFixed(1)}
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                <span className="text-red-500">70</span> / <span className="text-green-500">30</span>
              </span>
            </div>
            <div 
              ref={rsiContainerRef} 
              className="w-full h-[100px]"
            />
          </div>
        )}
        
        {/* MACD Chart */}
        {showIndicators && showMACD && (
          <div className="border-t border-border">
            <div className="px-3 py-1 bg-muted/30 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">MACD (12, 26, 9)</span>
              {currentMACD && (
                <>
                  <span className="text-xs font-mono text-blue-500">M: {currentMACD.macd.toFixed(4)}</span>
                  <span className="text-xs font-mono text-orange-500">S: {currentMACD.signal.toFixed(4)}</span>
                  <span className={cn("text-xs font-mono font-medium", getMACDColor(currentMACD.histogram))}>
                    H: {currentMACD.histogram.toFixed(4)}
                  </span>
                </>
              )}
            </div>
            <div 
              ref={macdContainerRef} 
              className="w-full h-[100px]"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}