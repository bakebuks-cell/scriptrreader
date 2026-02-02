import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X, HelpCircle, Shield, AlertTriangle, TrendingDown, Pause, DollarSign, Package } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  RiskControlSettings,
  defaultRiskControlSettings,
  defaultExposureLimits,
  defaultInventoryCaps,
  defaultSessionLimits,
  defaultAutoPauseTriggers,
} from '@/types/market-maker';

interface RiskControlPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export function RiskControlPanel({ botId, onSave, onCancel }: RiskControlPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<RiskControlSettings>(defaultRiskControlSettings);

  useEffect(() => {
    const saved = getModuleConfig('risk_control') as Partial<RiskControlSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({
        ...defaultRiskControlSettings,
        ...saved,
        exposure: { ...defaultExposureLimits, ...saved.exposure },
        inventory: { ...defaultInventoryCaps, ...saved.inventory },
        session: { ...defaultSessionLimits, ...saved.session },
        autoPause: { ...defaultAutoPauseTriggers, ...saved.autoPause },
      });
    }
  }, [configLoading]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'risk_control',
      settings: settings as unknown as Record<string, unknown>,
    });
    onSave?.();
  };

  const updateExposure = (field: keyof typeof settings.exposure, value: any) => {
    setSettings({
      ...settings,
      exposure: { ...settings.exposure, [field]: value },
    });
  };

  const updateInventory = (field: keyof typeof settings.inventory, value: any) => {
    setSettings({
      ...settings,
      inventory: { ...settings.inventory, [field]: value },
    });
  };

  const updateSession = (field: keyof typeof settings.session, value: any) => {
    setSettings({
      ...settings,
      session: { ...settings.session, [field]: value },
    });
  };

  const updateAutoPause = (field: keyof typeof settings.autoPause, value: any) => {
    setSettings({
      ...settings,
      autoPause: { ...settings.autoPause, [field]: value },
    });
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Risk Control
          </CardTitle>
          <CardDescription>
            Configure exposure limits, inventory caps, session limits, and auto-pause triggers.
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
        {/* Warning Alert */}
        <Alert className="border-primary/50 bg-primary/10">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Risk controls are critical for protecting your capital. Configure these settings carefully.
          </AlertDescription>
        </Alert>

        {/* Master Enable */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <Label className="text-base font-semibold">Enable Risk Control</Label>
            <p className="text-sm text-muted-foreground">
              Activate all risk management features
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        {settings.enabled && (
          <Accordion type="multiple" defaultValue={['exposure', 'autoPause']} className="space-y-4">
            {/* Exposure Limits */}
            <AccordionItem value="exposure" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Exposure Limits</span>
                  <Badge variant={settings.exposure.enabled ? "default" : "secondary"}>
                    {settings.exposure.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={settings.exposure.enabled}
                    onCheckedChange={(checked) => updateExposure('enabled', checked)}
                  />
                  <Label>Enable Exposure Limits</Label>
                </div>

                {settings.exposure.enabled && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        Max Position Size
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-primary" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Maximum position size in base currency</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.exposure.maxPositionSize}
                        onChange={(e) => updateExposure('maxPositionSize', parseFloat(e.target.value) || 0)}
                        className="bg-muted/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Max Position Value (USDT)</Label>
                      <Input
                        type="number"
                        step="100"
                        value={settings.exposure.maxPositionValue}
                        onChange={(e) => updateExposure('maxPositionValue', parseFloat(e.target.value) || 0)}
                        className="bg-muted/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Max Order Size</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.exposure.maxOrderSize}
                        onChange={(e) => updateExposure('maxOrderSize', parseFloat(e.target.value) || 0)}
                        className="bg-muted/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Max Daily Volume (USDT)</Label>
                      <Input
                        type="number"
                        step="1000"
                        value={settings.exposure.maxDailyVolume}
                        onChange={(e) => updateExposure('maxDailyVolume', parseFloat(e.target.value) || 0)}
                        className="bg-muted/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Max Open Orders</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={settings.exposure.maxOpenOrders}
                        onChange={(e) => updateExposure('maxOpenOrders', parseInt(e.target.value) || 10)}
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Inventory Caps */}
            <AccordionItem value="inventory" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Inventory Caps</span>
                  <Badge variant={settings.inventory.enabled ? "default" : "secondary"}>
                    {settings.inventory.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={settings.inventory.enabled}
                    onCheckedChange={(checked) => updateInventory('enabled', checked)}
                  />
                  <Label>Enable Inventory Caps</Label>
                </div>

                {settings.inventory.enabled && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Max Base Holding</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.inventory.maxBaseHolding}
                        onChange={(e) => updateInventory('maxBaseHolding', parseFloat(e.target.value) || 0)}
                        className="bg-muted/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Max Quote Holding (USDT)</Label>
                      <Input
                        type="number"
                        step="1000"
                        value={settings.inventory.maxQuoteHolding}
                        onChange={(e) => updateInventory('maxQuoteHolding', parseFloat(e.target.value) || 0)}
                        className="bg-muted/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Min Base Reserve</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.inventory.minBaseReserve}
                        onChange={(e) => updateInventory('minBaseReserve', parseFloat(e.target.value) || 0)}
                        className="bg-muted/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Min Quote Reserve (USDT)</Label>
                      <Input
                        type="number"
                        step="100"
                        value={settings.inventory.minQuoteReserve}
                        onChange={(e) => updateInventory('minQuoteReserve', parseFloat(e.target.value) || 0)}
                        className="bg-muted/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Alert Threshold (%)</Label>
                      <Input
                        type="number"
                        min={50}
                        max={100}
                        value={settings.inventory.alertThreshold}
                        onChange={(e) => updateInventory('alertThreshold', parseInt(e.target.value) || 80)}
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Session Limits */}
            <AccordionItem value="session" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Session Limits</span>
                  <Badge variant={settings.session.enabled ? "default" : "secondary"}>
                    {settings.session.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={settings.session.enabled}
                    onCheckedChange={(checked) => updateSession('enabled', checked)}
                  />
                  <Label>Enable Session Limits</Label>
                </div>

                {settings.session.enabled && (
                  <>
                    <Alert className="border-destructive/50 bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        Session limits help prevent catastrophic losses. Set these carefully.
                      </AlertDescription>
                    </Alert>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          Max Loss Per Session (USDT)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-primary" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bot will pause when this loss is reached</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Input
                          type="number"
                          step="10"
                          value={settings.session.maxLossPerSession}
                          onChange={(e) => updateSession('maxLossPerSession', parseFloat(e.target.value) || 0)}
                          className="bg-muted/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Max Profit Take (USDT)</Label>
                        <Input
                          type="number"
                          step="10"
                          value={settings.session.maxProfitTakePerSession}
                          onChange={(e) => updateSession('maxProfitTakePerSession', parseFloat(e.target.value) || 0)}
                          className="bg-muted/50"
                          placeholder="0 = disabled"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Session Duration (hours)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={168}
                          value={settings.session.sessionDurationHours}
                          onChange={(e) => updateSession('sessionDurationHours', parseInt(e.target.value) || 24)}
                          className="bg-muted/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Reset Time (HH:MM)</Label>
                        <Input
                          type="time"
                          value={settings.session.resetTime}
                          onChange={(e) => updateSession('resetTime', e.target.value)}
                          className="bg-muted/50"
                        />
                      </div>

                      <div className="flex items-center gap-3 col-span-full">
                        <Switch
                          checked={settings.session.pauseOnLimitReach}
                          onCheckedChange={(checked) => updateSession('pauseOnLimitReach', checked)}
                        />
                        <Label>Pause bot when limit reached</Label>
                      </div>
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Auto-Pause Triggers */}
            <AccordionItem value="autoPause" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Pause className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Auto-Pause Triggers</span>
                  <Badge variant={settings.autoPause.enabled ? "default" : "secondary"}>
                    {settings.autoPause.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={settings.autoPause.enabled}
                    onCheckedChange={(checked) => updateAutoPause('enabled', checked)}
                  />
                  <Label>Enable Auto-Pause Triggers</Label>
                </div>

                {settings.autoPause.enabled && (
                  <div className="space-y-4 pt-2">
                    {/* High Volatility */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/20 rounded-lg">
                      <Switch
                        checked={settings.autoPause.onHighVolatility}
                        onCheckedChange={(checked) => updateAutoPause('onHighVolatility', checked)}
                      />
                      <div className="flex-1">
                        <Label>Pause on High Volatility</Label>
                        <p className="text-xs text-muted-foreground">Stop trading during extreme price swings</p>
                      </div>
                      {settings.autoPause.onHighVolatility && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Threshold:</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={settings.autoPause.volatilityThreshold}
                            onChange={(e) => updateAutoPause('volatilityThreshold', parseFloat(e.target.value) || 5)}
                            className="w-20 h-8 bg-muted/50"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>

                    {/* Low Liquidity */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/20 rounded-lg">
                      <Switch
                        checked={settings.autoPause.onLowLiquidity}
                        onCheckedChange={(checked) => updateAutoPause('onLowLiquidity', checked)}
                      />
                      <div className="flex-1">
                        <Label>Pause on Low Liquidity</Label>
                        <p className="text-xs text-muted-foreground">Stop when order book depth is thin</p>
                      </div>
                      {settings.autoPause.onLowLiquidity && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Min Depth:</Label>
                          <Input
                            type="number"
                            step="100"
                            value={settings.autoPause.liquidityThreshold}
                            onChange={(e) => updateAutoPause('liquidityThreshold', parseFloat(e.target.value) || 1000)}
                            className="w-24 h-8 bg-muted/50"
                          />
                          <span className="text-xs text-muted-foreground">USDT</span>
                        </div>
                      )}
                    </div>

                    {/* API Errors */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/20 rounded-lg">
                      <Switch
                        checked={settings.autoPause.onApiError}
                        onCheckedChange={(checked) => updateAutoPause('onApiError', checked)}
                      />
                      <div className="flex-1">
                        <Label>Pause on API Errors</Label>
                        <p className="text-xs text-muted-foreground">Stop after consecutive API failures</p>
                      </div>
                      {settings.autoPause.onApiError && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">After:</Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={settings.autoPause.apiErrorCount}
                            onChange={(e) => updateAutoPause('apiErrorCount', parseInt(e.target.value) || 5)}
                            className="w-16 h-8 bg-muted/50"
                          />
                          <span className="text-xs text-muted-foreground">errors</span>
                        </div>
                      )}
                    </div>

                    {/* Price Gap */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/20 rounded-lg">
                      <Switch
                        checked={settings.autoPause.onPriceGap}
                        onCheckedChange={(checked) => updateAutoPause('onPriceGap', checked)}
                      />
                      <div className="flex-1">
                        <Label>Pause on Price Gap</Label>
                        <p className="text-xs text-muted-foreground">Stop when price jumps suddenly</p>
                      </div>
                      {settings.autoPause.onPriceGap && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Gap:</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={settings.autoPause.priceGapPercent}
                            onChange={(e) => updateAutoPause('priceGapPercent', parseFloat(e.target.value) || 3)}
                            className="w-20 h-8 bg-muted/50"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Cooldown */}
                    <div className="flex items-center gap-4">
                      <Label className="text-sm">Cooldown after pause (minutes):</Label>
                      <Input
                        type="number"
                        min={1}
                        max={1440}
                        value={settings.autoPause.cooldownMinutes}
                        onChange={(e) => updateAutoPause('cooldownMinutes', parseInt(e.target.value) || 15)}
                        className="w-24 bg-muted/50"
                      />
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Emergency Stop */}
        <Separator />
        <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div>
            <Label className="text-base font-semibold">Emergency Stop</Label>
            <p className="text-sm text-muted-foreground">
              Press ESC key to immediately cancel all orders
            </p>
          </div>
          <Switch
            checked={settings.emergencyStopEnabled}
            onCheckedChange={(checked) => setSettings({ ...settings, emergencyStopEnabled: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
