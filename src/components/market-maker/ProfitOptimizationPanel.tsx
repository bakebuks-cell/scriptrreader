import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Target, 
  ChevronDown, 
  Save, 
  TrendingUp,
  RefreshCw,
  Zap,
  AlertTriangle,
  BarChart3,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import type { ProfitOptimizationSettings } from '@/types/market-maker-advanced';
import { defaultProfitOptimizationSettings } from '@/types/market-maker-advanced';

interface ProfitOptimizationPanelProps {
  botId: string;
}

export function ProfitOptimizationPanel({ botId }: ProfitOptimizationPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<ProfitOptimizationSettings>(defaultProfitOptimizationSettings);
  const [expandedSections, setExpandedSections] = useState<string[]>(['targets', 'adaptive']);

  useEffect(() => {
    const saved = getModuleConfig('profit_optimization' as any);
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultProfitOptimizationSettings, ...saved } as ProfitOptimizationSettings);
    }
  }, [getModuleConfig]);

  const handleSave = () => {
    saveConfig.mutate({ moduleType: 'profit_optimization' as any, settings: settings as any });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const updateSetting = <K extends keyof ProfitOptimizationSettings>(key: K, value: ProfitOptimizationSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
              <Target className="h-5 w-5 text-primary" />
              Smart Profit Optimization
            </CardTitle>
            <CardDescription>
              Auto-adjust spreads and sizing based on profitability
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
            <Label className="text-base font-semibold">Enable Profit Optimization</Label>
            <p className="text-sm text-muted-foreground">
              Activate smart profit-based adjustments
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
          />
        </div>

        {/* Profit Targets */}
        <Collapsible open={expandedSections.includes('targets')} onOpenChange={() => toggleSection('targets')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium">Profit Targets</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.profitTarget.enabled}
                  onCheckedChange={(checked) => updateSetting('profitTarget', { ...settings.profitTarget, enabled: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('targets') && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Daily Target ($)</Label>
                <Input
                  type="number"
                  value={settings.profitTarget.dailyTarget}
                  onChange={(e) => updateSetting('profitTarget', { ...settings.profitTarget, dailyTarget: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Weekly Target ($)</Label>
                <Input
                  type="number"
                  value={settings.profitTarget.weeklyTarget}
                  onChange={(e) => updateSetting('profitTarget', { ...settings.profitTarget, weeklyTarget: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Target ($)</Label>
                <Input
                  type="number"
                  value={settings.profitTarget.monthlyTarget}
                  onChange={(e) => updateSetting('profitTarget', { ...settings.profitTarget, monthlyTarget: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Action on Target Reach</Label>
                <Select
                  value={settings.profitTarget.actionOnReach}
                  onValueChange={(value: 'widen_spread' | 'reduce_size' | 'pause' | 'continue') => updateSetting('profitTarget', { ...settings.profitTarget, actionOnReach: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="widen_spread">Widen Spread</SelectItem>
                    <SelectItem value="reduce_size">Reduce Size</SelectItem>
                    <SelectItem value="pause">Pause Trading</SelectItem>
                    <SelectItem value="continue">Continue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Spread Multiplier on Reach</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.profitTarget.spreadMultiplierOnReach}
                  onChange={(e) => updateSetting('profitTarget', { ...settings.profitTarget, spreadMultiplierOnReach: Number(e.target.value) })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Spread Optimization */}
        <Collapsible open={expandedSections.includes('spread')} onOpenChange={() => toggleSection('spread')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-medium">Spread Auto-Optimization</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('spread') && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <Label>Auto-Widen After Profit</Label>
                <Switch
                  checked={settings.spreadOptimization.autoWideningEnabled}
                  onCheckedChange={(checked) => updateSetting('spreadOptimization', { ...settings.spreadOptimization, autoWideningEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <Label>Auto-Narrow on Inactivity</Label>
                <Switch
                  checked={settings.spreadOptimization.autoNarrowingEnabled}
                  onCheckedChange={(checked) => updateSetting('spreadOptimization', { ...settings.spreadOptimization, autoNarrowingEnabled: checked })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Widening Trigger Profit ($)</Label>
                <Input
                  type="number"
                  value={settings.spreadOptimization.wideningTriggerProfit}
                  onChange={(e) => updateSetting('spreadOptimization', { ...settings.spreadOptimization, wideningTriggerProfit: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Inactivity Threshold (min)</Label>
                <Input
                  type="number"
                  value={settings.spreadOptimization.narrowingInactivityMinutes}
                  onChange={(e) => updateSetting('spreadOptimization', { ...settings.spreadOptimization, narrowingInactivityMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Spread Floor (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.spreadOptimization.minSpreadFloor}
                  onChange={(e) => updateSetting('spreadOptimization', { ...settings.spreadOptimization, minSpreadFloor: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Spread Ceiling (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.spreadOptimization.maxSpreadCeiling}
                  onChange={(e) => updateSetting('spreadOptimization', { ...settings.spreadOptimization, maxSpreadCeiling: Number(e.target.value) })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Adaptive Spread */}
        <Collapsible open={expandedSections.includes('adaptive')} onOpenChange={() => toggleSection('adaptive')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-medium">Adaptive Spread (Profitability-Based)</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.adaptiveSpread.enabled}
                  onCheckedChange={(checked) => updateSetting('adaptiveSpread', { ...settings.adaptiveSpread, enabled: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('adaptive') && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Profitability Window</Label>
                <Select
                  value={settings.adaptiveSpread.profitabilityWindow}
                  onValueChange={(value: 'hourly' | 'daily' | 'weekly') => updateSetting('adaptiveSpread', { ...settings.adaptiveSpread, profitabilityWindow: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Adjustment Interval (min)</Label>
                <Input
                  type="number"
                  value={settings.adaptiveSpread.adjustmentIntervalMinutes}
                  onChange={(e) => updateSetting('adaptiveSpread', { ...settings.adaptiveSpread, adjustmentIntervalMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Profitable Spread Multiplier</Label>
                <Slider
                  value={[settings.adaptiveSpread.profitableSpreadMultiplier]}
                  onValueChange={([value]) => updateSetting('adaptiveSpread', { ...settings.adaptiveSpread, profitableSpreadMultiplier: value })}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">{settings.adaptiveSpread.profitableSpreadMultiplier}x</p>
              </div>
              <div className="space-y-2">
                <Label>Unprofitable Spread Multiplier</Label>
                <Slider
                  value={[settings.adaptiveSpread.unprofitableSpreadMultiplier]}
                  onValueChange={([value]) => updateSetting('adaptiveSpread', { ...settings.adaptiveSpread, unprofitableSpreadMultiplier: value })}
                  min={1}
                  max={2}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">{settings.adaptiveSpread.unprofitableSpreadMultiplier}x</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Low Activity Boost */}
        <Collapsible open={expandedSections.includes('boost')} onOpenChange={() => toggleSection('boost')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">Low Activity Boost Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.lowActivityBoost.enabled}
                  onCheckedChange={(checked) => updateSetting('lowActivityBoost', { ...settings.lowActivityBoost, enabled: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('boost') && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inactivity Threshold (min)</Label>
                <Input
                  type="number"
                  value={settings.lowActivityBoost.inactivityThresholdMinutes}
                  onChange={(e) => updateSetting('lowActivityBoost', { ...settings.lowActivityBoost, inactivityThresholdMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Boost Duration (min)</Label>
                <Input
                  type="number"
                  value={settings.lowActivityBoost.maxBoostDurationMinutes}
                  onChange={(e) => updateSetting('lowActivityBoost', { ...settings.lowActivityBoost, maxBoostDurationMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Spread Reduction (%)</Label>
                <Slider
                  value={[settings.lowActivityBoost.boostSpreadReduction]}
                  onValueChange={([value]) => updateSetting('lowActivityBoost', { ...settings.lowActivityBoost, boostSpreadReduction: value })}
                  min={5}
                  max={50}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">{settings.lowActivityBoost.boostSpreadReduction}%</p>
              </div>
              <div className="space-y-2">
                <Label>Size Increase (%)</Label>
                <Slider
                  value={[settings.lowActivityBoost.boostSizeIncrease]}
                  onValueChange={([value]) => updateSetting('lowActivityBoost', { ...settings.lowActivityBoost, boostSizeIncrease: value })}
                  min={5}
                  max={50}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">{settings.lowActivityBoost.boostSizeIncrease}%</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Drawdown Recovery */}
        <Collapsible open={expandedSections.includes('recovery')} onOpenChange={() => toggleSection('recovery')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-primary" />
                <span className="font-medium">Drawdown Recovery Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.drawdownRecovery.enabled}
                  onCheckedChange={(checked) => updateSetting('drawdownRecovery', { ...settings.drawdownRecovery, enabled: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('recovery') && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger Drawdown (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={settings.drawdownRecovery.triggerDrawdownPercent}
                  onChange={(e) => updateSetting('drawdownRecovery', { ...settings.drawdownRecovery, triggerDrawdownPercent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Recovery Mode</Label>
                <Select
                  value={settings.drawdownRecovery.recoveryMode}
                  onValueChange={(value: 'conservative' | 'normal' | 'aggressive') => updateSetting('drawdownRecovery', { ...settings.drawdownRecovery, recoveryMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recovery Target (%)</Label>
                <Input
                  type="number"
                  value={settings.drawdownRecovery.recoveryTargetPercent}
                  onChange={(e) => updateSetting('drawdownRecovery', { ...settings.drawdownRecovery, recoveryTargetPercent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Recovery Duration (hrs)</Label>
                <Input
                  type="number"
                  value={settings.drawdownRecovery.maxRecoveryDurationHours}
                  onChange={(e) => updateSetting('drawdownRecovery', { ...settings.drawdownRecovery, maxRecoveryDurationHours: Number(e.target.value) })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Loss Prevention */}
        <Collapsible open={expandedSections.includes('loss')} onOpenChange={() => toggleSection('loss')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span className="font-medium">Auto-Pause on Losses</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.lossPrevention.enabled}
                  onCheckedChange={(checked) => updateSetting('lossPrevention', { ...settings.lossPrevention, enabled: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('loss') && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Consecutive Loss Limit</Label>
                <Input
                  type="number"
                  value={settings.lossPrevention.consecutiveLossLimit}
                  onChange={(e) => updateSetting('lossPrevention', { ...settings.lossPrevention, consecutiveLossLimit: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Loss Period (min)</Label>
                <Input
                  type="number"
                  value={settings.lossPrevention.lossPeriodMinutes}
                  onChange={(e) => updateSetting('lossPrevention', { ...settings.lossPrevention, lossPeriodMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Action on Limit</Label>
                <Select
                  value={settings.lossPrevention.actionOnLimit}
                  onValueChange={(value: 'pause' | 'widen_spread' | 'reduce_size') => updateSetting('lossPrevention', { ...settings.lossPrevention, actionOnLimit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pause">Pause</SelectItem>
                    <SelectItem value="widen_spread">Widen Spread</SelectItem>
                    <SelectItem value="reduce_size">Reduce Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pause Duration (min)</Label>
                <Input
                  type="number"
                  value={settings.lossPrevention.pauseDurationMinutes}
                  onChange={(e) => updateSetting('lossPrevention', { ...settings.lossPrevention, pauseDurationMinutes: Number(e.target.value) })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Capital Rotation */}
        <Collapsible open={expandedSections.includes('rotation')} onOpenChange={() => toggleSection('rotation')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium">Capital Rotation Between Pairs</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.capitalRotation.enabled}
                  onCheckedChange={(checked) => updateSetting('capitalRotation', { ...settings.capitalRotation, enabled: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('rotation') && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rotation Mode</Label>
                <Select
                  value={settings.capitalRotation.rotationMode}
                  onValueChange={(value: 'performance' | 'volatility' | 'balanced') => updateSetting('capitalRotation', { ...settings.capitalRotation, rotationMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance-Based</SelectItem>
                    <SelectItem value="volatility">Volatility-Based</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rebalance Interval (min)</Label>
                <Input
                  type="number"
                  value={settings.capitalRotation.rebalanceIntervalMinutes}
                  onChange={(e) => updateSetting('capitalRotation', { ...settings.capitalRotation, rebalanceIntervalMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Allocation (%)</Label>
                <Input
                  type="number"
                  value={settings.capitalRotation.minAllocationPercent}
                  onChange={(e) => updateSetting('capitalRotation', { ...settings.capitalRotation, minAllocationPercent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Allocation (%)</Label>
                <Input
                  type="number"
                  value={settings.capitalRotation.maxAllocationPercent}
                  onChange={(e) => updateSetting('capitalRotation', { ...settings.capitalRotation, maxAllocationPercent: Number(e.target.value) })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
