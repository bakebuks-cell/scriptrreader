import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Lock, Zap, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { signInWithMagicLink, user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Redirect to dashboard once session + role are available
  useEffect(() => {
    if (!loading && user && role) {
      navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, role, loading, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setIsLoading(true);
    const { error } = await signInWithMagicLink(email);
    setIsLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('rate limit') || error.message.includes('security purposes')) {
        toast({ title: 'Please wait', description: 'You can request a new link in 60 seconds.', variant: 'destructive' });
        setCooldown(60);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      setShowCheckEmail(true);
      setCooldown(60);
    }
  };

  // Show "check your email" screen
  if (showCheckEmail) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">PineTrader</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription className="mt-2">
                We've sent a login link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-primary/30 bg-primary/5">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Click the link in the email to sign in instantly. Your dashboard will open directly.
                </AlertDescription>
              </Alert>

              <div className="text-center text-sm text-muted-foreground">
                <p>Didn't receive the email? Check your spam folder.</p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCheckEmail(false)}
              >
                Use a different email
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">PineTrader</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to PineTrader</CardTitle>
            <CardDescription>Enter your email to receive a login link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || cooldown > 0}>
                {isLoading ? 'Sending link...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Login Link'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                New users will be automatically registered
              </p>
            </form>

            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                <span>Passwordless</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>5 Free Trades</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
