import { 
  Settings, 
  ArrowLeftRight, 
  Bell, 
  BarChart3, 
  XCircle, 
  ArrowDownCircle, 
  RotateCcw 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfigSection = 
  | 'basic_settings' 
  | 'exchange' 
  | 'notifications' 
  | 'market_pricing' 
  | 'autocancel' 
  | 'stop_loss' 
  | 'revert_backlog';

interface ConfigSidebarProps {
  activeSection: ConfigSection;
  onSectionChange: (section: ConfigSection) => void;
}

const generalItems = [
  { id: 'basic_settings' as const, label: 'Basic settings', icon: Settings },
  { id: 'exchange' as const, label: 'Exchange', icon: ArrowLeftRight },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
];

const marketMakerItems = [
  { id: 'market_pricing' as const, label: 'Market & Pricing', icon: BarChart3 },
  { id: 'autocancel' as const, label: 'Autocancel', icon: XCircle },
  { id: 'stop_loss' as const, label: 'Stop-loss', icon: ArrowDownCircle },
  { id: 'revert_backlog' as const, label: 'Revert & backlog', icon: RotateCcw },
];

export function ConfigSidebar({ activeSection, onSectionChange }: ConfigSidebarProps) {
  return (
    <div className="w-full lg:w-64 shrink-0">
      <div className="bg-card rounded-lg border border-border p-4 space-y-6">
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
  );
}
