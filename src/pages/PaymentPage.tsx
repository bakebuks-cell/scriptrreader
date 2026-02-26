import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionSettings } from '@/hooks/useSubscriptionSettings';
import { useUserPaymentRequests } from '@/hooks/usePaymentRequests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Copy, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  LogOut,
  Wallet,
  Send
} from 'lucide-react';
import logo from '@/assets/logo.png';

export default function PaymentPage() {
  const { user, signOut } = useAuth();
  const { settings, isLoading: settingsLoading } = useSubscriptionSettings();
  const { requests, submitPayment, isSubmitting, pendingRequest } = useUserPaymentRequests();
  const [txHash, setTxHash] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim() || !settings) return;

    try {
      await submitPayment({
        tx_hash: txHash.trim(),
        amount: settings.monthly_amount,
        crypto_symbol: settings.crypto_symbol,
        wallet_address: settings.receiver_wallet_address,
      });
      setTxHash('');
      toast({
        title: 'Payment Submitted',
        description: 'Your transaction hash has been submitted for verification.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to submit payment',
        variant: 'destructive',
      });
    }
  };

  const copyAddress = () => {
    if (settings?.receiver_wallet_address) {
      navigator.clipboard.writeText(settings.receiver_wallet_address);
      toast({ title: 'Copied!', description: 'Wallet address copied to clipboard' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-lg" />
      </div>
    );
  }

  // Get rejected requests (user can resubmit)
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Love With Trade" className="h-14 w-auto" />
          <span className="text-xl font-bold">Love With Trade</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          {/* Pending Request Status */}
          {pendingRequest && (
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <Clock className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                Your payment is pending admin confirmation. TX Hash: <code className="text-xs">{pendingRequest.tx_hash}</code>
              </AlertDescription>
            </Alert>
          )}

          {/* Rejected Request Notice */}
          {!pendingRequest && rejectedRequests.length > 0 && (
            <Alert className="border-destructive/30 bg-destructive/5">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                Your previous payment was rejected. 
                {rejectedRequests[0].admin_notes && (
                  <span className="block mt-1 text-sm">Reason: {rejectedRequests[0].admin_notes}</span>
                )}
                Please submit a new transaction hash below.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Subscription Payment</CardTitle>
              <CardDescription>
                Pay monthly to access the trading bot features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount */}
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Monthly Amount</p>
                <p className="text-3xl font-bold text-primary">
                  {settings?.monthly_amount} {settings?.crypto_symbol}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {settings?.crypto_name}
                </p>
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Send to Wallet Address</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-md bg-muted text-sm break-all font-mono">
                    {settings?.receiver_wallet_address || 'Not configured'}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyAddress} className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              {settings?.receiver_wallet_address && (
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG
                      value={settings.receiver_wallet_address}
                      size={180}
                      level="H"
                      includeMargin
                    />
                  </div>
                </div>
              )}

              {/* Submit TX Hash Form */}
              {!pendingRequest && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tx-hash">Transaction Hash</Label>
                    <Input
                      id="tx-hash"
                      placeholder="Enter your transaction hash..."
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      required
                      minLength={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the transaction hash after sending the payment
                    </p>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isSubmitting || !txHash.trim()}>
                    <Send className="h-4 w-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit Payment'}
                  </Button>
                </form>
              )}

              {/* Previous Payments */}
              {requests.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment History</Label>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {requests.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 text-sm">
                        <div className="flex-1 min-w-0">
                          <code className="text-xs truncate block">{r.tx_hash}</code>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          r.status === 'CONFIRMED' ? 'default' :
                          r.status === 'REJECTED' ? 'destructive' : 'secondary'
                        } className="ml-2 shrink-0 gap-1">
                          {r.status === 'CONFIRMED' && <CheckCircle2 className="h-3 w-3" />}
                          {r.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                          {r.status === 'PENDING' && <Clock className="h-3 w-3" />}
                          {r.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
