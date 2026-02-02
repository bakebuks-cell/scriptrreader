import { 
  Settings, 
  ArrowLeftRight, 
  Bell, 
  BarChart3, 
  XCircle, 
  ArrowDownCircle, 
  RotateCcw,
  Layers,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export type ConfigSection = 
  | 'basic_settings' 
  | 'exchange' 
  | 'notifications' 
  | 'market_pricing' 
  | 'order_layers'
  | 'autocancel' 
  | 'stop_loss' 
  | 'revert_backlog'
  | 'risk_control';

interface ConfigSidebarProps {
  activeSection: ConfigSection;
  onSectionChange: (section: ConfigSection) => void;
}

const generalItems = [
  { id: 'basic_settings' as const, label: 'Basic settings', shortLabel: 'Basic', icon: Settings },
  { id: 'exchange' as const, label: 'Exchange', shortLabel: 'Exchange', icon: ArrowLeftRight },
  { id: 'notifications' as const, label: 'Notifications', shortLabel: 'Notify', icon: Bell },
];

const marketMakerItems = [
  { id: 'market_pricing' as const, label: 'Market & Pricing', shortLabel: 'Market', icon: BarChart3 },
  { id: 'order_layers' as const, label: 'Order Layers', shortLabel: 'Layers', icon: Layers },
  { id: 'autocancel' as const, label: 'Autocancel', shortLabel: 'Cancel', icon: XCircle },
  { id: 'stop_loss' as const, label: 'Stop-loss', shortLabel: 'Stop', icon: ArrowDownCircle },
  { id: 'revert_backlog' as const, label: 'Revert & backlog', shortLabel: 'Revert', icon: RotateCcw },
  { id: 'risk_control' as const, label: 'Risk Control', shortLabel: 'Risk', icon: Shield },
];

const allItems = [...generalItems, ...marketMakerItems];

export function ConfigSidebar({ activeSection, onSectionChange }: ConfigSidebarProps) {
  return (
    <>
      {/* Mobile: Horizontal scrollable tabs */}
      <div className="lg:hidden w-full -mx-3 sm:-mx-4 px-3 sm:px-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-3">
            {allItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 touch-target",
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/80"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden xs:inline">{item.shortLabel}</span>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>

      {/* Desktop: Vertical sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="bg-card rounded-lg border border-border p-4 space-y-6 sticky top-20">
          {/* General Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              GENERAL
            </h3>
            <div className="space-y-1">
              {generalItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Market Maker Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              MARKET MAKER
            </h3>
            <div className="space-y-1">
              {marketMakerItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
