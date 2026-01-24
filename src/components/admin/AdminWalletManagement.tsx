import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Wallet, 
  ShieldCheck, 
  Users, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useAdminWallets, Wallet as WalletType } from '@/hooks/useWallets';
import { useToast } from '@/hooks/use-toast';

export default function AdminWalletManagement() {
  const { 
    wallets, 
    adminWallets, 
    userWallets, 
    isLoading, 
    createAdminWallet,
    deleteWallet,
    isCreating,
    isDeleting
  } = useAdminWallets();
  const { toast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWallet, setNewWallet] = useState({ name: '', apiKey: '', apiSecret: '' });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const handleCreateWallet = async () => {
    if (!newWallet.name.trim()) {
      toast({ title: 'Error', description: 'Wallet name is required', variant: 'destructive' });
      return;
    }
    if (!newWallet.apiKey.trim() || !newWallet.apiSecret.trim()) {
      toast({ title: 'Error', description: 'API key and secret are required', variant: 'destructive' });
      return;
    }

    try {
      await createAdminWallet({
        name: newWallet.name,
        apiKey: newWallet.apiKey,
        apiSecret: newWallet.apiSecret,
      });
      setShowCreateDialog(false);
      setNewWallet({ name: '', apiKey: '', apiSecret: '' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create wallet', variant: 'destructive' });
    }
  };

  const handleDeleteWallet = async (id: string, role: string) => {
    if (!confirm(`Are you sure you want to delete this ${role} wallet?`)) return;
    try {
      await deleteWallet(id);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete wallet', variant: 'destructive' });
    }
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskSecret = (secret: string | null) => {
    if (!secret) return '••••••••';
    return secret.slice(0, 8) + '••••••••' + secret.slice(-4);
  };

  const WalletListItem = ({ wallet }: { wallet: WalletType }) => (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${wallet.role === 'ADMIN' ? 'bg-primary/10' : 'bg-secondary/50'}`}>
          {wallet.role === 'ADMIN' ? (
            <ShieldCheck className="h-5 w-5 text-primary" />
          ) : (
            <Wallet className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{wallet.name}</p>
            <Badge variant={wallet.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
              {wallet.role}
            </Badge>
            {wallet.is_active && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-600">Active</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {wallet.exchange} • Created {new Date(wallet.created_at).toLocaleDateString()}
          </p>
          {wallet.user_id && wallet.role === 'USER' && (
            <p className="text-xs text-muted-foreground mt-1">
              User ID: {wallet.user_id.slice(0, 8)}...
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-right mr-4">
          <p className="text-xs text-muted-foreground">API Key</p>
          <p className="font-mono text-xs">
            {showSecrets[wallet.id] ? wallet.api_key_encrypted : maskSecret(wallet.api_key_encrypted)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleSecretVisibility(wallet.id)}
        >
          {showSecrets[wallet.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDeleteWallet(wallet.id, wallet.role)}
          disabled={isDeleting}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet Management
            </CardTitle>
            <CardDescription>
              Manage admin and user wallets. Admin sees all wallets, users only see their own.
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Admin Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Admin Wallet</DialogTitle>
                <DialogDescription>
                  Add a new admin-owned wallet for trading operations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="wallet-name">Wallet Name</Label>
                  <Input
                    id="wallet-name"
                    value={newWallet.name}
                    onChange={(e) => setNewWallet(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Main Trading Wallet"
                  />
                </div>
                <div>
                  <Label htmlFor="api-key">Binance API Key</Label>
                  <Input
                    id="api-key"
                    value={newWallet.apiKey}
                    onChange={(e) => setNewWallet(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter API key"
                    type="password"
                  />
                </div>
                <div>
                  <Label htmlFor="api-secret">Binance API Secret</Label>
                  <Input
                    id="api-secret"
                    value={newWallet.apiSecret}
                    onChange={(e) => setNewWallet(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="Enter API secret"
                    type="password"
                  />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Admin wallets are only visible to administrators.
                  </p>
                </div>
                <Button 
                  onClick={handleCreateWallet} 
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    'Create Admin Wallet'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Admin Wallets ({adminWallets.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Wallets ({userWallets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="mt-4 space-y-3">
            {adminWallets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No admin wallets</p>
                <p className="text-sm">Create an admin wallet to get started</p>
              </div>
            ) : (
              adminWallets.map((wallet) => (
                <WalletListItem key={wallet.id} wallet={wallet} />
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-3">
            {userWallets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No user wallets</p>
                <p className="text-sm">Users will appear here after connecting their wallets</p>
              </div>
            ) : (
              userWallets.map((wallet) => (
                <WalletListItem key={wallet.id} wallet={wallet} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Security Notice */}
        <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">Role-Based Access Control Active</p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                • Users can only see their own USER wallets<br />
                • Admin wallets are never visible to regular users<br />
                • All access is enforced server-side via RLS policies
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
