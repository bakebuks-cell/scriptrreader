import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Trade } from './useTrades';
import { PineScript } from './usePineScripts';

export interface ScriptAnalytics {
  scriptId: string;
  scriptName: string;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  failedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  trades: Trade[];
}

export interface OverallAnalytics {
  totalScripts: number;
  activeScripts: number;
  totalTrades: number;
  winRate: number;
  netPnL: number;
  bestPerformingScript: ScriptAnalytics | null;
  worstPerformingScript: ScriptAnalytics | null;
}

function calculateScriptAnalytics(trades: Trade[], script: PineScript): ScriptAnalytics {
  const scriptTrades = trades.filter(t => t.script_id === script.id);
  
  const closedTrades = scriptTrades.filter(t => t.status === 'CLOSED');
  const openTrades = scriptTrades.filter(t => t.status === 'OPEN' || t.status === 'PENDING');
  const failedTrades = scriptTrades.filter(t => t.status === 'FAILED' || t.status === 'CANCELLED');
  
  // Calculate winning/losing trades based on entry and exit prices
  const tradesWithPnL = closedTrades.map(trade => {
    if (!trade.entry_price || !trade.exit_price) return { ...trade, pnl: 0 };
    
    const priceDiff = trade.signal_type === 'BUY' 
      ? trade.exit_price - trade.entry_price 
      : trade.entry_price - trade.exit_price;
    const pnl = trade.quantity ? priceDiff * trade.quantity : priceDiff;
    
    return { ...trade, pnl };
  });
  
  const winningTrades = tradesWithPnL.filter(t => t.pnl > 0);
  const losingTrades = tradesWithPnL.filter(t => t.pnl < 0);
  
  const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  const averageProfit = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  
  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
  const largestLoss = losingTrades.length > 0 ? Math.max(...losingTrades.map(t => Math.abs(t.pnl))) : 0;
  
  return {
    scriptId: script.id,
    scriptName: script.name,
    totalTrades: scriptTrades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    failedTrades: failedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    totalProfit,
    totalLoss,
    netPnL: totalProfit - totalLoss,
    averageProfit,
    averageLoss,
    profitFactor,
    largestWin,
    largestLoss,
    trades: scriptTrades,
  };
}

export function useScriptAnalytics() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['script-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return { scripts: [], trades: [] };

      // Fetch user's scripts
      const { data: scripts, error: scriptsError } = await supabase
        .from('pine_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (scriptsError) throw scriptsError;

      // Fetch user's trades
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tradesError) throw tradesError;

      return {
        scripts: scripts as PineScript[],
        trades: trades as Trade[],
      };
    },
    enabled: !!user?.id,
  });

  const scripts = data?.scripts ?? [];
  const trades = data?.trades ?? [];

  // Calculate analytics per script
  const scriptAnalytics: ScriptAnalytics[] = scripts.map(script => 
    calculateScriptAnalytics(trades, script)
  ).filter(analytics => analytics.totalTrades > 0);

  // Calculate overall analytics
  const overallAnalytics: OverallAnalytics = {
    totalScripts: scripts.length,
    activeScripts: scripts.filter(s => s.is_active).length,
    totalTrades: trades.length,
    winRate: scriptAnalytics.length > 0 
      ? scriptAnalytics.reduce((sum, s) => sum + s.winRate, 0) / scriptAnalytics.length 
      : 0,
    netPnL: scriptAnalytics.reduce((sum, s) => sum + s.netPnL, 0),
    bestPerformingScript: scriptAnalytics.length > 0 
      ? scriptAnalytics.reduce((best, current) => 
          current.netPnL > best.netPnL ? current : best
        ) 
      : null,
    worstPerformingScript: scriptAnalytics.length > 0 
      ? scriptAnalytics.reduce((worst, current) => 
          current.netPnL < worst.netPnL ? current : worst
        ) 
      : null,
  };

  return {
    scriptAnalytics,
    overallAnalytics,
    scripts,
    trades,
    isLoading,
    error,
    refetch,
  };
}

export function useAdminScriptAnalytics() {
  const { isAdmin } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-script-analytics'],
    queryFn: async () => {
      // Fetch all scripts
      const { data: scripts, error: scriptsError } = await supabase
        .from('pine_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (scriptsError) throw scriptsError;

      // Fetch all trades
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (tradesError) throw tradesError;

      return {
        scripts: scripts as PineScript[],
        trades: trades as Trade[],
      };
    },
    enabled: isAdmin,
  });

  const scripts = data?.scripts ?? [];
  const trades = data?.trades ?? [];

  // Calculate analytics per script
  const scriptAnalytics: ScriptAnalytics[] = scripts.map(script => 
    calculateScriptAnalytics(trades, script)
  );

  // Calculate overall analytics
  const overallAnalytics: OverallAnalytics = {
    totalScripts: scripts.length,
    activeScripts: scripts.filter(s => s.is_active).length,
    totalTrades: trades.length,
    winRate: scriptAnalytics.filter(s => s.closedTrades > 0).length > 0 
      ? scriptAnalytics.filter(s => s.closedTrades > 0).reduce((sum, s) => sum + s.winRate, 0) / scriptAnalytics.filter(s => s.closedTrades > 0).length 
      : 0,
    netPnL: scriptAnalytics.reduce((sum, s) => sum + s.netPnL, 0),
    bestPerformingScript: scriptAnalytics.filter(s => s.totalTrades > 0).length > 0 
      ? scriptAnalytics.filter(s => s.totalTrades > 0).reduce((best, current) => 
          current.netPnL > best.netPnL ? current : best
        ) 
      : null,
    worstPerformingScript: scriptAnalytics.filter(s => s.totalTrades > 0).length > 0 
      ? scriptAnalytics.filter(s => s.totalTrades > 0).reduce((worst, current) => 
          current.netPnL < worst.netPnL ? current : worst
        ) 
      : null,
  };

  return {
    scriptAnalytics,
    overallAnalytics,
    scripts,
    trades,
    isLoading,
    error,
    refetch,
  };
}
