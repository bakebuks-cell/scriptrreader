import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X, Timer } from 'lucide-react';
import { useMarketMakerBots, useBotConfiguration, ModuleType } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, addDays, isPast } from 'date-fns';

interface BasicSettingsPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface BasicSettings {
  name: string;
  cooldownPeriod: number;
  cooldownUnit: 'seconds' | 'minutes';
}

const defaultSettings: BasicSettings = {
  name: '',
  cooldownPeriod: 30,
  cooldownUnit: 'seconds',
};

export function BasicSettingsPanel({ botId, onSave, onCancel }: BasicSettingsPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const { bots, updateBot } = useMarketMakerBots();
  const [settings, setSettings] = useState<BasicSettings>(defaultSettings);
  const [autoStopEnabled, setAutoStopEnabled] = useState(false);
  const [autoStopDays, setAutoStopDays] = useState(7);

  const currentBot = bots.find(b => b.id === botId);

  useEffect(() => {
    const saved = getModuleConfig('basic_settings') as Partial<BasicSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultSettings, ...saved });
    }
  }, [configLoading]);

  useEffect(() => {
    if (currentBot?.auto_stop_at) {
      setAutoStopEnabled(true);
      const diff = Math.max(1, Math.round((new Date(currentBot.auto_stop_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      setAutoStopDays(diff);
    } else {
      setAutoStopEnabled(false);
    }
  }, [currentBot?.auto_stop_at]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'basic_settings',
      settings: settings as unknown as Record<string, unknown>,
    });

    // Save auto-stop setting to the bot record
    const autoStopAt = autoStopEnabled ? addDays(new Date(), autoStopDays).toISOString() : null;
    await updateBot.mutateAsync({ id: botId, auto_stop_at: autoStopAt } as any);

    onSave?.();
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
        <div>
          <CardTitle className="text-lg sm:text-xl">Basic settings</CardTitle>
          <CardDescription>Give your bot a name!</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saveConfig.isPending} size="sm" className="h-9">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" onClick={onCancel} size="sm" className="h-9">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="grid gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="name" className="sm:w-40 flex items-center gap-2">
              Name
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>A friendly name for your bot</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              placeholder="My Market Maker Bot"
              className="flex-1 bg-muted/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="cooldown" className="sm:w-40 flex items-center gap-2">
              Cooldown period
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Time to wait between orders</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <div className="flex flex-1 gap-2">
              <Input
                id="cooldown"
                type="number"
                value={settings.cooldownPeriod}
                onChange={(e) => setSettings({ ...settings, cooldownPeriod: parseInt(e.target.value) || 0 })}
                className="flex-1 bg-muted/50"
              />
              <Select
                value={settings.cooldownUnit}
                onValueChange={(value: 'seconds' | 'minutes') => setSettings({ ...settings, cooldownUnit: value })}
              >
                <SelectTrigger className="w-28 sm:w-40 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Second(s)</SelectItem>
                  <SelectItem value="minutes">Minute(s)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Auto-Stop Timer */}
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
            <Label className="sm:w-40 flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              Auto-Stop Timer
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Automatically deactivate this bot after a set number of days</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={autoStopEnabled}
              onCheckedChange={setAutoStopEnabled}
            />
          </div>

          {autoStopEnabled && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="autoStopDays" className="sm:w-40">Stop after (days)</Label>
              <div className="flex flex-1 items-center gap-3">
                <Input
                  id="autoStopDays"
                  type="number"
                  min={1}
                  max={365}
                  value={autoStopDays}
                  onChange={(e) => setAutoStopDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 bg-muted/50"
                />
                <span className="text-sm text-muted-foreground">
                  Bot will stop on {format(addDays(new Date(), autoStopDays), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          )}

          {currentBot?.auto_stop_at && (
            <div className="mt-2">
              {isPast(new Date(currentBot.auto_stop_at)) ? (
                <Badge variant="destructive">Auto-stopped</Badge>
              ) : (
                <Badge variant="secondary">
                  Auto-stop: {format(new Date(currentBot.auto_stop_at), 'MMM d, yyyy HH:mm')}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
