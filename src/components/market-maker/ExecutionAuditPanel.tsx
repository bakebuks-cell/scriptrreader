import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  ChevronDown, 
  Save, 
  AlertTriangle, 
  Clock,
  Zap,
  Lock,
  RefreshCw,
  Activity,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBotConfiguration } from '@/hooks/useMarketMakerBots';
import type { ExecutionAuditSettings, ExecutionLog } from '@/types/market-maker-advanced';
import { defaultExecutionAuditSettings } from '@/types/market-maker-advanced';

interface ExecutionAuditPanelProps {
  botId: string;
}

// Mock execution logs
const mockLogs: ExecutionLog[] = [
  { id: '1', timestamp: new Date().toISOString(), eventType: 'order_placed', symbol: 'BTCUSDT', side: 'buy', price: 43250, quantity: 0.1, status: 'pending', message: 'Limit order placed' },
  { id: '2', timestamp: new Date(Date.now() - 5000).toISOString(), eventType: 'order_filled', symbol: 'BTCUSDT', side: 'buy', price: 43248, quantity: 0.1, status: 'filled', message: 'Order fully filled' },
  { id: '3', timestamp: new Date(Date.now() - 15000).toISOString(), eventType: 'warning', symbol: 'ETHUSDT', side: 'sell', status: 'warning', message: 'Rate limit approaching (80%)' },
  { id: '4', timestamp: new Date(Date.now() - 30000).toISOString(), eventType: 'order_cancelled', symbol: 'BNBUSDT', side: 'sell', price: 312.5, quantity: 5, status: 'cancelled', message: 'Stale order cancelled' },
  { id: '5', timestamp: new Date(Date.now() - 60000).toISOString(), eventType: 'error', symbol: 'BTCUSDT', side: 'buy', status: 'error', message: 'Duplicate order detected and rejected' },
];

