import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Code, 
  BarChart3, 
  Wallet,
  Settings, 
  LogOut,
  TrendingUp,
  Menu,
  Shield,
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
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Users', icon: Users, tab: 'users' },
  { title: 'Coins', icon: Coins, tab: 'coins' },
  { title: 'Pine Scripts', icon: Code, tab: 'scripts' },
  { title: 'Trades', icon: BarChart3, tab: 'trades' },
  { title: 'Wallets', icon: Wallet, tab: 'wallets' },
  { title: 'Settings', icon: Settings, tab: 'settings' },
  { title: 'Profile', icon: User, tab: 'profile' },
];

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function AdminSidebarNav({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sidebar-foreground">PineTrader</span>
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              </div>
              <span className="text-xs text-muted-foreground">Control Panel</span>
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

function AdminTopBar({ activeTab }: { activeTab: string }) {
  const tabTitles: Record<string, string> = {
    users: 'User Management',
    coins: 'Coin Management',
    scripts: 'Pine Scripts',
    trades: 'Trade Monitor',
    wallets: 'Wallet Overview',
    settings: 'Settings',
    profile: 'Admin Profile',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <SidebarTrigger className="md:hidden">
        <Menu className="h-5 w-5" />
      </SidebarTrigger>
      
      <div className="flex-1 flex items-center gap-3">
        <h1 className="text-xl font-semibold">{tabTitles[activeTab] || 'Admin'}</h1>
        <Badge variant="outline" className="hidden sm:flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      </div>

      <ThemeToggle />
    </header>
  );
}

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <AdminSidebarNav activeTab={activeTab} onTabChange={onTabChange} />
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopBar activeTab={activeTab} />
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
