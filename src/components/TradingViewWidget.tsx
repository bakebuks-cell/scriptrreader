import { useEffect, useRef, memo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Minimize2, Code, Activity } from 'lucide-react';

const SYMBOLS = [
  { value: 'BINANCE:BNBUSDT.P', label: 'BNB/USDT' },
  { value: 'BINANCE:BTCUSDT.P', label: 'BTC/USDT' },
  { value: 'BINANCE:ETHUSDT.P', label: 'ETH/USDT' },
  { value: 'BINANCE:SOLUSDT.P', label: 'SOL/USDT' },
  { value: 'BINANCE:XRPUSDT.P', label: 'XRP/USDT' },
  { value: 'BINANCE:ADAUSDT.P', label: 'ADA/USDT' },
  { value: 'BINANCE:DOGEUSDT.P', label: 'DOGE/USDT' },
];

// Map Pine Script timeframes to TradingView intervals
const TIMEFRAME_MAP: Record<string, string> = {
  '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30',
  '1h': '60', '2h': '120', '4h': '240', '6h': '360', '8h': '480',
  '12h': '720', '1d': 'D', '1w': 'W', '1M': 'M',
};

// Map symbol from Pine Script format (e.g. "BNBUSDT") to TradingView format
function toTradingViewSymbol(symbol: string): string {
  const clean = symbol.replace(/USDT$/i, 'USDT.P');
  return `BINANCE:${clean}`;
}

// Detect studies from Pine Script content
function detectStudies(scriptContent?: string): string[] {
  if (!scriptContent) return ['STD;Supertrend'];
  
  const studies: string[] = [];
  const lower = scriptContent.toLowerCase();
  
  if (lower.includes('supertrend') || lower.includes('ta.supertrend')) {
    studies.push('STD;Supertrend');
  }
  if (lower.includes('ta.ema') || lower.includes('ema(')) {
    studies.push('STD;EMA');
  }
  if (lower.includes('ta.sma') || lower.includes('sma(')) {
    studies.push('STD;SMA');
  }
  if (lower.includes('ta.rsi') || lower.includes('rsi(')) {
    studies.push('STD;RSI');
  }
  if (lower.includes('ta.macd') || lower.includes('macd(')) {
    studies.push('STD;MACD');
  }
  if (lower.includes('ta.bb') || lower.includes('ta.bbands') || lower.includes('bollinger')) {
    studies.push('STD;Bollinger_Bands');
  }
  if (lower.includes('ta.atr') || lower.includes('atr(')) {
    studies.push('STD;ATR');
  }
  if (lower.includes('ut bot') || lower.includes('ut_bot')) {
    studies.push('STD;Supertrend');
    studies.push('STD;ATR');
  }
  if (lower.includes('volume') || lower.includes('ta.volume')) {
    studies.push('STD;Volume');
  }
  
  // Deduplicate
  return [...new Set(studies.length > 0 ? studies : ['STD;Supertrend'])];
}

interface ActiveScript {
  name: string;
  symbol: string;
  scriptContent?: string;
  allowedTimeframes?: string[];
  candleType?: string;
}

interface TradingViewWidgetProps {
  symbol?: string;
  className?: string;
  height?: number;
  activeScript?: ActiveScript | null;
}

function TradingViewWidget({ symbol: defaultSymbol, className, height = 500, activeScript }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Derive symbol from active script or fallback
  const scriptSymbol = activeScript?.symbol ? toTradingViewSymbol(activeScript.symbol) : null;
  const [manualSymbol, setManualSymbol] = useState(defaultSymbol || 'BINANCE:BNBUSDT.P');
  const selectedSymbol = scriptSymbol || manualSymbol;
  
  // Derive timeframe from active script
  const scriptTimeframe = activeScript?.allowedTimeframes?.[0];
  const tvInterval = scriptTimeframe ? (TIMEFRAME_MAP[scriptTimeframe] || '5') : '5';
  
  // Derive studies from script content
  const studies = detectStudies(activeScript?.scriptContent);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: selectedSymbol,
      interval: tvInterval,
      timezone: 'Asia/Kolkata',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      style: activeScript?.candleType === 'heikinashi' ? '8' : '1',
      locale: 'en',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      studies,
    });

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    containerRef.current.appendChild(widgetContainer);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [selectedSymbol, tvInterval, studies, activeScript?.candleType]);

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (containerRef.current) {
        const event = new Event('themechange');
        containerRef.current.dispatchEvent(event);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const chartContent = (
    <Card className={`${className} ${isFullscreen ? 'rounded-none border-0' : ''}`}>
      <CardContent className="p-0">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            {!activeScript ? (
              <Select value={manualSymbol} onValueChange={setManualSymbol}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Code className="h-3 w-3" />
                  {activeScript.name}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {activeScript.symbol}
                </Badge>
                {scriptTimeframe && (
                  <Badge variant="secondary" className="text-xs">
                    {scriptTimeframe}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Show detected indicators */}
            {activeScript && (
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                {studies.map(s => (
                  <Badge key={s} variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">
                    {s.replace('STD;', '').replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            )}
            
            <span className="text-xs text-muted-foreground">
              Perpetual · TradingView
              {activeScript?.candleType === 'heikinashi' && ' · Heikin Ashi'}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 shrink-0 gap-1 text-xs"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Open fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
        </div>
        
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ height: isFullscreen ? 'calc(100vh - 53px)' : `${height}px`, minHeight: `${height}px`, width: '100%', overflow: 'hidden' }}
        />
      </CardContent>
    </Card>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {chartContent}
      </div>
    );
  }

  return chartContent;
}

export default memo(TradingViewWidget);
