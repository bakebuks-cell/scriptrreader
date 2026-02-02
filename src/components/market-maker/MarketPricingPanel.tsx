import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X, Plus, Minus, HelpCircle, RefreshCw, ExternalLink, Loader2, TrendingUp, TrendingDown, BarChart3, Activity, Scale } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMarketData, formatPrice, formatVolume, calculateSpread } from '@/hooks/useMarketData';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  MarketPricingSettings,
  OrderLayer,
  defaultDualSideQuoting,
  defaultSpreadSettings,
  defaultInventorySettings,
} from '@/types/market-maker';

interface MarketPricingPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const defaultOrderLayer: OrderLayer = {
  id: '1',
  enabled: true,
  buyAmount: 0.001,
  sellAmount: 0.001,
  percentageHigherAsk: 0,
  percentageLowerBid: 0,
  priceGap: 0.1,
  spreadMultiplier: 1,
};

const defaultSettings: MarketPricingSettings = {
  market: 'BTCUSDT',
  strategy: '',
  marketTrend: 'neutral',
  orderSequence: 'buy_sell_same_time',
  orderPositioning: 'percentage_higher_lower',
  orderLayers: [defaultOrderLayer],
  dualSideQuoting: defaultDualSideQuoting,
  spread: defaultSpreadSettings,
  inventory: defaultInventorySettings,
  volatilityWindow: 15,
  priceSource: 'mid',
};

