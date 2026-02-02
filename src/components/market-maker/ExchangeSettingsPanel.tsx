import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X, Copy, ExternalLink, HelpCircle } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import { useMarketMakerBots } from '@/hooks/useMarketMakerBots';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface ExchangeSettingsPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface ExchangeSettings {
  paperTrading: boolean;
  exchange: string;
  loadApiKeysFromBot: string;
  apiKey: string;
  apiSecret: string;
}

const defaultSettings: ExchangeSettings = {
  paperTrading: false,
  exchange: 'binance',
  loadApiKeysFromBot: '',
  apiKey: '',
  apiSecret: '',
};

const IP_ADDRESSES = '188.116.26.207, 37.16.28.70, 162.62.127.246, 45.155.166.35';

export function ExchangeSettingsPanel({ botId, onSave, onCancel }: ExchangeSettingsPanelProps) {
  const { toast } = useToast();
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const { bots } = useMarketMakerBots();
  const [settings, setSettings] = useState<ExchangeSettings>(defaultSettings);

  useEffect(() => {
    const saved = getModuleConfig('exchange') as Partial<ExchangeSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultSettings, ...saved });
    }
  }, [configLoading]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'exchange',
      settings: settings as unknown as Record<string, unknown>,
    });
    onSave?.();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(IP_ADDRESSES);
    toast({ title: 'Copied', description: 'IP addresses copied to clipboard' });
  };

  const otherBots = bots.filter(b => b.id !== botId);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Exchange settings</CardTitle>
          <CardDescription>
            <span className="text-primary">Connect your bot</span> to your exchange account with API keys.{' '}
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
        <div className="grid gap-6">
          {/* Paper Trading */}
          <div className="flex items-center gap-4">
            <Label className="w-40 flex items-center gap-2">
              Paper trading
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Simulate trades without real money</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Switch
              checked={settings.paperTrading}
              onCheckedChange={(checked) => setSettings({ ...settings, paperTrading: checked })}
            />
          </div>

          {/* Exchange */}
          <div className="flex items-center gap-4">
            <Label className="w-40">
              Exchange <span className="text-destructive">*</span>
            </Label>
            <Select
              value={settings.exchange}
              onValueChange={(value) => setSettings({ ...settings, exchange: value })}
            >
              <SelectTrigger className="flex-1 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binance">Binance</SelectItem>
                <SelectItem value="binance_us">Binance US</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Load API Keys from Bot */}
          <div className="flex items-center gap-4">
            <Label className="w-40">Load API keys from bot</Label>
            <Select
              value={settings.loadApiKeysFromBot}
              onValueChange={(value) => setSettings({ ...settings, loadApiKeysFromBot: value })}
            >
              <SelectTrigger className="flex-1 bg-muted/50">
                <SelectValue placeholder="Select a bot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {otherBots.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* IP Addresses */}
          <div className="flex items-start gap-4">
            <Label className="w-40 pt-2">
              <span>IP Addresses</span>
              <p className="text-xs text-muted-foreground font-normal mt-1">
                Whitelist these IP addresses at the exchange.
              </p>
            </Label>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-md bg-muted/50 border border-primary text-sm text-primary font-mono">
                {IP_ADDRESSES}
              </div>
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* API Key */}
          <div className="flex items-center gap-4">
            <Label className="w-40">
              {settings.exchange === 'binance' ? 'Binance' : 'Binance US'} Api Key <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              className="flex-1 bg-muted/50"
              placeholder="Enter your API key"
            />
          </div>

          {/* API Secret */}
          <div className="flex items-center gap-4">
            <Label className="w-40">
              {settings.exchange === 'binance' ? 'Binance' : 'Binance US'} Api Secret <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={settings.apiSecret}
              onChange={(e) => setSettings({ ...settings, apiSecret: e.target.value })}
              className="flex-1 bg-muted/50 border-primary"
              placeholder="Enter your API secret"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
