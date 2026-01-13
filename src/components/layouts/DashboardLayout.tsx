import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Code, 
  Wallet, 
  BarChart3, 
  Settings, 
  LogOut,
  TrendingUp,
  Menu,
  Coins,
  User
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', tab: 'overview' },
  { title: 'Pine Script', icon: Code, path: '/dashboard', tab: 'scripts' },
  { title: 'Wallet', icon: Wallet, path: '/dashboard', tab: 'wallet' },
  { title: 'Trades', icon: BarChart3, path: '/dashboard', tab: 'trades' },
  { title: 'Settings', icon: Settings, path: '/dashboard', tab: 'settings' },
  { title: 'Profile', icon: User, path: '/dashboard', tab: 'profile' },
];

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function SidebarNav({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">PineTrader</span>
              <span className="text-xs text-muted-foreground">Trading Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.tab}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.tab)}
                    isActive={activeTab === item.tab}
                    tooltip={item.title}
                    className={cn(
                      "transition-colors",
                      activeTab === item.tab && "bg-sidebar-accent text-primary font-medium"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Coin Status */}
        {!isCollapsed && profile && (
          <div className="mt-4 mx-2 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Coins:</span>
              <span className="font-semibold text-sidebar-foreground">{profile.coins}</span>
            </div>
            {profile.coins === 0 && (
              <p className="text-xs text-destructive mt-1">No trades remaining</p>
            )}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        {!isCollapsed && (
          <div className="mt-2 px-2">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        )}
      </SidebarFooter>
    </>
  );
}

function TopBar({ activeTab }: { activeTab: string }) {
  const { profile } = useProfile();
  const tabTitles: Record<string, string> = {
    overview: 'Dashboard',
    scripts: 'Pine Script Editor',
    wallet: 'Wallet',
    trades: 'Trade History',
    settings: 'Settings',
    profile: 'Profile',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <SidebarTrigger className="md:hidden">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>
      
      <div className="flex-1">
        <h1 className="text-xl font-semibold">{tabTitles[activeTab] || 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-4">
        {profile && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{profile.coins} coins</span>
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <SidebarNav activeTab={activeTab} onTabChange={onTabChange} />
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar activeTab={activeTab} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
