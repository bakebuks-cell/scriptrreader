import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X, HelpCircle, AlertTriangle } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RevertBacklogPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface RevertBacklogSettings {
  moveFailedToBacklog: boolean;
  automaticMatchBacklog: boolean;
  revertCancelledOrders: string;
  orderType: string;
  enableTakeProfit: boolean;
  takeProfitAt: number;
  enableMaxLoss: boolean;
  maxLoss: number;
  trendBasedRevert: boolean;
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
};

export function RevertBacklogPanel({ botId, onSave, onCancel }: RevertBacklogPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<RevertBacklogSettings>(defaultSettings);

  useEffect(() => {
    const saved = getModuleConfig('revert_backlog') as Partial<RevertBacklogSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultSettings, ...saved });
    }
  }, [configLoading]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'revert_backlog',
      settings: settings as unknown as Record<string, unknown>,
    });
    onSave?.();
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Revert & backlog</CardTitle>
          <CardDescription>Enable/disable and configure automatic reverting/retrying of failed market maker orders.</CardDescription>
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
            <strong>WARNING!</strong> When this is enabled you could end up with losses. Make sure to correctly configure these settings.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {/* Move failed to backlog */}
          <div className="flex items-center gap-4">
            <Label className="flex-1 flex items-center gap-2">
              Move failed to backlog
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Move failed orders to backlog for retry</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={settings.moveFailedToBacklog}
              onCheckedChange={(checked) => setSettings({ ...settings, moveFailedToBacklog: checked })}
            />
          </div>

          {/* Automatic match backlog */}
          <div className="flex items-center gap-4">
            <Label className="flex-1 flex items-center gap-2">
              Automatic match backlog
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Automatically retry matching backlog orders</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={settings.automaticMatchBacklog}
              onCheckedChange={(checked) => setSettings({ ...settings, automaticMatchBacklog: checked })}
            />
          </div>

          {/* Revert cancelled orders */}
          <div className="flex items-center gap-4">
            <Label className="w-48 flex items-center gap-2">
              Revert cancelled orders
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
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
              <SelectTrigger className="flex-1 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="do_nothing">Do nothing</SelectItem>
                <SelectItem value="revert_immediately">Revert immediately</SelectItem>
                <SelectItem value="move_to_backlog">Move to backlog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Order type */}
          <div className="flex items-center gap-4">
            <Label className="w-48 flex items-center gap-2">
              Order type
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Type of order for reverted trades</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select
              value={settings.orderType}
              onValueChange={(value) => setSettings({ ...settings, orderType: value })}
            >
              <SelectTrigger className="flex-1 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="limit">Limit</SelectItem>
                <SelectItem value="market">Market</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enable take profit */}
          <div className="flex items-center gap-4">
            <Label className="w-48">Enable take profit</Label>
            <Switch
              checked={settings.enableTakeProfit}
              onCheckedChange={(checked) => setSettings({ ...settings, enableTakeProfit: checked })}
            />
          </div>

          {settings.enableTakeProfit && (
            <div className="flex items-center gap-4 ml-4">
              <Label className="w-44 flex items-center gap-2">
                Take profit at
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage at which to take profit</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                step="0.1"
                value={settings.takeProfitAt || ''}
                onChange={(e) => setSettings({ ...settings, takeProfitAt: parseFloat(e.target.value) || 0 })}
                className="flex-1 bg-muted/50"
                placeholder="Percentage"
              />
            </div>
          )}

          {/* Enable max loss */}
          <div className="flex items-center gap-4">
            <Label className="w-48">Enable max loss</Label>
            <Switch
              checked={settings.enableMaxLoss}
              onCheckedChange={(checked) => setSettings({ ...settings, enableMaxLoss: checked })}
            />
          </div>

          {settings.enableMaxLoss && (
            <div className="flex items-center gap-4 ml-4">
              <Label className="w-44 flex items-center gap-2">
                Max loss
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum loss percentage before stopping</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="number"
                step="0.1"
                value={settings.maxLoss || ''}
                onChange={(e) => setSettings({ ...settings, maxLoss: parseFloat(e.target.value) || 0 })}
                className="flex-1 bg-muted/50"
                placeholder="Percentage"
              />
            </div>
          )}

          {/* Trend-based revert */}
          <div className="flex items-center gap-4">
            <Label className="flex-1 flex items-center gap-2">
              Trend-based revert logic
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Use market trend to determine revert behavior</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={settings.trendBasedRevert}
              onCheckedChange={(checked) => setSettings({ ...settings, trendBasedRevert: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
