import { useState } from 'react';
import { useAdminPineScripts, PineScript, CreatePineScriptInput } from '@/hooks/usePineScripts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Save, 
  Trash2, 
  Copy, 
  Code, 
  Shield, 
  Users,
  Edit,
  Settings2,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AVAILABLE_TIMEFRAMES, MAX_SYMBOLS_PER_SCRIPT } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import BotConfigForm, { BotConfig } from '@/components/bot/BotConfigForm';
import SymbolMultiSelect from '@/components/SymbolMultiSelect';

const defaultScript = `// Admin Pine Script Template
//@version=5
strategy("Admin Strategy", overlay=true)

// Your indicators here
sma20 = ta.sma(close, 20)
sma50 = ta.sma(close, 50)

// Entry conditions
longCondition = ta.crossover(sma20, sma50)
shortCondition = ta.crossunder(sma20, sma50)

// Execute trades
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.entry("Short", strategy.short)

// Plots
plot(sma20, color=color.blue)
plot(sma50, color=color.red)
`;

const DEFAULT_BOT_CONFIG: BotConfig = {
  candle_type: 'regular',
  market_type: 'spot',
  trading_pairs: ['BTCUSDT'],
  multi_pair_mode: false,
  position_size_type: 'fixed',
  position_size_value: 100,
  max_capital: 1000,
  leverage: 1,
  max_trades_per_day: 10,
};

