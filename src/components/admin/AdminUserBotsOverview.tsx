import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Code, Power, User } from 'lucide-react';
import type { PineScript } from '@/hooks/usePineScripts';

interface UserScriptRecord {
  id: string;
  user_id: string;
  script_id: string;
  is_active: boolean;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  email: string | null;
  display_name: string | null;
  bot_enabled: boolean;
}

interface AdminUserBotsOverviewProps {
  scripts: PineScript[];
  allUserScriptRecords: UserScriptRecord[];
  allProfiles: UserProfile[];
}

interface UserBotData {
  userId: string;
  email: string | null;
  displayName: string | null;
  botEnabled: boolean;
  ownScripts: { script: PineScript; isActive: boolean }[];
  companyScripts: { script: PineScript; isActive: boolean }[];
}

export default function AdminUserBotsOverview({
  scripts,
  allUserScriptRecords,
  allProfiles,
}: AdminUserBotsOverviewProps) {
  // Build a per-user breakdown
  const scriptMap = new Map(scripts.map(s => [s.id, s]));

  const usersData: UserBotData[] = allProfiles.map(profile => {
    // Own scripts: scripts created by this user (non-admin)
    const ownScripts = scripts
      .filter(s => s.created_by === profile.user_id && !s.admin_tag)
      .map(s => ({ script: s, isActive: s.is_active }));

    // Company script activations via user_scripts
    const userRecords = allUserScriptRecords.filter(r => r.user_id === profile.user_id);
    const companyScripts = userRecords
      .map(r => {
        const script = scriptMap.get(r.script_id);
        if (!script) return null;
        return { script, isActive: r.is_active };
      })
      .filter(Boolean) as { script: PineScript; isActive: boolean }[];

    return {
      userId: profile.user_id,
      email: profile.email,
      displayName: profile.display_name,
      botEnabled: profile.bot_enabled,
      ownScripts,
      companyScripts,
    };
  });

  // Summary stats
  const totalBotActive = usersData.filter(u => u.botEnabled).length;
  const totalBotInactive = usersData.filter(u => !u.botEnabled).length;
  const totalActiveScripts = usersData.reduce(
    (sum, u) =>
      sum +
      u.ownScripts.filter(s => s.isActive).length +
      u.companyScripts.filter(s => s.isActive).length,
    0
  );
  const totalInactiveScripts = usersData.reduce(
    (sum, u) =>
      sum +
      u.ownScripts.filter(s => !s.isActive).length +
      u.companyScripts.filter(s => !s.isActive).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Power className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalBotActive}</p>
              <p className="text-xs text-muted-foreground">Bots Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-muted">
              <Power className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalBotInactive}</p>
              <p className="text-xs text-muted-foreground">Bots Inactive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Code className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalActiveScripts}</p>
              <p className="text-xs text-muted-foreground">Active Scripts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-muted">
              <Code className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalInactiveScripts}</p>
              <p className="text-xs text-muted-foreground">Inactive Scripts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-User Breakdown */}
      {usersData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No users found</p>
          </CardContent>
        </Card>
      ) : (
        usersData.map(userData => {
          const totalScripts = userData.ownScripts.length + userData.companyScripts.length;
          const activeCount =
            userData.ownScripts.filter(s => s.isActive).length +
            userData.companyScripts.filter(s => s.isActive).length;

          return (
            <Card key={userData.userId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${userData.botEnabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                      <Bot className={`h-5 w-5 ${userData.botEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {userData.displayName || userData.email || userData.userId.slice(0, 8) + '...'}
                      </CardTitle>
                      {userData.displayName && userData.email && (
                        <CardDescription className="text-xs">{userData.email}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={userData.botEnabled ? 'default' : 'secondary'}>
                      {userData.botEnabled ? '🟢 Bot Active' : '🔴 Bot Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {activeCount}/{totalScripts} scripts active
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {totalScripts > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {/* Own Scripts */}
                    {userData.ownScripts.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Own Scripts</p>
                        <div className="flex flex-wrap gap-2">
                          {userData.ownScripts.map(({ script, isActive }) => (
                            <Badge
                              key={script.id}
                              variant={isActive ? 'default' : 'outline'}
                              className={`gap-1 text-xs ${isActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
                            >
                              {isActive ? '🟢' : '🔴'} {script.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Company Scripts */}
                    {userData.companyScripts.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Company Scripts</p>
                        <div className="flex flex-wrap gap-2">
                          {userData.companyScripts.map(({ script, isActive }) => (
                            <Badge
                              key={script.id}
                              variant={isActive ? 'default' : 'outline'}
                              className={`gap-1 text-xs ${isActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
                            >
                              {isActive ? '🟢' : '🔴'} {script.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
