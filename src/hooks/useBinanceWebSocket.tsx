import { useState, useEffect, useCallback, useRef } from 'react';

export interface BinanceTickerStream {
  symbol: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
}

export interface BinanceUserStream {
  accountBalance: number;
  positions: BinancePosition[];
  orders: BinanceOrder[];
}

export interface BinancePosition {
  symbol: string;
  positionAmt: number;
  entryPrice: number;
  markPrice: number;
  unRealizedProfit: number;
  percentage: number;
  side: 'LONG' | 'SHORT' | 'BOTH';
}

export interface BinanceOrder {
  symbol: string;
  orderId: string;
  side: 'BUY' | 'SELL';
  type: string;
  price: number;
  origQty: number;
  executedQty: number;
  status: string;
}

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  reconnecting: boolean;
}

interface UseBinanceWebSocketResult {
  tickers: Map<string, BinanceTickerStream>;
  state: WebSocketState;
  connect: () => void;
  disconnect: () => void;
}

// Use edge function proxy to bypass geo-restrictions
const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/binance-websocket-proxy`;

export function useBinanceWebSocket(symbols: string[]): UseBinanceWebSocketResult {
  const [tickers, setTickers] = useState<Map<string, BinanceTickerStream>>(new Map());
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    error: null,
    reconnecting: false,
  });
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const disconnect = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (mountedRef.current) {
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  const fetchTickers = useCallback(async () => {
    if (symbols.length === 0) return;

    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ symbols, mode: 'polling' }),
      });

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.tickers && mountedRef.current) {
        setTickers(prev => {
          const next = new Map(prev);
          for (const ticker of data.tickers) {
            next.set(ticker.symbol, ticker);
          }
          return next;
        });

        setState({
          isConnected: true,
          error: null,
          reconnecting: false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch tickers:', err);
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to fetch data',
        }));
      }
    }
  }, [symbols]);

  const connect = useCallback(() => {
    if (symbols.length === 0) return;
    
    disconnect();
    
    // Fetch immediately
    fetchTickers();
    
    // Then poll every 3 seconds
    pollingIntervalRef.current = setInterval(fetchTickers, 3000);
    
  }, [symbols, disconnect, fetchTickers]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (symbols.length > 0) {
      connect();
    }
    
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [symbols.join(',')]); // Reconnect when symbols change

  return {
    tickers,
    state,
    connect,
    disconnect,
  };
}

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';

// Hook for mini ticker stream (lighter weight, updates more frequently)
export function useBinanceMiniTicker(symbols: string[]) {
  const [tickers, setTickers] = useState<Map<string, { symbol: string; lastPrice: number; volume: number }>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (symbols.length === 0) return;

    const streams = symbols.map(s => `${s.toLowerCase()}@miniTicker`).join('/');
    const wsUrl = `${BINANCE_WS_BASE}/${streams}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setIsConnected(true);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.e === '24hrMiniTicker') {
          setTickers(prev => {
            const next = new Map(prev);
            next.set(data.s, {
              symbol: data.s,
              lastPrice: parseFloat(data.c),
              volume: parseFloat(data.v),
            });
            return next;
          });
        }
      } catch (err) {
        console.error('Mini ticker parse error:', err);
      }
    };

    ws.onclose = () => {
      if (mountedRef.current) setIsConnected(false);
    };

    return () => {
      mountedRef.current = false;
      ws.close();
    };
  }, [symbols.join(',')]);

  return { tickers, isConnected };
}

// Hook for aggregate trade stream (real-time trades)
export function useBinanceAggTrade(symbol: string) {
  const [lastTrade, setLastTrade] = useState<{ price: number; qty: number; isBuyerMaker: boolean; time: number } | null>(null);
  const [tradeCount, setTradeCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!symbol) return;

    const wsUrl = `${BINANCE_WS_BASE}/${symbol.toLowerCase()}@aggTrade`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(event.data);
        if (data.e === 'aggTrade') {
          setLastTrade({
            price: parseFloat(data.p),
            qty: parseFloat(data.q),
            isBuyerMaker: data.m,
            time: data.T,
          });
          setTradeCount(prev => prev + 1);
        }
      } catch (err) {
        console.error('AggTrade parse error:', err);
      }
    };

    return () => {
      mountedRef.current = false;
      ws.close();
    };
  }, [symbol]);

  return { lastTrade, tradeCount };
}

// Combined hook for performance dashboard
export function usePerformanceWebSocket(symbols: string[]) {
  const { tickers, state } = useBinanceWebSocket(symbols);
  const [performanceData, setPerformanceData] = useState({
    totalVolume24h: 0,
    avgPriceChange: 0,
    spreadSum: 0,
    lastUpdate: new Date(),
  });

  useEffect(() => {
    if (tickers.size === 0) return;

    let totalVolume = 0;
    let totalPriceChange = 0;
    let totalSpread = 0;
    let count = 0;

    tickers.forEach((ticker) => {
      totalVolume += ticker.quoteVolume;
      totalPriceChange += ticker.priceChangePercent;
      if (ticker.bidPrice > 0) {
        totalSpread += ((ticker.askPrice - ticker.bidPrice) / ticker.bidPrice) * 100;
      }
      count++;
    });

    setPerformanceData({
      totalVolume24h: totalVolume,
      avgPriceChange: count > 0 ? totalPriceChange / count : 0,
      spreadSum: totalSpread,
      lastUpdate: new Date(),
    });
  }, [tickers]);

  return {
    tickers,
    performanceData,
    isConnected: state.isConnected,
    error: state.error,
    reconnecting: state.reconnecting,
  };
}
