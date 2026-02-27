import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
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

type Exchange = 'binance' | 'binance_us'

function normalizeExchange(value: string | null): Exchange {
  if (value === 'binance_us') return 'binance_us'
  return 'binance'
}

// Create Binance signature using Web Crypto API (native Deno support)
async function createSignature(queryString: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(queryString))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Make authenticated Binance API request
async function binanceRequest(
  endpoint: string,
  apiKey: string,
  apiSecret: string,
  exchange: Exchange,
  method: string = 'GET',
  params: Record<string, string> = {},
  isFutures: boolean = false
): Promise<any> {
  if (isFutures && exchange === 'binance_us') {
    throw new Error('Futures are not available on Binance US')
  }

  const baseUrl = isFutures
    ? 'https://fapi.binance.com'
    : exchange === 'binance_us'
      ? 'https://api.binance.us'
      : 'https://api.binance.com'
  
  const timestamp = Date.now().toString()
  const allParams = { ...params, timestamp, recvWindow: '10000' }
  const queryString = new URLSearchParams(allParams).toString()
  const signature = await createSignature(queryString, apiSecret)
  const signedQuery = `${queryString}&signature=${signature}`
  
  console.log(`[BINANCE] Request: ${endpoint} | keyPrefix=${apiKey.substring(0, 8)}... | secretLen=${apiSecret.length} | secretPrefix=${apiSecret.substring(0, 4)}... | exchange=${exchange}`)
  
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
    const errorCode = error.code
    const errorMsg = error.msg || `Binance API error: ${response.status}`
    
    console.error(`[BINANCE] Error ${errorCode}: ${errorMsg} | endpoint=${endpoint} | keyPrefix=${apiKey.substring(0, 8)}... | exchange=${exchange}`)
    
    // Provide user-friendly messages for common errors - use HttpError with 400 for client issues
    if (errorCode === -2015 || errorMsg.includes('Invalid API-key')) {
      throw new HttpError(400, `Binance rejected the request (code ${errorCode}): ${errorMsg}. Key prefix: ${apiKey.substring(0, 8)}... Please set IP Access to "Unrestricted (Less Secure)" in your Binance API settings, and ensure Reading, Futures, and Spot & Margin Trading are enabled.`)
    }
    if (errorMsg.includes('restricted location')) {
      throw new HttpError(400, 'Binance is unavailable in your region. If you are in the US, please use Binance US instead.')
    }
    
    throw new HttpError(400, errorMsg)
  }
  
  return response.json()
}

