import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LifetimeFreeEmail {
  id: string;
  email: string;
  created_at: string;
}

export function useLifetimeFreeEmails() {
  const { user } = useAuth();

  const { data: emails, isLoading, error } = useQuery({
    queryKey: ['lifetime-free-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lifetime_free_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LifetimeFreeEmail[];
    },
    enabled: !!user,
  });

  return {
    emails: emails ?? [],
    isLoading,
    error,
    isLifetimeFree: (email: string) => {
      return emails?.some(e => e.email.toLowerCase() === email.toLowerCase()) ?? false;
    },
  };
}

export function useAdminLifetimeFreeEmails() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: emails, isLoading, error } = useQuery({
    queryKey: ['lifetime-free-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lifetime_free_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LifetimeFreeEmail[];
    },
    enabled: isAdmin,
  });

  const addEmail = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase
        .from('lifetime_free_emails')
        .insert({ email: email.toLowerCase().trim() })
        .select()
        .single();

      if (error) throw error;
      return data as LifetimeFreeEmail;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifetime-free-emails'] });
    },
  });

  const removeEmail = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lifetime_free_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifetime-free-emails'] });
    },
  });

  return {
    emails: emails ?? [],
    isLoading,
    error,
    addEmail: addEmail.mutateAsync,
    removeEmail: removeEmail.mutateAsync,
    isAdding: addEmail.isPending,
    isRemoving: removeEmail.isPending,
  };
}
