import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileJson, FileCode, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface ScriptExportButtonProps {
  scripts: PineScript[];
  selectedScript?: PineScript | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function ScriptExportButton({
  scripts,
  selectedScript,
  variant = 'outline',
  size = 'default',
}: ScriptExportButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  };

  const exportAsPineScript = (script: PineScript) => {
    const header = `// ===============================================
// Script: ${script.name}
// Description: ${script.description || 'No description'}
// Symbol: ${script.symbol}
// Timeframes: ${script.allowed_timeframes.join(', ')}
// Created: ${new Date(script.created_at).toLocaleDateString()}
// ===============================================

`;
    const content = header + script.script_content;
    const filename = `${sanitizeFilename(script.name)}.pine`;
    downloadFile(content, filename, 'text/plain');
  };

  const exportAsJson = (scripts: PineScript[]) => {
    const exportData = scripts.map(script => ({
      name: script.name,
      description: script.description,
      script_content: script.script_content,
      symbol: script.symbol,
      allowed_timeframes: script.allowed_timeframes,
      is_active: script.is_active,
      bot_config: {
        candle_type: script.candle_type,
        market_type: script.market_type,
        trading_pairs: script.trading_pairs,
        multi_pair_mode: script.multi_pair_mode,
        position_size_type: script.position_size_type,
        position_size_value: script.position_size_value,
        max_capital: script.max_capital,
        leverage: script.leverage,
        max_trades_per_day: script.max_trades_per_day,
      },
      created_at: script.created_at,
      updated_at: script.updated_at,
    }));

    const content = JSON.stringify(exportData, null, 2);
    const filename = scripts.length === 1 
      ? `${sanitizeFilename(scripts[0].name)}.json`
      : `pine_scripts_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    downloadFile(content, filename, 'application/json');
  };

  const exportAsText = (scripts: PineScript[]) => {
    let content = `Pine Scripts Backup
Generated: ${new Date().toLocaleString()}
Total Scripts: ${scripts.length}
${'='.repeat(50)}

`;

    scripts.forEach((script, index) => {
      content += `
${'─'.repeat(50)}
SCRIPT ${index + 1}: ${script.name}
${'─'.repeat(50)}
Description: ${script.description || 'None'}
Symbol: ${script.symbol}
Timeframes: ${script.allowed_timeframes.join(', ')}
Status: ${script.is_active ? 'Active' : 'Inactive'}
Market Type: ${script.market_type || 'spot'}
Leverage: ${script.leverage || 1}x
Created: ${new Date(script.created_at).toLocaleString()}

--- SCRIPT CONTENT ---
${script.script_content}
--- END SCRIPT ---

`;
    });

    const filename = `pine_scripts_backup_${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(content, filename, 'text/plain');
  };

  const handleExport = async (format: 'pine' | 'json' | 'text', all: boolean) => {
    setIsExporting(true);
    try {
      const scriptsToExport = all ? scripts : (selectedScript ? [selectedScript] : []);
      
      if (scriptsToExport.length === 0) {
        toast({
          title: 'No scripts to export',
          description: 'Select a script or choose "Export All"',
          variant: 'destructive',
        });
        return;
      }

      switch (format) {
        case 'pine':
          if (all) {
            scriptsToExport.forEach(script => exportAsPineScript(script));
            toast({
              title: 'Export Complete',
              description: `Exported ${scriptsToExport.length} scripts as .pine files`,
            });
          } else if (selectedScript) {
            exportAsPineScript(selectedScript);
            toast({
              title: 'Export Complete',
              description: `Exported "${selectedScript.name}" as .pine file`,
            });
          }
          break;
        case 'json':
          exportAsJson(scriptsToExport);
          toast({
            title: 'Export Complete',
            description: `Exported ${scriptsToExport.length} script(s) as JSON`,
          });
          break;
        case 'text':
          exportAsText(scriptsToExport);
          toast({
            title: 'Export Complete',
            description: `Exported ${scriptsToExport.length} script(s) as text file`,
          });
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting || scripts.length === 0}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {size !== 'icon' && <span className="ml-2">Export</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {selectedScript && (
          <>
            <DropdownMenuLabel>Export Selected Script</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport('pine', false)}>
              <FileCode className="h-4 w-4 mr-2" />
              As Pine Script (.pine)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json', false)}>
              <FileJson className="h-4 w-4 mr-2" />
              As JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel>Export All Scripts ({scripts.length})</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('pine', true)}>
          <FileCode className="h-4 w-4 mr-2" />
          All as Pine Scripts
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json', true)}>
          <FileJson className="h-4 w-4 mr-2" />
          All as JSON (full backup)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('text', true)}>
          <FileText className="h-4 w-4 mr-2" />
          All as Text File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
