import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BinanceBalance {
  asset: string
  free: string
  locked: string
}

interface BinancePosition {
  symbol: string
  positionAmt: string
  entryPrice: string
  unrealizedProfit: string
  leverage: string
  marginType: string
}

interface TradeParams {
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT'
  quantity: string
  price?: string
  stopLoss?: string
  takeProfit?: string
}

// Create Binance signature for authenticated requests
function createSignature(queryString: string, apiSecret: string): string {
  const hmac = createHmac('sha256', apiSecret)
  hmac.update(queryString)
  return hmac.digest('hex')
}

// Make authenticated Binance API request
async function binanceRequest(
  endpoint: string,
  apiKey: string,
  apiSecret: string,
  method: string = 'GET',
  params: Record<string, string> = {},
  isFutures: boolean = false
): Promise<any> {
  const baseUrl = isFutures 
    ? 'https://fapi.binance.com' 
    : 'https://api.binance.com'
  
  const timestamp = Date.now().toString()
  const allParams = { ...params, timestamp }
  const queryString = new URLSearchParams(allParams).toString()
  const signature = createSignature(queryString, apiSecret)
  const signedQuery = `${queryString}&signature=${signature}`
  
  const url = `${baseUrl}${endpoint}?${signedQuery}`
  
  const response = await fetch(url, {
    method,
    headers: {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.msg || `Binance API error: ${response.status}`)
  }
  
  return response.json()
}

// Get user's API keys from database
async function getUserApiKeys(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('exchange_keys')
    .select('api_key_encrypted, api_secret_encrypted')
    .eq('user_id', userId)
    .eq('exchange', 'binance')
    .eq('is_active', true)
    .maybeSingle()
  
  if (error) throw new Error(`Failed to fetch API keys: ${error.message}`)
  if (!data) throw new Error('No Binance API keys configured')
  
  return {
    apiKey: data.api_key_encrypted,
    apiSecret: data.api_secret_encrypted,
  }
}

// Get spot wallet balance
async function getSpotBalance(apiKey: string, apiSecret: string): Promise<BinanceBalance[]> {
  const data = await binanceRequest('/api/v3/account', apiKey, apiSecret)
  
  // Filter out zero balances
  return data.balances.filter(
    (b: BinanceBalance) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
  )
}

// Get futures positions
async function getFuturesPositions(apiKey: string, apiSecret: string): Promise<BinancePosition[]> {
  try {
    const data = await binanceRequest('/fapi/v2/positionRisk', apiKey, apiSecret, 'GET', {}, true)
    
    // Filter out positions with no amount
    return data.filter((p: BinancePosition) => parseFloat(p.positionAmt) !== 0)
  } catch (err) {
    // Futures might not be enabled for this user
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log('Futures not available:', errorMessage);
    return [];
  }
}

// Get futures account balance
async function getFuturesBalance(apiKey: string, apiSecret: string): Promise<BinanceBalance[]> {
  try {
    const data = await binanceRequest('/fapi/v2/balance', apiKey, apiSecret, 'GET', {}, true)
    
    return data
      .filter((b: any) => parseFloat(b.balance) > 0)
      .map((b: any) => ({
        asset: b.asset,
        free: b.availableBalance,
        locked: (parseFloat(b.balance) - parseFloat(b.availableBalance)).toString(),
      }))
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log('Futures balance not available:', errorMessage);
    return [];
  }
}

// Place a market order
async function placeOrder(
  apiKey: string, 
  apiSecret: string, 
  params: TradeParams,
  isFutures: boolean = false
): Promise<any> {
  const endpoint = isFutures ? '/fapi/v1/order' : '/api/v3/order'
  
  const orderParams: Record<string, string> = {
    symbol: params.symbol,
    side: params.side,
    type: params.type,
    quantity: params.quantity,
  }
  
  if (params.type === 'LIMIT' && params.price) {
    orderParams.price = params.price
    orderParams.timeInForce = 'GTC'
  }
  
  const result = await binanceRequest(endpoint, apiKey, apiSecret, 'POST', orderParams, isFutures)
  
  // If SL/TP provided, place those orders too
  if (params.stopLoss) {
    try {
      await binanceRequest(endpoint, apiKey, apiSecret, 'POST', {
        symbol: params.symbol,
        side: params.side === 'BUY' ? 'SELL' : 'BUY',
        type: 'STOP_MARKET',
        stopPrice: params.stopLoss,
        closePosition: 'true',
      }, isFutures)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.log('Stop loss order failed:', errorMessage);
    }
  }
  
  if (params.takeProfit) {
    try {
      await binanceRequest(endpoint, apiKey, apiSecret, 'POST', {
        symbol: params.symbol,
        side: params.side === 'BUY' ? 'SELL' : 'BUY',
        type: 'TAKE_PROFIT_MARKET',
        stopPrice: params.takeProfit,
        closePosition: 'true',
      }, isFutures)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      console.log('Take profit order failed:', errorMessage);
    }
  }
  
  return result
}

// Public endpoints that don't require authentication
async function getPublicTicker(symbols: string[]): Promise<any[]> {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
        );
        if (!response.ok) {
          console.log(`Ticker not found for ${symbol}`);
          return null;
        }
        return response.json();
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err);
        return null;
      }
    })
  );
  return results.filter(Boolean);
}