// Get user's API keys from database
async function getUserApiKeys(supabase: any, userId: string, exchange: Exchange) {
  // Prefer the newer `wallets` table (used by the current UI)
  const { data: walletData, error: walletError } = await supabase
    .from('wallets')
    .select('api_key_encrypted, api_secret_encrypted')
    .eq('user_id', userId)
    .eq('exchange', exchange)
    .eq('is_active', true)
    .not('api_key_encrypted', 'is', null)
    .not('api_secret_encrypted', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (walletError) {
    throw new HttpError(500, `Failed to fetch API keys: ${walletError.message}`)
  }

  if (walletData) {
    return {
      apiKey: walletData.api_key_encrypted.trim(),
      apiSecret: walletData.api_secret_encrypted.trim(),
    }
  }

  // Backward compatibility: older projects stored keys in `exchange_keys`
  const { data: legacyData, error: legacyError } = await supabase
    .from('exchange_keys')
    .select('api_key_encrypted, api_secret_encrypted')
    .eq('user_id', userId)
    .eq('exchange', exchange)
    .eq('is_active', true)
    .maybeSingle()

  if (legacyError) throw new HttpError(500, `Failed to fetch API keys: ${legacyError.message}`)

  if (!legacyData) {
    const msg = exchange === 'binance_us' ? 'No Binance US API keys configured' : 'No Binance API keys configured'
    throw new HttpError(400, msg)
  }

  return {
    apiKey: legacyData.api_key_encrypted.trim(),
    apiSecret: legacyData.api_secret_encrypted.trim(),
  }
}

// Get spot wallet balance
async function getSpotBalance(apiKey: string, apiSecret: string, exchange: Exchange): Promise<BinanceBalance[]> {
  const data = await binanceRequest('/api/v3/account', apiKey, apiSecret, exchange)
  
  // Filter out zero balances
  return data.balances.filter(
    (b: BinanceBalance) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
  )
}

// Get futures positions
async function getFuturesPositions(apiKey: string, apiSecret: string, exchange: Exchange): Promise<BinancePosition[]> {
  try {
    const data = await binanceRequest('/fapi/v2/positionRisk', apiKey, apiSecret, exchange, 'GET', {}, true)
    
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
async function getFuturesBalance(apiKey: string, apiSecret: string, exchange: Exchange): Promise<BinanceBalance[]> {
  try {
    const data = await binanceRequest('/fapi/v2/balance', apiKey, apiSecret, exchange, 'GET', {}, true)
    
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
  exchange: Exchange,
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
  
  const result = await binanceRequest(endpoint, apiKey, apiSecret, exchange, 'POST', orderParams, isFutures)
  
  // If SL/TP provided, place those orders too
  if (params.stopLoss) {
    try {
      await binanceRequest(endpoint, apiKey, apiSecret, exchange, 'POST', {
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
      await binanceRequest(endpoint, apiKey, apiSecret, exchange, 'POST', {
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

// Futures-only symbols that don't exist on spot market
const FUTURES_ONLY_SYMBOLS = ['XAUUSDT', 'XAGUSDT']

function isFuturesOnlySymbol(symbol: string): boolean {
  return FUTURES_ONLY_SYMBOLS.includes(symbol.toUpperCase())
}

// Public endpoints that don't require authentication
async function getPublicTicker(symbols: string[]): Promise<any[]> {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const isFutures = isFuturesOnlySymbol(symbol)
        const baseUrls = isFutures 
          ? ['https://fapi.binance.com/fapi/v1', 'https://fapi1.binance.com/fapi/v1', 'https://fapi2.binance.com/fapi/v1']
          : ['https://api.binance.com/api/v3', 'https://api1.binance.com/api/v3', 'https://data-api.binance.vision/api/v3']
        
        for (const baseUrl of baseUrls) {
          const response = await fetch(`${baseUrl}/ticker/24hr?symbol=${symbol}`);
          if (response.status === 451) {
            console.log(`Ticker geo-blocked on ${baseUrl}, trying next...`)
            continue
          }
          if (!response.ok) {
            console.log(`Ticker not found for ${symbol} (${isFutures ? 'futures' : 'spot'})`);
            return null;
          }
          return response.json();
        }
        return null;
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
  const isFutures = isFuturesOnlySymbol(symbol)
  
  // Try multiple endpoints for geo-blocked regions
  const spotUrls = [
    'https://api.binance.com/api/v3',
    'https://api1.binance.com/api/v3',
    'https://api2.binance.com/api/v3',
    'https://api3.binance.com/api/v3',
  ]
  const futuresUrls = [
    'https://fapi.binance.com/fapi/v1',
    'https://fapi1.binance.com/fapi/v1',
    'https://fapi2.binance.com/fapi/v1',
    'https://fapi3.binance.com/fapi/v1',
    'https://fapi4.binance.com/fapi/v1',
  ]
  
  const baseUrls = isFutures ? futuresUrls : spotUrls
  
  let lastError: Error | null = null
  for (const baseUrl of baseUrls) {
    try {
      const url = `${baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      console.log(`Fetching klines from: ${url}`);
      
      const response = await fetch(url);
      
      if (response.status === 451) {
        console.log(`Geo-blocked on ${baseUrl}, trying next...`)
        lastError = new Error(`Geo-blocked: ${response.status}`)
        continue
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Binance klines error (${response.status}): ${errorText}`);
        throw new Error(`Failed to fetch klines for ${symbol}: ${response.status} ${errorText}`);
      }
      return response.json();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (!lastError.message.includes('Geo-blocked')) {
        throw err
      }
    }
  }
  
  // If all endpoints geo-blocked, try data.binance.com as last resort
  try {
    const fallbackBase = isFutures ? 'https://fapi4.binance.com/fapi/v1' : 'https://data-api.binance.vision/api/v3'
    const url = `${fallbackBase}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    console.log(`Trying fallback: ${url}`);
    const response = await fetch(url);
    if (response.ok) return response.json();
  } catch (_) {}
  
  throw lastError || new Error(`Failed to fetch klines for ${symbol}`)
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
    const exchange = normalizeExchange(url.searchParams.get('exchange'))
    
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Use service role client for DB queries
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Validate JWT locally via getClaims (no network round-trip)
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('[BINANCE-API] Auth failed:', claimsError?.message || 'No claims')
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = { id: claimsData.claims.sub as string }

    // Get user's API keys
    const { apiKey, apiSecret } = await getUserApiKeys(supabase, user.id, exchange)

    let result: any

    switch (action) {
      case 'balance': {
        const spotBalances = await getSpotBalance(apiKey, apiSecret, exchange)
        const futuresBalances = await getFuturesBalance(apiKey, apiSecret, exchange)
        
        result = {
          spot: spotBalances,
          futures: futuresBalances,
        }
        break
      }
      
      case 'positions': {
        const positions = await getFuturesPositions(apiKey, apiSecret, exchange)
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
        const { symbol, side, type = 'MARKET', quantity, price, stopLoss, takeProfit, isFutures: isFuturesParam = false } = body
        // Force futures for futures-only symbols (XAU, XAG)
        const isFuturesEffective = isFuturesParam || isFuturesOnlySymbol(symbol)
        
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
          result = await placeOrder(apiKey, apiSecret, exchange, {
            symbol,
            side,
            type,
            quantity,
            price,
            stopLoss,
            takeProfit,
          }, isFuturesEffective)
          
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
          await binanceRequest('/api/v3/account', apiKey, apiSecret, exchange)
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
    const status = err instanceof HttpError ? err.status : 500;
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
