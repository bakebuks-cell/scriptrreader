import { useState } from 'react';
import { useAdminLifetimeFreeEmails } from '@/hooks/useLifetimeFreeEmails';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Crown, Plus, Trash2, Mail } from 'lucide-react';

export default function LifetimeFreeEmailsPanel() {
  const { emails, isLoading, addEmail, removeEmail, isAdding, isRemoving } = useAdminLifetimeFreeEmails();
  const [newEmail, setNewEmail] = useState('');
  const { toast } = useToast();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    try {
      await addEmail(newEmail);
      setNewEmail('');
      toast({ title: 'Added', description: 'Email added to lifetime free list.' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add email',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeEmail(id);
      toast({ title: 'Removed', description: 'Email removed from lifetime free list.' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to remove email',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Lifetime Free Access
        </CardTitle>
        <CardDescription>
          Users with these emails bypass subscription checks entirely
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            type="email"
            placeholder="user@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={isAdding} size="sm" className="gap-1 shrink-0">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>

        {emails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No lifetime free emails configured</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emails.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{entry.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Since {new Date(entry.created_at).toLocaleDateString()}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(entry.id)}
                    disabled={isRemoving}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
