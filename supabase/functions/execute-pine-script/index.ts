import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedStrategy {
  entryType: 'MA_CROSSOVER' | 'MA_CROSSUNDER' | 'PRICE_ABOVE' | 'PRICE_BELOW' | 'RSI' | 'CUSTOM'
  fastMAPeriod: number
  slowMAPeriod: number
  maType: 'EMA' | 'SMA'
  stopLossPercent: number
  takeProfitPercent: number
  rsiPeriod?: number
  rsiOverbought?: number
  rsiOversold?: number
}

interface Candle {
  openTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface TradeSignal {
  type: 'BUY' | 'SELL' | 'NONE'
  price: number
  stopLoss: number
  takeProfit: number
  reason: string
}

// Parse Pine Script to extract strategy parameters
function parsePineScript(scriptContent: string): ParsedStrategy {
  const strategy: ParsedStrategy = {
    entryType: 'MA_CROSSOVER',
    fastMAPeriod: 12,
    slowMAPeriod: 26,
    maType: 'EMA',
    stopLossPercent: 2.0,
    takeProfitPercent: 4.0,
  }

  // Extract fast MA length
  const fastMatch = scriptContent.match(/fast(?:Length|MA|Period)\s*=\s*input\.int\((\d+)/i)
    || scriptContent.match(/fast(?:Length|MA|Period)\s*=\s*(\d+)/i)
  if (fastMatch) strategy.fastMAPeriod = parseInt(fastMatch[1])

  // Extract slow MA length
  const slowMatch = scriptContent.match(/slow(?:Length|MA|Period)\s*=\s*input\.int\((\d+)/i)
    || scriptContent.match(/slow(?:Length|MA|Period)\s*=\s*(\d+)/i)
  if (slowMatch) strategy.slowMAPeriod = parseInt(slowMatch[1])

  // Extract stop loss
  const slMatch = scriptContent.match(/stop(?:Loss|_loss)(?:Percent|Pct|_pct)?\s*=\s*input\.float\(([\d.]+)/i)
    || scriptContent.match(/stop(?:Loss|_loss)(?:Percent|Pct|_pct)?\s*=\s*([\d.]+)/i)
  if (slMatch) strategy.stopLossPercent = parseFloat(slMatch[1])

  // Extract take profit
  const tpMatch = scriptContent.match(/take(?:Profit|_profit)(?:Percent|Pct|_pct)?\s*=\s*input\.float\(([\d.]+)/i)
    || scriptContent.match(/take(?:Profit|_profit)(?:Percent|Pct|_pct)?\s*=\s*([\d.]+)/i)
  if (tpMatch) strategy.takeProfitPercent = parseFloat(tpMatch[1])

  // Detect MA type
  if (scriptContent.includes('ta.sma') || scriptContent.includes('sma(')) {
    strategy.maType = 'SMA'
  }

  // Detect entry type
  if (scriptContent.includes('crossunder')) {
    strategy.entryType = 'MA_CROSSUNDER'
  } else if (scriptContent.includes('crossover')) {
    strategy.entryType = 'MA_CROSSOVER'
  }

  // Extract RSI parameters if present
  const rsiPeriodMatch = scriptContent.match(/rsi(?:Length|Period)\s*=\s*(?:input\.int\()?(\d+)/i)
  if (rsiPeriodMatch) {
    strategy.rsiPeriod = parseInt(rsiPeriodMatch[1])
    strategy.entryType = 'RSI'
    
    const obMatch = scriptContent.match(/overbought\s*=\s*(?:input\.int\()?(\d+)/i)
    const osMatch = scriptContent.match(/oversold\s*=\s*(?:input\.int\()?(\d+)/i)
    strategy.rsiOverbought = obMatch ? parseInt(obMatch[1]) : 70
    strategy.rsiOversold = osMatch ? parseInt(osMatch[1]) : 30
  }

  return strategy
}

// Calculate Simple Moving Average
function calculateSMA(closes: number[], period: number): number[] {
  const sma: number[] = []
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      sma.push(0)
    } else {
      const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      sma.push(sum / period)
    }
  }
  return sma
}

// Calculate Exponential Moving Average
function calculateEMA(closes: number[], period: number): number[] {
  const ema: number[] = []
  const multiplier = 2 / (period + 1)
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      ema.push(closes[i])
    } else if (i < period - 1) {
      // Use SMA for initial values
      const sum = closes.slice(0, i + 1).reduce((a, b) => a + b, 0)
      ema.push(sum / (i + 1))
    } else if (i === period - 1) {
      // First EMA is SMA
      const sum = closes.slice(0, period).reduce((a, b) => a + b, 0)
      ema.push(sum / period)
    } else {
      ema.push((closes[i] - ema[i - 1]) * multiplier + ema[i - 1])
    }
  }
  return ema
}

// Calculate RSI
function calculateRSI(closes: number[], period: number): number[] {
  const rsi: number[] = []
  const gains: number[] = []
  const losses: number[] = []
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      rsi.push(50)
      continue
    }
    
    const change = closes[i] - closes[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? -change : 0)
    
    if (i < period) {
      rsi.push(50)
    } else {
      const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period
      const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period
      
      if (avgLoss === 0) {
        rsi.push(100)
      } else {
        const rs = avgGain / avgLoss
        rsi.push(100 - (100 / (1 + rs)))
      }
    }
  }
  return rsi
}

// Evaluate strategy and generate signal
function evaluateStrategy(
  strategy: ParsedStrategy, 
  candles: Candle[], 
  currentPrice: number
): TradeSignal {
  const closes = candles.map(c => c.close)
  
  if (closes.length < Math.max(strategy.fastMAPeriod, strategy.slowMAPeriod) + 2) {
    return { type: 'NONE', price: currentPrice, stopLoss: 0, takeProfit: 0, reason: 'Insufficient data' }
  }
  
  const calculateMA = strategy.maType === 'EMA' ? calculateEMA : calculateSMA
  const fastMA = calculateMA(closes, strategy.fastMAPeriod)
  const slowMA = calculateMA(closes, strategy.slowMAPeriod)
  
  const lastIdx = closes.length - 1
  const prevIdx = closes.length - 2
  
  let signal: TradeSignal = { 
    type: 'NONE', 
    price: currentPrice, 
    stopLoss: 0, 
    takeProfit: 0, 
    reason: 'No signal' 
  }
  
  switch (strategy.entryType) {
    case 'MA_CROSSOVER': {
      // Fast MA crosses above Slow MA = BUY
      const crossedOver = fastMA[prevIdx] <= slowMA[prevIdx] && fastMA[lastIdx] > slowMA[lastIdx]
      // Fast MA crosses below Slow MA = SELL
      const crossedUnder = fastMA[prevIdx] >= slowMA[prevIdx] && fastMA[lastIdx] < slowMA[lastIdx]
      
      if (crossedOver) {
        signal = {
          type: 'BUY',
          price: currentPrice,
          stopLoss: currentPrice * (1 - strategy.stopLossPercent / 100),
          takeProfit: currentPrice * (1 + strategy.takeProfitPercent / 100),
          reason: `MA Crossover: Fast(${strategy.fastMAPeriod}) crossed above Slow(${strategy.slowMAPeriod})`
        }
      } else if (crossedUnder) {
        signal = {
          type: 'SELL',
          price: currentPrice,
          stopLoss: currentPrice * (1 + strategy.stopLossPercent / 100),
          takeProfit: currentPrice * (1 - strategy.takeProfitPercent / 100),
          reason: `MA Crossunder: Fast(${strategy.fastMAPeriod}) crossed below Slow(${strategy.slowMAPeriod})`
        }
      }
      break
    }
    
    case 'MA_CROSSUNDER': {
      // Inverse logic - crossunder = BUY, crossover = SELL
      const crossedUnder = fastMA[prevIdx] >= slowMA[prevIdx] && fastMA[lastIdx] < slowMA[lastIdx]
      const crossedOver = fastMA[prevIdx] <= slowMA[prevIdx] && fastMA[lastIdx] > slowMA[lastIdx]
      
      if (crossedUnder) {
        signal = {
          type: 'BUY',
          price: currentPrice,
          stopLoss: currentPrice * (1 - strategy.stopLossPercent / 100),
          takeProfit: currentPrice * (1 + strategy.takeProfitPercent / 100),
          reason: `MA Crossunder: Fast(${strategy.fastMAPeriod}) crossed below Slow(${strategy.slowMAPeriod})`
        }
      } else if (crossedOver) {
        signal = {
          type: 'SELL',
          price: currentPrice,
          stopLoss: currentPrice * (1 + strategy.stopLossPercent / 100),
          takeProfit: currentPrice * (1 - strategy.takeProfitPercent / 100),
          reason: `MA Crossover: Fast(${strategy.fastMAPeriod}) crossed above Slow(${strategy.slowMAPeriod})`
        }
      }
      break
    }
    
    case 'RSI': {
      if (!strategy.rsiPeriod) break
      
      const rsi = calculateRSI(closes, strategy.rsiPeriod)
      const currentRSI = rsi[lastIdx]
      const prevRSI = rsi[prevIdx]
      
      // RSI crosses above oversold = BUY
      if (prevRSI <= (strategy.rsiOversold || 30) && currentRSI > (strategy.rsiOversold || 30)) {
        signal = {
          type: 'BUY',
          price: currentPrice,
          stopLoss: currentPrice * (1 - strategy.stopLossPercent / 100),
          takeProfit: currentPrice * (1 + strategy.takeProfitPercent / 100),
          reason: `RSI crossed above ${strategy.rsiOversold} (oversold)`
        }
      }
      // RSI crosses below overbought = SELL
      else if (prevRSI >= (strategy.rsiOverbought || 70) && currentRSI < (strategy.rsiOverbought || 70)) {
        signal = {
          type: 'SELL',
          price: currentPrice,
          stopLoss: currentPrice * (1 + strategy.stopLossPercent / 100),
          takeProfit: currentPrice * (1 - strategy.takeProfitPercent / 100),
          reason: `RSI crossed below ${strategy.rsiOverbought} (overbought)`
        }
      }
      break
    }
  }
  
  return signal
}

// Fetch candles from Binance
async function fetchCandles(symbol: string, interval: string, limit: number = 100): Promise<Candle[]> {
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch candles: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.map((k: any[]) => ({
    openTime: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }))
}

// Get current price
async function getCurrentPrice(symbol: string): Promise<number> {
  const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
  if (!response.ok) throw new Error('Failed to fetch price')
  const data = await response.json()
  return parseFloat(data.price)
}

// Map timeframe to Binance interval
function timeframeToBinanceInterval(timeframe: string): string {
  const map: Record<string, string> = {
    '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
    '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w'
  }
  return map[timeframe] || '1h'
}

// Create Binance signature
function createSignature(queryString: string, apiSecret: string): string {
  const hmac = createHmac('sha256', apiSecret)
  hmac.update(queryString)
  return hmac.digest('hex')
}

// Execute trade on Binance
async function executeTrade(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: string
): Promise<any> {
  const timestamp = Date.now().toString()
  const params = { symbol, side, type: 'MARKET', quantity, timestamp }
  const queryString = new URLSearchParams(params).toString()
  const signature = createSignature(queryString, apiSecret)
  
  const response = await fetch(
    `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`,
    {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': apiKey },
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.msg || 'Trade execution failed')
  }
  
  return response.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'evaluate'
    
    // For manual trigger, require auth
    let userId: string | null = null
    const authHeader = req.headers.get('Authorization')
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id || null
    }

    if (action === 'evaluate-all') {
      // Scheduled execution - evaluate all active scripts for all users with bots enabled
      const results: any[] = []
      
      // Get all users with bot enabled and coins > 0
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, coins, selected_timeframes')
        .eq('bot_enabled', true)
        .gt('coins', 0)
      
      if (!profiles || profiles.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No active bots found', results: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      for (const profile of profiles) {
        // Get user's active scripts
        const { data: scripts } = await supabase
          .from('pine_scripts')
          .select('*')
          .eq('created_by', profile.user_id)
          .eq('is_active', true)
        
        if (!scripts || scripts.length === 0) continue
        
        // Get user's API keys
        const { data: keys } = await supabase
          .from('exchange_keys')
          .select('api_key_encrypted, api_secret_encrypted')
          .eq('user_id', profile.user_id)
          .eq('exchange', 'binance')
          .eq('is_active', true)
          .maybeSingle()
        
        if (!keys) continue
        
        for (const script of scripts) {
          try {
            // Parse the script
            const strategy = parsePineScript(script.script_content)
            
            // Check each allowed timeframe
            for (const timeframe of script.allowed_timeframes) {
              // Skip if user hasn't selected this timeframe
              if (!profile.selected_timeframes?.includes(timeframe)) continue
              
              const interval = timeframeToBinanceInterval(timeframe)
              const candles = await fetchCandles(script.symbol, interval)
              const currentPrice = await getCurrentPrice(script.symbol)
              
              const signal = evaluateStrategy(strategy, candles, currentPrice)
              
              if (signal.type !== 'NONE') {
                // Check for duplicate trade on same candle
                const lastCandleTime = new Date(candles[candles.length - 1].openTime).toISOString()
                
                const { data: existingTrade } = await supabase
                  .from('trades')
                  .select('id')
                  .eq('user_id', profile.user_id)
                  .eq('symbol', script.symbol)
                  .eq('timeframe', timeframe)
                  .gte('created_at', lastCandleTime)
                  .maybeSingle()
                
                if (existingTrade) {
                  results.push({
                    userId: profile.user_id,
                    script: script.name,
                    timeframe,
                    signal: signal.type,
                    status: 'SKIPPED',
                    reason: 'Duplicate signal on same candle'
                  })
                  continue
                }
                
                // Calculate quantity (simplified - 10 USDT worth)
                const quantity = (10 / currentPrice).toFixed(6)
                
                // Lock coin
                const newCoins = profile.coins - 1
                await supabase
                  .from('profiles')
                  .update({ coins: newCoins })
                  .eq('user_id', profile.user_id)
                
                try {
                  // Execute trade
                  const tradeResult = await executeTrade(
                    keys.api_key_encrypted,
                    keys.api_secret_encrypted,
                    script.symbol,
                    signal.type,
                    quantity
                  )
                  
                  // Record trade
                  await supabase.from('trades').insert({
                    user_id: profile.user_id,
                    script_id: script.id,
                    symbol: script.symbol,
                    signal_type: signal.type,
                    timeframe,
                    status: 'OPEN',
                    entry_price: signal.price,
                    stop_loss: signal.stopLoss,
                    take_profit: signal.takeProfit,
                    coin_locked: true,
                    coin_consumed: true,
                    opened_at: new Date().toISOString(),
                  })
                  
                  results.push({
                    userId: profile.user_id,
                    script: script.name,
                    timeframe,
                    signal: signal.type,
                    status: 'EXECUTED',
                    price: signal.price,
                    reason: signal.reason,
                    orderId: tradeResult.orderId
                  })
                  
                } catch (tradeError) {
                  // Refund coin on failure
                  await supabase
                    .from('profiles')
                    .update({ coins: profile.coins })
                    .eq('user_id', profile.user_id)
                  
                  const errorMessage = tradeError instanceof Error ? tradeError.message : 'Unknown error'
                  
                  // Record failed trade
                  await supabase.from('trades').insert({
                    user_id: profile.user_id,
                    script_id: script.id,
                    symbol: script.symbol,
                    signal_type: signal.type,
                    timeframe,
                    status: 'FAILED',
                    error_message: errorMessage,
                    coin_locked: false,
                    coin_consumed: false,
                  })
                  
                  results.push({
                    userId: profile.user_id,
                    script: script.name,
                    timeframe,
                    signal: signal.type,
                    status: 'FAILED',
                    error: errorMessage
                  })
                }
              }
            }
          } catch (scriptError) {
            const errorMessage = scriptError instanceof Error ? scriptError.message : 'Unknown error'
            results.push({
              userId: profile.user_id,
              script: script.name,
              status: 'ERROR',
              error: errorMessage
            })
          }
        }
      }
      
      return new Response(
        JSON.stringify({ message: 'Evaluation complete', results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (action === 'evaluate-script') {
      // Evaluate a single script (for testing)
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const body = await req.json()
      const { scriptId, timeframe = '1h', dryRun = true } = body
      
      // Get the script
      const { data: script, error: scriptError } = await supabase
        .from('pine_scripts')
        .select('*')
        .eq('id', scriptId)
        .eq('created_by', userId)
        .single()
      
      if (scriptError || !script) {
        return new Response(
          JSON.stringify({ error: 'Script not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Parse and evaluate
      const strategy = parsePineScript(script.script_content)
      const interval = timeframeToBinanceInterval(timeframe)
      const candles = await fetchCandles(script.symbol, interval)
      const currentPrice = await getCurrentPrice(script.symbol)
      const signal = evaluateStrategy(strategy, candles, currentPrice)
      
      return new Response(
        JSON.stringify({
          script: script.name,
          symbol: script.symbol,
          timeframe,
          strategy,
          signal,
          dryRun,
          currentPrice,
          lastCandle: candles[candles.length - 1],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (action === 'parse') {
      // Just parse the script without evaluating
      const body = await req.json()
      const { scriptContent } = body
      
      if (!scriptContent) {
        return new Response(
          JSON.stringify({ error: 'scriptContent is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const strategy = parsePineScript(scriptContent)
      
      return new Response(
        JSON.stringify({ strategy }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Pine Script execution error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
