import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, X, Plus, Minus, HelpCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MarketPricingPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface OrderLayer {
  id: string;
  buyAmount: number;
  sellAmount: number;
  percentageHigherAsk: number;
  percentageLowerBid: number;
}

interface MarketPricingSettings {
  market: string;
  strategy: string;
  marketTrend: 'neutral' | 'uptrend' | 'downtrend';
  orderSequence: string;
  orderPositioning: string;
  orderLayers: OrderLayer[];
}

const defaultSettings: MarketPricingSettings = {
  market: 'BTCUSDT',
  strategy: '',
  marketTrend: 'neutral',
  orderSequence: 'buy_sell_same_time',
  orderPositioning: 'percentage_higher_lower',
  orderLayers: [
    { id: '1', buyAmount: 0.001, sellAmount: 0.001, percentageHigherAsk: 0, percentageLowerBid: 0 },
  ],
};

export function MarketPricingPanel({ botId, onSave, onCancel }: MarketPricingPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<MarketPricingSettings>(defaultSettings);

  useEffect(() => {
    const saved = getModuleConfig('market_pricing') as Partial<MarketPricingSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultSettings, ...saved });
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
    setSettings({
      ...settings,
      orderLayers: [
        ...settings.orderLayers,
        { id: Date.now().toString(), buyAmount: 0.001, sellAmount: 0.001, percentageHigherAsk: 0, percentageLowerBid: 0 },
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

  const updateOrderLayer = (id: string, field: keyof OrderLayer, value: number) => {
    setSettings({
      ...settings,
      orderLayers: settings.orderLayers.map((layer) =>
        layer.id === id ? { ...layer, [field]: value } : layer
      ),
    });
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Market & Pricing</CardTitle>
          <CardDescription>
            Configure your market making bot.{' '}
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
            {/* Market */}
            <div className="flex items-center gap-4">
              <Label className="w-40 flex items-center gap-2">
                Market <span className="text-destructive">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-primary" />
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
                <SelectTrigger className="flex-1 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTCUSDT">BTC - USDT</SelectItem>
                  <SelectItem value="ETHUSDT">ETH - USDT</SelectItem>
                  <SelectItem value="BNBUSDT">BNB - USDT</SelectItem>
                  <SelectItem value="BNBARS">BNB - ARS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Strategy */}
            <div className="flex items-center gap-4">
              <Label className="w-40 flex items-center gap-2">
                Strategy
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select a predefined strategy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={settings.strategy}
                onValueChange={(value) => setSettings({ ...settings, strategy: value === 'none' ? '' : value })}
              >
                <SelectTrigger className="flex-1 bg-muted/50">
                  <SelectValue placeholder="No strategy selected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No strategy selected</SelectItem>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Market Trend */}
            <div className="flex items-center gap-4">
              <Label className="w-40">Market trend</Label>
              <div className="flex gap-2">
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
                    {' '}{trend === 'neutral' ? 'Neutral (Default)' : trend.charAt(0).toUpperCase() + trend.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              The following configurations are your default settings and for a{' '}
              <strong>neutral/sideways market</strong>:
            </div>

            {/* Order Sequence */}
            <div className="flex items-center gap-4">
              <Label className="w-40 flex items-center gap-2">
                Order sequence
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-primary" />
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
                <SelectTrigger className="flex-1 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy_sell_same_time">Buy and sell at the same time</SelectItem>
                  <SelectItem value="buy_first">Buy first, then sell</SelectItem>
                  <SelectItem value="sell_first">Sell first, then buy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Positioning */}
            <div className="flex items-center gap-4">
              <Label className="w-40 flex items-center gap-2">
                Order positioning
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How orders are positioned relative to market</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={settings.orderPositioning}
                onValueChange={(value) => setSettings({ ...settings, orderPositioning: value })}
              >
                <SelectTrigger className="flex-1 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage_higher_lower">Percentage higher ask / lower bid</SelectItem>
                  <SelectItem value="fixed_spread">Fixed spread</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Info Card */}
          <div className="bg-card border border-primary rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">{settings.market.replace('USDT', '/USDT')}</span>
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Last price:</span>
              </div>
              <div className="text-2xl font-bold text-primary">--</div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best bid:</span>
                <span className="text-primary">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best offer:</span>
                <span className="text-primary">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spread:</span>
                <span className="text-primary">--</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Layers */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="flex items-center gap-2">
              Order layers
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure multiple order layers</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Button variant="outline" size="sm" onClick={addOrderLayer}>
              <Plus className="h-4 w-4 mr-1" />
              Add order layer
            </Button>
          </div>

          {settings.orderLayers.map((layer, index) => (
            <div key={layer.id} className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-primary">ORDER LAYER {index + 1}</span>
                {settings.orderLayers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOrderLayer(layer.id)}
                    className="h-8 w-8"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    Buy amount <span className="text-destructive">*</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Amount to buy</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={layer.buyAmount}
                    onChange={(e) => updateOrderLayer(layer.id, 'buyAmount', parseFloat(e.target.value) || 0)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    Sell amount
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Amount to sell</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={layer.sellAmount}
                    onChange={(e) => updateOrderLayer(layer.id, 'sellAmount', parseFloat(e.target.value) || 0)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    Percentage higher ask
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>% above the best ask</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={layer.percentageHigherAsk}
                    onChange={(e) => updateOrderLayer(layer.id, 'percentageHigherAsk', parseFloat(e.target.value) || 0)}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    Percentage lower bid
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>% below the best bid</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={layer.percentageLowerBid}
                    onChange={(e) => updateOrderLayer(layer.id, 'percentageLowerBid', parseFloat(e.target.value) || 0)}
                    className="bg-background"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
