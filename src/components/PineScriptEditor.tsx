import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Code, Save, Trash2, Play, Pause, Plus, Copy, Check, FlaskConical, Loader2, X, Settings2, Shield, Power } from 'lucide-react';
import { AVAILABLE_TIMEFRAMES, MAX_SYMBOLS_PER_SCRIPT } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useEvaluateScript, useRunEngine } from '@/hooks/usePineScriptEngine';
import SignalPreview from '@/components/SignalPreview';
import BotConfigForm, { BotConfig } from '@/components/bot/BotConfigForm';
import PineScriptActions from '@/components/PineScriptActions';
import SymbolMultiSelect from '@/components/SymbolMultiSelect';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PineScript {
  id: string;
  name: string;
  description: string | null;
  script_content: string;
  symbol: string;
  is_active: boolean;
  allowed_timeframes: string[];
  admin_tag: string | null;
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
  scripts: any[];
  onSave: (script: Omit<PineScript, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'webhook_secret' | 'admin_tag'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<PineScript>) => Promise<void>;
  onDelete: (id: string) => Promise<void | string>;
  onToggleActivation?: (id: string, is_active: boolean) => Promise<void>;
  onAttach?: (scriptId: string) => Promise<void>;
  onDetach?: (scriptId: string) => Promise<void>;
  attachedScriptIds?: string[];
  isLoading?: boolean;
  isSaving?: boolean;
  isToggling?: boolean;
  canAttach?: boolean;
  readOnly?: boolean;
  companyMode?: boolean;
  usePerUserActivation?: boolean;
}

