import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TickerData {
  symbol: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

interface UseMarketDataResult {
  ticker: TickerData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMarketData(symbol: string, refreshInterval: number = 5000): UseMarketDataResult {
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicker = useCallback(async () => {
    if (!symbol) return;
    
    try {
      setError(null);
      
      // Fetch public ticker data (no API keys required)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/binance-api?action=ticker&symbols=${symbol}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      
      const result = await response.json();
      
      if (result.tickers && result.tickers.length > 0) {
        const t = result.tickers[0];
        setTicker({
          symbol: t.symbol,
          lastPrice: t.lastPrice,
          bidPrice: t.bidPrice,
          askPrice: t.askPrice,
          priceChange: t.priceChange,
          priceChangePercent: t.priceChangePercent,
          highPrice: t.highPrice,
          lowPrice: t.lowPrice,
          volume: t.volume,
          quoteVolume: t.quoteVolume,
        });
      }
    } catch (err) {
      console.error('Market data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchTicker();
    
    const interval = setInterval(fetchTicker, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchTicker, refreshInterval]);

  return {
    ticker,
    loading,
    error,
    refresh: fetchTicker,
  };
}

// Format price with appropriate decimal places
export function formatPrice(price: string | number, decimals: number = 2): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '--';
  
  // For very small prices (like some altcoins), show more decimals
  if (num < 0.01) {
    return num.toFixed(6);
  } else if (num < 1) {
    return num.toFixed(4);
  } else if (num < 100) {
    return num.toFixed(2);
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format volume with K, M, B suffixes
export function formatVolume(volume: string | number): string {
  const num = typeof volume === 'string' ? parseFloat(volume) : volume;
  if (isNaN(num)) return '--';
  
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

// Calculate spread percentage
export function calculateSpread(bid: string, ask: string): string {
  const bidNum = parseFloat(bid);
  const askNum = parseFloat(ask);
  if (isNaN(bidNum) || isNaN(askNum) || bidNum === 0) return '--';
  
  const spread = ((askNum - bidNum) / bidNum) * 100;
  return spread.toFixed(4) + '%';
}
