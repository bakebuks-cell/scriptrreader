import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Waves, 
  ChevronDown, 
  Save, 
  TrendingUp,
  TrendingDown,
  Activity,
  Minus,
  AlertTriangle,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import type { MarketRegimeSettings, MarketRegime, RegimePreset } from '@/types/market-maker-advanced';
import { defaultMarketRegimeSettings } from '@/types/market-maker-advanced';

interface MarketRegimePanelProps {
  botId: string;
}

const regimeIcons: Record<MarketRegime, React.ReactNode> = {
  'ranging': <Minus className="h-4 w-4" />,
  'trending_up': <TrendingUp className="h-4 w-4" />,
  'trending_down': <TrendingDown className="h-4 w-4" />,
  'high_volatility': <Activity className="h-4 w-4" />,
  'low_liquidity': <AlertTriangle className="h-4 w-4" />,
  'dead_market': <Gauge className="h-4 w-4" />,
};

const regimeLabels: Record<MarketRegime, string> = {
  'ranging': 'Ranging',
  'trending_up': 'Trending Up',
  'trending_down': 'Trending Down',
  'high_volatility': 'High Volatility',
  'low_liquidity': 'Low Liquidity',
  'dead_market': 'Dead Market',
};

const regimeColors: Record<MarketRegime, string> = {
  'ranging': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  'trending_up': 'bg-green-500/20 text-green-500 border-green-500/30',
  'trending_down': 'bg-red-500/20 text-red-500 border-red-500/30',
  'high_volatility': 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  'low_liquidity': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  'dead_market': 'bg-gray-500/20 text-gray-500 border-gray-500/30',
};

