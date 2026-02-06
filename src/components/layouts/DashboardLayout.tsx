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
  User,
  LineChart,
  Bot
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { PaidModeIndicator } from '@/components/PaidModeIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', tab: 'overview' },
  { title: 'Charts', icon: LineChart, path: '/dashboard', tab: 'charts' },
  { title: 'Library', icon: Code, path: '/dashboard', tab: 'scripts' },
  { title: 'Analytics', icon: BarChart3, path: '/dashboard', tab: 'analytics' },
  { title: 'Wallet', icon: Wallet, path: '/dashboard', tab: 'wallet' },
  { title: 'Trades', icon: TrendingUp, path: '/dashboard', tab: 'trades' },
  { title: 'Settings', icon: Settings, path: '/dashboard', tab: 'settings' },
  { title: 'Profile', icon: User, path: '/dashboard', tab: 'profile' },
];

// TODO: Market Maker hidden temporarily — unhide when ready
// const botItems = [
//   { title: 'Market Maker', icon: Bot, path: '/market-maker', tab: 'market-maker' },
// ];
const botItems: typeof navItems = [];

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function SidebarNav({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavClick = (item: typeof navItems[0] | typeof botItems[0]) => {
    if (item.path === '/market-maker') {
      navigate('/market-maker');
    } else {
      onTabChange(item.tab);
    }
  };

  const isActive = (item: typeof navItems[0] | typeof botItems[0]) => {
    if (item.path === '/market-maker') {
      return location.pathname === '/market-maker';
    }
    return activeTab === item.tab;
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
                    onClick={() => handleNavClick(item)}
                    isActive={isActive(item)}
                    tooltip={item.title}
                    className={cn(
                      "transition-colors",
                      isActive(item) && "bg-sidebar-accent text-primary font-medium"
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

        {/* Bots Section */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bots
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {botItems.map((item) => (
                <SidebarMenuItem key={item.tab}>
                  <SidebarMenuButton
                    onClick={() => handleNavClick(item)}
                    isActive={isActive(item)}
                    tooltip={item.title}
                    className={cn(
                      "transition-colors",
                      isActive(item) && "bg-sidebar-accent text-primary font-medium"
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
  const location = useLocation();
  
  const tabTitles: Record<string, string> = {
    overview: 'Dashboard',
    charts: 'Price Charts',
    scripts: 'Library',
    analytics: 'Script Analytics',
    wallet: 'Wallet',
    trades: 'Trade History',
    settings: 'Settings',
    profile: 'Profile',
    'market-maker': 'Market Maker',
  };

  const currentTitle = location.pathname === '/market-maker' 
    ? 'Market Maker' 
    : tabTitles[activeTab] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-6 safe-area-inset-top">
      <SidebarTrigger className="h-10 w-10 touch-target">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>
      
      <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
        <h1 className="text-base sm:text-xl font-semibold truncate">{currentTitle}</h1>
        <PaidModeIndicator />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        {/* Single responsive sidebar - offcanvas on mobile, icon-collapsible on desktop */}
        <Sidebar 
          collapsible="icon" 
          className="border-r border-sidebar-border"
        >
          <SidebarNav activeTab={activeTab} onTabChange={onTabChange} />
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar activeTab={activeTab} />
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto safe-area-inset-bottom">
            <div className="animate-fade-in max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
