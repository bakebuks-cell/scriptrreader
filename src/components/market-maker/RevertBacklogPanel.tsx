import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X, HelpCircle, AlertTriangle, RotateCcw, List, DollarSign, RefreshCcw } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  RevertBacklogSettings,
  defaultRetrySettings,
  defaultFallbackPricingSettings,
  defaultLossAwareReversionSettings,
} from '@/types/market-maker';

interface RevertBacklogPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const defaultSettings: RevertBacklogSettings = {
  moveFailedToBacklog: false,
  automaticMatchBacklog: false,
  revertCancelledOrders: 'do_nothing',
  orderType: 'limit',
  enableTakeProfit: false,
  takeProfitAt: 0,
  enableMaxLoss: false,
  maxLoss: 0,
  trendBasedRevert: false,
  retry: defaultRetrySettings,
  fallbackPricing: defaultFallbackPricingSettings,
  lossAwareReversion: defaultLossAwareReversionSettings,
  maxBacklogSize: 100,
  backlogExpireHours: 24,
  priorityQueue: true,
};

export function RevertBacklogPanel({ botId, onSave, onCancel }: RevertBacklogPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<RevertBacklogSettings>(defaultSettings);

  useEffect(() => {
    const saved = getModuleConfig('revert_backlog') as Partial<RevertBacklogSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({
        ...defaultSettings,
        ...saved,
        retry: { ...defaultRetrySettings, ...saved.retry },
        fallbackPricing: { ...defaultFallbackPricingSettings, ...saved.fallbackPricing },
        lossAwareReversion: { ...defaultLossAwareReversionSettings, ...saved.lossAwareReversion },
      });
    }
  }, [configLoading]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'revert_backlog',
      settings: settings as unknown as Record<string, unknown>,
    });
    onSave?.();
  };

  const updateRetry = (field: keyof typeof settings.retry, value: any) => {
    setSettings({
      ...settings,
      retry: { ...settings.retry, [field]: value },
    });
  };

  const updateFallbackPricing = (field: keyof typeof settings.fallbackPricing, value: any) => {
    setSettings({
      ...settings,
      fallbackPricing: { ...settings.fallbackPricing, [field]: value },
    });
  };

  const updateLossAware = (field: keyof typeof settings.lossAwareReversion, value: any) => {
    setSettings({
      ...settings,
      lossAwareReversion: { ...settings.lossAwareReversion, [field]: value },
    });
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Revert & Backlog
          </CardTitle>
          <CardDescription>Configure failed order queue, retry logic, fallback pricing, and loss-aware reversion.</CardDescription>
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
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>WARNING!</strong> Improper revert settings can lead to losses. Configure carefully.
          </AlertDescription>
        </Alert>

        {/* Basic Settings */}
        <div className="grid gap-4">
          <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
            <Switch
              checked={settings.moveFailedToBacklog}
              onCheckedChange={(checked) => setSettings({ ...settings, moveFailedToBacklog: checked })}
            />
            <div>
              <Label>Move failed orders to backlog</Label>
              <p className="text-xs text-muted-foreground">Queue failed orders for retry</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
            <Switch
              checked={settings.automaticMatchBacklog}
              onCheckedChange={(checked) => setSettings({ ...settings, automaticMatchBacklog: checked })}
            />
            <div>
              <Label>Automatic match backlog</Label>
              <p className="text-xs text-muted-foreground">Automatically retry matching backlog orders</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
            <Switch
              checked={settings.priorityQueue}
              onCheckedChange={(checked) => setSettings({ ...settings, priorityQueue: checked })}
            />
            <div>
              <Label>Priority Queue</Label>
              <p className="text-xs text-muted-foreground">Process higher-value orders first</p>
            </div>
          </div>
        </div>

        {/* Backlog Settings */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Revert Cancelled Orders
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Action to take when orders are cancelled</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select
              value={settings.revertCancelledOrders}
              onValueChange={(value) => setSettings({ ...settings, revertCancelledOrders: value })}
            >
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="do_nothing">Do nothing</SelectItem>
                <SelectItem value="revert_immediately">Revert immediately</SelectItem>
                <SelectItem value="move_to_backlog">Move to backlog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Max Backlog Size</Label>
            <Input
              type="number"
              min={10}
              max={1000}
              value={settings.maxBacklogSize}
              onChange={(e) => setSettings({ ...settings, maxBacklogSize: parseInt(e.target.value) || 100 })}
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Backlog Expire (hours)</Label>
            <Input
              type="number"
              min={1}
              max={168}
              value={settings.backlogExpireHours}
              onChange={(e) => setSettings({ ...settings, backlogExpireHours: parseInt(e.target.value) || 24 })}
              className="bg-muted/50"
            />
          </div>
        </div>

        {/* Order Type & Take Profit */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Order Type for Reverts</Label>
            <Select
              value={settings.orderType}
              onValueChange={(value) => setSettings({ ...settings, orderType: value })}
            >
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="limit">Limit</SelectItem>
                <SelectItem value="market">Market</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={settings.trendBasedRevert}
              onCheckedChange={(checked) => setSettings({ ...settings, trendBasedRevert: checked })}
            />
            <Label>Trend-based revert logic</Label>
          </div>
        </div>

        <Separator />

        <Accordion type="multiple" defaultValue={['retry']} className="space-y-4">
          {/* Retry Logic */}
          <AccordionItem value="retry" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <RefreshCcw className="h-4 w-4 text-primary" />
                <span className="font-semibold">Retry Logic</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Max Retries</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={settings.retry.maxRetries}
                    onChange={(e) => updateRetry('maxRetries', parseInt(e.target.value) || 3)}
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Retry Delay (sec)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.retry.retryDelaySeconds}
                    onChange={(e) => updateRetry('retryDelaySeconds', parseInt(e.target.value) || 5)}
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Backoff Multiplier</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min={1}
                    value={settings.retry.backoffMultiplier}
                    onChange={(e) => updateRetry('backoffMultiplier', parseFloat(e.target.value) || 2)}
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Max Backoff (sec)</Label>
                  <Input
                    type="number"
                    min={10}
                    value={settings.retry.maxBackoffSeconds}
                    onChange={(e) => updateRetry('maxBackoffSeconds', parseInt(e.target.value) || 60)}
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Fallback Pricing */}
          <AccordionItem value="fallbackPricing" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-semibold">Fallback Pricing</span>
                <Badge variant={settings.fallbackPricing.enabled ? "default" : "secondary"}>
                  {settings.fallbackPricing.enabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={settings.fallbackPricing.enabled}
                  onCheckedChange={(checked) => updateFallbackPricing('enabled', checked)}
                />
                <Label>Enable Fallback Pricing</Label>
              </div>

              {settings.fallbackPricing.enabled && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Fallback Method</Label>
                    <Select
                      value={settings.fallbackPricing.method}
                      onValueChange={(value: 'market' | 'limit_aggressive' | 'twap' | 'vwap') => updateFallbackPricing('method', value)}
                    >
                      <SelectTrigger className="bg-muted/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market Order</SelectItem>
                        <SelectItem value="limit_aggressive">Aggressive Limit</SelectItem>
                        <SelectItem value="twap">TWAP</SelectItem>
                        <SelectItem value="vwap">VWAP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Slippage Tolerance (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0.1}
                      value={settings.fallbackPricing.slippageTolerance}
                      onChange={(e) => updateFallbackPricing('slippageTolerance', parseFloat(e.target.value) || 0.5)}
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Time Window (min)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.fallbackPricing.timeWindowMinutes}
                      onChange={(e) => updateFallbackPricing('timeWindowMinutes', parseInt(e.target.value) || 5)}
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Max Price Deviation (%)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min={0.5}
                      value={settings.fallbackPricing.maxPriceDeviation}
                      onChange={(e) => updateFallbackPricing('maxPriceDeviation', parseFloat(e.target.value) || 2)}
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Loss-Aware Reversion */}
          <AccordionItem value="lossAware" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-semibold">Loss-Aware Reversion</span>
                <Badge variant={settings.lossAwareReversion.enabled ? "destructive" : "secondary"}>
                  {settings.lossAwareReversion.enabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  Controls reversion behavior based on accumulated losses.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-4">
                <Switch
                  checked={settings.lossAwareReversion.enabled}
                  onCheckedChange={(checked) => updateLossAware('enabled', checked)}
                />
                <Label>Enable Loss-Aware Reversion</Label>
              </div>

              {settings.lossAwareReversion.enabled && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Max Loss Per Revert (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0.1}
                      value={settings.lossAwareReversion.maxLossPerRevert}
                      onChange={(e) => updateLossAware('maxLossPerRevert', parseFloat(e.target.value) || 1)}
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Daily Loss Limit (%)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min={0.5}
                      value={settings.lossAwareReversion.dailyLossLimit}
                      onChange={(e) => updateLossAware('dailyLossLimit', parseFloat(e.target.value) || 5)}
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.lossAwareReversion.pauseOnLimitReach}
                      onCheckedChange={(checked) => updateLossAware('pauseOnLimitReach', checked)}
                    />
                    <Label className="text-sm">Pause on limit reached</Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.lossAwareReversion.recoverBeforeNew}
                      onCheckedChange={(checked) => updateLossAware('recoverBeforeNew', checked)}
                    />
                    <Label className="text-sm">Recover losses before new trades</Label>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Take Profit / Max Loss */}
          <AccordionItem value="profitLoss" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <List className="h-4 w-4 text-primary" />
                <span className="font-semibold">Take Profit / Max Loss</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={settings.enableTakeProfit}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableTakeProfit: checked })}
                    />
                    <Label>Enable Take Profit</Label>
                  </div>

                  {settings.enableTakeProfit && (
                    <div className="space-y-2 ml-4">
                      <Label className="text-sm">Take Profit At (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.takeProfitAt || ''}
                        onChange={(e) => setSettings({ ...settings, takeProfitAt: parseFloat(e.target.value) || 0 })}
                        className="bg-muted/50"
                        placeholder="Percentage"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={settings.enableMaxLoss}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableMaxLoss: checked })}
                    />
                    <Label>Enable Max Loss</Label>
                  </div>

                  {settings.enableMaxLoss && (
                    <div className="space-y-2 ml-4">
                      <Label className="text-sm">Max Loss (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.maxLoss || ''}
                        onChange={(e) => setSettings({ ...settings, maxLoss: parseFloat(e.target.value) || 0 })}
                        className="bg-muted/50"
                        placeholder="Percentage"
                      />
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