export function MarketRegimePanel({ botId }: MarketRegimePanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<MarketRegimeSettings>(defaultMarketRegimeSettings);
  const [expandedSections, setExpandedSections] = useState<string[]>(['detection', 'presets']);
  const [simulatedRegime, setSimulatedRegime] = useState<MarketRegime>('ranging');

  useEffect(() => {
    const saved = getModuleConfig('market_regime' as any);
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultMarketRegimeSettings, ...saved } as MarketRegimeSettings);
    }
  }, [getModuleConfig]);

  // Simulate regime changes
  useEffect(() => {
    const regimes: MarketRegime[] = ['ranging', 'trending_up', 'trending_down', 'high_volatility', 'low_liquidity'];
    const interval = setInterval(() => {
      setSimulatedRegime(regimes[Math.floor(Math.random() * regimes.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    saveConfig.mutate({ moduleType: 'market_regime' as any, settings: settings as any });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const updateSetting = <K extends keyof MarketRegimeSettings>(key: K, value: MarketRegimeSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePreset = (regime: MarketRegime, updates: Partial<RegimePreset>) => {
    setSettings(prev => ({
      ...prev,
      presets: prev.presets.map(p => 
        p.regime === regime ? { ...p, ...updates } : p
      ),
    }));
  };

  if (configLoading) {
    return <Card className="border-border"><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-primary" />
              Market Regime Detection
            </CardTitle>
            <CardDescription>
              Auto-detect market conditions and adjust strategy accordingly
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saveConfig.isPending} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <Label className="text-base font-semibold">Enable Regime Detection</Label>
            <p className="text-sm text-muted-foreground">
              Automatically detect and adapt to market conditions
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
          />
        </div>

        {/* Current Regime Display */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Current Detected Regime</Label>
            <Badge variant="outline" className="text-xs">Live</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(regimeLabels).map(([regime, label]) => (
              <Badge
                key={regime}
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 transition-all",
                  simulatedRegime === regime 
                    ? regimeColors[regime as MarketRegime] + " border-2"
                    : "opacity-40"
                )}
              >
                {regimeIcons[regime as MarketRegime]}
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Detection Settings */}
        <Collapsible open={expandedSections.includes('detection')} onOpenChange={() => toggleSection('detection')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-medium">Detection Settings</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('detection') && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Detection Interval (sec)</Label>
                <Input
                  type="number"
                  value={settings.detection.detectionIntervalSeconds}
                  onChange={(e) => updateSetting('detection', { ...settings.detection, detectionIntervalSeconds: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lookback Period (min)</Label>
                <Input
                  type="number"
                  value={settings.detection.lookbackPeriodMinutes}
                  onChange={(e) => updateSetting('detection', { ...settings.detection, lookbackPeriodMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmation Period (sec)</Label>
                <Input
                  type="number"
                  value={settings.detection.confirmationPeriodSeconds}
                  onChange={(e) => updateSetting('detection', { ...settings.detection, confirmationPeriodSeconds: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hysteresis (%)</Label>
                <Input
                  type="number"
                  value={settings.detection.hysteresisPercent}
                  onChange={(e) => updateSetting('detection', { ...settings.detection, hysteresisPercent: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Thresholds */}
            <div className="mt-4 space-y-4">
              <Label className="text-sm font-semibold">Detection Thresholds</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Trend Strength Min (ADX)</Label>
                  <Slider
                    value={[settings.detection.thresholds.trendStrengthMin]}
                    onValueChange={([value]) => updateSetting('detection', { 
                      ...settings.detection, 
                      thresholds: { ...settings.detection.thresholds, trendStrengthMin: value } 
                    })}
                    min={10}
                    max={50}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">{settings.detection.thresholds.trendStrengthMin}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">High Volatility Threshold (%)</Label>
                  <Slider
                    value={[settings.detection.thresholds.volatilityHighThreshold]}
                    onValueChange={([value]) => updateSetting('detection', { 
                      ...settings.detection, 
                      thresholds: { ...settings.detection.thresholds, volatilityHighThreshold: value } 
                    })}
                    min={1}
                    max={10}
                    step={0.5}
                  />
                  <p className="text-xs text-muted-foreground">{settings.detection.thresholds.volatilityHighThreshold}%</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Low Volatility Threshold (%)</Label>
                  <Slider
                    value={[settings.detection.thresholds.volatilityLowThreshold]}
                    onValueChange={([value]) => updateSetting('detection', { 
                      ...settings.detection, 
                      thresholds: { ...settings.detection.thresholds, volatilityLowThreshold: value } 
                    })}
                    min={0.1}
                    max={2}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">{settings.detection.thresholds.volatilityLowThreshold}%</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Min Liquidity Volume ($)</Label>
                  <Input
                    type="number"
                    value={settings.detection.thresholds.liquidityMinVolume}
                    onChange={(e) => updateSetting('detection', { 
                      ...settings.detection, 
                      thresholds: { ...settings.detection.thresholds, liquidityMinVolume: Number(e.target.value) } 
                    })}
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Auto-Adjustment Settings */}
        <Collapsible open={expandedSections.includes('adjustment')} onOpenChange={() => toggleSection('adjustment')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Gauge className="h-4 w-4 text-primary" />
                <span className="font-medium">Auto-Adjustment</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('adjustment') && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'adjustSpread', label: 'Spread' },
                { key: 'adjustOrderSize', label: 'Order Size' },
                { key: 'adjustOrderLayers', label: 'Order Layers' },
                { key: 'adjustCancelTiming', label: 'Cancel Timing' },
                { key: 'adjustRiskLimits', label: 'Risk Limits' },
                { key: 'smoothTransition', label: 'Smooth Transition' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <Label className="text-sm">{label}</Label>
                  <Switch
                    checked={settings.autoAdjustment[key as keyof typeof settings.autoAdjustment] as boolean}
                    onCheckedChange={(checked) => updateSetting('autoAdjustment', { ...settings.autoAdjustment, [key]: checked })}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Transition Period (sec)</Label>
              <Slider
                value={[settings.autoAdjustment.transitionPeriodSeconds]}
                onValueChange={([value]) => updateSetting('autoAdjustment', { ...settings.autoAdjustment, transitionPeriodSeconds: value })}
                min={5}
                max={120}
                step={5}
              />
              <p className="text-xs text-muted-foreground">{settings.autoAdjustment.transitionPeriodSeconds} seconds</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Regime Presets */}
        <Collapsible open={expandedSections.includes('presets')} onOpenChange={() => toggleSection('presets')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Waves className="h-4 w-4 text-primary" />
                <span className="font-medium">Regime Presets</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('presets') && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            {settings.presets.map((preset) => (
              <div key={preset.regime} className="p-4 bg-muted/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("px-2 py-1", regimeColors[preset.regime])}>
                      {regimeIcons[preset.regime]}
                      <span className="ml-1">{regimeLabels[preset.regime]}</span>
                    </Badge>
                  </div>
                  <Switch
                    checked={preset.enabled}
                    onCheckedChange={(checked) => updatePreset(preset.regime, { enabled: checked })}
                  />
                </div>
                
                {preset.enabled && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Spread</Label>
                      <Input
                        type="number"
                        step="0.1"
                        className="h-8 text-xs"
                        value={preset.spreadMultiplier}
                        onChange={(e) => updatePreset(preset.regime, { spreadMultiplier: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Size</Label>
                      <Input
                        type="number"
                        step="0.1"
                        className="h-8 text-xs"
                        value={preset.orderSizeMultiplier}
                        onChange={(e) => updatePreset(preset.regime, { orderSizeMultiplier: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Layers</Label>
                      <Input
                        type="number"
                        step="0.1"
                        className="h-8 text-xs"
                        value={preset.layerCountMultiplier}
                        onChange={(e) => updatePreset(preset.regime, { layerCountMultiplier: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Cancel</Label>
                      <Input
                        type="number"
                        step="0.1"
                        className="h-8 text-xs"
                        value={preset.cancelTimeMultiplier}
                        onChange={(e) => updatePreset(preset.regime, { cancelTimeMultiplier: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Risk</Label>
                      <Input
                        type="number"
                        step="0.1"
                        className="h-8 text-xs"
                        value={preset.riskLimitMultiplier}
                        onChange={(e) => updatePreset(preset.regime, { riskLimitMultiplier: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
