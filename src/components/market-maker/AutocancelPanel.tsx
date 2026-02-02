import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X, HelpCircle } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface AutocancelSettings {
  onlyCancelUnfilledOrders: boolean;
  doNotCancelPartiallyFilled: boolean;
  cancelAfterPeriod: boolean;
  neutralPeriod: number;
  neutralUnit: 'seconds' | 'minutes';
  uptrendPeriod: number;
  uptrendUnit: 'seconds' | 'minutes';
  downtrendPeriod: number;
  downtrendUnit: 'seconds' | 'minutes';
  cancelOnTrendChange: boolean;
  trendCancelActions: TrendCancelAction;
  cancelOnPercentChange: boolean;
  percentChange: number;
  percentChangePeriod: number;
  percentChangePeriodUnit: 'seconds' | 'minutes';
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
};

export function AutocancelPanel({ botId, onSave, onCancel }: AutocancelPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<AutocancelSettings>(defaultSettings);

  useEffect(() => {
    const saved = getModuleConfig('autocancel') as Partial<AutocancelSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultSettings, ...saved, trendCancelActions: { ...defaultSettings.trendCancelActions, ...saved.trendCancelActions } });
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

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Autocancel</CardTitle>
          <CardDescription>Configure the autocancel time and other autocancel settings.</CardDescription>
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
        <div className="grid gap-6">
          {/* Only cancel unfilled orders */}
          <div className="flex items-center gap-4">
            <Label className="flex-1 flex items-center gap-2">
              Only cancel unfilled orders
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Only cancel orders that haven't been filled at all</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={settings.onlyCancelUnfilledOrders}
              onCheckedChange={(checked) => setSettings({ ...settings, onlyCancelUnfilledOrders: checked })}
            />
          </div>

          {/* Do not cancel partially filled */}
          <div className="flex items-center gap-4">
            <Label className="flex-1 flex items-center gap-2">
              Do not cancel partially filled
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Keep orders that have been partially filled</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={settings.doNotCancelPartiallyFilled}
              onCheckedChange={(checked) => setSettings({ ...settings, doNotCancelPartiallyFilled: checked })}
            />
          </div>

          {/* Cancel after period of time */}
          <div className="flex items-center gap-4">
            <Label className="flex-1 flex items-center gap-2">
              Cancel after period of time
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Automatically cancel orders after a specified time</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={settings.cancelAfterPeriod}
              onCheckedChange={(checked) => setSettings({ ...settings, cancelAfterPeriod: checked })}
            />
          </div>

          {settings.cancelAfterPeriod && (
            <div className="ml-4 p-4 bg-muted/30 rounded-lg space-y-4">
              <p className="text-sm text-muted-foreground">Configure the cancel periods for each enabled market trend.</p>

              {/* Neutral */}
              <div className="flex items-center gap-4">
                <Label className="w-32 flex items-center gap-2">
                  Neutral (default)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel period for neutral market</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
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
                  <SelectTrigger className="w-32 bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Second(s)</SelectItem>
                    <SelectItem value="minutes">Minute(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Uptrend */}
              <div className="flex items-center gap-4">
                <Label className="w-32 flex items-center gap-2">
                  Uptrend
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel period for uptrend market</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
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
                  <SelectTrigger className="w-32 bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Second(s)</SelectItem>
                    <SelectItem value="minutes">Minute(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Downtrend */}
              <div className="flex items-center gap-4">
                <Label className="w-32 flex items-center gap-2">
                  Downtrend
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel period for downtrend market</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
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
                  <SelectTrigger className="w-32 bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Second(s)</SelectItem>
                    <SelectItem value="minutes">Minute(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Cancel on trend change */}
          <div className="flex items-center gap-4">
            <Label className="flex-1 flex items-center gap-2">
              Cancel on trend change
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancel orders when market trend changes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={settings.cancelOnTrendChange}
              onCheckedChange={(checked) => setSettings({ ...settings, cancelOnTrendChange: checked })}
            />
          </div>

          {settings.cancelOnTrendChange && (
            <div className="ml-4 p-4 bg-muted/30 rounded-lg space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* From neutral */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">From neutral</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">To downtrend</Label>
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
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">To uptrend</Label>
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

                {/* From downtrend */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">From downtrend</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">To neutral</Label>
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
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">To uptrend</Label>
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

                {/* From uptrend */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">From uptrend</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">To neutral</Label>
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
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">To downtrend</Label>
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
            </div>
          )}

          {/* Cancel on percent change */}
          <div className="flex items-center gap-4">
            <Label className="flex-1 flex items-center gap-2">
              Cancel on percent change
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancel orders based on price percentage change</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={settings.cancelOnPercentChange}
              onCheckedChange={(checked) => setSettings({ ...settings, cancelOnPercentChange: checked })}
            />
          </div>

          {settings.cancelOnPercentChange && (
            <div className="ml-4 p-4 bg-muted/30 rounded-lg space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-40 flex items-center gap-2">
                  Percent change
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage threshold to trigger cancellation</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.percentChange}
                  onChange={(e) => setSettings({ ...settings, percentChange: parseFloat(e.target.value) || 0 })}
                  className="flex-1 bg-muted/50"
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-40 flex items-center gap-2">
                  Percent change period
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Time period to measure percentage change</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  value={settings.percentChangePeriod}
                  onChange={(e) => setSettings({ ...settings, percentChangePeriod: parseInt(e.target.value) || 0 })}
                  className="flex-1 bg-muted/50"
                />
                <Select
                  value={settings.percentChangePeriodUnit}
                  onValueChange={(value: 'seconds' | 'minutes') => setSettings({ ...settings, percentChangePeriodUnit: value })}
                >
                  <SelectTrigger className="w-32 bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Second(s)</SelectItem>
                    <SelectItem value="minutes">Minute(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