export function MarketPricingPanel({ botId, onSave, onCancel }: MarketPricingPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<MarketPricingSettings>(defaultSettings);
  const { ticker, loading: tickerLoading, error: tickerError, refresh } = useMarketData(settings.market, 5000);

  useEffect(() => {
    const saved = getModuleConfig('market_pricing') as Partial<MarketPricingSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({
        ...defaultSettings,
        ...saved,
        dualSideQuoting: { ...defaultDualSideQuoting, ...saved.dualSideQuoting },
        spread: { ...defaultSpreadSettings, ...saved.spread },
        inventory: { ...defaultInventorySettings, ...saved.inventory },
      });
    }
  }, [configLoading]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'market_pricing',
      settings: settings as unknown as Record<string, unknown>,
    });
    onSave?.();
  };

  const addOrderLayer = () => {
    const newId = Date.now().toString();
    setSettings({
      ...settings,
      orderLayers: [
        ...settings.orderLayers,
        { ...defaultOrderLayer, id: newId, percentageHigherAsk: settings.orderLayers.length * 0.1, percentageLowerBid: settings.orderLayers.length * 0.1 },
      ],
    });
  };

  const removeOrderLayer = (id: string) => {
    if (settings.orderLayers.length > 1) {
      setSettings({
        ...settings,
        orderLayers: settings.orderLayers.filter((layer) => layer.id !== id),
      });
    }
  };

  const updateOrderLayer = (id: string, field: keyof OrderLayer, value: any) => {
    setSettings({
      ...settings,
      orderLayers: settings.orderLayers.map((layer) =>
        layer.id === id ? { ...layer, [field]: value } : layer
      ),
    });
  };

  const updateDualSide = (field: keyof typeof settings.dualSideQuoting, value: any) => {
    setSettings({
      ...settings,
      dualSideQuoting: { ...settings.dualSideQuoting, [field]: value },
    });
  };

  const updateSpread = (field: keyof typeof settings.spread, value: any) => {
    setSettings({
      ...settings,
      spread: { ...settings.spread, [field]: value },
    });
  };

  const updateInventory = (field: keyof typeof settings.inventory, value: any) => {
    setSettings({
      ...settings,
      inventory: { ...settings.inventory, [field]: value },
    });
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Market & Pricing
          </CardTitle>
          <CardDescription>
            Configure dual-side quoting, dynamic spread, and inventory balancing.{' '}
            <a href="#" className="text-primary hover:underline inline-flex items-center gap-1">
              Read more <ExternalLink className="h-3 w-3" />
            </a>
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
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Settings */}
          <div className="space-y-6">
            {/* Market & Strategy */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Market <span className="text-destructive">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the trading pair</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  value={settings.market}
                  onValueChange={(value) => setSettings({ ...settings, market: value })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTCUSDT">BTC - USDT</SelectItem>
                    <SelectItem value="ETHUSDT">ETH - USDT</SelectItem>
                    <SelectItem value="BNBUSDT">BNB - USDT</SelectItem>
                    <SelectItem value="SOLUSDT">SOL - USDT</SelectItem>
                    <SelectItem value="XRPUSDT">XRP - USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Source</Label>
                <Select
                  value={settings.priceSource}
                  onValueChange={(value: 'mid' | 'last' | 'weighted') => setSettings({ ...settings, priceSource: value })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mid">Mid Price</SelectItem>
                    <SelectItem value="last">Last Price</SelectItem>
                    <SelectItem value="weighted">Volume Weighted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Market Trend */}
            <div className="space-y-2">
              <Label>Market Trend</Label>
              <div className="flex flex-wrap gap-2">
                {(['neutral', 'uptrend', 'downtrend'] as const).map((trend) => (
                  <Button
                    key={trend}
                    type="button"
                    variant={settings.marketTrend === trend ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSettings({ ...settings, marketTrend: trend })}
                    className={cn(
                      "capitalize",
                      settings.marketTrend === trend && "bg-primary text-primary-foreground"
                    )}
                  >
                    {trend === 'neutral' && '→'}
                    {trend === 'uptrend' && '↗'}
                    {trend === 'downtrend' && '↘'}
                    {' '}{trend === 'neutral' ? 'Neutral' : trend.charAt(0).toUpperCase() + trend.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Order Sequence & Positioning */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Order Sequence
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How orders should be executed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  value={settings.orderSequence}
                  onValueChange={(value) => setSettings({ ...settings, orderSequence: value })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy_sell_same_time">Buy & Sell Same Time</SelectItem>
                    <SelectItem value="buy_first">Buy First, Then Sell</SelectItem>
                    <SelectItem value="sell_first">Sell First, Then Buy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Volatility Window (min)</Label>
                <Input
                  type="number"
                  min={5}
                  max={60}
                  value={settings.volatilityWindow}
                  onChange={(e) => setSettings({ ...settings, volatilityWindow: parseInt(e.target.value) || 15 })}
                  className="bg-muted/50"
                />
              </div>
            </div>
          </div>

          {/* Price Info Card */}
          <div className="bg-card border border-primary rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">{settings.market.replace('USDT', '/USDT')}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={refresh}
                disabled={tickerLoading}
              >
                {tickerLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {tickerError ? (
              <div className="text-sm text-destructive">
                Failed to load market data
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Last price:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {ticker ? formatPrice(ticker.lastPrice) : '--'}
                  </span>
                  {ticker && (
                    <span className={cn(
                      "flex items-center text-sm",
                      parseFloat(ticker.priceChangePercent) >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {parseFloat(ticker.priceChangePercent) >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {parseFloat(ticker.priceChangePercent).toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best bid:</span>
                  <span className="text-green-500 font-mono">
                    {ticker ? formatPrice(ticker.bidPrice) : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best ask:</span>
                  <span className="text-red-500 font-mono">
                    {ticker ? formatPrice(ticker.askPrice) : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spread:</span>
                  <span className="text-primary font-mono">
                    {ticker ? calculateSpread(ticker.bidPrice, ticker.askPrice) : '--'}
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Volume:</span>
                    <span className="text-foreground font-mono">
                      {ticker ? formatVolume(ticker.quoteVolume) + ' USDT' : '--'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <Accordion type="multiple" defaultValue={['dualSide', 'spread']} className="space-y-4">
          {/* Dual-Side Quoting */}
          <AccordionItem value="dualSide" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-semibold">Dual-Side Quoting</span>
                <Badge variant={settings.dualSideQuoting.enabled ? "default" : "secondary"}>
                  {settings.dualSideQuoting.enabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={settings.dualSideQuoting.enabled}
                  onCheckedChange={(checked) => updateDualSide('enabled', checked)}
                />
                <Label>Enable Dual-Side Quoting</Label>
              </div>

              {settings.dualSideQuoting.enabled && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.dualSideQuoting.symmetricQuoting}
                      onCheckedChange={(checked) => updateDualSide('symmetricQuoting', checked)}
                    />
                    <Label className="text-sm">Symmetric Quoting</Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Min Quote Size</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min={0}
                      value={settings.dualSideQuoting.minQuoteSize}
                      onChange={(e) => updateDualSide('minQuoteSize', parseFloat(e.target.value) || 0.001)}
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Max Quote Size</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={settings.dualSideQuoting.maxQuoteSize}
                      onChange={(e) => updateDualSide('maxQuoteSize', parseFloat(e.target.value) || 1)}
                      className="bg-muted/50"
                    />
                  </div>

                  {!settings.dualSideQuoting.symmetricQuoting && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm">Buy Bias (-100 to 100)</Label>
                        <Input
                          type="number"
                          min={-100}
                          max={100}
                          value={settings.dualSideQuoting.buyBias}
                          onChange={(e) => updateDualSide('buyBias', parseInt(e.target.value) || 0)}
                          className="bg-muted/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Sell Bias (-100 to 100)</Label>
                        <Input
                          type="number"
                          min={-100}
                          max={100}
                          value={settings.dualSideQuoting.sellBias}
                          onChange={(e) => updateDualSide('sellBias', parseInt(e.target.value) || 0)}
                          className="bg-muted/50"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Dynamic Spread */}
          <AccordionItem value="spread" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-semibold">Dynamic Spread</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Spread Mode</Label>
                  <Select
                    value={settings.spread.spreadMode}
                    onValueChange={(value: 'fixed' | 'dynamic' | 'volatility_based') => updateSpread('spreadMode', value)}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="dynamic">Dynamic</SelectItem>
                      <SelectItem value="volatility_based">Volatility-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Base Spread (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    value={settings.spread.baseSpread}
                    onChange={(e) => updateSpread('baseSpread', parseFloat(e.target.value) || 0.1)}
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Min Spread (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    value={settings.spread.minSpread}
                    onChange={(e) => updateSpread('minSpread', parseFloat(e.target.value) || 0.05)}
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Max Spread (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={settings.spread.maxSpread}
                    onChange={(e) => updateSpread('maxSpread', parseFloat(e.target.value) || 0.5)}
                    className="bg-muted/50"
                  />
                </div>

                {settings.spread.spreadMode === 'volatility_based' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Volatility Multiplier</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0.5}
                      value={settings.spread.volatilityMultiplier}
                      onChange={(e) => updateSpread('volatilityMultiplier', parseFloat(e.target.value) || 1.5)}
                      className="bg-muted/50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm">Trend Adjustment (%)</Label>
                  <Input
                    type="number"
                    step="5"
                    min={0}
                    max={100}
                    value={settings.spread.trendAdjustmentPercent}
                    onChange={(e) => updateSpread('trendAdjustmentPercent', parseInt(e.target.value) || 20)}
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Inventory Balancing */}
          <AccordionItem value="inventory" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Scale className="h-4 w-4 text-primary" />
                <span className="font-semibold">Inventory Balancing</span>
                <Badge variant={settings.inventory.adjustSpreadOnSkew ? "default" : "secondary"}>
                  {settings.inventory.adjustSpreadOnSkew ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    Target Ratio
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Target base/quote ratio (0.5 = 50/50)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={0.1}
                    max={0.9}
                    value={settings.inventory.targetRatio}
                    onChange={(e) => updateInventory('targetRatio', parseFloat(e.target.value) || 0.5)}
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Max Skew</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min={0.1}
                    max={0.5}
                    value={settings.inventory.maxSkew}
                    onChange={(e) => updateInventory('maxSkew', parseFloat(e.target.value) || 0.3)}
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Rebalance Threshold</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min={0.05}
                    max={0.5}
                    value={settings.inventory.rebalanceThreshold}
                    onChange={(e) => updateInventory('rebalanceThreshold', parseFloat(e.target.value) || 0.2)}
                    className="bg-muted/50"
                  />
                </div>

                <div className="flex items-center gap-3 col-span-full sm:col-span-1">
                  <Switch
                    checked={settings.inventory.adjustSpreadOnSkew}
                    onCheckedChange={(checked) => updateInventory('adjustSpreadOnSkew', checked)}
                  />
                  <Label className="text-sm">Adjust Spread on Skew</Label>
                </div>

                {settings.inventory.adjustSpreadOnSkew && (
                  <div className="space-y-2">
                    <Label className="text-sm">Skew Spread Multiplier</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={1}
                      max={3}
                      value={settings.inventory.skewSpreadMultiplier}
                      onChange={(e) => updateInventory('skewSpreadMultiplier', parseFloat(e.target.value) || 1.2)}
                      className="bg-muted/50"
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator />

        {/* Order Layers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              Order Layers
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure multiple order layers for ladder orders</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Button variant="outline" size="sm" onClick={addOrderLayer}>
              <Plus className="h-4 w-4 mr-1" />
              Add Layer
            </Button>
          </div>

          {settings.orderLayers.map((layer, index) => (
            <div key={layer.id} className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="default">Layer {index + 1}</Badge>
                  <Switch
                    checked={layer.enabled}
                    onCheckedChange={(checked) => updateOrderLayer(layer.id, 'enabled', checked)}
                  />
                </div>
                {settings.orderLayers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOrderLayer(layer.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {layer.enabled && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Buy Amount</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={layer.buyAmount}
                      onChange={(e) => updateOrderLayer(layer.id, 'buyAmount', parseFloat(e.target.value) || 0)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Sell Amount</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={layer.sellAmount}
                      onChange={(e) => updateOrderLayer(layer.id, 'sellAmount', parseFloat(e.target.value) || 0)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">% Higher Ask</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={layer.percentageHigherAsk}
                      onChange={(e) => updateOrderLayer(layer.id, 'percentageHigherAsk', parseFloat(e.target.value) || 0)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">% Lower Bid</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={layer.percentageLowerBid}
                      onChange={(e) => updateOrderLayer(layer.id, 'percentageLowerBid', parseFloat(e.target.value) || 0)}
                      className="bg-background"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
