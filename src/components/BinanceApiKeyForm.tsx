import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, Eye, EyeOff, Trash2, Shield, CheckCircle2, Wifi, WifiOff, Loader2, Copy, Check, Globe, Info } from 'lucide-react';
import { useUserWallets, callBinanceApi } from '@/hooks/useWallets';
import { useToast } from '@/hooks/use-toast';

// Supported exchanges
const EXCHANGES = [
  { value: 'binance', label: 'Binance', logo: '🔶' },
  { value: 'binance_us', label: 'Binance US', logo: '🔶' },
] as const;

// IP addresses to whitelist for Binance API
const WHITELIST_IPS = [
  '0.0.0.0/0', // Allow all (recommended for testing)
];

export default function BinanceApiKeyForm() {
  const { 
    wallets, 
    activeWallet, 
    hasWallets, 
    createWallet, 
    deleteWallet, 
    isCreating, 
    isDeleting 
  } = useUserWallets();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isTesting, setIsTesting] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);

  const handleCopyIp = async () => {
    await navigator.clipboard.writeText(WHITELIST_IPS.join(', '));
    setCopiedIp(true);
    toast({ title: 'Copied', description: 'IP addresses copied to clipboard' });
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleTestConnection = async () => {
    try {
      setConnectionStatus('idle');
      setIsTesting(true);
      await callBinanceApi('test', 'GET', undefined, activeWallet?.exchange);
      setConnectionStatus('success');
      toast({ 
        title: 'Connection Successful', 
        description: 'Your Binance API keys are valid and working correctly.' 
      });
    } catch (error: any) {
      setConnectionStatus('error');
      toast({ 
        title: 'Connection Failed', 
        description: error.message || 'Could not connect to Binance. Please check your API keys.',
        variant: 'destructive' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast({ title: 'Error', description: 'Both API key and secret are required', variant: 'destructive' });
      return;
    }

    try {
      const exchangeName = EXCHANGES.find(e => e.value === selectedExchange)?.label || 'Binance';
      await createWallet({ name: `${exchangeName} Wallet`, apiKey, apiSecret, exchange: selectedExchange });
      toast({ title: 'Success', description: `${exchangeName} API keys saved securely` });
      setApiKey('');
      setApiSecret('');
      setIsOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save API keys', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!activeWallet) return;
    try {
      await deleteWallet(activeWallet.id);
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
          Exchange API Keys
        </CardTitle>
        <CardDescription>
          Connect your exchange account to enable automated trading
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasWallets && activeWallet ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Connected to {activeWallet.exchange === 'binance' ? 'Binance' : activeWallet.exchange}</p>
                  <p className="text-sm text-muted-foreground">
                    API Key: {activeWallet.api_key_encrypted?.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            {/* Test Connection Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : connectionStatus === 'success' ? (
                <>
                  <Wifi className="h-4 w-4 mr-2 text-primary" />
                  Connection Verified
                </>
              ) : connectionStatus === 'error' ? (
                <>
                  <WifiOff className="h-4 w-4 mr-2 text-destructive" />
                  Test Connection
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

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
                    <DialogTitle>Update Exchange API Keys</DialogTitle>
                    <DialogDescription>
                      Enter your new API credentials. Make sure to enable trading permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="update-exchange">Exchange</Label>
                      <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXCHANGES.map((exchange) => (
                            <SelectItem key={exchange.value} value={exchange.value}>
                              <span className="flex items-center gap-2">
                                <span>{exchange.logo}</span>
                                <span>{exchange.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                    <Button onClick={handleSave} disabled={isCreating} className="w-full">
                      {isCreating ? 'Saving...' : 'Update Keys'}
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
                      Are you sure you want to delete your API keys? This will disable automated trading.
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
              <p className="text-sm text-muted-foreground">Add your exchange API keys to start trading</p>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Add Exchange API Keys
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Connect Exchange Account</DialogTitle>
                  <DialogDescription>
                    Select your exchange and enter your API credentials to enable automated trading.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Step 1: Exchange Selection */}
                  <div>
                    <Label htmlFor="exchange">Step 1: Select Exchange</Label>
                    <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your exchange" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXCHANGES.map((exchange) => (
                          <SelectItem key={exchange.value} value={exchange.value}>
                            <span className="flex items-center gap-2">
                              <span>{exchange.logo}</span>
                              <span>{exchange.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2: IP Whitelist Info */}
                  <div className="p-3 rounded-lg bg-accent/50 border border-border">
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Step 2: IP Whitelist (Optional)</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          For enhanced security, you can restrict API access to specific IPs. If you want to whitelist our servers, use:
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-background px-2 py-1 rounded border flex-1">
                            {WHITELIST_IPS.join(', ')}
                          </code>
                          <Button variant="ghost" size="sm" onClick={handleCopyIp} className="shrink-0">
                            {copiedIp ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Or set "Unrestricted" for easier setup
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Required Permissions */}
                  <div className="p-3 rounded-lg bg-accent/50">
                    <p className="text-sm font-medium mb-2">Step 3: Required API Permissions:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✓ Enable Spot & Margin Trading</li>
                      <li>✓ Enable Futures (for futures trading)</li>
                      <li>✓ Enable Reading</li>
                      <li className="text-destructive">✗ Disable Withdrawals (recommended)</li>
                    </ul>
                  </div>

                  {/* Step 4: API Credentials */}
                  <div>
                    <Label htmlFor="api-key">Step 4: API Key</Label>
                    <Input
                      id="api-key"
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="api-secret">API Secret</Label>
                    <div className="relative mt-1">
                      <Input
                        id="api-secret"
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

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground">
                      Your keys are encrypted and stored securely. We never have direct access to your funds.
                    </p>
                  </div>

                  <Button onClick={handleSave} disabled={isCreating} className="w-full">
                    {isCreating ? 'Connecting...' : `Connect ${EXCHANGES.find(e => e.value === selectedExchange)?.label || 'Exchange'}`}
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
