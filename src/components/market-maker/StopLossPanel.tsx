import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X, HelpCircle } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StopLossPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface StopLossSettings {
  enabled: boolean;
  upperLimitPrice: number;
  lowerLimitPrice: number;
  cancelMarketMakers: boolean;
  allowRevertRetry: boolean;
}

const defaultSettings: StopLossSettings = {
  enabled: false,
  upperLimitPrice: 0,
  lowerLimitPrice: 0,
  cancelMarketMakers: false,
  allowRevertRetry: false,
};

export function StopLossPanel({ botId, onSave, onCancel }: StopLossPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<StopLossSettings>(defaultSettings);

  useEffect(() => {
    const saved = getModuleConfig('stop_loss') as Partial<StopLossSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultSettings, ...saved });
    }
  }, [configLoading]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'stop_loss',
      settings: settings as unknown as Record<string, unknown>,
    });
    onSave?.();
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Stop-loss ranges</CardTitle>
          <CardDescription>Enable and set stop-loss ranges within which you want to trade.</CardDescription>
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
          {/* Enable */}
          <div className="flex items-center gap-4">
            <Label className="w-40 flex items-center gap-2">
              Enable
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enable stop-loss protection</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Upper limit price */}
              <div className="flex items-center gap-4">
                <Label className="w-40">Upper limit price</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={settings.upperLimitPrice || ''}
                  onChange={(e) => setSettings({ ...settings, upperLimitPrice: parseFloat(e.target.value) || 0 })}
                  className="flex-1 bg-muted/50"
                  placeholder="Enter upper limit"
                />
              </div>

              {/* Lower limit price */}
              <div className="flex items-center gap-4">
                <Label className="w-40">Lower limit price</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={settings.lowerLimitPrice || ''}
                  onChange={(e) => setSettings({ ...settings, lowerLimitPrice: parseFloat(e.target.value) || 0 })}
                  className="flex-1 bg-muted/50"
                  placeholder="Enter lower limit"
                />
              </div>

              {/* Cancel market makers */}
              <div className="flex items-center gap-4">
                <Label className="w-40 flex items-center gap-2">
                  Cancel market makers
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel all maker orders when stop-loss triggers</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Switch
                  checked={settings.cancelMarketMakers}
                  onCheckedChange={(checked) => setSettings({ ...settings, cancelMarketMakers: checked })}
                />
              </div>

              {/* Allow revert/retry */}
              <div className="flex items-center gap-4">
                <Label className="w-40 flex items-center gap-2">
                  Allow revert/retry
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Allow retrying failed orders</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Switch
                  checked={settings.allowRevertRetry}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowRevertRetry: checked })}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
