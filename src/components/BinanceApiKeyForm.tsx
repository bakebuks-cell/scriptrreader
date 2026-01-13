import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Key, Eye, EyeOff, Trash2, Shield, CheckCircle2 } from 'lucide-react';
import { useExchangeKeys } from '@/hooks/useBinanceWallet';
import { useToast } from '@/hooks/use-toast';

export default function BinanceApiKeyForm() {
  const { binanceKeys, hasKeys, saveKeys, deleteKeys, isSaving, isDeleting } = useExchangeKeys();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  const handleSave = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast({ title: 'Error', description: 'Both API key and secret are required', variant: 'destructive' });
      return;
    }

    try {
      await saveKeys({ apiKey, apiSecret });
      toast({ title: 'Success', description: 'Binance API keys saved securely' });
      setApiKey('');
      setApiSecret('');
      setIsOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save API keys', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteKeys();
      toast({ title: 'Success', description: 'API keys deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete API keys', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Binance API Keys
        </CardTitle>
        <CardDescription>
          Connect your Binance account to enable automated trading
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasKeys ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Connected to Binance</p>
                  <p className="text-sm text-muted-foreground">
                    API Key: {binanceKeys?.api_key_encrypted.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Your API keys are encrypted and stored securely. They are never exposed in the client.
              </p>
            </div>

            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">Update Keys</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Binance API Keys</DialogTitle>
                    <DialogDescription>
                      Enter your new Binance API credentials. Make sure to enable trading permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="update-api-key">API Key</Label>
                      <Input
                        id="update-api-key"
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="update-api-secret">API Secret</Label>
                      <div className="relative">
                        <Input
                          id="update-api-secret"
                          type={showSecret ? 'text' : 'password'}
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          placeholder="Enter your API secret"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="w-full">
                      {isSaving ? 'Saving...' : 'Update Keys'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete API Keys</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete your Binance API keys? This will disable automated trading.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete Keys'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-6">
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No API keys configured</p>
              <p className="text-sm text-muted-foreground">Add your Binance API keys to start trading</p>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Add Binance API Keys
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Binance Account</DialogTitle>
                  <DialogDescription>
                    Enter your Binance API credentials. Make sure to enable trading permissions in your Binance account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-accent/50">
                    <p className="text-sm font-medium mb-2">Required API Permissions:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✓ Enable Spot & Margin Trading</li>
                      <li>✓ Enable Futures (for futures trading)</li>
                      <li>✓ Enable Reading</li>
                      <li className="text-destructive">✗ Disable Withdrawals (recommended)</li>
                    </ul>
                  </div>

                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your Binance API key"
                    />
                  </div>

                  <div>
                    <Label htmlFor="api-secret">API Secret</Label>
                    <div className="relative">
                      <Input
                        id="api-secret"
                        type={showSecret ? 'text' : 'password'}
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        placeholder="Enter your Binance API secret"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground">
                      Your keys are encrypted and stored securely. We never have direct access to your funds.
                    </p>
                  </div>

                  <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving ? 'Saving...' : 'Connect Binance'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
