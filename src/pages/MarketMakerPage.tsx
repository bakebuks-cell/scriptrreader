import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMarketMakerBots } from '@/hooks/useMarketMakerBots';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ConfigSidebar, ConfigSection } from '@/components/market-maker/ConfigSidebar';
import { BasicSettingsPanel } from '@/components/market-maker/BasicSettingsPanel';
import { ExchangeSettingsPanel } from '@/components/market-maker/ExchangeSettingsPanel';
import { NotificationsPanel } from '@/components/market-maker/NotificationsPanel';
import { MarketPricingPanel } from '@/components/market-maker/MarketPricingPanel';
import { AutocancelPanel } from '@/components/market-maker/AutocancelPanel';
import { StopLossPanel } from '@/components/market-maker/StopLossPanel';
import { RevertBacklogPanel } from '@/components/market-maker/RevertBacklogPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Bot, ChevronDown, Settings, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';

export default function MarketMakerPage() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const { bots, botsLoading, createBot, deleteBot } = useMarketMakerBots();
  
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ConfigSection>('basic_settings');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('My Market Maker Bot');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && user && role === 'admin') {
      navigate('/admin');
    }
  }, [user, role, authLoading, navigate]);

  // Select first bot by default
  useEffect(() => {
    if (!botsLoading && bots.length > 0 && !selectedBotId) {
      setSelectedBotId(bots[0].id);
    }
  }, [bots, botsLoading, selectedBotId]);

  const handleCreateBot = async () => {
    if (!newBotName.trim()) return;
    const newBot = await createBot.mutateAsync(newBotName);
    setSelectedBotId(newBot.id);
    setCreateDialogOpen(false);
    setNewBotName('My Market Maker Bot');
  };

  const handleDeleteBot = async () => {
    if (!selectedBotId) return;
    await deleteBot.mutateAsync(selectedBotId);
    setSelectedBotId(bots.length > 1 ? bots.find(b => b.id !== selectedBotId)?.id ?? null : null);
    setDeleteDialogOpen(false);
  };

  const selectedBot = bots.find(b => b.id === selectedBotId);

  if (authLoading || botsLoading) {
    return (
      <DashboardLayout activeTab="market-maker" onTabChange={() => {}}>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const renderConfigPanel = () => {
    if (!selectedBotId) {
      return (
        <Card className="border-border h-full flex items-center justify-center">
          <CardContent className="text-center py-12">
            <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bot Selected</h3>
            <p className="text-muted-foreground mb-4">
              Create or select a Market Maker bot to configure it.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bot
            </Button>
          </CardContent>
        </Card>
      );
    }

    switch (activeSection) {
      case 'basic_settings':
        return <BasicSettingsPanel botId={selectedBotId} />;
      case 'exchange':
        return <ExchangeSettingsPanel botId={selectedBotId} />;
      case 'notifications':
        return <NotificationsPanel botId={selectedBotId} />;
      case 'market_pricing':
        return <MarketPricingPanel botId={selectedBotId} />;
      case 'autocancel':
        return <AutocancelPanel botId={selectedBotId} />;
      case 'stop_loss':
        return <StopLossPanel botId={selectedBotId} />;
      case 'revert_backlog':
        return <RevertBacklogPanel botId={selectedBotId} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout activeTab="market-maker" onTabChange={(tab) => navigate(`/dashboard?tab=${tab}`)}>
      <div className="space-y-6">
        {/* Bot Selector Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Market Maker</h1>
              <p className="text-sm text-muted-foreground">Configure your market maker bot</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {bots.length > 0 && (
              <Select value={selectedBotId ?? ''} onValueChange={setSelectedBotId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a bot" />
                </SelectTrigger>
                <SelectContent>
                  {bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Bot
            </Button>

            {selectedBotId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Actions
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Bot
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <ConfigSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          
          {/* Config Panel */}
          <div className="flex-1 min-w-0">
            {renderConfigPanel()}
          </div>
        </div>
      </div>

      {/* Create Bot Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Market Maker Bot</DialogTitle>
            <DialogDescription>
              Give your new bot a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newBotName}
              onChange={(e) => setNewBotName(e.target.value)}
              placeholder="Bot name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBot} disabled={createBot.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bot Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBot?.name}"? This action cannot be undone and all configurations will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBot} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