// Fetch klines/candlestick data
async function getKlines(symbol: string, interval: string, limit: number = 300): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch klines for ${symbol}`);
    }
    return response.json();
  } catch (err) {
    console.error(`Error fetching klines:`, err);
    throw err;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'balance'
    
    // PUBLIC ENDPOINTS (no auth required)
    if (action === 'ticker') {
      const symbolsParam = url.searchParams.get('symbols') || 'BTCUSDT'
      const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase())
      
      const tickers = await getPublicTicker(symbols)
      
      return new Response(
        JSON.stringify({ tickers }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'klines') {
      const symbolParam = url.searchParams.get('symbol') || 'BTCUSDT'
      const intervalParam = url.searchParams.get('interval') || '1h'
      const limitParam = parseInt(url.searchParams.get('limit') || '300', 10)
      
      const klines = await getKlines(symbolParam.toUpperCase(), intervalParam, limitParam)
      
      return new Response(
        JSON.stringify({ klines }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // AUTHENTICATED ENDPOINTS
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify and get user from JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's API keys
    const { apiKey, apiSecret } = await getUserApiKeys(supabase, user.id)

    let result: any

    switch (action) {
      case 'balance': {
        const spotBalances = await getSpotBalance(apiKey, apiSecret)
        const futuresBalances = await getFuturesBalance(apiKey, apiSecret)
        
        result = {
          spot: spotBalances,
          futures: futuresBalances,
        }
        break
      }
      
      case 'positions': {
        const positions = await getFuturesPositions(apiKey, apiSecret)
        result = { positions }
        break
      }
      
      case 'trade': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Trade requires POST method' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        const body = await req.json()
        const { symbol, side, type = 'MARKET', quantity, price, stopLoss, takeProfit, isFutures = false } = body
        
        if (!symbol || !side || !quantity) {
          return new Response(
            JSON.stringify({ error: 'Missing required trade parameters: symbol, side, quantity' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Check user's coins before trading
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins')
          .eq('user_id', user.id)
          .single()
        
        if (!profile || profile.coins <= 0) {
          return new Response(
            JSON.stringify({ error: 'Insufficient coins. No trades remaining.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Lock a coin
        await supabase
          .from('profiles')
          .update({ coins: profile.coins - 1 })
          .eq('user_id', user.id)
        
        try {
          result = await placeOrder(apiKey, apiSecret, {
            symbol,
            side,
            type,
            quantity,
            price,
            stopLoss,
            takeProfit,
          }, isFutures)
          
          // Record the trade
          await supabase.from('trades').insert({
            user_id: user.id,
            symbol,
            signal_type: side,
            status: 'OPEN',
            entry_price: parseFloat(result.fills?.[0]?.price || result.price || 0),
            stop_loss: stopLoss ? parseFloat(stopLoss) : null,
            take_profit: takeProfit ? parseFloat(takeProfit) : null,
            timeframe: '1h', // Default, can be passed in
            coin_locked: true,
            coin_consumed: true,
            opened_at: new Date().toISOString(),
          })
          
        } catch (tradeError) {
          // Refund the coin on failure
          await supabase
            .from('profiles')
            .update({ coins: profile.coins })
            .eq('user_id', user.id)
          
          throw tradeError
        }
        
        break
      }
      
      case 'test': {
        // Test API connection
        try {
          await binanceRequest('/api/v3/account', apiKey, apiSecret)
          result = { success: true, message: 'API connection successful' }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          result = { success: false, message: errorMessage }
        }
        break
      }
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Binance API error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
