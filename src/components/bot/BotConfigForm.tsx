import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  CANDLE_TYPES, 
  MARKET_TYPES, 
  POSITION_SIZE_TYPES, 
  LEVERAGE_OPTIONS,
  POPULAR_TRADING_PAIRS,
  AVAILABLE_TIMEFRAMES,
  MAX_SYMBOLS_PER_SCRIPT
} from '@/lib/constants';
import { 
  CandlestickChart, 
  Layers, 
  Wallet, 
  TrendingUp, 
  Shield,
  Plus,
  X,
  FileCode,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import SymbolMultiSelect from '@/components/SymbolMultiSelect';

export interface BotConfig {
  candle_type: string;
  market_type: string;
  trading_pairs: string[];
  multi_pair_mode: boolean;
  position_size_type: string;
  position_size_value: number;
  max_capital: number;
  leverage: number;
  max_trades_per_day: number;
}

export interface StrategyConfig {
  name: string;
  description: string;
  symbol: string;
  symbols: string[];
  script_content: string;
  allowed_timeframes: string[];
  is_active: boolean;
}

interface BotConfigFormProps {
  config: BotConfig;
  onChange: (config: BotConfig) => void;
  strategyConfig?: StrategyConfig;
  onStrategyChange?: (config: StrategyConfig) => void;
  disabled?: boolean;
  showStrategySection?: boolean;
}

const DEFAULT_PINE_SCRIPT = `// PineTrader Strategy Template
// Customize your entry, exit, SL, and TP logic below

//@version=5
strategy("My Strategy", overlay=true)

// Input parameters
fastLength = input.int(12, "Fast MA Length")
slowLength = input.int(26, "Slow MA Length")
stopLossPercent = input.float(2.0, "Stop Loss %")
takeProfitPercent = input.float(4.0, "Take Profit %")

// Calculate indicators
fastMA = ta.ema(close, fastLength)
slowMA = ta.ema(close, slowLength)

// Entry conditions
longCondition = ta.crossover(fastMA, slowMA)
shortCondition = ta.crossunder(fastMA, slowMA)

// Calculate SL/TP levels
longSL = close * (1 - stopLossPercent / 100)
longTP = close * (1 + takeProfitPercent / 100)
shortSL = close * (1 + stopLossPercent / 100)
shortTP = close * (1 - takeProfitPercent / 100)

// Execute trades
if longCondition
    strategy.entry("Long", strategy.long)
    strategy.exit("Long Exit", "Long", stop=longSL, limit=longTP)

if shortCondition
    strategy.entry("Short", strategy.short)
    strategy.exit("Short Exit", "Short", stop=shortSL, limit=shortTP)

// Plot indicators
plot(fastMA, color=color.blue, title="Fast MA")
plot(slowMA, color=color.red, title="Slow MA")
`;

export default function BotConfigForm({ 
  config, 
  onChange, 
  strategyConfig,
  onStrategyChange,
  disabled = false,
  showStrategySection = false
}: BotConfigFormProps) {
  const [customPair, setCustomPair] = useState('');
  const [copied, setCopied] = useState(false);

  const handleChange = <K extends keyof BotConfig>(key: K, value: BotConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleStrategyFieldChange = <K extends keyof StrategyConfig>(key: K, value: StrategyConfig[K]) => {
    if (onStrategyChange && strategyConfig) {
      onStrategyChange({ ...strategyConfig, [key]: value });
    }
  };

  const handleTimeframeChange = (timeframe: string, checked: boolean) => {
    if (!strategyConfig || !onStrategyChange) return;
    if (checked) {
      onStrategyChange({
        ...strategyConfig,
        allowed_timeframes: [...strategyConfig.allowed_timeframes, timeframe]
      });
    } else {
      onStrategyChange({
        ...strategyConfig,
        allowed_timeframes: strategyConfig.allowed_timeframes.filter(t => t !== timeframe)
      });
    }
  };

  const handleCopyScript = async () => {
    if (strategyConfig) {
      await navigator.clipboard.writeText(strategyConfig.script_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addTradingPair = (pair: string) => {
    const normalizedPair = pair.toUpperCase().trim();
    if (normalizedPair && !config.trading_pairs.includes(normalizedPair)) {
      handleChange('trading_pairs', [...config.trading_pairs, normalizedPair]);
    }
    setCustomPair('');
  };

  const removeTradingPair = (pair: string) => {
    if (config.trading_pairs.length > 1) {
      handleChange('trading_pairs', config.trading_pairs.filter(p => p !== pair));
    }
  };

  const isFutures = config.market_type !== 'spot';

  return (
    <div className="space-y-6">
      {/* Section 1: Strategy & Signal Settings */}
      {showStrategySection && strategyConfig && onStrategyChange && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">1</Badge>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                Strategy & Signal Settings
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Pine Script strategy upload or paste
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="strategy-name" className="text-xs text-muted-foreground">Strategy Name *</Label>
              <Input
                id="strategy-name"
                value={strategyConfig.name}
                onChange={(e) => handleStrategyFieldChange('name', e.target.value)}
                placeholder="My Strategy"
                disabled={disabled}
              />
            </div>

            <SymbolMultiSelect
              value={strategyConfig.symbols || [strategyConfig.symbol]}
              onChange={(symbols) => {
                onStrategyChange?.({
                  ...strategyConfig,
                  symbols,
                  symbol: symbols[0] || 'BTCUSDT'
                });
                // Sync with bot config trading_pairs
                onChange({
                  ...config,
                  trading_pairs: symbols,
                  multi_pair_mode: symbols.length > 1
                });
              }}
              disabled={disabled}
              label="Trading Symbols"
              placeholder="Select 1-10 symbols..."
            />

            <div>
              <Label htmlFor="description" className="text-xs text-muted-foreground">Description (optional)</Label>
              <Input
                id="description"
                value={strategyConfig.description}
                onChange={(e) => handleStrategyFieldChange('description', e.target.value)}
                placeholder="Brief description of your strategy"
                disabled={disabled}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Allowed Timeframes (must match script)</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {AVAILABLE_TIMEFRAMES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-accent cursor-pointer">
                    <Checkbox
                      checked={strategyConfig.allowed_timeframes.includes(value)}
                      onCheckedChange={(checked) => handleTimeframeChange(value, checked as boolean)}
                      disabled={disabled}
                    />
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="script" className="text-xs text-muted-foreground">Pine Script Code</Label>
                <Button variant="ghost" size="sm" onClick={handleCopyScript} disabled={disabled}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Textarea
                id="script"
                value={strategyConfig.script_content}
                onChange={(e) => handleStrategyFieldChange('script_content', e.target.value)}
                className="font-mono text-xs min-h-[200px] bg-accent/30"
                placeholder="Enter your Pine Script code here..."
                disabled={disabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 2: Candle Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">{showStrategySection ? '2' : '1'}</Badge>
            <CardTitle className="text-sm flex items-center gap-2">
              <CandlestickChart className="h-4 w-4 text-primary" />
              Candle Type Selection
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Choose between Regular OHLC or Heikin Ashi candles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {CANDLE_TYPES.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant={config.candle_type === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChange('candle_type', value)}
                disabled={disabled}
                className="flex-1"
              >
                {label}
                {value === 'regular' && <Badge variant="secondary" className="ml-2 text-[10px]">Default</Badge>}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Market & Symbol Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">{showStrategySection ? '3' : '2'}</Badge>
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Market & Symbol Configuration
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Select exchange, market type, and trading pairs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Exchange</Label>
            <div className="mt-1">
              <Badge variant="secondary" className="text-sm">Binance</Badge>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Market Type</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {MARKET_TYPES.map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant={config.market_type === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('market_type', value)}
                  disabled={disabled}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Trading Pair(s)</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Single-pair</span>
                <Switch
                  checked={config.multi_pair_mode}
                  onCheckedChange={(checked) => handleChange('multi_pair_mode', checked)}
                  disabled={disabled}
                />
                <span className="text-xs text-muted-foreground">Multi-pair mode</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {config.trading_pairs.map((pair) => (
                <Badge key={pair} variant="secondary" className="flex items-center gap-1">
                  {pair}
                  {!disabled && config.trading_pairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTradingPair(pair)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>

            {config.multi_pair_mode && !disabled && (
              <div className="flex gap-2">
                <Select onValueChange={addTradingPair}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add trading pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_TRADING_PAIRS.filter(p => !config.trading_pairs.includes(p)).map((pair) => (
                      <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Input
                    value={customPair}
                    onChange={(e) => setCustomPair(e.target.value.toUpperCase())}
                    placeholder="Custom"
                    className="w-24"
                  />
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="outline"
                    onClick={() => addTradingPair(customPair)}
                    disabled={!customPair}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Capital & Position Sizing */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">{showStrategySection ? '4' : '3'}</Badge>
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Capital & Position Sizing
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Configure position size and maximum capital limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Position Size Type</Label>
            <div className="flex gap-2 mt-1">
              {POSITION_SIZE_TYPES.map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant={config.position_size_type === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('position_size_type', value)}
                  disabled={disabled}
                  className="flex-1"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position_size" className="text-xs text-muted-foreground">
                {config.position_size_type === 'fixed' ? 'Fixed Amount (USDT)' : 'Percentage of Wallet (%)'}
              </Label>
              <Input
                id="position_size"
                type="number"
                value={config.position_size_value}
                onChange={(e) => handleChange('position_size_value', parseFloat(e.target.value) || 0)}
                min={config.position_size_type === 'percentage' ? 1 : 10}
                max={config.position_size_type === 'percentage' ? 100 : 1000000}
                step={config.position_size_type === 'percentage' ? 1 : 10}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="max_capital" className="text-xs text-muted-foreground">
                Maximum Capital Limit (USDT)
              </Label>
              <Input
                id="max_capital"
                type="number"
                value={config.max_capital}
                onChange={(e) => handleChange('max_capital', parseFloat(e.target.value) || 0)}
                min={100}
                max={10000000}
                step={100}
                disabled={disabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Leverage & Margin (Futures Only) */}
      {isFutures && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">{showStrategySection ? '5' : '4'}</Badge>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Leverage & Margin
                <Badge variant="destructive" className="text-[10px]">Futures Only</Badge>
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Configure leverage for futures trading
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground">Leverage Selection</Label>
                <Badge variant="outline" className="text-lg font-bold">
                  {config.leverage}x
                </Badge>
              </div>
              <Slider
                value={[LEVERAGE_OPTIONS.indexOf(config.leverage as typeof LEVERAGE_OPTIONS[number]) !== -1 
                  ? LEVERAGE_OPTIONS.indexOf(config.leverage as typeof LEVERAGE_OPTIONS[number])
                  : 0]}
                onValueChange={([index]) => handleChange('leverage', LEVERAGE_OPTIONS[index] ?? 1)}
                min={0}
                max={LEVERAGE_OPTIONS.length - 1}
                step={1}
                disabled={disabled}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1x</span>
                <span>25x</span>
                <span>50x</span>
                <span>100x</span>
                <span>125x</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 6: Trade Frequency & Safety */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">{showStrategySection ? '6' : isFutures ? '5' : '4'}</Badge>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Trade Frequency & Safety
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Set daily trade limits for risk management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Maximum Trades Per Day</Label>
              <Badge variant="outline" className="text-lg font-bold">
                {config.max_trades_per_day}
              </Badge>
            </div>
            <Slider
              value={[config.max_trades_per_day]}
              onValueChange={([value]) => handleChange('max_trades_per_day', value)}
              min={1}
              max={50}
              step={1}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>10</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
