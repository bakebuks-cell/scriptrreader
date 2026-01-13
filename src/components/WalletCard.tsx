import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useWalletBalance, useOpenPositions } from '@/hooks/useBinanceWallet';

export default function WalletCard() {
  const { balances, totalUSDT, isLoading, isRefreshing, refresh, hasKeys } = useWalletBalance();
  const { positions } = useOpenPositions();

  if (!hasKeys) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Binance Wallet
          </CardTitle>
          <CardDescription>Connect your Binance API keys to view your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No API keys configured</p>
            <p className="text-sm">Add your Binance API keys to see your balance</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Binance Wallet
            </CardTitle>
            <CardDescription>Your connected wallet balance</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
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
            <div className="space-y-2">
              <p className="text-sm font-medium">Assets</p>
              {balances.map((balance) => (
                <div 
                  key={balance.asset} 
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold">{balance.asset.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{balance.asset}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{parseFloat(balance.free).toFixed(4)}</p>
                    {parseFloat(balance.locked) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Locked: {parseFloat(balance.locked).toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Open Positions */}
            {positions.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium">Open Positions</p>
                {positions.map((position, idx) => {
                  const pnl = parseFloat(position.unrealizedProfit);
                  const isProfit = pnl >= 0;
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{position.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {position.leverage}x • Entry: ${parseFloat(position.entryPrice).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {isProfit ? (
                            <TrendingUp className="h-4 w-4 text-buy" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-sell" />
                          )}
                          <span className={isProfit ? 'text-buy' : 'text-sell'}>
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

            {positions.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No open positions</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
