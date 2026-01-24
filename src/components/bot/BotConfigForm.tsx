import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CANDLE_TYPES, 
  MARKET_TYPES, 
  POSITION_SIZE_TYPES, 
  LEVERAGE_OPTIONS,
  POPULAR_TRADING_PAIRS 
} from '@/lib/constants';
import { 
  CandlestickChart, 
  Layers, 
  Wallet, 
  TrendingUp, 
  Shield,
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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

interface BotConfigFormProps {
  config: BotConfig;
  onChange: (config: BotConfig) => void;
  disabled?: boolean;
}

export default function BotConfigForm({ config, onChange, disabled = false }: BotConfigFormProps) {
  const [customPair, setCustomPair] = useState('');

  const handleChange = <K extends keyof BotConfig>(key: K, value: BotConfig[K]) => {
    onChange({ ...config, [key]: value });
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
      {/* Candle Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CandlestickChart className="h-4 w-4 text-primary" />
            Candle Type
          </CardTitle>
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
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market & Symbol Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Market & Symbol Configuration
          </CardTitle>
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
            <div className="flex gap-2 mt-1">
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
              <Label className="text-xs text-muted-foreground">Trading Pairs</Label>
              <div className="flex items-center gap-2">
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

      {/* Capital & Position Sizing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Capital & Position Sizing
          </CardTitle>
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
                {config.position_size_type === 'fixed' ? 'Amount (USDT)' : 'Percentage (%)'}
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
                Max Capital (USDT)
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

      {/* Leverage & Margin (Futures Only) */}
      {isFutures && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Leverage & Margin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground">Leverage</Label>
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

      {/* Trade Frequency & Safety */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Trade Frequency & Safety
          </CardTitle>
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
