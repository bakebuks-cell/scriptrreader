import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TradeSignal {
  action: 'BUY' | 'SELL' | 'CLOSE' | 'NONE';
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
}

interface ParsedStrategy {
  entryConditions: any[];
  exitConditions: any[];
  stopLoss: { type: string; value: number } | null;
  takeProfit: { type: string; value: number } | null;
  direction: 'long' | 'short' | 'both';
  riskPercent: number;
}

interface EvaluationResult {
  strategy: ParsedStrategy;
  signal: TradeSignal;
  currentPrice: number;
  indicators: {
    ema9: number[];
    ema21: number[];
    rsi: number[];
    macd: { macd: number[]; signal: number[] };
  };
}

interface IndicatorsResult {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  lastCandle: {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  indicators: {
    ema: Record<string, number[]>;
    sma: Record<string, number[]>;
    rsi: number[];
    macd: { macd: number[]; signal: number[]; histogram: number[] };
    bb: { upper: number[]; middle: number[]; lower: number[] };
    atr: number[];
  };
}

interface RunResult {
  processed: number;
  results: Array<{
    scriptId: string;
    userId: string;
    symbol: string;
    signal?: TradeSignal;
    executed: boolean;
    error?: string;
    tradeId?: string;
    reason?: string;
  }>;
  timestamp: string;
}

// Helper to call edge function
async function callPineScriptEngine(action: string, method: string = 'GET', body?: any): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pine-script-engine`;
  const url = new URL(baseUrl);
  
  // Parse action — might contain additional params like "indicators&symbol=X&timeframe=Y"
  const parts = action.split('&');
  url.searchParams.set('action', parts[0]);
  for (let i = 1; i < parts.length; i++) {
    const [key, value] = parts[i].split('=');
    if (key && value) url.searchParams.set(key, value);
  }
  
  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(error.error || `Engine request failed (${response.status})`);
  }
  
  return response.json();
}

// Hook to evaluate a Pine Script without executing trades
export function useEvaluateScript() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ scriptContent, symbol, timeframe = '1h' }: { 
      scriptContent: string; 
      symbol: string; 
      timeframe?: string;
    }): Promise<EvaluationResult> => {
      return callPineScriptEngine('evaluate', 'POST', { scriptContent, symbol, timeframe });
    },
    onError: (error: Error) => {
      toast({
        title: 'Evaluation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to parse a Pine Script and get the strategy structure
export function useParseScript() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (scriptContent: string): Promise<{ strategy: ParsedStrategy }> => {
      return callPineScriptEngine('parse', 'POST', { scriptContent });
    },
    onError: (error: Error) => {
      toast({
        title: 'Parse Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to run the engine for all active scripts (admin only)
export function useRunEngine() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (): Promise<RunResult> => {
      return callPineScriptEngine('run', 'POST');
    },
    // No generic toast here — the calling component handles per-script result display
    onError: (error: Error) => {
      toast({
        title: 'Engine Run Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to get live indicators for a symbol
export function useIndicators(symbol: string, timeframe: string = '1h') {
  return useQuery({
    queryKey: ['indicators', symbol, timeframe],
    queryFn: async (): Promise<IndicatorsResult> => {
      return callPineScriptEngine(`indicators&symbol=${symbol}&timeframe=${timeframe}`);
    },
    refetchInterval: 60000, // Refresh every minute
    enabled: !!symbol,
  });
}

// Hook to test evaluate the user's active script
export function useTestMyScript() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ scriptId }: { scriptId: string }): Promise<EvaluationResult & { scriptName: string }> => {
      // Get the script content
      const { data: script, error } = await supabase
        .from('pine_scripts')
        .select('name, script_content, symbol')
        .eq('id', scriptId)
        .single();
      
      if (error || !script) {
        throw new Error('Script not found');
      }
      
      const result = await callPineScriptEngine('evaluate', 'POST', {
        scriptContent: script.script_content,
        symbol: script.symbol,
        timeframe: '1h',
      });
      
      return { ...result, scriptName: script.name };
    },
    onSuccess: (data) => {
      const actionText = data.signal.action === 'NONE' 
        ? 'No trade signal' 
        : `${data.signal.action} signal at ${data.signal.price.toFixed(2)}`;
      
      toast({
        title: `${data.scriptName} Evaluation`,
        description: actionText,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
