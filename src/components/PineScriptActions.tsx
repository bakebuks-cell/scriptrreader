import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Flag, Eye } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ReportScriptModal from './ReportScriptModal';

interface PineScriptActionsProps {
  scriptId: string;
  scriptName: string;
  scriptOwnerId: string | null;
  currentUserId: string | null;
  isAdmin: boolean;
  isAdminScript?: boolean; // Whether the script has admin_tag
  onEdit?: () => void;
  onView?: () => void;
  showView?: boolean;
  showEdit?: boolean;
  showReport?: boolean;
  compact?: boolean;
}

export default function PineScriptActions({
  scriptId,
  scriptName,
  scriptOwnerId,
  currentUserId,
  isAdmin,
  isAdminScript = false,
  onEdit,
  onView,
  showView = true,
  showEdit = true,
  showReport = true,
  compact = false,
}: PineScriptActionsProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Edit permission: 
  // - Admin can edit anything
  // - User can edit their own scripts (but not admin scripts)
  const canEdit = isAdmin || (currentUserId && scriptOwnerId === currentUserId && !isAdminScript);
  
  // Report permission: any user can report any script except their own
  const canReport = currentUserId && scriptOwnerId !== currentUserId;

  const buttonSize = compact ? 'icon' : 'sm';
  const iconSize = compact ? 'h-4 w-4' : 'h-4 w-4';

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {showView && onView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={buttonSize}
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
              >
                <Eye className={iconSize} />
                {!compact && <span className="ml-1">View</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>View script details</TooltipContent>
          </Tooltip>
        )}

        {showEdit && canEdit && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={buttonSize}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className={iconSize} />
                {!compact && <span className="ml-1">Edit</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit script</TooltipContent>
          </Tooltip>
        )}

        {showReport && canReport && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={buttonSize}
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setReportModalOpen(true);
                }}
              >
                <Flag className={iconSize} />
                {!compact && <span className="ml-1">Report</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Report this script</TooltipContent>
          </Tooltip>
        )}

        <ReportScriptModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          scriptId={scriptId}
          scriptName={scriptName}
        />
      </div>
    </TooltipProvider>
  );
}
