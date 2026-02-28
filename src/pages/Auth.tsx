import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Zap, Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isAdminEmail } from '@/lib/constants';
import logo from '@/assets/logo.png';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const { signIn, signUp, user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Check for email verification success from URL and handle redirect
  useEffect(() => {
    const verified = searchParams.get('verified');
    const emailParam = searchParams.get('email');
    
    if (verified === 'true') {
      setVerifiedEmail(emailParam);
      
      // If user is already logged in (Supabase auto-signs in after verification),
      // redirect them to the dashboard immediately
      if (!loading && user && role) {
        toast({
          title: 'Email Verified!',
          description: 'Welcome! Redirecting to your dashboard...',
        });
        navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
        return;
      }
      
      // If still loading or no user yet, show verification success message
      if (!loading && !user) {
        toast({
          title: 'Email Verified!',
          description: 'Your email has been verified. You can now sign in.',
        });
      }
    }
  }, [searchParams, toast, loading, user, role, navigate]);

  // Redirect if already logged in (non-verification flow)
  useEffect(() => {
    if (!loading && user && role && !searchParams.get('verified')) {
      navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, role, loading, navigate, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error, requiresEmailVerification } = await signIn(email, password);

      if (error) {
        // Check for unverified email error
        if (error.message.includes('Email not confirmed')) {
          toast({
            title: 'Email Not Verified',
            description: 'Please check your inbox and verify your email before signing in.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
      } else if (requiresEmailVerification) {
        toast({
          title: 'Magic Link Sent',
          description: 'Check your email and click the sign-in link to continue.',
        });
      } else {
        const targetRoute = isAdminEmail(email) ? '/admin' : '/dashboard';
        navigate(targetRoute);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      // Show verification message
      setShowVerificationMessage(true);
      setEmail('');
      setPassword('');
    }
  };

  // Show verification pending screen
  if (showVerificationMessage) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="LoveWithTrade" className="h-20 w-auto" />
            <span className="text-xl font-bold">LoveWithTrade</span>
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
                We've sent a verification link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-primary/30 bg-primary/5">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Click the link in the email to verify your account. Once verified, you can sign in.
                </AlertDescription>
              </Alert>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Didn't receive the email? Check your spam folder.</p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowVerificationMessage(false)}
              >
                Back to Sign In
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
            <img src={logo} alt="LoveWithTrade" className="h-20 w-auto" />
            <span className="text-xl font-bold">LoveWithTrade</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your trading dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Show success message if email was just verified */}
            {verifiedEmail && (
              <Alert className="mb-4 border-primary/30 bg-primary/5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription>
                  Email verified successfully! You can now sign in.
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    You'll receive a verification email after signing up
                  </p>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                <span>Secure</span>
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
