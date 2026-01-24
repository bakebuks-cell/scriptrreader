import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flag, AlertTriangle } from 'lucide-react';
import { useScriptReports, REPORT_REASONS, ReportReason } from '@/hooks/useScriptReports';
import { useToast } from '@/hooks/use-toast';

interface ReportScriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scriptId: string;
  scriptName: string;
}

export default function ReportScriptModal({
  open,
  onOpenChange,
  scriptId,
  scriptName,
}: ReportScriptModalProps) {
  const { toast } = useToast();
  const { createReport, isCreating } = useScriptReports();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: 'Error',
        description: 'Please select a reason for reporting',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createReport({
        script_id: scriptId,
        reason: reason as ReportReason,
        description: description.trim() || undefined,
      });

      toast({
        title: 'Report Submitted',
        description: 'Thank you for your report. Our team will review it shortly.',
      });

      // Reset and close
      setReason('');
      setDescription('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit report',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Report Script
          </DialogTitle>
          <DialogDescription>
            Report "{scriptName}" for violating our guidelines
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Important</p>
              <p className="text-muted-foreground">
                False reports may result in action against your account. Only report genuine violations.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about why you're reporting this script..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isCreating || !reason}
          >
            {isCreating ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
