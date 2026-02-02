import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';

interface NotificationsPanelProps {
  botId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface NotificationSettings {
  notifyOnTrade: boolean;
  notifyOnError: boolean;
  notifyOnCancelledOrder: boolean;
}

const defaultSettings: NotificationSettings = {
  notifyOnTrade: false,
  notifyOnError: true,
  notifyOnCancelledOrder: false,
};

export function NotificationsPanel({ botId, onSave, onCancel }: NotificationsPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    const saved = getModuleConfig('notifications') as Partial<NotificationSettings>;
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultSettings, ...saved });
    }
  }, [configLoading]);

  const handleSave = async () => {
    await saveConfig.mutateAsync({
      moduleType: 'notifications',
      settings: settings as unknown as Record<string, unknown>,
    });
    onSave?.();
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Get notified by email about your bot trades.</CardDescription>
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
          {/* Notification on trade */}
          <div className="flex items-center gap-4">
            <Label className="w-56">Notification on trade:</Label>
            <Switch
              checked={settings.notifyOnTrade}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnTrade: checked })}
            />
          </div>

          {/* Notification on trade error */}
          <div className="flex items-center gap-4">
            <Label className="w-56">Notification on trade error:</Label>
            <Switch
              checked={settings.notifyOnError}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnError: checked })}
            />
          </div>

          {/* Notify on cancelled order */}
          <div className="flex items-center gap-4">
            <Label className="w-56">Notify on cancelled order:</Label>
            <Switch
              checked={settings.notifyOnCancelledOrder}
              onCheckedChange={(checked) => setSettings({ ...settings, notifyOnCancelledOrder: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
