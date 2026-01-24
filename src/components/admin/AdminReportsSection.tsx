import { useState } from 'react';
import {
  useAdminScriptReports,
  REPORT_REASONS,
  REPORT_STATUSES,
  ReportStatus,
} from '@/hooks/useScriptReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Flag,
  Eye,
  CheckCircle,
  Clock,
  Trash2,
  MessageSquare,
  AlertTriangle,
  FileWarning,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AdminReportsSection() {
  const { toast } = useToast();
  const {
    reports,
    isLoading,
    updateReport,
    deleteReport,
    isUpdating,
    isDeleting,
    stats,
  } = useAdminScriptReports();

  const [selectedReport, setSelectedReport] = useState<typeof reports[0] | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<ReportStatus>('PENDING');

  const handleOpenDetails = (report: typeof reports[0]) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setNewStatus(report.status);
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;

    try {
      await updateReport({
        id: selectedReport.id,
        status: newStatus,
        admin_notes: adminNotes.trim() || undefined,
      });
      toast({ title: 'Success', description: 'Report updated successfully' });
      setSelectedReport(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReport(id);
      toast({ title: 'Success', description: 'Report deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleQuickAction = async (id: string, status: ReportStatus) => {
    try {
      await updateReport({ id, status });
      toast({ title: 'Success', description: `Report marked as ${status.toLowerCase()}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getReasonLabel = (reason: string) => {
    return REPORT_REASONS.find(r => r.value === reason)?.label || reason;
  };

  const getStatusBadge = (status: ReportStatus) => {
    const statusConfig = REPORT_STATUSES.find(s => s.value === status);
    const variants: Record<ReportStatus, 'destructive' | 'secondary' | 'default'> = {
      PENDING: 'destructive',
      REVIEWED: 'secondary',
      RESOLVED: 'default',
    };
    return (
      <Badge variant={variants[status]}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.reviewed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Script Reports
          </CardTitle>
          <CardDescription>
            Review and manage reported scripts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileWarning className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No reports yet</p>
              <p className="text-muted-foreground">All scripts are in good standing</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Script</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{report.script?.name || 'Unknown Script'}</p>
                        <p className="text-xs text-muted-foreground">{report.script?.symbol}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{report.reporter?.display_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{report.reporter?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getReasonLabel(report.reason)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(report.created_at), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetails(report)}
                          title="View Details"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        {report.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuickAction(report.id, 'REVIEWED')}
                            title="Mark as Reviewed"
                            disabled={isUpdating}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {report.status !== 'RESOLVED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuickAction(report.id, 'RESOLVED')}
                            title="Mark as Resolved"
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              title="Delete Report"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this report. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReport(report.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Report Details
            </DialogTitle>
            <DialogDescription>
              Review and update report status
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Script</Label>
                  <p className="font-medium">{selectedReport.script?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Symbol</Label>
                  <p>{selectedReport.script?.symbol}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Reporter</Label>
                  <p className="font-medium">
                    {selectedReport.reporter?.display_name || selectedReport.reporter?.email || 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reason</Label>
                  <Badge variant="outline">{getReasonLabel(selectedReport.reason)}</Badge>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg mt-1">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ReportStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this report..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateReport} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
