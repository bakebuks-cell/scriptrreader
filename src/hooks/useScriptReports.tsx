import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ReportReason = 'SPAM' | 'SCAM' | 'FAKE_STRATEGY' | 'OFFENSIVE' | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED';

export interface ScriptReport {
  id: string;
  script_id: string;
  reported_by: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  script?: {
    id: string;
    name: string;
    symbol: string;
    created_by: string | null;
  };
  reporter?: {
    email: string | null;
    display_name: string | null;
  };
}

export interface CreateReportInput {
  script_id: string;
  reason: ReportReason;
  description?: string;
}

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'SCAM', label: 'Scam' },
  { value: 'FAKE_STRATEGY', label: 'Fake Strategy' },
  { value: 'OFFENSIVE', label: 'Offensive Content' },
  { value: 'OTHER', label: 'Other' },
];

export const REPORT_STATUSES: { value: ReportStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'REVIEWED', label: 'Reviewed', color: 'bg-blue-500' },
  { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-500' },
];

// User hook - for creating reports
export function useScriptReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myReports, isLoading } = useQuery({
    queryKey: ['script-reports', 'user', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('script_reports')
        .select(`
          *,
          script:pine_scripts(id, name, symbol, created_by)
        `)
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ScriptReport[];
    },
    enabled: !!user?.id,
  });

  const createReport = useMutation({
    mutationFn: async (input: CreateReportInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('script_reports')
        .insert({
          script_id: input.script_id,
          reported_by: user.id,
          reason: input.reason,
          description: input.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ScriptReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-reports'] });
    },
  });

  return {
    myReports: myReports ?? [],
    isLoading,
    createReport: createReport.mutateAsync,
    isCreating: createReport.isPending,
  };
}

// Admin hook - for managing all reports
export function useAdminScriptReports() {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['script-reports', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('script_reports')
        .select(`
          *,
          script:pine_scripts(id, name, symbol, created_by)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch reporter profiles separately
      const reporterIds = [...new Set(data.map(r => r.reported_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .in('user_id', reporterIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(report => ({
        ...report,
        reporter: profileMap.get(report.reported_by) || null,
      })) as ScriptReport[];
    },
    enabled: isAdmin,
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: ReportStatus; admin_notes?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const updateData: any = { ...updates };
      if (updates.status && updates.status !== 'PENDING') {
        updateData.reviewed_by = user.id;
        updateData.reviewed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('script_reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ScriptReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-reports', 'admin'] });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('script_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-reports', 'admin'] });
    },
  });

  // Stats
  const pendingCount = reports?.filter(r => r.status === 'PENDING').length ?? 0;
  const reviewedCount = reports?.filter(r => r.status === 'REVIEWED').length ?? 0;
  const resolvedCount = reports?.filter(r => r.status === 'RESOLVED').length ?? 0;

  return {
    reports: reports ?? [],
    isLoading,
    error,
    updateReport: updateReport.mutateAsync,
    deleteReport: deleteReport.mutateAsync,
    isUpdating: updateReport.isPending,
    isDeleting: deleteReport.isPending,
    stats: {
      total: reports?.length ?? 0,
      pending: pendingCount,
      reviewed: reviewedCount,
      resolved: resolvedCount,
    },
  };
}
