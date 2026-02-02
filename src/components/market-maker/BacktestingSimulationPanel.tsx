import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  History,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Settings2,
  BarChart3,
  Target,
  Loader2
} from 'lucide-react';

interface BacktestingSimulationPanelProps {
  botId: string;
}

interface SimulationResult {
  totalTrades: number;
  winRate: number;
  netPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  avgTradeTime: string;
  profitFactor: number;
}

export default function BacktestingSimulationPanel({ botId }: BacktestingSimulationPanelProps) {
  const [isHistoricalOpen, setIsHistoricalOpen] = useState(true);
  const [isStressTestOpen, setIsStressTestOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulationMode, setSimulationMode] = useState<'historical' | 'stress' | 'optimizer'>('historical');
  
  // Historical Replay Settings
  const [historicalPair, setHistoricalPair] = useState('BTCUSDT');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [playbackSpeed, setPlaybackSpeed] = useState([10]);
  const [includeSlippage, setIncludeSlippage] = useState(true);
  const [includeFees, setIncludeFees] = useState(true);
  const [slippagePercent, setSlippagePercent] = useState('0.05');
  const [feePercent, setFeePercent] = useState('0.1');
  
  // Stress Test Settings
  const [stressScenario, setStressScenario] = useState<'flash_crash' | 'volatility_spike' | 'liquidity_drain' | 'custom'>('flash_crash');
  const [crashPercent, setCrashPercent] = useState('30');
  const [crashDuration, setCrashDuration] = useState('60');
  const [volatilityMultiplier, setVolatilityMultiplier] = useState([3]);
  const [liquidityDrop, setLiquidityDrop] = useState([80]);
  
  // Parameter Optimizer Settings
  const [optimizeSpread, setOptimizeSpread] = useState(true);
  const [optimizeLayers, setOptimizeLayers] = useState(true);
  const [optimizeSize, setOptimizeSize] = useState(false);
  const [optimizeTarget, setOptimizeTarget] = useState<'profit' | 'sharpe' | 'drawdown'>('profit');
  const [iterations, setIterations] = useState('1000');
  
  // Simulation Results
  const [results, setResults] = useState<SimulationResult | null>(null);

  const runSimulation = () => {
    setIsRunning(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          // Generate mock results
          setResults({
            totalTrades: Math.floor(Math.random() * 500) + 100,
            winRate: 45 + Math.random() * 20,
            netPnL: (Math.random() - 0.3) * 5000,
            maxDrawdown: Math.random() * 15 + 5,
            sharpeRatio: Math.random() * 2 + 0.5,
            avgTradeTime: `${Math.floor(Math.random() * 10) + 1}m ${Math.floor(Math.random() * 60)}s`,
            profitFactor: Math.random() * 1.5 + 0.8,
          });
          return 100;
        }
        return prev + Math.random() * 5 + 1;
      });
    }, 100);
  };

  const resetSimulation = () => {
    setProgress(0);
    setResults(null);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Backtesting & Simulation
          </CardTitle>
          <CardDescription>
            Test your Market Maker strategy before going live
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={simulationMode === 'historical' ? 'default' : 'outline'}
              onClick={() => setSimulationMode('historical')}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Historical
            </Button>
            <Button
              variant={simulationMode === 'stress' ? 'default' : 'outline'}
              onClick={() => setSimulationMode('stress')}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Stress Test
            </Button>
            <Button
              variant={simulationMode === 'optimizer' ? 'default' : 'outline'}
              onClick={() => setSimulationMode('optimizer')}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Optimizer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historical Replay */}
      {simulationMode === 'historical' && (
        <Card>
          <Collapsible open={isHistoricalOpen} onOpenChange={setIsHistoricalOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    <CardTitle>Historical Replay</CardTitle>
                  </div>
                  {isHistoricalOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                <CardDescription>Replay historical market data with your strategy</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trading Pair</Label>
                    <Select value={historicalPair} onValueChange={setHistoricalPair}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                        <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                        <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                        <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Playback Speed</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={playbackSpeed}
                        onValueChange={setPlaybackSpeed}
                        min={1}
                        max={100}
                        step={1}
                      />
                      <span className="text-sm font-medium w-12">{playbackSpeed[0]}x</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label>Include Slippage</Label>
                      <p className="text-xs text-muted-foreground">Simulate real execution</p>
                    </div>
                    <Switch
                      checked={includeSlippage}
                      onCheckedChange={setIncludeSlippage}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label>Include Fees</Label>
                      <p className="text-xs text-muted-foreground">Maker/taker fees</p>
                    </div>
                    <Switch
                      checked={includeFees}
                      onCheckedChange={setIncludeFees}
                    />
                  </div>
                </div>

                {(includeSlippage || includeFees) && (
                  <div className="grid grid-cols-2 gap-4">
                    {includeSlippage && (
                      <div className="space-y-2">
                        <Label>Slippage %</Label>
                        <Input
                          type="number"
                          value={slippagePercent}
                          onChange={(e) => setSlippagePercent(e.target.value)}
                          step="0.01"
                        />
                      </div>
                    )}
                    {includeFees && (
                      <div className="space-y-2">
                        <Label>Fee %</Label>
                        <Input
                          type="number"
                          value={feePercent}
                          onChange={(e) => setFeePercent(e.target.value)}
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Stress Testing */}
      {simulationMode === 'stress' && (
        <Card>
          <Collapsible open={isStressTestOpen} onOpenChange={setIsStressTestOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    <CardTitle>Strategy Stress Testing</CardTitle>
                  </div>
                  {isStressTestOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                <CardDescription>Test how your strategy performs under extreme conditions</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Stress Scenario</Label>
                  <Select value={stressScenario} onValueChange={(v: any) => setStressScenario(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flash_crash">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-destructive" />
                          Flash Crash
                        </div>
                      </SelectItem>
                      <SelectItem value="volatility_spike">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-orange-500" />
                          Volatility Spike
                        </div>
                      </SelectItem>
                      <SelectItem value="liquidity_drain">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          Liquidity Drain
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4" />
                          Custom Scenario
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {stressScenario === 'flash_crash' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Crash Severity (%)</Label>
                      <Input
                        type="number"
                        value={crashPercent}
                        onChange={(e) => setCrashPercent(e.target.value)}
                        min="5"
                        max="80"
                      />
                      <p className="text-xs text-muted-foreground">Price drop percentage</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={crashDuration}
                        onChange={(e) => setCrashDuration(e.target.value)}
                        min="10"
                        max="3600"
                      />
                      <p className="text-xs text-muted-foreground">How long the crash lasts</p>
                    </div>
                  </div>
                )}

                {stressScenario === 'volatility_spike' && (
                  <div className="space-y-2">
                    <Label>Volatility Multiplier: {volatilityMultiplier[0]}x</Label>
                    <Slider
                      value={volatilityMultiplier}
                      onValueChange={setVolatilityMultiplier}
                      min={2}
                      max={10}
                      step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Simulates {volatilityMultiplier[0]}x normal market volatility
                    </p>
                  </div>
                )}

                {stressScenario === 'liquidity_drain' && (
                  <div className="space-y-2">
                    <Label>Liquidity Reduction: {liquidityDrop[0]}%</Label>
                    <Slider
                      value={liquidityDrop}
                      onValueChange={setLiquidityDrop}
                      min={50}
                      max={99}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Order book depth reduced by {liquidityDrop[0]}%
                    </p>
                  </div>
                )}

                {stressScenario === 'custom' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Price Drop %</Label>
                      <Input type="number" value={crashPercent} onChange={(e) => setCrashPercent(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Vol Multiplier</Label>
                      <Input type="number" value={volatilityMultiplier[0]} onChange={(e) => setVolatilityMultiplier([parseFloat(e.target.value)])} />
                    </div>
                    <div className="space-y-2">
                      <Label>Liquidity %</Label>
                      <Input type="number" value={100 - liquidityDrop[0]} onChange={(e) => setLiquidityDrop([100 - parseFloat(e.target.value)])} />
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Parameter Optimizer */}
      {simulationMode === 'optimizer' && (
        <Card>
          <Collapsible open={isOptimizerOpen} onOpenChange={setIsOptimizerOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <CardTitle>Parameter Optimizer</CardTitle>
                  </div>
                  {isOptimizerOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                <CardDescription>Find optimal parameters for your strategy</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Optimization Target</Label>
                  <Select value={optimizeTarget} onValueChange={(v: any) => setOptimizeTarget(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profit">Maximum Profit</SelectItem>
                      <SelectItem value="sharpe">Best Sharpe Ratio</SelectItem>
                      <SelectItem value="drawdown">Minimum Drawdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Label className="text-sm font-medium">Parameters to Optimize</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label>Spread</Label>
                    <Switch
                      checked={optimizeSpread}
                      onCheckedChange={setOptimizeSpread}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label>Layers</Label>
                    <Switch
                      checked={optimizeLayers}
                      onCheckedChange={setOptimizeLayers}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label>Order Size</Label>
                    <Switch
                      checked={optimizeSize}
                      onCheckedChange={setOptimizeSize}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Optimization Iterations</Label>
                  <Input
                    type="number"
                    value={iterations}
                    onChange={(e) => setIterations(e.target.value)}
                    min="100"
                    max="10000"
                  />
                  <p className="text-xs text-muted-foreground">
                    More iterations = better results, but slower
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Simulation Controls */}
      <Card>
        <CardContent className="pt-6">
          {isRunning && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Running simulation...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={runSimulation}
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetSimulation}
              disabled={isRunning}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Simulation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{results.totalTrades}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-green-500">{results.winRate.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Net P&L</p>
                <p className={`text-2xl font-bold ${results.netPnL >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  ${results.netPnL.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Max Drawdown</p>
                <p className="text-2xl font-bold text-orange-500">{results.maxDrawdown.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                <p className="text-2xl font-bold">{results.sharpeRatio.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Profit Factor</p>
                <p className="text-2xl font-bold">{results.profitFactor.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center col-span-2">
                <p className="text-sm text-muted-foreground">Avg Trade Time</p>
                <p className="text-2xl font-bold">{results.avgTradeTime}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Export Results
              </Button>
              <Button className="flex-1">
                Apply to Live Bot
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Banner */}
      <Card className="border-orange-500/50 bg-orange-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-500">Simulation Mode Active</p>
              <p className="text-sm text-muted-foreground">
                All trades are simulated. No real orders will be placed. Results are based on historical data and may not reflect actual future performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
