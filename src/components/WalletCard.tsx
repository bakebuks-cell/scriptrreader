import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, RefreshCw, TrendingUp, TrendingDown, Link2Off, ShieldCheck, User, AlertTriangle } from 'lucide-react';
import { useWalletBalance, useOpenPositions, Wallet as WalletType } from '@/hooks/useWallets';
import { useTrades } from '@/hooks/useTrades';

interface WalletCardProps {
  compact?: boolean;
  wallet?: WalletType;
  showRoleBadge?: boolean;
}

export default function WalletCard({ compact = false, wallet, showRoleBadge = false }: WalletCardProps) {
  const { balances, totalUSDT, isLoading, isRefreshing, refresh, hasWallets, wallet: activeWallet, error } = useWalletBalance(wallet?.id);
  const { positions: rawPositions } = useOpenPositions();
  // Filter out dust/residual positions (amount too small to be meaningful)
  const positions = rawPositions.filter(p => Math.abs(parseFloat(p.positionAmt)) > 0.1);
  // Use DB active trades count to stay in sync with the Open Trades dashboard card
  const { activeTrades } = useTrades();
  const openTradesCount = activeTrades.length;

  const displayWallet = wallet || activeWallet;

  // Show error state with actionable message
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
              <div className="text-sm">
                <span className="text-muted-foreground">{openTradesCount} open position{openTradesCount !== 1 ? 's' : ''}</span>
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

            {/* Open Positions */}
            {positions.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="text-sm font-medium">Open Positions</p>
                {positions.map((position, idx) => {
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
                })}
              </div>
            )}

            {positions.length === 0 && balances.length === 0 && (
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
