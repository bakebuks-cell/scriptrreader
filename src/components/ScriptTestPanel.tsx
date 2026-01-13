import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Play, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useEvaluateScript, ScriptEvaluationResult } from '@/hooks/usePineScriptExecution';
import { AVAILABLE_TIMEFRAMES } from '@/lib/constants';

interface ScriptTestPanelProps {
  scriptId: string;
  scriptName: string;
  symbol: string;
  allowedTimeframes: string[];
}

export default function ScriptTestPanel({ 
  scriptId, 
  scriptName, 
  symbol,
  allowedTimeframes 
}: ScriptTestPanelProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(allowedTimeframes[0] || '1h');
  const [result, setResult] = useState<ScriptEvaluationResult | null>(null);
  
  const { mutateAsync: evaluateScript, isPending } = useEvaluateScript();

  const handleTest = async () => {
    try {
      const data = await evaluateScript({ 
        scriptId, 
        timeframe: selectedTimeframe,
        dryRun: true 
      });
      setResult(data);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const getTimeframeLabel = (tf: string) => {
    return AVAILABLE_TIMEFRAMES.find(t => t.value === tf)?.label || tf;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Play className="h-5 w-5" />
          Test Script
        </CardTitle>
        <CardDescription>
          Evaluate "{scriptName}" against live market data (dry run - no trades executed)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedTimeframes.map((tf) => (
                <SelectItem key={tf} value={tf}>
                  {getTimeframeLabel(tf)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleTest} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Test
          </Button>
        </div>

        {result && (
          <>
            <Separator />
            
            {/* Signal Result */}
            <div className={`p-4 rounded-lg border ${
              result.signal.type === 'BUY' 
                ? 'bg-green-500/10 border-green-500/30' 
                : result.signal.type === 'SELL' 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-muted border-border'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {result.signal.type === 'BUY' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : result.signal.type === 'SELL' ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-lg">
                    {result.signal.type === 'NONE' ? 'No Signal' : `${result.signal.type} Signal`}
                  </span>
                </div>
                <Badge variant={result.signal.type === 'NONE' ? 'outline' : 'default'}>
                  {result.timeframe}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{result.signal.reason}</p>
              
              {result.signal.type !== 'NONE' && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Entry Price</p>
                    <p className="font-medium">${result.signal.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stop Loss</p>
                    <p className="font-medium text-red-500">${result.signal.stopLoss.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Take Profit</p>
                    <p className="font-medium text-green-500">${result.signal.takeProfit.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Strategy Details */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Parsed Strategy</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-accent/50 rounded">
                  <span className="text-muted-foreground">Entry Type:</span>
                  <span className="ml-2 font-medium">{result.strategy.entryType.replace('_', ' ')}</span>
                </div>
                <div className="p-2 bg-accent/50 rounded">
                  <span className="text-muted-foreground">MA Type:</span>
                  <span className="ml-2 font-medium">{result.strategy.maType}</span>
                </div>
                <div className="p-2 bg-accent/50 rounded">
                  <span className="text-muted-foreground">Fast MA:</span>
                  <span className="ml-2 font-medium">{result.strategy.fastMAPeriod}</span>
                </div>
                <div className="p-2 bg-accent/50 rounded">
                  <span className="text-muted-foreground">Slow MA:</span>
                  <span className="ml-2 font-medium">{result.strategy.slowMAPeriod}</span>
                </div>
                <div className="p-2 bg-accent/50 rounded">
                  <span className="text-muted-foreground">Stop Loss:</span>
                  <span className="ml-2 font-medium">{result.strategy.stopLossPercent}%</span>
                </div>
                <div className="p-2 bg-accent/50 rounded">
                  <span className="text-muted-foreground">Take Profit:</span>
                  <span className="ml-2 font-medium">{result.strategy.takeProfitPercent}%</span>
                </div>
              </div>
            </div>

            {/* Market Data */}
            <div className="flex items-center justify-between text-sm p-3 bg-accent/30 rounded-lg">
              <div>
                <span className="text-muted-foreground">Current Price:</span>
                <span className="ml-2 font-bold">${result.currentPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Symbol:</span>
                <span className="ml-2 font-medium">{result.symbol}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              Dry run - no actual trades were executed
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
