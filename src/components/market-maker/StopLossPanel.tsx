import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, HelpCircle, AlertTriangle, TrendingDown, Zap, Target } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  StopLossSettings,
  defaultDrawdownSettings,
  defaultEmergencySettings,
} from '@/types/market-maker';

interface StopLossPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const defaultSettings: StopLossSettings = {
  enabled: false,
  upperLimitPrice: 0,
  lowerLimitPrice: 0,
  cancelMarketMakers: false,
  allowRevertRetry: false,
  drawdown: defaultDrawdownSettings,
  emergency: defaultEmergencySettings,
  trailingStop: false,
  trailingStopPercent: 2,
  breakEvenTrigger: 0,
  partialExitLevels: [],
};

export function StopLossPanel({ botId, onSave, onCancel }: StopLossPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<StopLossSettings>(defaultSettings);

  useEffect(() => {
    const saved = getModuleConfig('stop_loss') as Partial<StopLossSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({
        ...defaultSettings,
        ...saved,
        drawdown: { ...defaultDrawdownSettings, ...saved.drawdown },
        emergency: { ...defaultEmergencySettings, ...saved.emergency },
      });
    }
  }, [configLoading]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'stop_loss',
      settings: settings as unknown as Record<string, unknown>,
    });
    onSave?.();
  };

  const updateDrawdown = (field: keyof typeof settings.drawdown, value: any) => {
    setSettings({
      ...settings,
      drawdown: { ...settings.drawdown, [field]: value },
    });
  };

  const updateEmergency = (field: keyof typeof settings.emergency, value: any) => {
    setSettings({
      ...settings,
      emergency: { ...settings.emergency, [field]: value },
    });
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Stop-Loss
          </CardTitle>
          <CardDescription>
            Configure range-based stop loss, drawdown protection, and emergency liquidation.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saveConfig.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Enable */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <Label className="text-base font-semibold">Enable Stop-Loss</Label>
            <p className="text-sm text-muted-foreground">
              Activate stop-loss protection for your trades
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Price Range Stop-Loss */}
            <div className="p-4 border border-border rounded-lg space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Price Range Limits</Label>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    Upper Limit Price
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Stop trading if price exceeds this value</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={settings.upperLimitPrice || ''}
                    onChange={(e) => setSettings({ ...settings, upperLimitPrice: parseFloat(e.target.value) || 0 })}
                    className="bg-muted/50"
                    placeholder="Enter upper limit"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    Lower Limit Price
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Stop trading if price falls below this value</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={settings.lowerLimitPrice || ''}
                    onChange={(e) => setSettings({ ...settings, lowerLimitPrice: parseFloat(e.target.value) || 0 })}
                    className="bg-muted/50"
                    placeholder="Enter lower limit"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.cancelMarketMakers}
                    onCheckedChange={(checked) => setSettings({ ...settings, cancelMarketMakers: checked })}
                  />
                  <Label className="text-sm">Cancel all maker orders</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.allowRevertRetry}
                    onCheckedChange={(checked) => setSettings({ ...settings, allowRevertRetry: checked })}
                  />
                  <Label className="text-sm">Allow revert/retry</Label>
                </div>
              </div>
            </div>

            {/* Trailing Stop */}
            <div className="p-4 border border-border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <Label className="font-semibold">Trailing Stop</Label>
                </div>
                <Switch
                  checked={settings.trailingStop}
                  onCheckedChange={(checked) => setSettings({ ...settings, trailingStop: checked })}
                />
              </div>

              {settings.trailingStop && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Trailing Distance (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.trailingStopPercent}
                      onChange={(e) => setSettings({ ...settings, trailingStopPercent: parseFloat(e.target.value) || 2 })}
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Break-Even Trigger (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings.breakEvenTrigger}
                      onChange={(e) => setSettings({ ...settings, breakEvenTrigger: parseFloat(e.target.value) || 0 })}
                      className="bg-muted/50"
                      placeholder="0 = disabled"
                    />
                  </div>
                </div>
              )}
            </div>

            <Accordion type="multiple" defaultValue={[]} className="space-y-4">
              {/* Drawdown Settings */}
              <AccordionItem value="drawdown" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="font-semibold">Drawdown Protection</span>
                    <Badge variant={settings.drawdown.enabled ? "destructive" : "secondary"}>
                      {settings.drawdown.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                      Drawdown protection automatically halts trading when losses exceed threshold.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center gap-4">
                    <Switch
                      checked={settings.drawdown.enabled}
                      onCheckedChange={(checked) => updateDrawdown('enabled', checked)}
                    />
                    <Label>Enable Drawdown Protection</Label>
                  </div>

                  {settings.drawdown.enabled && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Max Drawdown (%)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={settings.drawdown.maxDrawdownPercent}
                          onChange={(e) => updateDrawdown('maxDrawdownPercent', parseFloat(e.target.value) || 5)}
                          className="bg-muted/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Time Window (min)</Label>
                        <Input
                          type="number"
                          min={5}
                          value={settings.drawdown.windowMinutes}
                          onChange={(e) => updateDrawdown('windowMinutes', parseInt(e.target.value) || 60)}
                          className="bg-muted/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Action on Trigger</Label>
                        <Select
                          value={settings.drawdown.action}
                          onValueChange={(value: 'pause' | 'stop' | 'reduce_size') => updateDrawdown('action', value)}
                        >
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pause">Pause Trading</SelectItem>
                            <SelectItem value="stop">Stop Completely</SelectItem>
                            <SelectItem value="reduce_size">Reduce Position Size</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {settings.drawdown.action === 'reduce_size' && (
                        <div className="space-y-2">
                          <Label className="text-sm">Reduction (%)</Label>
                          <Input
                            type="number"
                            min={10}
                            max={90}
                            value={settings.drawdown.reductionPercent}
                            onChange={(e) => updateDrawdown('reductionPercent', parseInt(e.target.value) || 50)}
                            className="bg-muted/50"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm">Cooldown (min)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={settings.drawdown.cooldownMinutes}
                          onChange={(e) => updateDrawdown('cooldownMinutes', parseInt(e.target.value) || 30)}
                          className="bg-muted/50"
                        />
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Emergency Liquidation */}
              <AccordionItem value="emergency" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-destructive" />
                    <span className="font-semibold">Emergency Liquidation</span>
                    <Badge variant={settings.emergency.enabled ? "destructive" : "secondary"}>
                      {settings.emergency.enabled ? 'Armed' : 'Disabled'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <Zap className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                      <strong>WARNING:</strong> Emergency liquidation will immediately close all positions at market price.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center gap-4">
                    <Switch
                      checked={settings.emergency.enabled}
                      onCheckedChange={(checked) => updateEmergency('enabled', checked)}
                    />
                    <Label>Enable Emergency Liquidation</Label>
                  </div>

                  {settings.emergency.enabled && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Trigger Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={settings.emergency.triggerPrice || ''}
                          onChange={(e) => updateEmergency('triggerPrice', parseFloat(e.target.value) || 0)}
                          className="bg-muted/50"
                          placeholder="Price trigger"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Trigger When</Label>
                        <Select
                          value={settings.emergency.triggerType}
                          onValueChange={(value: 'above' | 'below') => updateEmergency('triggerType', value)}
                        >
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="above">Price Above</SelectItem>
                            <SelectItem value="below">Price Below</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Action</Label>
                        <Select
                          value={settings.emergency.action}
                          onValueChange={(value: 'liquidate_all' | 'cancel_all' | 'hedge') => updateEmergency('action', value)}
                        >
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="liquidate_all">Liquidate All</SelectItem>
                            <SelectItem value="cancel_all">Cancel All Orders</SelectItem>
                            <SelectItem value="hedge">Hedge Position</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-3 col-span-full">
                        <Switch
                          checked={settings.emergency.notifyOnTrigger}
                          onCheckedChange={(checked) => updateEmergency('notifyOnTrigger', checked)}
                        />
                        <Label className="text-sm">Send notification on trigger</Label>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  );
}
