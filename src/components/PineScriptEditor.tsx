import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Save, Trash2, Play, Pause, Plus, Copy, Check, FlaskConical, Loader2, X, Settings2 } from 'lucide-react';
import { AVAILABLE_TIMEFRAMES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useEvaluateScript } from '@/hooks/usePineScriptEngine';
import SignalPreview from '@/components/SignalPreview';
import BotConfigForm, { BotConfig } from '@/components/bot/BotConfigForm';

interface PineScript {
  id: string;
  name: string;
  description: string | null;
  script_content: string;
  symbol: string;
  is_active: boolean;
  allowed_timeframes: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Bot configuration fields
  candle_type?: string;
  market_type?: string;
  trading_pairs?: string[];
  multi_pair_mode?: boolean;
  position_size_type?: string;
  position_size_value?: number;
  max_capital?: number;
  leverage?: number;
  max_trades_per_day?: number;
}

interface PineScriptEditorProps {
  scripts: PineScript[];
  onSave: (script: Omit<PineScript, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'webhook_secret'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<PineScript>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAttach?: (scriptId: string) => Promise<void>;
  onDetach?: (scriptId: string) => Promise<void>;
  attachedScriptIds?: string[];
  isLoading?: boolean;
  isSaving?: boolean;
  canAttach?: boolean;
  readOnly?: boolean;
}

const DEFAULT_PINE_SCRIPT = `// PineTrader Strategy Template
// Customize your entry, exit, SL, and TP logic below

//@version=5
strategy("My Strategy", overlay=true)

// Input parameters
fastLength = input.int(12, "Fast MA Length")
slowLength = input.int(26, "Slow MA Length")
stopLossPercent = input.float(2.0, "Stop Loss %")
takeProfitPercent = input.float(4.0, "Take Profit %")

// Calculate indicators
fastMA = ta.ema(close, fastLength)
slowMA = ta.ema(close, slowLength)

// Entry conditions
longCondition = ta.crossover(fastMA, slowMA)
shortCondition = ta.crossunder(fastMA, slowMA)

// Calculate SL/TP levels
longSL = close * (1 - stopLossPercent / 100)
longTP = close * (1 + takeProfitPercent / 100)
shortSL = close * (1 + stopLossPercent / 100)
shortTP = close * (1 - takeProfitPercent / 100)

// Execute trades
if longCondition
    strategy.entry("Long", strategy.long)
    strategy.exit("Long Exit", "Long", stop=longSL, limit=longTP)

if shortCondition
    strategy.entry("Short", strategy.short)
    strategy.exit("Short Exit", "Short", stop=shortSL, limit=shortTP)

// Plot indicators
plot(fastMA, color=color.blue, title="Fast MA")
plot(slowMA, color=color.red, title="Slow MA")
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

export default function PineScriptEditor({
  scripts,
  onSave,
  onUpdate,
  onDelete,
  onAttach,
  onDetach,
  attachedScriptIds = [],
  isLoading,
  isSaving,
  canAttach = false,
  readOnly = false,
}: PineScriptEditorProps) {
  const { toast } = useToast();
  const [selectedScript, setSelectedScript] = useState<PineScript | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSignalPreview, setShowSignalPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('strategy');
  
  // Test script mutation
  const evaluateScript = useEvaluateScript();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbol: 'BTCUSDT',
    script_content: DEFAULT_PINE_SCRIPT,
    allowed_timeframes: ['1h', '4h'],
    is_active: true,
  });

  const [botConfig, setBotConfig] = useState<BotConfig>(DEFAULT_BOT_CONFIG);

  useEffect(() => {
    if (selectedScript) {
      setFormData({
        name: selectedScript.name,
        description: selectedScript.description || '',
        symbol: selectedScript.symbol,
        script_content: selectedScript.script_content,
        allowed_timeframes: selectedScript.allowed_timeframes,
        is_active: selectedScript.is_active,
      });
      setBotConfig({
        candle_type: selectedScript.candle_type || 'regular',
        market_type: selectedScript.market_type || 'spot',
        trading_pairs: selectedScript.trading_pairs || [selectedScript.symbol],
        multi_pair_mode: selectedScript.multi_pair_mode || false,
        position_size_type: selectedScript.position_size_type || 'fixed',
        position_size_value: selectedScript.position_size_value || 100,
        max_capital: selectedScript.max_capital || 1000,
        leverage: selectedScript.leverage || 1,
        max_trades_per_day: selectedScript.max_trades_per_day || 10,
      });
    }
  }, [selectedScript]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      symbol: 'BTCUSDT',
      script_content: DEFAULT_PINE_SCRIPT,
      allowed_timeframes: ['1h', '4h'],
      is_active: true,
    });
    setBotConfig(DEFAULT_BOT_CONFIG);
    setSelectedScript(null);
    setIsCreating(false);
    setActiveTab('strategy');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Script name is required', variant: 'destructive' });
      return;
    }
    if (!formData.script_content.trim()) {
      toast({ title: 'Error', description: 'Script content is required', variant: 'destructive' });
      return;
    }
    if (formData.allowed_timeframes.length === 0) {
      toast({ title: 'Error', description: 'Select at least one timeframe', variant: 'destructive' });
      return;
    }

    const fullData = {
      ...formData,
      ...botConfig,
    };

    try {
      if (selectedScript) {
        await onUpdate(selectedScript.id, fullData);
        toast({ title: 'Success', description: 'Script updated successfully' });
      } else {
        await onSave(fullData);
        toast({ title: 'Success', description: 'Script created successfully' });
        resetForm();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save script', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedScript) return;
    try {
      await onDelete(selectedScript.id);
      toast({ title: 'Success', description: 'Script deleted' });
      resetForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete script', variant: 'destructive' });
    }
  };

  const handleTimeframeChange = (timeframe: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        allowed_timeframes: [...prev.allowed_timeframes, timeframe]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        allowed_timeframes: prev.allowed_timeframes.filter(t => t !== timeframe)
      }));
    }
  };

  const handleCopyScript = async () => {
    await navigator.clipboard.writeText(formData.script_content);
    setCopied(true);
    toast({ title: 'Copied', description: 'Script copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestScript = () => {
    if (!formData.script_content.trim()) {
      toast({ title: 'Error', description: 'Script content is required', variant: 'destructive' });
      return;
    }
    if (!formData.symbol.trim()) {
      toast({ title: 'Error', description: 'Symbol is required', variant: 'destructive' });
      return;
    }
    
    setShowSignalPreview(true);
    evaluateScript.mutate({
      scriptContent: formData.script_content,
      symbol: formData.symbol,
      timeframe: formData.allowed_timeframes[0] || '1h',
    });
  };

  const isAttached = selectedScript ? attachedScriptIds.includes(selectedScript.id) : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Script List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Scripts
              </span>
              {!readOnly && (
                <Button 
                  size="sm" 
                  onClick={() => { resetForm(); setIsCreating(true); }}
                  disabled={isCreating}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : scripts.length === 0 && !isCreating ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {readOnly ? 'No scripts available' : 'No scripts yet. Create one!'}
              </p>
            ) : (
              <>
                {isCreating && (
                  <div 
                    className="p-3 rounded-lg border-2 border-primary bg-primary/5 cursor-pointer"
                  >
                    <p className="font-medium text-primary">New Script</p>
                    <p className="text-xs text-muted-foreground">Unsaved</p>
                  </div>
                )}
                {scripts.map((script) => (
                  <div
                    key={script.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedScript?.id === script.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-accent/50'
                    }`}
                    onClick={() => { setSelectedScript(script); setIsCreating(false); }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{script.name}</p>
                      <Badge variant={script.is_active ? 'default' : 'outline'} className="ml-2">
                        {script.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {script.symbol} • {script.allowed_timeframes.length} TF
                      {script.market_type && script.market_type !== 'spot' && (
                        <span className="ml-1">• {script.leverage || 1}x</span>
                      )}
                    </p>
                    {canAttach && attachedScriptIds.includes(script.id) && (
                      <Badge variant="secondary" className="mt-2 text-xs">Attached to Bot</Badge>
                    )}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Editor */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isCreating ? 'Create New Strategy' : selectedScript ? 'Edit Strategy' : 'Strategy Editor'}
            </CardTitle>
            <CardDescription>
              {isCreating || selectedScript 
                ? 'Configure your trading strategy and bot settings' 
                : 'Select a script from the list or create a new one'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isCreating || selectedScript) ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                    <div>
                      <Label htmlFor="name">Strategy Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Strategy"
                        disabled={readOnly}
                      />
                    </div>
                    <div>
                      <Label htmlFor="symbol">Primary Symbol</Label>
                      <Input
                        id="symbol"
                        value={formData.symbol}
                        onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                        placeholder="BTCUSDT"
                        disabled={readOnly}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your strategy"
                      disabled={readOnly}
                    />
                  </div>

                  <div>
                    <Label>Allowed Timeframes</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {AVAILABLE_TIMEFRAMES.map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-accent cursor-pointer">
                          <Checkbox
                            checked={formData.allowed_timeframes.includes(value)}
                            onCheckedChange={(checked) => handleTimeframeChange(value, checked as boolean)}
                            disabled={readOnly}
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="script">Pine Script Code</Label>
                      <Button variant="ghost" size="sm" onClick={handleCopyScript}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Textarea
                      id="script"
                      value={formData.script_content}
                      onChange={(e) => setFormData(prev => ({ ...prev, script_content: e.target.value }))}
                      className="font-mono text-sm min-h-[300px] bg-accent/30"
                      placeholder="Enter your Pine Script code here..."
                      disabled={readOnly}
                    />
                  </div>

                  {/* Signal Preview Panel */}
                  {showSignalPreview && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-muted-foreground">SIGNAL EVALUATION RESULT</h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowSignalPreview(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {evaluateScript.isPending ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="ml-3 text-muted-foreground">Evaluating script against live market data...</span>
                        </div>
                      ) : evaluateScript.isError ? (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                          <p className="font-medium">Evaluation failed</p>
                          <p className="text-sm mt-1">{evaluateScript.error?.message || 'Unknown error'}</p>
                        </div>
                      ) : evaluateScript.data ? (
                        <SignalPreview
                          signal={evaluateScript.data.signal}
                          currentPrice={evaluateScript.data.currentPrice}
                          indicators={evaluateScript.data.indicators}
                          symbol={formData.symbol}
                        />
                      ) : null}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="config" className="mt-4">
                  <BotConfigForm
                    config={botConfig}
                    onChange={setBotConfig}
                    disabled={readOnly}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a script from the list or create a new one to get started.</p>
              </div>
            )}

            {/* Action Buttons */}
            {(isCreating || selectedScript) && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  {!readOnly && (
                    <>
                      <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={handleTestScript}
                        disabled={evaluateScript.isPending}
                      >
                        {evaluateScript.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FlaskConical className="h-4 w-4 mr-2" />
                        )}
                        Test Script
                      </Button>
                      {selectedScript && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Script</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete "{selectedScript.name}"? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline">Cancel</Button>
                              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </>
                  )}
                </div>

                {canAttach && selectedScript && onAttach && onDetach && (
                  <Button
                    variant={isAttached ? 'outline' : 'default'}
                    onClick={() => isAttached ? onDetach(selectedScript.id) : onAttach(selectedScript.id)}
                  >
                    {isAttached ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Detach from Bot
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Attach to Bot
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
