import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X, Plus, Trash2, HelpCircle, Layers, GripVertical } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  OrderLayersSettings, 
  OrderLayerConfig,
} from '@/types/market-maker';

interface OrderLayersPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const defaultLayerConfig: OrderLayerConfig = {
  id: '',
  enabled: true,
  layerIndex: 1,
  side: 'both',
  quantity: 0.01,
  quantityType: 'fixed',
  priceOffset: 0.1,
  priceOffsetType: 'percentage',
  refreshInterval: 30,
  maxOrdersPerLayer: 1,
};

const defaultSettings: OrderLayersSettings = {
  enabled: true,
  maxLayers: 5,
  layers: [
    { ...defaultLayerConfig, id: '1', layerIndex: 1, priceOffset: 0.1 },
    { ...defaultLayerConfig, id: '2', layerIndex: 2, priceOffset: 0.2 },
    { ...defaultLayerConfig, id: '3', layerIndex: 3, priceOffset: 0.3 },
  ],
  ladderSpacing: 0.1,
  ladderSpacingType: 'geometric',
  autoAdjustLayers: true,
  minPriceDistance: 0.05,
};

export function OrderLayersPanel({ botId, onSave, onCancel }: OrderLayersPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<OrderLayersSettings>(defaultSettings);

  useEffect(() => {
    const saved = getModuleConfig('order_layers') as Partial<OrderLayersSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultSettings, ...saved });
    }
  }, [configLoading]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'order_layers',
      settings: settings as unknown as Record<string, unknown>,
    });
    onSave?.();
  };

  const addLayer = () => {
    if (settings.layers.length >= settings.maxLayers) return;
    const newIndex = settings.layers.length + 1;
    setSettings({
      ...settings,
      layers: [
        ...settings.layers,
        { 
          ...defaultLayerConfig, 
          id: Date.now().toString(), 
          layerIndex: newIndex,
          priceOffset: settings.ladderSpacing * newIndex,
        },
      ],
    });
  };

  const removeLayer = (id: string) => {
    if (settings.layers.length <= 1) return;
    setSettings({
      ...settings,
      layers: settings.layers
        .filter(l => l.id !== id)
        .map((l, idx) => ({ ...l, layerIndex: idx + 1 })),
    });
  };

  const updateLayer = (id: string, field: keyof OrderLayerConfig, value: any) => {
    setSettings({
      ...settings,
      layers: settings.layers.map(l => 
        l.id === id ? { ...l, [field]: value } : l
      ),
    });
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Order Layers
          </CardTitle>
          <CardDescription>
            Configure multi-layer ladder orders with configurable price gaps and per-layer quantity control.
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
            <Label className="text-base font-semibold">Enable Order Layers</Label>
            <p className="text-sm text-muted-foreground">
              Activate multi-layer order ladder system
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Global Settings */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Max Layers
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Maximum number of order layers allowed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.maxLayers}
                  onChange={(e) => setSettings({ ...settings, maxLayers: parseInt(e.target.value) || 5 })}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Ladder Spacing (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Price gap between consecutive layers</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={settings.ladderSpacing}
                  onChange={(e) => setSettings({ ...settings, ladderSpacing: parseFloat(e.target.value) || 0.1 })}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Spacing Type</Label>
                <Select
                  value={settings.ladderSpacingType}
                  onValueChange={(value: 'geometric' | 'arithmetic') => 
                    setSettings({ ...settings, ladderSpacingType: value })
                  }
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arithmetic">Arithmetic (Linear)</SelectItem>
                    <SelectItem value="geometric">Geometric (Exponential)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Min Price Distance (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Minimum distance from mid price for orders</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={settings.minPriceDistance}
                  onChange={(e) => setSettings({ ...settings, minPriceDistance: parseFloat(e.target.value) || 0.05 })}
                  className="bg-muted/50"
                />
              </div>
            </div>

            {/* Auto Adjust */}
            <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-lg">
              <Switch
                checked={settings.autoAdjustLayers}
                onCheckedChange={(checked) => setSettings({ ...settings, autoAdjustLayers: checked })}
              />
              <div>
                <Label>Auto-Adjust Layers</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically adjust layer spacing based on volatility
                </p>
              </div>
            </div>

            <Separator />

            {/* Layers List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Order Layers ({settings.layers.length}/{settings.maxLayers})</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addLayer}
                  disabled={settings.layers.length >= settings.maxLayers}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Layer
                </Button>
              </div>

              <div className="space-y-3">
                {settings.layers.map((layer, index) => (
                  <div 
                    key={layer.id} 
                    className="p-4 border border-border rounded-lg bg-card space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={layer.enabled ? "default" : "secondary"}>
                          Layer {layer.layerIndex}
                        </Badge>
                        <Switch
                          checked={layer.enabled}
                          onCheckedChange={(checked) => updateLayer(layer.id, 'enabled', checked)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLayer(layer.id)}
                        disabled={settings.layers.length <= 1}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {layer.enabled && (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Side</Label>
                          <Select
                            value={layer.side}
                            onValueChange={(value: 'buy' | 'sell' | 'both') => 
                              updateLayer(layer.id, 'side', value)
                            }
                          >
                            <SelectTrigger className="bg-muted/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="both">Both</SelectItem>
                              <SelectItem value="buy">Buy Only</SelectItem>
                              <SelectItem value="sell">Sell Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Quantity</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.001"
                              min={0}
                              value={layer.quantity}
                              onChange={(e) => updateLayer(layer.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="bg-muted/50 flex-1"
                            />
                            <Select
                              value={layer.quantityType}
                              onValueChange={(value: 'fixed' | 'percentage') => 
                                updateLayer(layer.id, 'quantityType', value)
                              }
                            >
                              <SelectTrigger className="w-24 bg-muted/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fixed</SelectItem>
                                <SelectItem value="percentage">%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Price Offset (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={layer.priceOffset}
                            onChange={(e) => updateLayer(layer.id, 'priceOffset', parseFloat(e.target.value) || 0)}
                            className="bg-muted/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Refresh (sec)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={layer.refreshInterval}
                            onChange={(e) => updateLayer(layer.id, 'refreshInterval', parseInt(e.target.value) || 30)}
                            className="bg-muted/50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
