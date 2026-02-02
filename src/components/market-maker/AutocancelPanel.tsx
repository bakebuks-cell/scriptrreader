import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X, HelpCircle, XCircle, RefreshCcw, Clock, TrendingUp } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AutocancelSettings,
  defaultPartialFillSettings,
  defaultSmartReplacementSettings,
} from '@/types/market-maker';

interface AutocancelPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface TrendCancelAction {
  fromNeutralToDowntrend: string;
  fromNeutralToUptrend: string;
  fromDowntrendToNeutral: string;
  fromDowntrendToUptrend: string;
  fromUptrendToNeutral: string;
  fromUptrendToDowntrend: string;
}

const defaultSettings: AutocancelSettings = {
  onlyCancelUnfilledOrders: false,
  doNotCancelPartiallyFilled: false,
  cancelAfterPeriod: false,
  neutralPeriod: 30,
  neutralUnit: 'seconds',
  uptrendPeriod: 30,
  uptrendUnit: 'seconds',
  downtrendPeriod: 30,
  downtrendUnit: 'seconds',
  cancelOnTrendChange: false,
  trendCancelActions: {
    fromNeutralToDowntrend: 'do_nothing',
    fromNeutralToUptrend: 'do_nothing',
    fromDowntrendToNeutral: 'do_nothing',
    fromDowntrendToUptrend: 'do_nothing',
    fromUptrendToNeutral: 'do_nothing',
    fromUptrendToDowntrend: 'do_nothing',
  },
  cancelOnPercentChange: false,
  percentChange: 0,
  percentChangePeriod: 30,
  percentChangePeriodUnit: 'minutes',
  partialFill: defaultPartialFillSettings,
  smartReplacement: defaultSmartReplacementSettings,
  staleOrderThreshold: 300,
  priceDeviationCancel: 1,
};

