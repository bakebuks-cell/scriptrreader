import { useState } from 'react';
import { useAdminSubscriptionSettings } from '@/hooks/useSubscriptionSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save } from 'lucide-react';

export default function SubscriptionSettingsPanel() {
  const { settings, isLoading, updateSettings, isUpdating } = useAdminSubscriptionSettings();
  const { toast } = useToast();

  const [localSettings, setLocalSettings] = useState<{
    subscription_mode_enabled: boolean;
    crypto_name: string;
    crypto_symbol: string;
    crypto_decimals: number;
    receiver_wallet_address: string;
    trial_days: number;
    monthly_amount: number;
  } | null>(null);

  // Initialize local state from fetched settings
  const current = localSettings ?? settings;

  const handleSave = async () => {
    if (!current) return;
    try {
      await updateSettings({
        subscription_mode_enabled: current.subscription_mode_enabled,
        crypto_name: current.crypto_name,
        crypto_symbol: current.crypto_symbol,
        crypto_decimals: current.crypto_decimals,
        receiver_wallet_address: current.receiver_wallet_address,
        trial_days: current.trial_days,
        monthly_amount: current.monthly_amount,
      });
      setLocalSettings(null);
      toast({ title: 'Saved', description: 'Subscription settings updated.' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  const update = (key: string, value: unknown) => {
    setLocalSettings(prev => ({
      ...(prev ?? {
        subscription_mode_enabled: settings?.subscription_mode_enabled ?? false,
        crypto_name: settings?.crypto_name ?? '',
        crypto_symbol: settings?.crypto_symbol ?? '',
        crypto_decimals: settings?.crypto_decimals ?? 6,
        receiver_wallet_address: settings?.receiver_wallet_address ?? '',
        trial_days: settings?.trial_days ?? 7,
        monthly_amount: settings?.monthly_amount ?? 30,
      }),
      [key]: value,
    }));
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Subscription Mode
          </CardTitle>
          <CardDescription>Enable or disable the subscription payment requirement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Subscription Mode</p>
              <p className="text-sm text-muted-foreground">
                {current?.subscription_mode_enabled
                  ? 'Users must pay to access features'
                  : 'All users have free access'}
              </p>
            </div>
            <Switch
              checked={current?.subscription_mode_enabled ?? false}
              onCheckedChange={(v) => update('subscription_mode_enabled', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crypto Payment Settings</CardTitle>
          <CardDescription>Configure cryptocurrency and wallet details for payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Crypto Name</Label>
              <Input
                value={current?.crypto_name ?? ''}
                onChange={(e) => update('crypto_name', e.target.value)}
                placeholder="e.g. Tether"
              />
            </div>
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input
                value={current?.crypto_symbol ?? ''}
                onChange={(e) => update('crypto_symbol', e.target.value)}
                placeholder="e.g. USDT"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Decimals</Label>
              <Input
                type="number"
                value={current?.crypto_decimals ?? 6}
                onChange={(e) => update('crypto_decimals', parseInt(e.target.value) || 0)}
                min={0}
                max={18}
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Amount</Label>
              <Input
                type="number"
                value={current?.monthly_amount ?? 30}
                onChange={(e) => update('monthly_amount', parseFloat(e.target.value) || 0)}
                min={0}
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Receiver Wallet Address</Label>
            <Input
              value={current?.receiver_wallet_address ?? ''}
              onChange={(e) => update('receiver_wallet_address', e.target.value)}
              placeholder="Enter wallet address..."
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Trial Days</Label>
            <Input
              type="number"
              value={current?.trial_days ?? 7}
              onChange={(e) => update('trial_days', parseInt(e.target.value) || 0)}
              min={0}
              max={365}
            />
            <p className="text-xs text-muted-foreground">Number of free days after signup</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isUpdating || !localSettings} className="gap-2">
        <Save className="h-4 w-4" />
        {isUpdating ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
