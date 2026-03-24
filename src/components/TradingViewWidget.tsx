import { useEffect, useRef, memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SYMBOLS = [
  { value: 'BINANCE:BNBUSDT.P', label: 'BNB/USDT' },
  { value: 'BINANCE:BTCUSDT.P', label: 'BTC/USDT' },
  { value: 'BINANCE:ETHUSDT.P', label: 'ETH/USDT' },
  { value: 'BINANCE:SOLUSDT.P', label: 'SOL/USDT' },
  { value: 'BINANCE:XRPUSDT.P', label: 'XRP/USDT' },
  { value: 'BINANCE:ADAUSDT.P', label: 'ADA/USDT' },
  { value: 'BINANCE:DOGEUSDT.P', label: 'DOGE/USDT' },
];

interface TradingViewWidgetProps {
  symbol?: string;
  className?: string;
  height?: number;
}

function TradingViewWidget({ symbol: defaultSymbol = 'BINANCE:BNBUSDT.P', className, height = 500 }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: selectedSymbol,
      interval: '5',
      timezone: 'Asia/Kolkata',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      studies: ['STD;Supertrend'],
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
  }, [selectedSymbol]);

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Re-render widget on theme change
      if (containerRef.current) {
        const event = new Event('themechange');
        containerRef.current.dispatchEvent(event);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYMBOLS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Perpetual · TradingView</span>
        </div>
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ height: `${height}px`, width: '100%' }}
        />
      </CardContent>
    </Card>
  );
}

export default memo(TradingViewWidget);
