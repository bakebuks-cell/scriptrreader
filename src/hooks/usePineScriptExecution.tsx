import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

const EXECUTE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-pine-script`;

async function callExecuteApi(action: string, body?: any) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (session) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${EXECUTE_FUNCTION_URL}?action=${action}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API request failed');
  return data;
}

export interface ParsedStrategy {
  entryType: 'MA_CROSSOVER' | 'MA_CROSSUNDER' | 'PRICE_ABOVE' | 'PRICE_BELOW' | 'RSI' | 'CUSTOM';
  fastMAPeriod: number;
  slowMAPeriod: number;
  maType: 'EMA' | 'SMA';
  stopLossPercent: number;
  takeProfitPercent: number;
  rsiPeriod?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
}

export interface TradeSignal {
  type: 'BUY' | 'SELL' | 'NONE';
  price: number;
  stopLoss: number;
  takeProfit: number;
  reason: string;
}

export interface ScriptEvaluationResult {
  script: string;
  symbol: string;
  timeframe: string;
  strategy: ParsedStrategy;
  signal: TradeSignal;
  dryRun: boolean;
  currentPrice: number;
  lastCandle: {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
}

// Hook to parse a Pine Script and extract strategy parameters
export function useParseScript() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (scriptContent: string): Promise<{ strategy: ParsedStrategy }> => {
      return await callExecuteApi('parse', { scriptContent });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Parse Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

// Hook to evaluate a script against current market data (dry run)
export function useEvaluateScript() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      scriptId, 
      timeframe = '1h',
      dryRun = true 
    }: { 
      scriptId: string; 
      timeframe?: string;
      dryRun?: boolean;
    }): Promise<ScriptEvaluationResult> => {
      return await callExecuteApi('evaluate-script', { scriptId, timeframe, dryRun });
    },
    onSuccess: (data) => {
      if (data.signal.type !== 'NONE') {
        toast({ 
          title: `Signal Detected: ${data.signal.type}`, 
          description: data.signal.reason,
        });
      } else {
        toast({ 
          title: 'No Signal', 
          description: 'No trading conditions met at this time.',
        });
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Evaluation Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

// Hook to trigger evaluation of all active scripts (for scheduled execution)
export function useExecuteAllScripts() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (): Promise<{ message: string; results: any[] }> => {
      return await callExecuteApi('evaluate-all', {});
    },
    onSuccess: (data) => {
      const executed = data.results.filter((r: any) => r.status === 'EXECUTED').length;
      const failed = data.results.filter((r: any) => r.status === 'FAILED').length;
      
      toast({ 
        title: 'Execution Complete', 
        description: `${executed} trades executed, ${failed} failed, ${data.results.length} total signals evaluated`,
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Execution Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