export function ExecutionAuditPanel({ botId }: ExecutionAuditPanelProps) {
  const { getModuleConfig, saveConfig, configLoading } = useBotConfiguration(botId);
  const [settings, setSettings] = useState<ExecutionAuditSettings>(defaultExecutionAuditSettings);
  const [expandedSections, setExpandedSections] = useState<string[]>(['duplicate', 'rateLimit']);
  const [logs] = useState<ExecutionLog[]>(mockLogs);

  useEffect(() => {
    const saved = getModuleConfig('execution_audit' as any);
    if (saved && Object.keys(saved).length > 0) {
      setSettings({ ...defaultExecutionAuditSettings, ...saved } as ExecutionAuditSettings);
    }
  }, [getModuleConfig]);

  const handleSave = () => {
    saveConfig.mutate({ moduleType: 'execution_audit' as any, settings: settings as any });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const updateSetting = <K extends keyof ExecutionAuditSettings>(key: K, value: ExecutionAuditSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getLogIcon = (type: ExecutionLog['eventType']) => {
    switch (type) {
      case 'order_placed': return <Activity className="h-3 w-3 text-blue-500" />;
      case 'order_filled': return <Zap className="h-3 w-3 text-green-500" />;
      case 'order_cancelled': return <RefreshCw className="h-3 w-3 text-yellow-500" />;
      case 'order_rejected': case 'error': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-3 w-3 text-orange-500" />;
      default: return <FileText className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (configLoading) {
    return <Card className="border-border"><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Execution Audit & Stability
            </CardTitle>
            <CardDescription>
              Safeguards against duplicate orders, rate limits, and execution failures
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saveConfig.isPending} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <Label className="text-base font-semibold">Enable Execution Audit</Label>
            <p className="text-sm text-muted-foreground">
              Activate all stability safeguards
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
          />
        </div>

        {/* Duplicate Order Guard */}
        <Collapsible open={expandedSections.includes('duplicate')} onOpenChange={() => toggleSection('duplicate')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-primary" />
                <span className="font-medium">Duplicate Order Guard</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.duplicateOrderGuard.enabled}
                  onCheckedChange={(checked) => updateSetting('duplicateOrderGuard', { ...settings.duplicateOrderGuard, enabled: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('duplicate') && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time Window (ms)</Label>
                <Input
                  type="number"
                  value={settings.duplicateOrderGuard.timeWindowMs}
                  onChange={(e) => updateSetting('duplicateOrderGuard', { ...settings.duplicateOrderGuard, timeWindowMs: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price Threshold (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.duplicateOrderGuard.priceThresholdPercent}
                  onChange={(e) => updateSetting('duplicateOrderGuard', { ...settings.duplicateOrderGuard, priceThresholdPercent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Size Threshold (%)</Label>
                <Input
                  type="number"
                  value={settings.duplicateOrderGuard.sizeThresholdPercent}
                  onChange={(e) => updateSetting('duplicateOrderGuard', { ...settings.duplicateOrderGuard, sizeThresholdPercent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Action on Duplicate</Label>
                <Select
                  value={settings.duplicateOrderGuard.action}
                  onValueChange={(value: 'reject' | 'merge' | 'queue') => updateSetting('duplicateOrderGuard', { ...settings.duplicateOrderGuard, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="merge">Merge</SelectItem>
                    <SelectItem value="queue">Queue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Cancel/Replace Loop Guard */}
        <Collapsible open={expandedSections.includes('cancelLoop')} onOpenChange={() => toggleSection('cancelLoop')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-primary" />
                <span className="font-medium">Cancel/Replace Loop Guard</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.cancelReplaceLoopGuard.enabled}
                  onCheckedChange={(checked) => updateSetting('cancelReplaceLoopGuard', { ...settings.cancelReplaceLoopGuard, enabled: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('cancelLoop') && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Cancels/Minute</Label>
                <Input
                  type="number"
                  value={settings.cancelReplaceLoopGuard.maxCancelsPerMinute}
                  onChange={(e) => updateSetting('cancelReplaceLoopGuard', { ...settings.cancelReplaceLoopGuard, maxCancelsPerMinute: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Replaces/Minute</Label>
                <Input
                  type="number"
                  value={settings.cancelReplaceLoopGuard.maxReplacesPerMinute}
                  onChange={(e) => updateSetting('cancelReplaceLoopGuard', { ...settings.cancelReplaceLoopGuard, maxReplacesPerMinute: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cooldown (seconds)</Label>
                <Input
                  type="number"
                  value={settings.cancelReplaceLoopGuard.cooldownSeconds}
                  onChange={(e) => updateSetting('cancelReplaceLoopGuard', { ...settings.cancelReplaceLoopGuard, cooldownSeconds: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Select
                  value={settings.cancelReplaceLoopGuard.action}
                  onValueChange={(value: 'pause' | 'alert' | 'reduce_frequency') => updateSetting('cancelReplaceLoopGuard', { ...settings.cancelReplaceLoopGuard, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pause">Pause</SelectItem>
                    <SelectItem value="alert">Alert Only</SelectItem>
                    <SelectItem value="reduce_frequency">Reduce Frequency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Rate Limit Protection */}
        <Collapsible open={expandedSections.includes('rateLimit')} onOpenChange={() => toggleSection('rateLimit')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">API Rate Limit Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.rateLimitProtection.enabled}
                  onCheckedChange={(checked) => updateSetting('rateLimitProtection', { ...settings.rateLimitProtection, enabled: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('rateLimit') && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Requests/Second</Label>
                <Input
                  type="number"
                  value={settings.rateLimitProtection.requestsPerSecond}
                  onChange={(e) => updateSetting('rateLimitProtection', { ...settings.rateLimitProtection, requestsPerSecond: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Requests/Minute</Label>
                <Input
                  type="number"
                  value={settings.rateLimitProtection.requestsPerMinute}
                  onChange={(e) => updateSetting('rateLimitProtection', { ...settings.rateLimitProtection, requestsPerMinute: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Burst Limit</Label>
                <Input
                  type="number"
                  value={settings.rateLimitProtection.burstLimit}
                  onChange={(e) => updateSetting('rateLimitProtection', { ...settings.rateLimitProtection, burstLimit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Backoff Strategy</Label>
              <Select
                value={settings.rateLimitProtection.backoffStrategy}
                onValueChange={(value: 'linear' | 'exponential' | 'adaptive') => updateSetting('rateLimitProtection', { ...settings.rateLimitProtection, backoffStrategy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="exponential">Exponential</SelectItem>
                  <SelectItem value="adaptive">Adaptive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Safety Guard */}
        <Collapsible open={expandedSections.includes('safety')} onOpenChange={() => toggleSection('safety')}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span className="font-medium">Safety Guard (Failed Orders)</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.safetyGuard.enabled}
                  onCheckedChange={(checked) => updateSetting('safetyGuard', { ...settings.safetyGuard, enabled: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.includes('safety') && "rotate-180")} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Consecutive Failures</Label>
                <Input
                  type="number"
                  value={settings.safetyGuard.maxConsecutiveFailures}
                  onChange={(e) => updateSetting('safetyGuard', { ...settings.safetyGuard, maxConsecutiveFailures: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Failure Window (seconds)</Label>
                <Input
                  type="number"
                  value={settings.safetyGuard.failureWindowSeconds}
                  onChange={(e) => updateSetting('safetyGuard', { ...settings.safetyGuard, failureWindowSeconds: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Action on Failure</Label>
                <Select
                  value={settings.safetyGuard.actionOnFailure}
                  onValueChange={(value: 'pause' | 'stop' | 'alert_only') => updateSetting('safetyGuard', { ...settings.safetyGuard, actionOnFailure: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pause">Pause</SelectItem>
                    <SelectItem value="stop">Stop</SelectItem>
                    <SelectItem value="alert_only">Alert Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <Label>Require Manual Resume</Label>
                <Switch
                  checked={settings.safetyGuard.requireManualResume}
                  onCheckedChange={(checked) => updateSetting('safetyGuard', { ...settings.safetyGuard, requireManualResume: checked })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Log Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Label>Log Retention (hours)</Label>
            <Slider
              value={[settings.logRetentionHours]}
              onValueChange={([value]) => updateSetting('logRetentionHours', value)}
              min={24}
              max={168}
              step={24}
            />
            <p className="text-xs text-muted-foreground">{settings.logRetentionHours} hours</p>
          </div>
          <div className="space-y-2">
            <Label>Log Level</Label>
            <Select
              value={settings.logLevel}
              onValueChange={(value: 'error' | 'warning' | 'info' | 'debug') => updateSetting('logLevel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Execution Logs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Recent Execution Logs</Label>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
          <ScrollArea className="h-[200px] border border-border rounded-lg">
            <div className="p-3 space-y-2">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start gap-3 p-2 bg-muted/30 rounded text-xs"
                >
                  {getLogIcon(log.eventType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.symbol}</span>
                      <Badge variant="outline" className="text-[10px] px-1">
                        {log.side.toUpperCase()}
                      </Badge>
                      {log.price && <span className="text-muted-foreground">${log.price}</span>}
                    </div>
                    <p className="text-muted-foreground truncate">{log.message}</p>
                  </div>
                  <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
