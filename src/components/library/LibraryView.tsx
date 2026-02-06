import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, Shield, BookOpen, BarChart3 } from 'lucide-react';
import PineScriptEditor from '@/components/PineScriptEditor';
import ManualCloseTradesButton from '@/components/ManualCloseTradesButton';
import ScriptExportButton from '@/components/ScriptExportButton';
import ScriptAnalyticsDashboard from '@/components/analytics/ScriptAnalyticsDashboard';
import type { PineScriptWithUserState } from '@/hooks/usePineScripts';

interface LibraryViewProps {
  scripts: any[];
  ownScripts: PineScriptWithUserState[];
  adminScripts: PineScriptWithUserState[];
  onSave: (script: any) => Promise<void>;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void | string>;
  onToggleActivation: (id: string, is_active: boolean) => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  isToggling: boolean;
}

function BotStatusSummary({ scripts }: { scripts: PineScriptWithUserState[] }) {
  const active = scripts.filter(s => s.user_is_active).length;
  const inactive = scripts.filter(s => !s.user_is_active).length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Bot className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{active}</p>
            <p className="text-xs text-muted-foreground">Active Bots</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="p-2 rounded-lg bg-muted">
            <Bot className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{inactive}</p>
            <p className="text-xs text-muted-foreground">Inactive Bots</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{scripts.length}</p>
            <p className="text-xs text-muted-foreground">Built Bots</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LibraryView({
  scripts,
  ownScripts,
  adminScripts,
  onSave,
  onUpdate,
  onDelete,
  onToggleActivation,
  isLoading,
  isSaving,
  isToggling,
}: LibraryViewProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="company" className="w-full">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <TabsList>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Company Library
            </TabsTrigger>
            <TabsTrigger value="own" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Own Library
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <ManualCloseTradesButton />
            <ScriptExportButton scripts={scripts} />
          </div>
        </div>

        <TabsContent value="company">
          <BotStatusSummary scripts={adminScripts} />
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Company Library
              </CardTitle>
              <CardDescription>
                Admin-managed strategies. You can activate/deactivate bots, select coins, and manually close trades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PineScriptEditor
                scripts={adminScripts}
                onSave={onSave}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onToggleActivation={onToggleActivation}
                isLoading={isLoading}
                isSaving={isSaving}
                isToggling={isToggling}
                readOnly
                companyMode
                usePerUserActivation
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="own">
          <BotStatusSummary scripts={ownScripts} />
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Own Library
              </CardTitle>
              <CardDescription>
                Create, edit, and manage your own trading strategies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PineScriptEditor
                scripts={ownScripts}
                onSave={onSave}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onToggleActivation={onToggleActivation}
                isLoading={isLoading}
                isSaving={isSaving}
                isToggling={isToggling}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <ScriptAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