export default function AdminPineScriptEditor() {
  const { 
    adminScripts, 
    userScripts, 
    isLoading, 
    createAdminScript, 
    updateScript, 
    deleteScript,
    copyScript,
    isCreating,
    isUpdating,
    isCopying
  } = useAdminPineScripts();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<PineScript | null>(null);
  const [createTab, setCreateTab] = useState<'strategy' | 'config'>('strategy');
  const [editTab, setEditTab] = useState<'strategy' | 'config'>('strategy');

  const [newScript, setNewScript] = useState<CreatePineScriptInput & { admin_tag: string; symbols: string[] }>({
    name: '',
    description: '',
    script_content: defaultScript,
    symbol: 'BTCUSDT',
    symbols: ['BTCUSDT'],
    allowed_timeframes: ['1h', '4h'],
    is_active: false,
    admin_tag: 'ADMIN',
    ...DEFAULT_BOT_CONFIG,
  });

  const [newBotConfig, setNewBotConfig] = useState<BotConfig>(DEFAULT_BOT_CONFIG);
  const [editBotConfig, setEditBotConfig] = useState<BotConfig>(DEFAULT_BOT_CONFIG);

  const handleCreateScript = async () => {
    if (!newScript.name.trim()) {
      toast({ title: 'Error', description: 'Script name is required', variant: 'destructive' });
      return;
    }
    if (newScript.symbols.length === 0) {
      toast({ title: 'Error', description: 'At least one symbol is required', variant: 'destructive' });
      return;
    }
    if (newScript.symbols.length > MAX_SYMBOLS_PER_SCRIPT) {
      toast({ title: 'Error', description: `Maximum ${MAX_SYMBOLS_PER_SCRIPT} symbols allowed`, variant: 'destructive' });
      return;
    }

    try {
      await createAdminScript({
        ...newScript,
        ...newBotConfig,
        symbol: newScript.symbols[0], // Primary symbol
        trading_pairs: newScript.symbols,
        multi_pair_mode: newScript.symbols.length > 1,
      });
      toast({ title: 'Success', description: 'Admin script created!' });
      setIsCreateDialogOpen(false);
      setNewScript({
        name: '',
        description: '',
        script_content: defaultScript,
        symbol: 'BTCUSDT',
        symbols: ['BTCUSDT'],
        allowed_timeframes: ['1h', '4h'],
        is_active: false,
        admin_tag: 'ADMIN',
      });
      setNewBotConfig(DEFAULT_BOT_CONFIG);
      setCreateTab('strategy');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateScript = async () => {
    if (!editingScript) return;

    try {
      await updateScript({
        id: editingScript.id,
        name: editingScript.name,
        description: editingScript.description,
        script_content: editingScript.script_content,
        symbol: editingScript.symbol,
        allowed_timeframes: editingScript.allowed_timeframes,
        is_active: editingScript.is_active,
        ...editBotConfig,
      });
      toast({ title: 'Success', description: 'Script updated!' });
      setEditingScript(null);
      setEditTab('strategy');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteScript = async (id: string) => {
    try {
      await deleteScript(id);
      toast({ title: 'Success', description: 'Script deleted!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCopyScript = async (script: PineScript) => {
    try {
      await copyScript(script);
      toast({ title: 'Success', description: 'Script copied to your admin scripts!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditScript = (script: PineScript) => {
    setEditingScript(script);
    setEditBotConfig({
      candle_type: script.candle_type || 'regular',
      market_type: script.market_type || 'spot',
      trading_pairs: script.trading_pairs || [script.symbol],
      multi_pair_mode: script.multi_pair_mode || false,
      position_size_type: script.position_size_type || 'fixed',
      position_size_value: script.position_size_value || 100,
      max_capital: script.max_capital || 1000,
      leverage: script.leverage || 1,
      max_trades_per_day: script.max_trades_per_day || 10,
    });
  };

  const toggleTimeframe = (tf: string, isNew: boolean) => {
    if (isNew) {
      setNewScript(prev => ({
        ...prev,
        allowed_timeframes: prev.allowed_timeframes?.includes(tf)
          ? prev.allowed_timeframes.filter(t => t !== tf)
          : [...(prev.allowed_timeframes || []), tf]
      }));
    } else if (editingScript) {
      setEditingScript(prev => prev ? ({
        ...prev,
        allowed_timeframes: prev.allowed_timeframes.includes(tf)
          ? prev.allowed_timeframes.filter(t => t !== tf)
          : [...prev.allowed_timeframes, tf]
      }) : null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Admin Script Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Pine Script Management</h3>
          <p className="text-sm text-muted-foreground">
            Create admin scripts and view/copy user scripts
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Admin Script
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Admin Pine Script</DialogTitle>
              <DialogDescription>
                Create a new admin-owned trading script with full bot configuration
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as 'strategy' | 'config')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="strategy" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Strategy & Signal
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Bot Configuration
                </TabsTrigger>
              </TabsList>

              <TabsContent value="strategy" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Script Name *</Label>
                  <Input
                    value={newScript.name}
                    onChange={(e) => setNewScript(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Admin Strategy"
                  />
                </div>

                <SymbolMultiSelect
                  value={newScript.symbols}
                  onChange={(symbols) => setNewScript(prev => ({ ...prev, symbols }))}
                  label="Trading Symbols"
                  placeholder="Select 1-10 symbols..."
                />

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newScript.description || ''}
                    onChange={(e) => setNewScript(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the strategy"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Allowed Timeframes</Label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TIMEFRAMES.map((tf) => (
                      <Badge
                        key={tf.value}
                        variant={newScript.allowed_timeframes?.includes(tf.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTimeframe(tf.value, true)}
                      >
                        {tf.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Script Content</Label>
                  <Textarea
                    value={newScript.script_content}
                    onChange={(e) => setNewScript(prev => ({ ...prev, script_content: e.target.value }))}
                    className="font-mono text-sm h-64"
                    placeholder="// Your Pine Script code here"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={newScript.is_active}
                    onCheckedChange={(checked) => setNewScript(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Active</Label>
                </div>
              </TabsContent>

              <TabsContent value="config" className="mt-4">
                <BotConfigForm
                  config={newBotConfig}
                  onChange={setNewBotConfig}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateScript} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Script'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="admin" className="w-full">
        <TabsList>
          <TabsTrigger value="admin" className="gap-2">
            <Shield className="h-4 w-4" />
            Admin Scripts ({adminScripts.length})
          </TabsTrigger>
          <TabsTrigger value="user" className="gap-2">
            <Users className="h-4 w-4" />
            User Scripts ({userScripts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-4 mt-4">
          {adminScripts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No admin scripts yet</p>
                  <p className="text-muted-foreground">Create your first admin script above</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            adminScripts.map((script) => (
              <Card key={script.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        {script.name}
                        <Badge variant="default" className="text-xs gap-1">
                          <Shield className="h-3 w-3" />
                          {script.admin_tag}
                        </Badge>
                        {script.is_active && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {script.market_type || 'spot'}
                        </Badge>
                        {script.leverage && script.leverage > 1 && (
                          <Badge variant="outline" className="text-xs">
                            {script.leverage}x
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {(() => {
                          const symbols = script.trading_pairs?.length ? script.trading_pairs : [script.symbol];
                          const displaySymbols = symbols.slice(0, 3).join(', ');
                          const remaining = symbols.length - 3;
                          return remaining > 0 ? `${displaySymbols} (+${remaining} more)` : displaySymbols;
                        })()} • {script.allowed_timeframes?.join(', ')} • 
                        {script.candle_type === 'heikin_ashi' ? ' Heikin Ashi' : ' OHLC'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditScript(script)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Script?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{script.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteScript(script.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {script.description && (
                    <p className="text-sm text-muted-foreground mb-2">{script.description}</p>
                  )}
                  <div className="grid grid-cols-4 gap-2 mb-2 text-xs">
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Size:</span>{' '}
                      {script.position_size_value} {script.position_size_type === 'percentage' ? '%' : 'USDT'}
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Max Cap:</span>{' '}
                      {script.max_capital} USDT
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Max Trades:</span>{' '}
                      {script.max_trades_per_day}/day
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Pairs:</span>{' '}
                      {script.trading_pairs?.length || 1}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto max-h-24">
                    <pre className="whitespace-pre-wrap">{script.script_content.slice(0, 200)}...</pre>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="user" className="space-y-4 mt-4">
          {userScripts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No user scripts yet</p>
                  <p className="text-muted-foreground">User scripts will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            userScripts.map((script) => (
              <Card key={script.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        {script.name}
                        <Badge variant="outline" className="text-xs">User Script</Badge>
                        {script.is_active && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {script.market_type || 'spot'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {(() => {
                          const symbols = script.trading_pairs?.length ? script.trading_pairs : [script.symbol];
                          const displaySymbols = symbols.slice(0, 3).join(', ');
                          const remaining = symbols.length - 3;
                          return remaining > 0 ? `${displaySymbols} (+${remaining} more)` : displaySymbols;
                        })()} • {script.allowed_timeframes?.join(', ')}
                        {script.created_by && (
                          <span className="ml-2 text-xs opacity-70">• Owner: {script.created_by.slice(0, 8)}...</span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditScript(script)}
                        title="Edit script"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleCopyScript(script)}
                        disabled={isCopying}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User Script?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{script.name}" created by user. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteScript(script.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {script.description && (
                    <p className="text-sm text-muted-foreground mb-2">{script.description}</p>
                  )}
                  <div className="grid grid-cols-4 gap-2 mb-2 text-xs">
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Size:</span>{' '}
                      {script.position_size_value} {script.position_size_type === 'percentage' ? '%' : 'USDT'}
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Max Cap:</span>{' '}
                      {script.max_capital} USDT
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Max Trades:</span>{' '}
                      {script.max_trades_per_day}/day
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <span className="text-muted-foreground">Pairs:</span>{' '}
                      {script.trading_pairs?.length || 1}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto max-h-24">
                    <pre className="whitespace-pre-wrap">{script.script_content.slice(0, 200)}...</pre>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingScript} onOpenChange={(open) => !open && setEditingScript(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Admin Script</DialogTitle>
            <DialogDescription>
              Modify your admin trading script and bot configuration
            </DialogDescription>
          </DialogHeader>
          {editingScript && (
            <Tabs value={editTab} onValueChange={(v) => setEditTab(v as 'strategy' | 'config')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="strategy" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Strategy & Signal
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Bot Configuration
                </TabsTrigger>
              </TabsList>

              <TabsContent value="strategy" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Script Name</Label>
                    <Input
                      value={editingScript.name}
                      onChange={(e) => setEditingScript(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Symbol</Label>
                    <Input
                      value={editingScript.symbol}
                      onChange={(e) => setEditingScript(prev => prev ? ({ ...prev, symbol: e.target.value.toUpperCase() }) : null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editingScript.description || ''}
                    onChange={(e) => setEditingScript(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Allowed Timeframes</Label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TIMEFRAMES.map((tf) => (
                      <Badge
                        key={tf.value}
                        variant={editingScript.allowed_timeframes.includes(tf.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTimeframe(tf.value, false)}
                      >
                        {tf.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Script Content</Label>
                  <Textarea
                    value={editingScript.script_content}
                    onChange={(e) => setEditingScript(prev => prev ? ({ ...prev, script_content: e.target.value }) : null)}
                    className="font-mono text-sm h-64"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingScript.is_active}
                    onCheckedChange={(checked) => setEditingScript(prev => prev ? ({ ...prev, is_active: checked }) : null)}
                  />
                  <Label>Active</Label>
                </div>
              </TabsContent>

              <TabsContent value="config" className="mt-4">
                <BotConfigForm
                  config={editBotConfig}
                  onChange={setEditBotConfig}
                />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingScript(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateScript} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
