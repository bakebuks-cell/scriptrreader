import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FlaskConical, Play, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { TradeMode } from '@/hooks/useProfile';

interface SimulationResult {
  valid: boolean;
  detected_mode: 'PLAIN' | 'STRATEGY' | 'INVALID';
  signals_found: string[];
  decision: string;
  errors: string[];
  warnings: string[];
}

interface SignalSimulatorProps {
  symbol?: string;
  timeframe?: string;
  tradeMode?: TradeMode;
  compact?: boolean;
}

const SAMPLE_PAYLOADS: Record<string, string> = {
  plain_buy: JSON.stringify({ signal_type: 'BUY', symbol: 'BTCUSDT', timeframe: '1h', bar_close_time: Date.now() }, null, 2),
  plain_sell: JSON.stringify({ signal_type: 'SELL', symbol: 'BTCUSDT', timeframe: '1h', bar_close_time: Date.now() }, null, 2),
  strategy_buy_open: JSON.stringify({ signal_type: 'BUY_OPEN', symbol: 'BTCUSDT', timeframe: '1h', bar_close_time: Date.now() }, null, 2),
  strategy_sell_exit: JSON.stringify({ signal_type: 'SELL_EXIT', symbol: 'BTCUSDT', timeframe: '1h', bar_close_time: Date.now() }, null, 2),
};

export default function SignalSimulator({ symbol = 'BTCUSDT', timeframe = '1h', tradeMode = 'auto', compact = false }: SignalSimulatorProps) {
  const { toast } = useToast();
  const [payload, setPayload] = useState(SAMPLE_PAYLOADS.plain_buy);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async () => {
    setIsSimulating(true);
    setResult(null);

    try {
      // Parse the payload
      let parsed: any;
      try {
        parsed = JSON.parse(payload);
      } catch {
        setResult({
          valid: false,
          detected_mode: 'INVALID',
          signals_found: [],
          decision: 'Cannot parse JSON payload',
          errors: ['Invalid JSON format'],
          warnings: [],
        });
        return;
      }

      // Client-side validation
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!parsed.signal_type) errors.push('Missing required field: signal_type');
      if (!parsed.symbol) errors.push('Missing required field: symbol');
      if (!parsed.timeframe) errors.push('Missing required field: timeframe');
      if (!parsed.bar_close_time && !parsed.signal_id) errors.push('Missing required field: bar_close_time or signal_id');

      const signalType = parsed.signal_type?.toUpperCase();
      const plainSignals = ['BUY', 'SELL'];
      const strategySignals = ['BUY_OPEN', 'BUY_EXIT', 'SELL_OPEN', 'SELL_EXIT'];
      const allValid = [...plainSignals, ...strategySignals];

      if (signalType && !allValid.includes(signalType)) {
        errors.push(`Invalid signal_type: "${signalType}". Must be one of: ${allValid.join(', ')}`);
      }

      // Detect mode
      let detectedMode: 'PLAIN' | 'STRATEGY' | 'INVALID' = 'INVALID';
      if (plainSignals.includes(signalType)) detectedMode = 'PLAIN';
      else if (strategySignals.includes(signalType)) detectedMode = 'STRATEGY';

      // Check mode compatibility
      if (tradeMode === 'plain' && detectedMode === 'STRATEGY') {
        errors.push(`Signal "${signalType}" is a Strategy signal, but account is set to Plain mode`);
      }
      if (tradeMode === 'strategy' && detectedMode === 'PLAIN') {
        errors.push(`Signal "${signalType}" is a Plain signal, but account is set to Strategy mode`);
      }

      // Determine decision
      let decision = '';
      if (errors.length > 0) {
        decision = 'REJECTED — fix errors above';
      } else {
        switch (signalType) {
          case 'BUY': decision = 'Target: LONG. If SHORT → flip. If NONE → open LONG. If LONG → ignore.'; break;
          case 'SELL': decision = 'Target: SHORT. If LONG → flip. If NONE → open SHORT. If SHORT → ignore.'; break;
          case 'BUY_OPEN': decision = 'Open LONG (if not already long). Opposite policy applies if SHORT exists.'; break;
          case 'BUY_EXIT': decision = 'Close LONG only. Never opens SHORT.'; break;
          case 'SELL_OPEN': decision = 'Open SHORT (if not already short). Opposite policy applies if LONG exists.'; break;
          case 'SELL_EXIT': decision = 'Close SHORT only. Never opens LONG.'; break;
          default: decision = 'Unknown signal type';
        }
      }

      setResult({
        valid: errors.length === 0,
        detected_mode: detectedMode,
        signals_found: signalType ? [signalType] : [],
        decision,
        errors,
        warnings,
      });
    } catch (err) {
      toast({ title: 'Simulation Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsSimulating(false);
    }
  };

  const loadSample = (key: string) => {
    const sample = SAMPLE_PAYLOADS[key];
    if (sample) {
      // Replace symbol/timeframe with current context
      const parsed = JSON.parse(sample);
      parsed.symbol = symbol;
      parsed.timeframe = timeframe;
      parsed.bar_close_time = Date.now();
      setPayload(JSON.stringify(parsed, null, 2));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          Signal Simulator
        </CardTitle>
        <CardDescription className="text-xs">
          Test a signal payload without placing trades. Validates format and shows execution decision.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick load buttons */}
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground mr-1">Load:</span>
          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => loadSample('plain_buy')}>BUY</Button>
          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => loadSample('plain_sell')}>SELL</Button>
          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => loadSample('strategy_buy_open')}>BUY_OPEN</Button>
          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => loadSample('strategy_sell_exit')}>SELL_EXIT</Button>
        </div>

        <Textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="font-mono text-xs min-h-[120px]"
          placeholder='{"signal_type": "BUY", "symbol": "BTCUSDT", "timeframe": "1h", "bar_close_time": 1234567890}'
        />

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Mode: {tradeMode.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {symbol} • {timeframe}
          </Badge>
        </div>

        <Button onClick={handleSimulate} disabled={isSimulating} className="w-full" size="sm">
          {isSimulating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          Simulate Signal
        </Button>

        {/* Results */}
        {result && (
          <div className={`p-3 rounded-lg border ${result.valid ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.valid ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
              <span className="text-sm font-medium">{result.valid ? 'Valid Signal' : 'Invalid Signal'}</span>
              <Badge variant={result.detected_mode === 'PLAIN' ? 'default' : result.detected_mode === 'STRATEGY' ? 'secondary' : 'destructive'} className="text-[10px]">
                {result.detected_mode}
              </Badge>
            </div>
            
            {result.errors.length > 0 && (
              <div className="space-y-1 mb-2">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive flex items-start gap-1">
                    <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="space-y-1 mb-2">
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-yellow-600 flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    {w}
                  </p>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <strong>Decision:</strong> {result.decision}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}