const DEFAULT_PINE_SCRIPT = '';

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
  onToggleActivation,
  onAttach,
  onDetach,
  attachedScriptIds = [],
  isLoading,
  isSaving,
  isToggling,
  canAttach = false,
  readOnly = false,
  companyMode = false,
  usePerUserActivation = false,
}: PineScriptEditorProps) {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [selectedScript, setSelectedScript] = useState<PineScript | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSignalPreview, setShowSignalPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('strategy');
  
  // Test script mutation
  const evaluateScript = useEvaluateScript();
  const runEngine = useRunEngine();
  const [isRunning, setIsRunning] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbols: ['BTCUSDT'] as string[],
    script_content: DEFAULT_PINE_SCRIPT,
      allowed_timeframes: ['1m'],
    is_active: false,
  });

  const [botConfig, setBotConfig] = useState<BotConfig>(DEFAULT_BOT_CONFIG);

  useEffect(() => {
    if (selectedScript) {
      // Get symbols from trading_pairs or fall back to symbol
      const symbols = selectedScript.trading_pairs?.length 
        ? selectedScript.trading_pairs 
        : [selectedScript.symbol];
      
      setFormData({
        name: selectedScript.name,
        description: selectedScript.description || '',
        symbols,
        script_content: selectedScript.script_content,
        allowed_timeframes: selectedScript.allowed_timeframes,
        is_active: selectedScript.is_active,
      });
      setBotConfig({
        candle_type: selectedScript.candle_type || 'regular',
        market_type: selectedScript.market_type || 'spot',
        trading_pairs: symbols,
        multi_pair_mode: symbols.length > 1,
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
      symbols: ['BTCUSDT'],
      script_content: DEFAULT_PINE_SCRIPT,
      allowed_timeframes: ['1m'],
      is_active: false,
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
    if (formData.symbols.length === 0) {
      toast({ title: 'Error', description: 'Select at least one symbol', variant: 'destructive' });
      return;
    }
    if (formData.symbols.length > MAX_SYMBOLS_PER_SCRIPT) {
      toast({ title: 'Error', description: `Maximum ${MAX_SYMBOLS_PER_SCRIPT} symbols allowed`, variant: 'destructive' });
      return;
    }

    // Build the full data, using first symbol as primary and all symbols in trading_pairs
    const fullData = {
      name: formData.name,
      description: formData.description,
      symbol: formData.symbols[0], // Primary symbol (first in list)
      script_content: formData.script_content,
      allowed_timeframes: formData.allowed_timeframes,
      is_active: formData.is_active,
      ...botConfig,
      trading_pairs: formData.symbols, // All selected symbols
      multi_pair_mode: formData.symbols.length > 1,
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
    } catch (error: any) {
      console.error('Save script error:', error);
      const errorMessage = error?.message || 'Failed to save script';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
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

  const handleTimeframeChange = (timeframe: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_timeframes: [timeframe]
    }));
  };

  const handleCopyScript = async () => {
    await navigator.clipboard.writeText(formData.script_content);
    setCopied(true);
    toast({ title: 'Copied', description: 'Script copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestScript = async () => {
    if (!formData.script_content.trim()) {
      toast({ title: 'Error', description: 'Script content is required', variant: 'destructive' });
      return;
    }
    if (formData.symbols.length === 0) {
      toast({ title: 'Error', description: 'At least one symbol is required', variant: 'destructive' });
      return;
    }
    
    setShowSignalPreview(true);
    // Test with the first symbol
    evaluateScript.mutate(
      {
        scriptContent: formData.script_content,
        symbol: formData.symbols[0],
        timeframe: formData.allowed_timeframes[0] || '1h',
      },
      {
        onSuccess: () => {
          // Auto-activate bot on successful test (item #8 from requirements)
          if (selectedScript && onToggleActivation) {
            const currentActive = usePerUserActivation && 'user_is_active' in selectedScript
              ? selectedScript.user_is_active
              : selectedScript.is_active;
            if (!currentActive) {
              onToggleActivation(selectedScript.id, true);
              toast({ title: 'Bot Activated', description: 'Script tested successfully — bot is now running' });
            }
          }
        },
      }
    );
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
              {!readOnly && !companyMode && (
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
                {scripts.map((script) => {
                  const isAdminScript = script.admin_tag !== null;
                  const isOwnScript = script.created_by === user?.id;
                  const canToggle = companyMode || (isOwnScript && !isAdminScript);
                  const canEdit = (isOwnScript && !isAdminScript) || isAdmin;
                  
                  // Use per-user activation state when available
                  const scriptActive = usePerUserActivation && 'user_is_active' in script
                    ? script.user_is_active
                    : script.is_active;
                  
                  return (
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
                        <p className="font-medium truncate flex-1">{script.name}</p>
                        <div className="flex items-center gap-1">
                          {isAdminScript && (
                            <Badge variant="secondary" className="gap-1 shrink-0">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                          <Badge 
                            variant={scriptActive ? 'default' : 'outline'} 
                            className={`shrink-0 ${scriptActive ? 'bg-green-600' : ''}`}
                          >
                            {scriptActive ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(() => {
                          const symbols = script.trading_pairs?.length ? script.trading_pairs : [script.symbol];
                          const displaySymbols = symbols.slice(0, 2).join(', ');
                          const remaining = symbols.length - 2;
                          return remaining > 0 ? `${displaySymbols} (+${remaining} more)` : displaySymbols;
                        })()} • {script.allowed_timeframes.length} TF
                        {script.market_type && script.market_type !== 'spot' && (
                          <span className="ml-1">• {script.leverage || 1}x</span>
                        )}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {canAttach && attachedScriptIds.includes(script.id) && (
                            <Badge variant="secondary" className="text-xs">Attached to Bot</Badge>
                          )}
                          {/* Activation Toggle */}
                          {canToggle && onToggleActivation && (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Switch
                                checked={scriptActive}
                                onCheckedChange={(checked) => onToggleActivation(script.id, checked)}
                                disabled={isToggling}
                                className="scale-75"
                              />
                              <span className="text-xs text-muted-foreground">
                                {scriptActive ? 'On' : 'Off'}
                              </span>
                            </div>
                          )}
                        </div>
                        <PineScriptActions
                          scriptId={script.id}
                          scriptName={script.name}
                          scriptOwnerId={script.created_by}
                          currentUserId={user?.id || null}
                          isAdmin={isAdmin}
                          isAdminScript={isAdminScript}
                          onEdit={canEdit ? () => { setSelectedScript(script); setIsCreating(false); } : undefined}
                          showView={false}
                          showEdit={canEdit && !readOnly}
                          showReport={!isOwnScript}
                          compact
                        />
                      </div>
                    </div>
                  );
                })}
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
                  <div>
                    <Label htmlFor="name">Strategy Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Strategy"
                      disabled={readOnly && !companyMode}
                    />
                  </div>

                  <SymbolMultiSelect
                    value={formData.symbols}
                    onChange={(symbols) => setFormData(prev => ({ ...prev, symbols }))}
                    disabled={readOnly && !companyMode}
                    label="Trading Symbols"
                    placeholder="Select 1-10 symbols..."
                  />

                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your strategy"
                      disabled={readOnly && !companyMode}
                    />
                  </div>

                  <div>
                    <Label>Allowed Timeframes</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {AVAILABLE_TIMEFRAMES.map(({ value, label }) => (
                        <label key={value} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${formData.allowed_timeframes.includes(value) ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'}`}>
                          <input
                            type="radio"
                            name="timeframe"
                            checked={formData.allowed_timeframes.includes(value)}
                            onChange={() => handleTimeframeChange(value)}
                            disabled={readOnly && !companyMode}
                            className="accent-primary"
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
                      disabled={readOnly || companyMode}
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
                          symbol={formData.symbols[0] || 'BTCUSDT'}
                        />
                      ) : null}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="config" className="mt-4">
                  <BotConfigForm
                    config={botConfig}
                    onChange={setBotConfig}
                    disabled={readOnly && !companyMode}
                    adminLimits={companyMode && selectedScript ? {
                      max_capital: selectedScript.max_capital || 1000,
                      max_position_size: selectedScript.position_size_value || 100,
                      max_trades_per_day: selectedScript.max_trades_per_day || 10,
                      max_leverage: selectedScript.leverage || 1,
                    } : undefined}
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
                  {!readOnly && !companyMode && (
                    <>
                      <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  )}

                  {/* Test Script - available for own scripts and company mode */}
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



                   {/* Run/Stop button - auto-activates the bot and runs engine */}
                  {selectedScript && onToggleActivation && (() => {
                    const currentActive = usePerUserActivation && 'user_is_active' in selectedScript
                      ? selectedScript.user_is_active
                      : selectedScript.is_active;
                    return currentActive ? (
                      <Button 
                        variant="outline"
                        onClick={() => setShowStopConfirm(true)}
                        disabled={isToggling || isRunning || isStopping}
                        className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        {(isToggling || isStopping) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                        {isStopping ? 'Closing Trades...' : isToggling ? 'Stopping...' : 'Stop'}
                      </Button>
                    ) : (
                      <Button 
                        onClick={async () => {
                          setIsRunning(true);
                          try {
                            // Step 1: Activate the script
                            await onToggleActivation(selectedScript.id, true);
                            toast({ title: 'Bot Activated', description: `"${selectedScript.name}" is now active. Running engine...` });
                            
                            // Step 2: Actually run the engine to evaluate and execute trades
                            const result = await runEngine.mutateAsync();
                            
                            // Step 3: Show detailed results (filter to current user + script only)
                            const scriptResults = result.results.filter(
                              (r: any) => r.scriptId === selectedScript.id && r.userId === user?.id
                            );
                            
                            if (scriptResults.length === 0) {
                              toast({ 
                                title: 'Engine Complete', 
                                description: `No matching signals found for "${selectedScript.name}" at this time. The bot will keep monitoring.`,
                              });
                            } else {
                              const executed = scriptResults.filter((r: any) => r.executed);
                              const signals = scriptResults.filter((r: any) => r.signal?.action !== 'NONE');
                              const errors = scriptResults.filter((r: any) => r.error);
                              
                              if (executed.length > 0) {
                                toast({ 
                                  title: '✅ Trades Executed!', 
                                  description: `${executed.length} trade(s) placed for "${selectedScript.name}". ${executed.map((r: any) => `${r.signal?.action} ${r.symbol} @ ${r.signal?.price?.toFixed(2)}`).join(', ')}`,
                                });
                              } else if (errors.length > 0) {
                                toast({ 
                                  title: '⚠️ Signal Found but Trade Failed', 
                                  description: errors.map((r: any) => r.error).join('; '),
                                  variant: 'destructive',
                                });
                              } else if (signals.length > 0) {
                                toast({ 
                                  title: 'Signal Detected', 
                                  description: signals.map((r: any) => `${r.signal?.action} ${r.symbol} — ${r.reason || 'conditions met'}`).join('; '),
                                });
                              } else {
                                toast({ 
                                  title: 'No Signal', 
                                  description: scriptResults.map((r: any) => r.reason || r.signal?.reason || 'No entry conditions met').join('; '),
                                });
                              }
                            }
                          } catch (err: any) {
                            toast({ 
                              title: 'Engine Error', 
                              description: err.message || 'Failed to run engine',
                              variant: 'destructive',
                            });
                          } finally {
                            setIsRunning(false);
                          }
                        }}
                        disabled={isToggling || isRunning}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {(isToggling || isRunning) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        {isRunning ? 'Running...' : isToggling ? 'Starting...' : 'Run'}
                      </Button>
                    );
                  })()}

                  {/* Delete - available in both edit and company mode */}
                  {(!readOnly || companyMode) && selectedScript && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{companyMode ? 'Remove Script' : 'Delete Script'}</DialogTitle>
                          <DialogDescription>
                            {companyMode 
                              ? `Remove "${selectedScript.name}" from your library?`
                              : `Are you sure you want to delete "${selectedScript.name}"? This action cannot be undone.`
                            }
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline">Cancel</Button>
                          <Button variant="destructive" onClick={handleDelete}>
                            {companyMode ? 'Remove' : 'Delete'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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

      {/* Stop Bot Confirmation Dialog */}
      <AlertDialog open={showStopConfirm} onOpenChange={(open) => {
        if (!isStopping) setShowStopConfirm(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Bot & Close All Trades?</AlertDialogTitle>
            <AlertDialogDescription>
              Stopping the bot will deactivate the script and close all existing open trades for &quot;{selectedScript?.name}&quot; in the database.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowStopConfirm(false)}
              disabled={isStopping}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isStopping}
              onClick={async () => {
                if (!selectedScript || !onToggleActivation || !user) return;
                setIsStopping(true);
                try {
                  // Step 1: Deactivate the script
                  await onToggleActivation(selectedScript.id, false);

                  // Step 2: Optimistically update local state so Run button appears immediately
                  setSelectedScript((prev: any) => prev ? { ...prev, is_active: false, user_is_active: false } : prev);
                  setFormData(prev => ({ ...prev, is_active: false }));
                  // Step 3: Close all OPEN/PENDING trades for this script on Binance + DB
                   const { data: { session } } = await supabase.auth.getSession();
                   const closeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pine-script-engine?action=close-all`;
                   const closeResponse = await fetch(closeUrl, {
                     method: 'POST',
                     headers: {
                       'Content-Type': 'application/json',
                       'Authorization': `Bearer ${session?.access_token || ''}`,
                     },
                     body: JSON.stringify({ script_id: selectedScript.id }),
                   });
                   const closeResult = await closeResponse.json().catch(() => ({}));

                   if (closeResult.closed > 0) {
                     toast({
                       title: 'Bot Stopped',
                       description: `"${selectedScript.name}" stopped and ${closeResult.closed} trade(s) closed on exchange.`,
                     });
                   } else {
                     toast({
                       title: 'Bot Stopped',
                       description: `"${selectedScript.name}" has been stopped. No active trades to close.`,
                     });
                   }
                } catch (err: any) {
                  toast({
                    title: 'Error',
                    description: err.message || 'Failed to stop bot',
                    variant: 'destructive',
                  });
                } finally {
                  setIsStopping(false);
                  setShowStopConfirm(false);
                }
              }}
            >
              {isStopping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Closing...
                </>
              ) : (
                'Stop & Close Trades'
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
