import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, RefreshCw, TrendingUp, TrendingDown, Link2Off, ShieldCheck, User, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useWalletBalance, useOpenPositions, Wallet as WalletType } from '@/hooks/useWallets';
import { useTrades } from '@/hooks/useTrades';
import { useToast } from '@/hooks/use-toast';

interface WalletCardProps {
  compact?: boolean;
  wallet?: WalletType;
  showRoleBadge?: boolean;
}

export default function WalletCard({ compact = false, wallet, showRoleBadge = false }: WalletCardProps) {
  const { balances, totalUSDT, isLoading, isRefreshing, refresh, hasWallets, wallet: activeWallet, error } = useWalletBalance(wallet?.id);
  const { positions: rawPositions } = useOpenPositions();
  const positions = rawPositions.filter(p => Math.abs(parseFloat(p.positionAmt)) > 0.1);
  const { activeTrades, closeSingleTrade, closingSingleId } = useTrades();
  const openTradesCount = activeTrades.length;
  const { toast } = useToast();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleCloseTrade = async (tradeId: string) => {
    if (confirmingId !== tradeId) {
      setConfirmingId(tradeId);
      return;
    }
    try {
      setConfirmingId(null);
      await closeSingleTrade(tradeId);
      toast({ title: 'Trade closed', description: 'Position has been closed successfully.' });
    } catch {
      toast({ title: 'Failed to close trade', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const displayWallet = wallet || activeWallet;

  const errorMessage = error?.message || '';
  const isApiError = errorMessage.includes('Invalid API key') ||
                     errorMessage.includes('IP not whitelisted') ||
                     errorMessage.includes('unavailable in your region');

  if (!hasWallets && !wallet) {
    return compact ? (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Link2Off className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">Not Connected</p>
        <p className="text-xs text-muted-foreground">Add your Binance API keys</p>
      </div>
    ) : (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Binance Wallet
          </CardTitle>
          <CardDescription>Connect your Binance API keys to view your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="empty-state py-8">
            <Wallet className="empty-state-icon" />
            <p className="empty-state-title">No wallets configured</p>
            <p className="empty-state-description">Add your Binance API keys in Settings to see your balance</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {showRoleBadge && displayWallet && (
          <div className="flex items-center gap-2">
            <Badge
              variant={displayWallet.role === 'ADMIN' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {displayWallet.role === 'ADMIN' ? (
                <><ShieldCheck className="h-3 w-3 mr-1" /> Admin Wallet</>
              ) : (
                <><User className="h-3 w-3 mr-1" /> User Wallet</>
              )}
            </Badge>
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : isApiError ? (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-destructive">Connection Error</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {errorMessage.includes('IP not whitelisted')
                    ? 'Whitelist server IPs in your Binance API settings'
                    : errorMessage.includes('unavailable in your region')
                    ? 'Try using Binance US if in the US'
                    : 'Check your API key configuration'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                {displayWallet?.name || 'Total Balance'}
              </p>
              <p className="text-xl font-bold text-primary">
                ${totalUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            {openTradesCount > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">{openTradesCount} open position{openTradesCount !== 1 ? 's' : ''}</p>
                {activeTrades.map((trade) => {
                  const isClosing = closingSingleId === trade.id;
                  const isConfirming = confirmingId === trade.id;
                  return (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{trade.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {trade.signal_type} · {trade.entry_price ? `$${trade.entry_price.toFixed(2)}` : 'Pending'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                          trade.status === 'OPEN' ? 'bg-buy/10 text-buy' : 'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {trade.status}
                        </span>
                        <Button
                          size="sm"
                          variant={isConfirming ? 'destructive' : 'outline'}
                          className="h-6 text-xs px-2"
                          disabled={isClosing}
                          onClick={() => handleCloseTrade(trade.id)}
                          onBlur={() => { if (confirmingId === trade.id) setConfirmingId(null); }}
                        >
                          {isClosing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isConfirming ? (
                            'Confirm'
                          ) : (
                            <><X className="h-3 w-3 mr-0.5" />Close</>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No open positions</p>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              {displayWallet?.name || 'Binance Wallet'}
              {showRoleBadge && displayWallet && (
                <Badge
                  variant={displayWallet.role === 'ADMIN' ? 'default' : 'secondary'}
                  className="text-xs ml-2"
                >
                  {displayWallet.role}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {displayWallet?.exchange || 'Binance'} • {displayWallet?.is_active ? 'Active' : 'Inactive'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isApiError ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <p className="font-medium">Connection Error</p>
              <p className="text-sm mt-1">{errorMessage}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Set IP Access to <strong>"Unrestricted (Less Secure)"</strong> in Binance API settings. Our servers use dynamic IPs.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Total Balance */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">Total Balance (USDT)</p>
              <p className="text-3xl font-bold text-primary">
                ${totalUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Asset List */}
            {balances.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Assets</p>
                {balances.slice(0, 5).map((balance) => (
                  <div
                    key={balance.asset}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{balance.asset.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{balance.asset}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium font-mono">{parseFloat(balance.free).toFixed(4)}</p>
                      {parseFloat(balance.locked) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Locked: {parseFloat(balance.locked).toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Open Positions - show live Binance positions OR DB open trades as fallback */}
            {(positions.length > 0 || activeTrades.length > 0) && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="text-sm font-medium">Open Positions</p>
                {positions.length > 0 ? (
                  positions.map((position, idx) => {
                    const pnl = parseFloat(position.unrealizedProfit);
                    const isProfit = pnl >= 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{position.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {position.leverage}x • Entry: ${parseFloat(position.entryPrice).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isProfit ? (
                              <TrendingUp className="h-4 w-4 text-buy" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-sell" />
                            )}
                            <span className={`font-medium ${isProfit ? 'text-buy' : 'text-sell'}`}>
                              ${Math.abs(pnl).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Size: {position.positionAmt}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Fallback: show DB open trades with Close buttons
                  activeTrades.map((trade) => {
                    const isClosing = closingSingleId === trade.id;
                    const isConfirming = confirmingId === trade.id;
                    return (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{trade.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {trade.signal_type} • Entry: {trade.entry_price ? `$${trade.entry_price.toFixed(2)}` : 'Pending'}
                          </p>
                          <p className="text-xs text-muted-foreground">{trade.timeframe}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            trade.status === 'OPEN'
                              ? 'bg-buy/10 text-buy'
                              : 'bg-yellow-500/10 text-yellow-600'
                          }`}>
                            {trade.status}
                          </span>
                          <Button
                            size="sm"
                            variant={isConfirming ? 'destructive' : 'outline'}
                            className="h-7 text-xs px-2"
                            disabled={isClosing}
                            onClick={() => handleCloseTrade(trade.id)}
                            onBlur={() => { if (confirmingId === trade.id) setConfirmingId(null); }}
                          >
                            {isClosing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isConfirming ? (
                              'Confirm?'
                            ) : (
                              <><X className="h-3 w-3 mr-0.5" />Close</>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {positions.length === 0 && activeTrades.length === 0 && balances.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No assets or positions found</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