export function AutocancelPanel({ botId, onSave, onCancel }: AutocancelPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<AutocancelSettings>(defaultSettings);

  useEffect(() => {
    const saved = getModuleConfig('autocancel') as Partial<AutocancelSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ 
        ...defaultSettings, 
        ...saved, 
        trendCancelActions: { ...defaultSettings.trendCancelActions, ...saved.trendCancelActions },
        partialFill: { ...defaultPartialFillSettings, ...saved.partialFill },
        smartReplacement: { ...defaultSmartReplacementSettings, ...saved.smartReplacement },
      });
    }
  }, [configLoading]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'autocancel',
      settings: settings as unknown as Record<string, unknown>,
    });
    onSave?.();
  };

  const updateTrendAction = (key: keyof TrendCancelAction, value: string) => {
    setSettings({
      ...settings,
      trendCancelActions: { ...settings.trendCancelActions, [key]: value },
    });
  };

  const updatePartialFill = (field: keyof typeof settings.partialFill, value: any) => {
    setSettings({
      ...settings,
      partialFill: { ...settings.partialFill, [field]: value },
    });
  };

  const updateSmartReplacement = (field: keyof typeof settings.smartReplacement, value: any) => {
    setSettings({
      ...settings,
      smartReplacement: { ...settings.smartReplacement, [field]: value },
    });
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-primary" />
            Autocancel
          </CardTitle>
          <CardDescription>Configure stale orders, timeout-based cancel, partial-fill handling, and smart re-placement.</CardDescription>
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
        {/* Basic Settings */}
        <div className="grid gap-4">
          <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
            <Switch
              checked={settings.onlyCancelUnfilledOrders}
              onCheckedChange={(checked) => setSettings({ ...settings, onlyCancelUnfilledOrders: checked })}
            />
            <div>
              <Label>Only cancel unfilled orders</Label>
              <p className="text-xs text-muted-foreground">Keep orders with any fill amount</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
            <Switch
              checked={settings.doNotCancelPartiallyFilled}
              onCheckedChange={(checked) => setSettings({ ...settings, doNotCancelPartiallyFilled: checked })}
            />
            <div>
              <Label>Do not cancel partially filled</Label>
              <p className="text-xs text-muted-foreground">Preserve orders that are partially executed</p>
            </div>
          </div>
        </div>

        {/* Stale Order & Price Deviation */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Stale Order Threshold (sec)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancel orders older than this threshold</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              min={10}
              value={settings.staleOrderThreshold}
              onChange={(e) => setSettings({ ...settings, staleOrderThreshold: parseInt(e.target.value) || 300 })}
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Price Deviation Cancel (%)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancel if price deviates more than this %</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              step="0.1"
              min={0.1}
              value={settings.priceDeviationCancel}
              onChange={(e) => setSettings({ ...settings, priceDeviationCancel: parseFloat(e.target.value) || 1 })}
              className="bg-muted/50"
            />
          </div>
        </div>

        <Separator />

        <Accordion type="multiple" defaultValue={['timeout']} className="space-y-4">
          {/* Timeout-based Cancel */}
          <AccordionItem value="timeout" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">Timeout-based Cancel</span>
                <Badge variant={settings.cancelAfterPeriod ? "default" : "secondary"}>
                  {settings.cancelAfterPeriod ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={settings.cancelAfterPeriod}
                  onCheckedChange={(checked) => setSettings({ ...settings, cancelAfterPeriod: checked })}
                />
                <Label>Cancel after period of time</Label>
              </div>

              {settings.cancelAfterPeriod && (
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">Configure cancel periods per market trend.</p>

                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* Neutral */}
                    <div className="space-y-2">
                      <Label className="text-sm">Neutral (default)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={settings.neutralPeriod}
                          onChange={(e) => setSettings({ ...settings, neutralPeriod: parseInt(e.target.value) || 0 })}
                          className="flex-1 bg-muted/50"
                        />
                        <Select
                          value={settings.neutralUnit}
                          onValueChange={(value: 'seconds' | 'minutes') => setSettings({ ...settings, neutralUnit: value })}
                        >
                          <SelectTrigger className="w-24 bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="seconds">Sec</SelectItem>
                            <SelectItem value="minutes">Min</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Uptrend */}
                    <div className="space-y-2">
                      <Label className="text-sm">Uptrend</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={settings.uptrendPeriod}
                          onChange={(e) => setSettings({ ...settings, uptrendPeriod: parseInt(e.target.value) || 0 })}
                          className="flex-1 bg-muted/50"
                        />
                        <Select
                          value={settings.uptrendUnit}
                          onValueChange={(value: 'seconds' | 'minutes') => setSettings({ ...settings, uptrendUnit: value })}
                        >
                          <SelectTrigger className="w-24 bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="seconds">Sec</SelectItem>
                            <SelectItem value="minutes">Min</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Downtrend */}
                    <div className="space-y-2">
                      <Label className="text-sm">Downtrend</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={settings.downtrendPeriod}
                          onChange={(e) => setSettings({ ...settings, downtrendPeriod: parseInt(e.target.value) || 0 })}
                          className="flex-1 bg-muted/50"
                        />
                        <Select
                          value={settings.downtrendUnit}
                          onValueChange={(value: 'seconds' | 'minutes') => setSettings({ ...settings, downtrendUnit: value })}
                        >
                          <SelectTrigger className="w-24 bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="seconds">Sec</SelectItem>
                            <SelectItem value="minutes">Min</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Trend-based Cancel */}
          <AccordionItem value="trend" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-semibold">Trend-based Cancel</span>
                <Badge variant={settings.cancelOnTrendChange ? "default" : "secondary"}>
                  {settings.cancelOnTrendChange ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={settings.cancelOnTrendChange}
                  onCheckedChange={(checked) => setSettings({ ...settings, cancelOnTrendChange: checked })}
                />
                <Label>Cancel on trend change</Label>
              </div>

              {settings.cancelOnTrendChange && (
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* From Neutral */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">From Neutral</Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">→ Downtrend</Label>
                        <Select
                          value={settings.trendCancelActions.fromNeutralToDowntrend}
                          onValueChange={(value) => updateTrendAction('fromNeutralToDowntrend', value)}
                        >
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="do_nothing">Do nothing</SelectItem>
                            <SelectItem value="cancel_all">Cancel all</SelectItem>
                            <SelectItem value="cancel_buys">Cancel buys</SelectItem>
                            <SelectItem value="cancel_sells">Cancel sells</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">→ Uptrend</Label>
                        <Select
                          value={settings.trendCancelActions.fromNeutralToUptrend}
                          onValueChange={(value) => updateTrendAction('fromNeutralToUptrend', value)}
                        >
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="do_nothing">Do nothing</SelectItem>
                            <SelectItem value="cancel_all">Cancel all</SelectItem>
                            <SelectItem value="cancel_buys">Cancel buys</SelectItem>
                            <SelectItem value="cancel_sells">Cancel sells</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* From Downtrend */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">From Downtrend</Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">→ Neutral</Label>
                        <Select
                          value={settings.trendCancelActions.fromDowntrendToNeutral}
                          onValueChange={(value) => updateTrendAction('fromDowntrendToNeutral', value)}
                        >
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="do_nothing">Do nothing</SelectItem>
                            <SelectItem value="cancel_all">Cancel all</SelectItem>
                            <SelectItem value="cancel_buys">Cancel buys</SelectItem>
                            <SelectItem value="cancel_sells">Cancel sells</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">→ Uptrend</Label>
                        <Select
                          value={settings.trendCancelActions.fromDowntrendToUptrend}
                          onValueChange={(value) => updateTrendAction('fromDowntrendToUptrend', value)}
                        >
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="do_nothing">Do nothing</SelectItem>
                            <SelectItem value="cancel_all">Cancel all</SelectItem>
                            <SelectItem value="cancel_buys">Cancel buys</SelectItem>
                            <SelectItem value="cancel_sells">Cancel sells</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* From Uptrend */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">From Uptrend</Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">→ Neutral</Label>
                        <Select
                          value={settings.trendCancelActions.fromUptrendToNeutral}
                          onValueChange={(value) => updateTrendAction('fromUptrendToNeutral', value)}
                        >
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="do_nothing">Do nothing</SelectItem>
                            <SelectItem value="cancel_all">Cancel all</SelectItem>
                            <SelectItem value="cancel_buys">Cancel buys</SelectItem>
                            <SelectItem value="cancel_sells">Cancel sells</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">→ Downtrend</Label>
                        <Select
                          value={settings.trendCancelActions.fromUptrendToDowntrend}
                          onValueChange={(value) => updateTrendAction('fromUptrendToDowntrend', value)}
                        >
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="do_nothing">Do nothing</SelectItem>
                            <SelectItem value="cancel_all">Cancel all</SelectItem>
                            <SelectItem value="cancel_buys">Cancel buys</SelectItem>
                            <SelectItem value="cancel_sells">Cancel sells</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Partial-Fill Handling */}
          <AccordionItem value="partialFill" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <RefreshCcw className="h-4 w-4 text-primary" />
                <span className="font-semibold">Partial-Fill Handling</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Action</Label>
                  <Select
                    value={settings.partialFill.action}
                    onValueChange={(value: 'keep' | 'cancel' | 'adjust') => updatePartialFill('action', value)}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep">Keep Order</SelectItem>
                      <SelectItem value="cancel">Cancel Order</SelectItem>
                      <SelectItem value="adjust">Adjust Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Min Fill % to Trigger</Label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={settings.partialFill.minFillPercent}
                    onChange={(e) => updatePartialFill('minFillPercent', parseInt(e.target.value) || 10)}
                    className="bg-muted/50"
                  />
                </div>

                {settings.partialFill.action === 'adjust' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm">Adjust Strategy</Label>
                      <Select
                        value={settings.partialFill.adjustStrategy}
                        onValueChange={(value: 'market' | 'limit_chase' | 'wait') => updatePartialFill('adjustStrategy', value)}
                      >
                        <SelectTrigger className="bg-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="market">Market Order</SelectItem>
                          <SelectItem value="limit_chase">Limit Chase</SelectItem>
                          <SelectItem value="wait">Wait</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {settings.partialFill.adjustStrategy === 'wait' && (
                      <div className="space-y-2">
                        <Label className="text-sm">Wait Time (sec)</Label>
                        <Input
                          type="number"
                          min={5}
                          value={settings.partialFill.waitTimeSeconds}
                          onChange={(e) => updatePartialFill('waitTimeSeconds', parseInt(e.target.value) || 30)}
                          className="bg-muted/50"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Smart Re-placement */}
          <AccordionItem value="smartReplacement" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <RefreshCcw className="h-4 w-4 text-primary" />
                <span className="font-semibold">Smart Re-placement</span>
                <Badge variant={settings.smartReplacement.enabled ? "default" : "secondary"}>
                  {settings.smartReplacement.enabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={settings.smartReplacement.enabled}
                  onCheckedChange={(checked) => updateSmartReplacement('enabled', checked)}
                />
                <Label>Enable Smart Re-placement</Label>
              </div>

              {settings.smartReplacement.enabled && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Replacement Mode</Label>
                    <Select
                      value={settings.smartReplacement.replacementMode}
                      onValueChange={(value: 'immediate' | 'delayed' | 'smart') => updateSmartReplacement('replacementMode', value)}
                    >
                      <SelectTrigger className="bg-muted/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                        <SelectItem value="smart">Smart (AI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.smartReplacement.replacementMode === 'delayed' && (
                    <div className="space-y-2">
                      <Label className="text-sm">Delay (sec)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={settings.smartReplacement.delaySeconds}
                        onChange={(e) => updateSmartReplacement('delaySeconds', parseInt(e.target.value) || 5)}
                        className="bg-muted/50"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm">Price Adjustment (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.smartReplacement.priceAdjustment}
                      onChange={(e) => updateSmartReplacement('priceAdjustment', parseFloat(e.target.value) || 0.1)}
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Max Replacements</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.smartReplacement.maxReplacements}
                      onChange={(e) => updateSmartReplacement('maxReplacements', parseInt(e.target.value) || 3)}
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Cooldown (sec)</Label>
                    <Input
                      type="number"
                      min={10}
                      value={settings.smartReplacement.cooldownSeconds}
                      onChange={(e) => updateSmartReplacement('cooldownSeconds', parseInt(e.target.value) || 60)}
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Percent Change Cancel */}
        <Separator />
        <div className="p-4 border border-border rounded-lg space-y-4">
          <div className="flex items-center gap-4">
            <Switch
              checked={settings.cancelOnPercentChange}
              onCheckedChange={(checked) => setSettings({ ...settings, cancelOnPercentChange: checked })}
            />
            <div>
              <Label className="font-semibold">Cancel on Price Change</Label>
              <p className="text-xs text-muted-foreground">Cancel orders when price changes significantly</p>
            </div>
          </div>

          {settings.cancelOnPercentChange && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Price Change (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.percentChange}
                  onChange={(e) => setSettings({ ...settings, percentChange: parseFloat(e.target.value) || 0 })}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Within Period</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={settings.percentChangePeriod}
                    onChange={(e) => setSettings({ ...settings, percentChangePeriod: parseInt(e.target.value) || 30 })}
                    className="flex-1 bg-muted/50"
                  />
                  <Select
                    value={settings.percentChangePeriodUnit}
                    onValueChange={(value: 'seconds' | 'minutes') => setSettings({ ...settings, percentChangePeriodUnit: value })}
                  >
                    <SelectTrigger className="w-24 bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Sec</SelectItem>
                      <SelectItem value="minutes">Min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
