import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FlaskConical, Play, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TradeMode, StrategyOppositePolicy } from '@/hooks/useProfile';

interface SimulationResult {
  valid: boolean;
  detected_mode: 'PLAIN' | 'STRATEGY' | 'INVALID';
  signals_found: string[];
  decision: string;
  errors: string[];
  warnings: string[];
  wouldExecute?: boolean;
}

interface SignalSimulatorProps {
  symbol?: string;
  timeframe?: string;
  tradeMode?: TradeMode;
  oppositePolicy?: StrategyOppositePolicy;
  compact?: boolean;
}

const SAMPLE_PAYLOADS: Record<string, string> = {
  plain_buy: JSON.stringify({ signal_type: 'BUY', symbol: 'BTCUSDT', timeframe: '1h', bar_close_time: Date.now() }, null, 2),
  plain_sell: JSON.stringify({ signal_type: 'SELL', symbol: 'BTCUSDT', timeframe: '1h', bar_close_time: Date.now() }, null, 2),
  strategy_buy_open: JSON.stringify({ signal_type: 'BUY_OPEN', symbol: 'BTCUSDT', timeframe: '1h', bar_close_time: Date.now() }, null, 2),
  strategy_buy_exit: JSON.stringify({ signal_type: 'BUY_EXIT', symbol: 'BTCUSDT', timeframe: '1h', bar_close_time: Date.now() }, null, 2),
  strategy_sell_open: JSON.stringify({ signal_type: 'SELL_OPEN', symbol: 'BTCUSDT', timeframe: '1h', bar_close_time: Date.now() }, null, 2),
  strategy_sell_exit: JSON.stringify({ signal_type: 'SELL_EXIT', symbol: 'BTCUSDT', timeframe: '1h', bar_close_time: Date.now() }, null, 2),
};

export default function SignalSimulator({ symbol = 'BTCUSDT', timeframe = '1h', tradeMode = 'auto', oppositePolicy = 'reject', compact = false }: SignalSimulatorProps) {
  const { toast } = useToast();
  const [payload, setPayload] = useState(SAMPLE_PAYLOADS.plain_buy);
  const [currentPosition, setCurrentPosition] = useState<'NONE' | 'LONG' | 'SHORT'>('NONE');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async () => {
    setIsSimulating(true);
    setResult(null);

    try {
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
      if (!parsed.timeframe) warnings.push('Missing field: timeframe (will use script default)');
      if (!parsed.bar_close_time && !parsed.signal_id) warnings.push('Missing dedup key (bar_close_time or signal_id)');

      const signalType = (parsed.signal_type || '').toUpperCase();
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

      // Simulate execution decision based on current position
      let decision = '';
      let wouldExecute = false;
      const effectiveMode = tradeMode === 'auto' ? detectedMode.toLowerCase() : tradeMode;

      if (errors.length > 0) {
        decision = 'REJECTED — fix errors above';
      } else if (effectiveMode === 'plain') {
        if (signalType === 'BUY') {
          if (currentPosition === 'LONG') { decision = 'IGNORE — Already LONG'; }
          else if (currentPosition === 'SHORT') { decision = 'FLIP — Cancel orders → Close SHORT → Confirm NONE → Open LONG'; wouldExecute = true; }
          else { decision = 'OPEN LONG'; wouldExecute = true; }
        } else if (signalType === 'SELL') {
          if (currentPosition === 'SHORT') { decision = 'IGNORE — Already SHORT'; }
          else if (currentPosition === 'LONG') { decision = 'FLIP — Cancel orders → Close LONG → Confirm NONE → Open SHORT'; wouldExecute = true; }
          else { decision = 'OPEN SHORT'; wouldExecute = true; }
        }
      } else if (effectiveMode === 'strategy') {
        switch (signalType) {
          case 'BUY_OPEN':
            if (currentPosition === 'LONG') { decision = 'IGNORE — Already LONG'; }
            else if (currentPosition === 'SHORT') {
              if (oppositePolicy === 'flip') { decision = 'FLIP (policy=flip) — Close SHORT → Open LONG'; wouldExecute = true; }
              else { decision = 'REJECT (policy=reject) — Opposite SHORT exists. Wait for SELL_EXIT.'; }
            } else { decision = 'OPEN LONG'; wouldExecute = true; }
            break;
          case 'BUY_EXIT':
            if (currentPosition === 'LONG') { decision = 'CLOSE LONG — Cancel orders → Close → Confirm NONE'; wouldExecute = true; }
            else { decision = 'IGNORE — No LONG position to exit (never opens SHORT)'; }
            break;
          case 'SELL_OPEN':
            if (currentPosition === 'SHORT') { decision = 'IGNORE — Already SHORT'; }
            else if (currentPosition === 'LONG') {
              if (oppositePolicy === 'flip') { decision = 'FLIP (policy=flip) — Close LONG → Open SHORT'; wouldExecute = true; }
              else { decision = 'REJECT (policy=reject) — Opposite LONG exists. Wait for BUY_EXIT.'; }
            } else { decision = 'OPEN SHORT'; wouldExecute = true; }
            break;
          case 'SELL_EXIT':
            if (currentPosition === 'SHORT') { decision = 'CLOSE SHORT — Cancel orders → Close → Confirm NONE'; wouldExecute = true; }
            else { decision = 'IGNORE — No SHORT position to exit (never opens LONG)'; }
            break;
        }
      }

      setResult({
        valid: errors.length === 0,
        detected_mode: detectedMode,
        signals_found: signalType ? [signalType] : [],
        decision,
        errors,
        warnings,
        wouldExecute,
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
      const parsed = JSON.parse(sample);
      parsed.symbol = symbol;
      parsed.timeframe = timeframe;
      parsed.bar_close_time = Date.now();
      setPayload(JSON.stringify(parsed, null, 2));
      setResult(null);
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
          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => loadSample('strategy_buy_exit')}>BUY_EXIT</Button>
          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => loadSample('strategy_sell_open')}>SELL_OPEN</Button>
          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => loadSample('strategy_sell_exit')}>SELL_EXIT</Button>
        </div>

        <Textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="font-mono text-xs min-h-[120px]"
          placeholder='{"signal_type": "BUY", "symbol": "BTCUSDT", "timeframe": "1h", "bar_close_time": 1234567890}'
        />

        {/* Current position selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Simulated Position:</span>
          <Select value={currentPosition} onValueChange={(v) => { setCurrentPosition(v as any); setResult(null); }}>
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">NONE</SelectItem>
              <SelectItem value="LONG">LONG</SelectItem>
              <SelectItem value="SHORT">SHORT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Mode: {tradeMode.toUpperCase()}
          </Badge>
          {tradeMode === 'strategy' && (
            <Badge variant="outline" className="text-xs">
              Opposite: {oppositePolicy.toUpperCase()}
            </Badge>
          )}
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
          <div className={`p-3 rounded-lg border ${result.valid ? (result.wouldExecute ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5') : 'border-destructive/30 bg-destructive/5'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.valid ? (
                result.wouldExecute ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm font-medium">
                {result.valid ? (result.wouldExecute ? 'Would Execute' : 'Valid — No Action') : 'Invalid Signal'}
              </span>
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