import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ============================================
// TYPE DEFINITIONS
// ============================================

interface OHLCV {
  openTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  closeTime: number
}

interface IndicatorValues {
  ema: Record<number, number[]>
  sma: Record<number, number[]>
  rsi: Record<number, number[]>
  macd: { macd: number[]; signal: number[]; histogram: number[] }
  bb: { upper: number[]; middle: number[]; lower: number[] }
  atr: Record<number, number[]>
  supertrend: { upper: number[]; lower: number[]; direction: number[] } | null
}

interface ParsedStrategy {
  entryConditions: EntryCondition[]
  exitConditions: ExitCondition[]
  stopLoss: StopLossConfig | null
  takeProfit: TakeProfitConfig | null
  direction: 'long' | 'short' | 'both'
  riskPercent: number
}

interface EntryCondition {
  type: 'crossover' | 'crossunder' | 'above' | 'below' | 'equals' | 'direction_change_up' | 'direction_change_down'
  indicator1: IndicatorRef
  indicator2: IndicatorRef | number
  logic: 'and' | 'or'
}

interface ExitCondition {
  type: 'crossover' | 'crossunder' | 'above' | 'below' | 'equals'
  indicator1: IndicatorRef
  indicator2: IndicatorRef | number
  logic: 'and' | 'or'
}

interface IndicatorRef {
  name: 'ema' | 'sma' | 'rsi' | 'macd' | 'macd_signal' | 'macd_histogram' | 'bb_upper' | 'bb_lower' | 'bb_middle' | 'close' | 'open' | 'high' | 'low' | 'atr' | 'supertrend_direction'
  period?: number
}

interface StopLossConfig {
  type: 'percent' | 'atr' | 'fixed'
  value: number
}

interface TakeProfitConfig {
  type: 'percent' | 'atr' | 'fixed' | 'rr'
  value: number
}

interface TradeSignal {
  action: 'BUY' | 'SELL' | 'CLOSE' | 'NONE'
  price: number
  stopLoss?: number
  takeProfit?: number
  reason: string
}

interface UserScript {
  script_id: string
  user_id: string
  script: {
    id: string
    name: string
    script_content: string
    symbol: string
    is_active: boolean
    allowed_timeframes: string[]
  }
}

// ============================================
// BINANCE API HELPERS
// ============================================

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
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
}

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
  const signature = await createSignature(queryString, apiSecret)
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

// Coin-M Futures uses dapi.binance.com
async function binanceCoinMRequest(
  endpoint: string,
  apiKey: string,
  apiSecret: string,
  method: string = 'GET',
  params: Record<string, string> = {}
): Promise<any> {
  const baseUrl = 'https://dapi.binance.com'
  const timestamp = Date.now().toString()
  const allParams = { ...params, timestamp }
  const queryString = new URLSearchParams(allParams).toString()
  const signature = await createSignature(queryString, apiSecret)
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
    throw new Error(error.msg || `Binance Coin-M API error: ${response.status}`)
  }
  
  return response.json()
}

// Futures-only symbols that don't exist on spot market
const FUTURES_ONLY_SYMBOLS = ['XAUUSDT', 'XAGUSDT']

// Cache for hedge mode detection per API key (avoid repeated calls)
const hedgeModeCache = new Map<string, boolean>()

async function isHedgeMode(apiKey: string, apiSecret: string, isCoinM: boolean = false): Promise<boolean> {
  const cacheKey = apiKey.substring(0, 8) + (isCoinM ? '_coinm' : '_usdtm')
  if (hedgeModeCache.has(cacheKey)) return hedgeModeCache.get(cacheKey)!
  
  try {
    const endpoint = isCoinM ? '/dapi/v1/positionSide/dual' : '/fapi/v1/positionSide/dual'
    const result = isCoinM
      ? await binanceCoinMRequest(endpoint, apiKey, apiSecret)
      : await binanceRequest(endpoint, apiKey, apiSecret, 'GET', {}, !isCoinM)
    const isHedge = result.dualSidePosition === true
    hedgeModeCache.set(cacheKey, isHedge)
    console.log(`[HEDGE] Account position mode: ${isHedge ? 'Hedge Mode' : 'One-Way Mode'}`)
    return isHedge
  } catch (err) {
    console.log(`[HEDGE] Could not detect position mode, assuming one-way:`, err)
    hedgeModeCache.set(cacheKey, false)
    return false
  }
}

function isFuturesOnlySymbol(symbol: string): boolean {
  return FUTURES_ONLY_SYMBOLS.includes(symbol.toUpperCase())
}

async function fetchOHLCV(symbol: string, interval: string, limit: number = 100): Promise<OHLCV[]> {
  const isFutures = isFuturesOnlySymbol(symbol)
  const baseUrl = isFutures ? 'https://fapi.binance.com/fapi/v1' : 'https://api.binance.com/api/v3'
  const url = `${baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  console.log(`[ENGINE] Fetching OHLCV: ${symbol} ${interval} limit=${limit} (${isFutures ? 'futures' : 'spot'})`)
  
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text()
    console.error(`[ENGINE] OHLCV fetch failed: ${response.status} - ${body}`)
    throw new Error(`Failed to fetch OHLCV data: ${response.status}`)
  }
  
  const data = await response.json()
  console.log(`[ENGINE] Got ${data.length} candles for ${symbol}`)
  
  return data.map((k: any[]) => ({
    openTime: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    closeTime: k[6],
  }))
}

async function getCurrentPrice(symbol: string): Promise<number> {
  const isFutures = isFuturesOnlySymbol(symbol)
  const baseUrl = isFutures ? 'https://fapi.binance.com/fapi/v1' : 'https://api.binance.com/api/v3'
  const url = `${baseUrl}/ticker/price?symbol=${symbol}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch price: ${response.status}`)
  }
  const data = await response.json()
  return parseFloat(data.price)
}

// ============================================
// TECHNICAL INDICATORS
// ============================================

function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return []
  const ema: number[] = []
  const multiplier = 2 / (period + 1)
  
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += prices[i]
  }
  ema.push(sum / period)
  
  for (let i = period; i < prices.length; i++) {
    const value = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]
    ema.push(value)
  }
  
  return ema
}

function calculateSMA(prices: number[], period: number): number[] {
  if (prices.length < period) return []
  const sma: number[] = []
  
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += prices[i - j]
    }
    sma.push(sum / period)
  }
  
  return sma
}

function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = []
  const gains: number[] = []
  const losses: number[] = []
  
  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? -diff : 0)
  }
  
  if (gains.length < period) return []
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
  
  for (let i = period; i <= gains.length; i++) {
    if (avgLoss === 0) {
      rsi.push(100)
    } else {
      const rs = avgGain / avgLoss
      rsi.push(100 - (100 / (1 + rs)))
    }
    
    if (i < gains.length) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period
    }
  }
  
  return rsi
}

function calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(prices, fastPeriod)
  const slowEMA = calculateEMA(prices, slowPeriod)
  
  if (fastEMA.length === 0 || slowEMA.length === 0) {
    return { macd: [], signal: [], histogram: [] }
  }
  
  const macdLine: number[] = []
  const offset = slowPeriod - fastPeriod
  
  for (let i = 0; i < slowEMA.length; i++) {
    if (i + offset < fastEMA.length) {
      macdLine.push(fastEMA[i + offset] - slowEMA[i])
    }
  }
  
  const signalLine = calculateEMA(macdLine, signalPeriod)
  const histogram: number[] = []
  
  const signalOffset = signalPeriod - 1
  for (let i = 0; i < signalLine.length; i++) {
    if (i + signalOffset < macdLine.length) {
      histogram.push(macdLine[i + signalOffset] - signalLine[i])
    }
  }
  
  return { macd: macdLine, signal: signalLine, histogram }
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(prices, period)
  const upper: number[] = []
  const lower: number[] = []
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1)
    const mean = middle[i - period + 1]
    if (mean === undefined) continue
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period
    const std = Math.sqrt(variance)
    
    upper.push(mean + stdDev * std)
    lower.push(mean - stdDev * std)
  }
  
  return { upper, middle, lower }
}

// RMA (Wilder's Moving Average) - matches TradingView's ta.rma()
function calculateRMA(values: number[], period: number): number[] {
  if (values.length < period) return []
  const rma: number[] = []
  
  // First value is SMA
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += values[i]
  }
  rma.push(sum / period)
  
  // Subsequent values use Wilder's smoothing: rma = (prev * (period-1) + current) / period
  for (let i = period; i < values.length; i++) {
    const value = (rma[rma.length - 1] * (period - 1) + values[i]) / period
    rma.push(value)
  }
  
  return rma
}

function calculateATR(ohlcv: OHLCV[], period: number = 14): number[] {
  const trueRanges: number[] = []
  
  for (let i = 1; i < ohlcv.length; i++) {
    const high = ohlcv[i].high
    const low = ohlcv[i].low
    const prevClose = ohlcv[i - 1].close
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    )
    trueRanges.push(tr)
  }
  
  // Use RMA (Wilder's smoothing) to match TradingView's ta.atr()
  return calculateRMA(trueRanges, period)
}

function calculateSuperTrend(ohlcv: OHLCV[], atrPeriod: number = 10, multiplier: number = 3.0): { upper: number[]; lower: number[]; direction: number[] } {
  const atrValues = calculateATR(ohlcv, atrPeriod)
  if (atrValues.length === 0) return { upper: [], lower: [], direction: [] }

  // ATR array is offset: atrValues[i] corresponds to ohlcv[i + atrPeriod]
  const atrOffset = atrPeriod

  const upper: number[] = []
  const lower: number[] = []
  const direction: number[] = []

  for (let i = 0; i < atrValues.length; i++) {
    const oi = i + atrOffset // corresponding ohlcv index
    const hl2 = (ohlcv[oi].high + ohlcv[oi].low) / 2
    const atr = atrValues[i]

    let basicUp = hl2 - multiplier * atr
    let basicDn = hl2 + multiplier * atr

    // Adjust bands based on previous values (SuperTrend band logic)
    if (i > 0) {
      const prevClose = ohlcv[oi - 1].close
      const prevUp = upper[i - 1]
      const prevDn = lower[i - 1]
      basicUp = prevClose > prevUp ? Math.max(basicUp, prevUp) : basicUp
      basicDn = prevClose < prevDn ? Math.min(basicDn, prevDn) : basicDn
    }

    upper.push(basicUp)
    lower.push(basicDn)

    // Determine trend direction: 1 = bullish, -1 = bearish
    if (i === 0) {
      direction.push(1)
    } else {
      const prevDir = direction[i - 1]
      const close = ohlcv[oi].close
      if (prevDir === -1 && close > lower[i - 1]) {
        direction.push(1) // flip to bullish
      } else if (prevDir === 1 && close < upper[i - 1]) {
        direction.push(-1) // flip to bearish
      } else {
        direction.push(prevDir)
      }
    }
  }

  return { upper, lower, direction }
}

function calculateAllIndicators(ohlcv: OHLCV[]): IndicatorValues {
  const closes = ohlcv.map(c => c.close)
  
  const result: IndicatorValues = {
    ema: {
      9: calculateEMA(closes, 9),
      12: calculateEMA(closes, 12),
      21: calculateEMA(closes, 21),
      26: calculateEMA(closes, 26),
      50: calculateEMA(closes, 50),
      100: calculateEMA(closes, 100),
      200: calculateEMA(closes, 200),
    },
    sma: {
      9: calculateSMA(closes, 9),
      20: calculateSMA(closes, 20),
      50: calculateSMA(closes, 50),
      100: calculateSMA(closes, 100),
      200: calculateSMA(closes, 200),
    },
    rsi: {
      14: calculateRSI(closes, 14),
    },
    macd: calculateMACD(closes),
    bb: calculateBollingerBands(closes),
    atr: {
      14: calculateATR(ohlcv, 14),
    },
    supertrend: calculateSuperTrend(ohlcv),
  }

  // Debug: log last few SuperTrend direction values
  if (result.supertrend && result.supertrend.direction.length > 0) {
    const dir = result.supertrend.direction
    const last5 = dir.slice(-5)
    const changes: Array<{idx: number, from: number, to: number}> = []
    for (let i = 1; i < dir.length; i++) {
      if (dir[i] !== dir[i - 1]) changes.push({ idx: i, from: dir[i - 1], to: dir[i] })
    }
    console.log(`[INDICATORS] SuperTrend: ${dir.length} values, last5=[${last5}], direction_changes=${changes.length}${changes.length > 0 ? ` last_change=idx${changes[changes.length-1].idx} (${changes[changes.length-1].from}->${changes[changes.length-1].to})` : ''}`)
  }

  return result
}

// ============================================
// PINE SCRIPT PARSER (Enhanced for BB strategy)
// ============================================

function parsePineScript(scriptContent: string): ParsedStrategy {
  const strategy: ParsedStrategy = {
    entryConditions: [],
    exitConditions: [],
    stopLoss: null,
    takeProfit: null,
    direction: 'both',
    riskPercent: 1,
  }
  
  const content = scriptContent.toLowerCase()
  
  // Parse direction
  if (content.includes('strategy.long') && !content.includes('strategy.short')) {
    strategy.direction = 'long'
  } else if (content.includes('strategy.short') && !content.includes('strategy.long')) {
    strategy.direction = 'short'
  }
  
  // ---- BOLLINGER BANDS DETECTION ----
  const hasBB = content.includes('sma(close') && (content.includes('stdev') || content.includes('bb') || content.includes('upper_band') || content.includes('lower_band'))
  
  if (hasBB) {
    console.log('[PARSER] Detected Bollinger Bands strategy')
    
    // Parse BB parameters
    let bbLength = 20
    let bbMult = 2.0
    const lengthMatch = scriptContent.match(/length\s*=\s*input\s*\(\s*(\d+)/i)
    const multMatch = scriptContent.match(/mult\s*=\s*input\s*\(\s*([\d.]+)/i)
    if (lengthMatch) bbLength = parseInt(lengthMatch[1])
    if (multMatch) bbMult = parseFloat(multMatch[1])
    console.log(`[PARSER] BB params: length=${bbLength}, mult=${bbMult}`)
    
    // Check for crossover/crossunder with lower_band/upper_band
    const hasLongEntry = content.includes('crossover(close, lower_band)') || 
                         content.includes('crossover(close,lower_band)') ||
                         content.includes('ta.crossover(close, lower_band)')
    const hasShortEntry = content.includes('crossunder(close, upper_band)') || 
                          content.includes('crossunder(close,upper_band)') ||
                          content.includes('ta.crossunder(close, upper_band)')
    
    if (hasLongEntry) {
      strategy.entryConditions.push({
        type: 'crossover',
        indicator1: { name: 'close' },
        indicator2: { name: 'bb_lower' },
        logic: 'and',
      })
      console.log('[PARSER] Added BB long entry: close crossover lower_band')
    }
    
    if (hasShortEntry) {
      // For short entries, we handle separately
      if (!hasLongEntry) {
        strategy.entryConditions.push({
          type: 'crossunder',
          indicator1: { name: 'close' },
          indicator2: { name: 'bb_upper' },
          logic: 'and',
        })
        console.log('[PARSER] Added BB short entry: close crossunder upper_band')
      }
    }
    
    // BB touch conditions (fallback)
    if (strategy.entryConditions.length === 0) {
      if (content.includes('close') && content.includes('lower_band')) {
        strategy.entryConditions.push({
          type: 'below',
          indicator1: { name: 'close' },
          indicator2: { name: 'bb_lower' },
          logic: 'and',
        })
      }
      if (content.includes('close') && content.includes('upper_band')) {
        strategy.exitConditions.push({
          type: 'above',
          indicator1: { name: 'close' },
          indicator2: { name: 'bb_upper' },
          logic: 'and',
        })
      }
    }
    
    // Exit conditions for BB
    if (content.includes('crossunder(close, basis)') || content.includes('crossunder(close,basis)')) {
      strategy.exitConditions.push({
        type: 'crossunder',
        indicator1: { name: 'close' },
        indicator2: { name: 'bb_middle' },
        logic: 'and',
      })
    }
    if (content.includes('crossover(close, basis)') || content.includes('crossover(close,basis)')) {
      strategy.exitConditions.push({
        type: 'crossover',
        indicator1: { name: 'close' },
        indicator2: { name: 'bb_middle' },
        logic: 'and',
      })
    }
  }
  
  // ---- SUPERTREND DETECTION ----
  const hasSuperTrend = content.includes('supertrend') || 
    (content.includes('atr') && content.includes('hl2') && content.includes('trend')) ||
    (content.includes('buysignal') && content.includes('sellsignal') && content.includes('trend'))
  
  if (hasSuperTrend) {
    console.log('[PARSER] Detected SuperTrend strategy')
    
    // Parse ATR period and multiplier from inputs
    let atrPeriod = 10
    let multiplier = 3.0
    const periodMatch = scriptContent.match(/(?:atr\s*period|periods)\s*.*?defval\s*=\s*(\d+)/i)
    const multMatch = scriptContent.match(/(?:atr\s*multiplier|multiplier)\s*.*?defval\s*=\s*([\d.]+)/i)
    if (periodMatch) atrPeriod = parseInt(periodMatch[1])
    if (multMatch) multiplier = parseFloat(multMatch[1])
    console.log(`[PARSER] SuperTrend params: ATR period=${atrPeriod}, multiplier=${multiplier}`)
    
    // Buy signal: trend changes from -1 to 1 (direction_change_up)
    strategy.entryConditions.push({
      type: 'direction_change_up',
      indicator1: { name: 'supertrend_direction' },
      indicator2: 1,
      logic: 'and',
    })
    console.log('[PARSER] Added SuperTrend entry: direction change up (buy)')
    
    // Sell/exit signal: trend changes from 1 to -1 (direction_change_down)
    strategy.exitConditions.push({
      type: 'direction_change_down',
      indicator1: { name: 'supertrend_direction' },
      indicator2: -1,
      logic: 'and',
    })
    console.log('[PARSER] Added SuperTrend exit: direction change down (sell)')
    
    // SuperTrend scripts typically trade both directions
    strategy.direction = 'both'
    
    // Default SL/TP for SuperTrend if not specified
    if (!strategy.stopLoss) {
      strategy.stopLoss = { type: 'atr', value: 1.5 }
    }
    if (!strategy.takeProfit) {
      strategy.takeProfit = { type: 'atr', value: 3.0 }
    }
  }
  
  // ---- EMA/SMA CROSSOVER DETECTION ----
  const emaCrossPatterns = [
    { pattern: /ta\.crossover\s*\(\s*ema\s*\(\s*close\s*,\s*(\d+)\s*\)\s*,\s*ema\s*\(\s*close\s*,\s*(\d+)\s*\)\s*\)/gi, type: 'crossover' as const },
    { pattern: /crossover\s*\(\s*ema(\d+)\s*,\s*ema(\d+)\s*\)/gi, type: 'crossover' as const },
    { pattern: /crossover\s*\(\s*ema\s*\(\s*close\s*,\s*(\d+)\s*\)\s*,\s*ema\s*\(\s*close\s*,\s*(\d+)\s*\)\s*\)/gi, type: 'crossover' as const },
  ]
  
  for (const { pattern, type } of emaCrossPatterns) {
    let match
    while ((match = pattern.exec(scriptContent)) !== null) {
      strategy.entryConditions.push({
        type,
        indicator1: { name: 'ema', period: parseInt(match[1]) },
        indicator2: { name: 'ema', period: parseInt(match[2]) },
        logic: 'and',
      })
    }
  }
  
  // ---- RSI CONDITIONS ----
  // Match patterns like: rsi < 30, rsi > 70, rsiValue > 5, rsi(close, 14) > 70
  const rsiPatterns = [
    /rsi\s*\(\s*close\s*,\s*\d+\s*\)\s*[<>]/gi,
    /rsi\w*\s*[<>]\s*\d+/gi,
    /rsi\s*[<>]\s*\d+/gi,
  ]
  
  // Check for RSI below condition
  const rsiBelowPatterns = [
    /rsi\w*\s*<\s*(\d+)/gi,
    /rsi\s*\(\s*close\s*,\s*\d+\s*\)\s*<\s*(\d+)/gi,
  ]
  for (const pat of rsiBelowPatterns) {
    let match
    while ((match = pat.exec(scriptContent)) !== null) {
      strategy.entryConditions.push({
        type: 'below',
        indicator1: { name: 'rsi', period: 14 },
        indicator2: parseInt(match[1]),
        logic: 'and',
      })
      console.log(`[PARSER] Added RSI below ${match[1]}`)
    }
  }
  
  // Check for RSI above condition
  const rsiAbovePatterns = [
    /rsi\w*\s*>\s*(\d+)/gi,
    /rsi\s*\(\s*close\s*,\s*\d+\s*\)\s*>\s*(\d+)/gi,
  ]
  for (const pat of rsiAbovePatterns) {
    let match
    while ((match = pat.exec(scriptContent)) !== null) {
      strategy.entryConditions.push({
        type: 'above',
        indicator1: { name: 'rsi', period: 14 },
        indicator2: parseInt(match[1]),
        logic: 'and',
      })
      console.log(`[PARSER] Added RSI above ${match[1]}`)
    }
  }
  
  // ---- GENERIC CLOSE COMPARISON (close > N, close < N) ----
  const closeAboveMatch = scriptContent.match(/close\s*>\s*([\d.]+)/i)
  if (closeAboveMatch && strategy.entryConditions.length === 0) {
    strategy.entryConditions.push({
      type: 'above',
      indicator1: { name: 'close' },
      indicator2: parseFloat(closeAboveMatch[1]),
      logic: 'and',
    })
    console.log(`[PARSER] Added close > ${closeAboveMatch[1]}`)
  }
  
  // ---- MACD CONDITIONS ----
  if (content.includes('crossover') && content.includes('macd') && content.includes('signal')) {
    if (content.match(/crossover\s*\(\s*macd.*signal/)) {
      strategy.entryConditions.push({
        type: 'crossover',
        indicator1: { name: 'macd' },
        indicator2: { name: 'macd_signal' },
        logic: 'and',
      })
    }
  }
  if (content.includes('crossunder') && content.includes('macd') && content.includes('signal')) {
    if (content.match(/crossunder\s*\(\s*macd.*signal/)) {
      strategy.entryConditions.push({
        type: 'crossunder',
        indicator1: { name: 'macd' },
        indicator2: { name: 'macd_signal' },
        logic: 'and',
      })
    }
  }
  
  // ---- STOP LOSS ----
  const slMatch = scriptContent.match(/stop_?loss\s*[=:]\s*([\d.]+)\s*%?/i) || 
                  scriptContent.match(/sl\s*[=:]\s*([\d.]+)\s*%?/i)
  if (slMatch) {
    const value = parseFloat(slMatch[1])
    strategy.stopLoss = {
      type: 'percent',
      value: value > 1 ? value : value * 100,
    }
  }
  
  const atrSlMatch = scriptContent.match(/stop_?loss\s*=.*atr\s*\*\s*([\d.]+)/i)
  if (atrSlMatch) {
    strategy.stopLoss = {
      type: 'atr',
      value: parseFloat(atrSlMatch[1]),
    }
  }
  
  // ---- TAKE PROFIT ----
  const tpMatch = scriptContent.match(/take_?profit\s*[=:]\s*([\d.]+)\s*%?/i) ||
                  scriptContent.match(/tp\s*[=:]\s*([\d.]+)\s*%?/i)
  if (tpMatch) {
    const value = parseFloat(tpMatch[1])
    strategy.takeProfit = {
      type: 'percent',
      value: value > 1 ? value : value * 100,
    }
  }
  
  const rrMatch = scriptContent.match(/risk_?reward\s*[=:]\s*([\d.]+)/i) ||
                  scriptContent.match(/rr\s*[=:]\s*([\d.]+)/i)
  if (rrMatch && strategy.stopLoss) {
    strategy.takeProfit = {
      type: 'rr',
      value: parseFloat(rrMatch[1]),
    }
  }
  
  // DEFAULT FALLBACK: If no conditions were parsed at all
  if (strategy.entryConditions.length === 0) {
    console.log('[PARSER] WARNING: No entry conditions parsed. Using default EMA 9/21 crossover.')
    strategy.entryConditions.push({
      type: 'crossover',
      indicator1: { name: 'ema', period: 9 },
      indicator2: { name: 'ema', period: 21 },
      logic: 'and',
    })
    
    // Add corresponding exit condition (crossunder = exit for long)
    strategy.exitConditions.push({
      type: 'crossunder',
      indicator1: { name: 'ema', period: 9 },
      indicator2: { name: 'ema', period: 21 },
      logic: 'and',
    })
    
    if (!strategy.stopLoss) {
      strategy.stopLoss = { type: 'percent', value: 2 }
    }
    if (!strategy.takeProfit) {
      strategy.takeProfit = { type: 'percent', value: 4 }
    }
  }
  
  // AUTO-GENERATE EXIT CONDITIONS if none defined — use inverse of entry conditions
  if (strategy.exitConditions.length === 0 && strategy.entryConditions.length > 0) {
    console.log('[PARSER] No exit conditions found, generating from entry conditions (inverse)')
    for (const entry of strategy.entryConditions) {
      let exitType: string | null = null
      switch (entry.type) {
        case 'crossover': exitType = 'crossunder'; break
        case 'crossunder': exitType = 'crossover'; break
        case 'above': exitType = 'below'; break
        case 'below': exitType = 'above'; break
        case 'direction_change_up': exitType = 'direction_change_down'; break
        case 'direction_change_down': exitType = 'direction_change_up'; break
      }
      if (exitType) {
        strategy.exitConditions.push({
          type: exitType as any,
          indicator1: entry.indicator1,
          indicator2: entry.indicator2,
          logic: entry.logic,
        })
      }
    }
    console.log(`[PARSER] Generated ${strategy.exitConditions.length} exit conditions`)
  }
  
  console.log(`[PARSER] Parsed strategy: ${strategy.entryConditions.length} entry conditions, ${strategy.exitConditions.length} exit conditions, direction=${strategy.direction}`)
  
  return strategy
}

// ============================================
// SIGNAL EVALUATION
// ============================================

function getIndicatorValue(
  ref: IndicatorRef | number,
  indicators: IndicatorValues,
  ohlcv: OHLCV[],
  index: number
): number | null {
  if (typeof ref === 'number') return ref
  
  const adjustedIndex = (arr: number[]) => {
    if (!arr || arr.length === 0) return -1
    // Properly map OHLCV index to indicator array index
    // Indicator arrays are shorter than OHLCV by their period offset
    const offset = ohlcv.length - arr.length
    const mapped = index - offset
    if (mapped < 0 || mapped >= arr.length) return -1
    return mapped
  }
  
  switch (ref.name) {
    case 'close':
      return ohlcv[index]?.close ?? null
    case 'open':
      return ohlcv[index]?.open ?? null
    case 'high':
      return ohlcv[index]?.high ?? null
    case 'low':
      return ohlcv[index]?.low ?? null
    case 'ema': {
      const emaPeriod = ref.period || 21
      const emaArr = indicators.ema[emaPeriod]
      if (!emaArr || emaArr.length === 0) return null
      const idx = adjustedIndex(emaArr)
      return idx >= 0 ? emaArr[idx] : null
    }
    case 'sma': {
      const smaPeriod = ref.period || 20
      const smaArr = indicators.sma[smaPeriod]
      if (!smaArr || smaArr.length === 0) return null
      const idx = adjustedIndex(smaArr)
      return idx >= 0 ? smaArr[idx] : null
    }
    case 'rsi': {
      const rsiArr = indicators.rsi[14]
      if (!rsiArr || rsiArr.length === 0) return null
      const idx = adjustedIndex(rsiArr)
      return idx >= 0 ? rsiArr[idx] : null
    }
    case 'macd':
      if (!indicators.macd.macd || indicators.macd.macd.length === 0) return null
      return indicators.macd.macd[adjustedIndex(indicators.macd.macd)]
    case 'macd_signal':
      if (!indicators.macd.signal || indicators.macd.signal.length === 0) return null
      return indicators.macd.signal[adjustedIndex(indicators.macd.signal)]
    case 'macd_histogram':
      if (!indicators.macd.histogram || indicators.macd.histogram.length === 0) return null
      return indicators.macd.histogram[adjustedIndex(indicators.macd.histogram)]
    case 'bb_upper':
      if (!indicators.bb.upper || indicators.bb.upper.length === 0) return null
      return indicators.bb.upper[adjustedIndex(indicators.bb.upper)]
    case 'bb_lower':
      if (!indicators.bb.lower || indicators.bb.lower.length === 0) return null
      return indicators.bb.lower[adjustedIndex(indicators.bb.lower)]
    case 'bb_middle':
      if (!indicators.bb.middle || indicators.bb.middle.length === 0) return null
      return indicators.bb.middle[adjustedIndex(indicators.bb.middle)]
    case 'atr': {
      const atrArr = indicators.atr[14]
      if (!atrArr || atrArr.length === 0) return null
      const idx = adjustedIndex(atrArr)
      return idx >= 0 ? atrArr[idx] : null
    }
    case 'supertrend_direction': {
      if (!indicators.supertrend || !indicators.supertrend.direction || indicators.supertrend.direction.length === 0) return null
      const idx = adjustedIndex(indicators.supertrend.direction)
      return idx >= 0 ? indicators.supertrend.direction[idx] : null
    }
    default:
      return null
  }
}

function evaluateCondition(
  condition: EntryCondition | ExitCondition,
  indicators: IndicatorValues,
  ohlcv: OHLCV[],
  currentIndex: number
): boolean {
  const val1Current = getIndicatorValue(condition.indicator1, indicators, ohlcv, currentIndex)
  const val2Current = getIndicatorValue(condition.indicator2, indicators, ohlcv, currentIndex)
  
  if (val1Current === null || val2Current === null) {
    console.log(`[EVAL] Condition skipped - null values: ${JSON.stringify(condition.indicator1)} = ${val1Current}, ${JSON.stringify(condition.indicator2)} = ${val2Current}`)
    return false
  }
  
  switch (condition.type) {
    case 'crossover': {
      const val1Prev = getIndicatorValue(condition.indicator1, indicators, ohlcv, currentIndex - 1)
      const val2Prev = getIndicatorValue(condition.indicator2, indicators, ohlcv, currentIndex - 1)
      if (val1Prev === null || val2Prev === null) return false
      const result = val1Prev <= val2Prev && val1Current > val2Current
      console.log(`[EVAL] Crossover: prev(${val1Prev.toFixed(2)} <= ${val2Prev.toFixed(2)}) && curr(${val1Current.toFixed(2)} > ${val2Current.toFixed(2)}) = ${result}`)
      return result
    }
    case 'crossunder': {
      const val1Prev = getIndicatorValue(condition.indicator1, indicators, ohlcv, currentIndex - 1)
      const val2Prev = getIndicatorValue(condition.indicator2, indicators, ohlcv, currentIndex - 1)
      if (val1Prev === null || val2Prev === null) return false
      const result = val1Prev >= val2Prev && val1Current < val2Current
      console.log(`[EVAL] Crossunder: prev(${val1Prev.toFixed(2)} >= ${val2Prev.toFixed(2)}) && curr(${val1Current.toFixed(2)} < ${val2Current.toFixed(2)}) = ${result}`)
      return result
    }
    case 'above':
      return val1Current > val2Current
    case 'below':
      return val1Current < val2Current
    case 'equals':
      return Math.abs(val1Current - val2Current) < 0.0001
    case 'direction_change_up': {
      // SuperTrend: current direction is 1 (bullish) and previous was -1 (bearish)
      const prevDir = getIndicatorValue(condition.indicator1, indicators, ohlcv, currentIndex - 1)
      if (prevDir === null) return false
      const result = val1Current === 1 && prevDir === -1
      console.log(`[EVAL] SuperTrend direction_change_up: prev=${prevDir}, curr=${val1Current} = ${result}`)
      return result
    }
    case 'direction_change_down': {
      // SuperTrend: current direction is -1 (bearish) and previous was 1 (bullish)
      const prevDir = getIndicatorValue(condition.indicator1, indicators, ohlcv, currentIndex - 1)
      if (prevDir === null) return false
      const result = val1Current === -1 && prevDir === 1
      console.log(`[EVAL] SuperTrend direction_change_down: prev=${prevDir}, curr=${val1Current} = ${result}`)
      return result
    }
    default:
      return false
  }
}

function evaluateExitConditions(
  strategy: ParsedStrategy,
  indicators: IndicatorValues,
  ohlcv: OHLCV[],
  currentPrice: number
): { shouldExit: boolean; reason: string } {
  if (!strategy.exitConditions || strategy.exitConditions.length === 0) {
    return { shouldExit: false, reason: 'No exit conditions defined' }
  }

  const lastIndex = ohlcv.length - 1
  const scanDepth = Math.min(5, lastIndex)

  for (let checkIdx = lastIndex; checkIdx > lastIndex - scanDepth; checkIdx--) {
    if (checkIdx < 1) break
    let conditionsMet = strategy.exitConditions.length > 0

    for (const condition of strategy.exitConditions) {
      const result = evaluateCondition(condition, indicators, ohlcv, checkIdx)
      if (condition.logic === 'and') {
        conditionsMet = conditionsMet && result
      } else {
        conditionsMet = conditionsMet || result
      }
    }

    if (conditionsMet) {
      console.log(`[EVAL] EXIT signal found at candle index ${checkIdx}`)
      return {
        shouldExit: true,
        reason: `Exit conditions met: ${strategy.exitConditions.map(c =>
          `${typeof c.indicator1 === 'object' ? c.indicator1.name + (c.indicator1.period ? `(${c.indicator1.period})` : '') : c.indicator1} ${c.type} ${typeof c.indicator2 === 'object' ? c.indicator2.name + (c.indicator2.period ? `(${c.indicator2.period})` : '') : c.indicator2}`
        ).join(', ')}`,
      }
    }
  }

  return { shouldExit: false, reason: 'Exit conditions not met' }
}

function evaluateStrategy(
  strategy: ParsedStrategy,
  indicators: IndicatorValues,
  ohlcv: OHLCV[],
  currentPrice: number,
  botStartedAt?: string // ISO timestamp — only fire signals from candles after this moment
): TradeSignal {
  const lastIndex = ohlcv.length - 1
  
  // Determine the earliest candle open-time we will accept as a NEW signal
  // (any candle that opened BEFORE bot_started_at is a pre-existing signal — ignore it)
  const minCandleOpenTime = botStartedAt ? new Date(botStartedAt).getTime() : null
  if (minCandleOpenTime) {
    console.log(`[EVAL] bot_started_at filter: only accepting candles with openTime >= ${new Date(minCandleOpenTime).toISOString()}`)
  }

  console.log(`[EVAL] Evaluating ${strategy.entryConditions.length} entry conditions at price ${currentPrice}, direction=${strategy.direction}`)
  
  // scanDepth=1 means ONLY the current (last closed) candle is checked for entry.
  // This prevents old/pre-existing signals from firing when the bot restarts.
  // A new trade should only be entered when a signal fires on a brand-new candle.
  const scanDepth = 1

  // Helper: check if candle at index is after bot start
  const candleIsNew = (idx: number): boolean => {
    if (!minCandleOpenTime) return true
    const candleOpen = ohlcv[idx]?.openTime ?? 0
    if (candleOpen < minCandleOpenTime) {
      console.log(`[EVAL] Skipping candle idx=${idx} openTime=${new Date(candleOpen).toISOString()} — predates bot start`)
      return false
    }
    return true
  }

  // For bidirectional strategies, evaluate BOTH long entry AND short entry separately
  if (strategy.direction === 'both') {
    // Split conditions into long-entry and short-entry
    const longConditions = strategy.entryConditions.filter(c => 
      c.type === 'crossover' || c.type === 'above' || c.type === 'direction_change_up'
    )
    const shortConditions = strategy.exitConditions.filter(c =>
      c.type === 'crossunder' || c.type === 'below' || c.type === 'direction_change_down'
    )

    console.log(`[EVAL] Bidirectional: ${longConditions.length} long conditions, ${shortConditions.length} short conditions`)

    // Check LONG entry
    let longSignal = false
    for (let checkIdx = lastIndex; checkIdx > lastIndex - scanDepth; checkIdx--) {
      if (checkIdx < 1) break
      if (!candleIsNew(checkIdx)) continue
      let met = longConditions.length > 0
      for (const cond of longConditions) {
        met = met && evaluateCondition(cond, indicators, ohlcv, checkIdx)
      }
      if (met) {
        console.log(`[EVAL] LONG entry signal at candle ${checkIdx}`)
        longSignal = true
        break
      }
    }

    // Check SHORT entry (using exit conditions as short entry for bidirectional)
    let shortSignal = false
    for (let checkIdx = lastIndex; checkIdx > lastIndex - scanDepth; checkIdx--) {
      if (checkIdx < 1) break
      if (!candleIsNew(checkIdx)) continue
      let met = shortConditions.length > 0
      for (const cond of shortConditions) {
        met = met && evaluateCondition(cond, indicators, ohlcv, checkIdx)
      }
      if (met) {
        console.log(`[EVAL] SHORT entry signal at candle ${checkIdx}`)
        shortSignal = true
        break
      }
    }

    if (!longSignal && !shortSignal) {
      console.log(`[EVAL] No entry signal (long or short) in last ${scanDepth} candles`)
      return { action: 'NONE', price: currentPrice, reason: 'No entry conditions met in recent candles' }
    }

    // Prefer short if both trigger (trend reversal = exit long + enter short)
    const action: 'BUY' | 'SELL' = shortSignal && !longSignal ? 'SELL' : 'BUY'
    console.log(`[EVAL] Bidirectional signal: ${action} (longSignal=${longSignal}, shortSignal=${shortSignal})`)

    return buildTradeSignal(action, currentPrice, strategy, indicators, ohlcv, lastIndex)
  }

  // Non-bidirectional: original logic
  let shouldEnter = false
  let signalIndex = lastIndex
  
  for (let checkIdx = lastIndex; checkIdx > lastIndex - scanDepth; checkIdx--) {
    if (checkIdx < 1) break
    if (!candleIsNew(checkIdx)) continue
    let conditionsMet = strategy.entryConditions.length > 0
    
    for (const condition of strategy.entryConditions) {
      const result = evaluateCondition(condition, indicators, ohlcv, checkIdx)
      if (condition.logic === 'and') {
        conditionsMet = conditionsMet && result
      } else {
        conditionsMet = conditionsMet || result
      }
    }
    
    if (conditionsMet) {
      shouldEnter = true
      signalIndex = checkIdx
      console.log(`[EVAL] Signal found at candle index ${checkIdx} (${lastIndex - checkIdx} candles ago)`)
      break
    }
  }
  
  if (!shouldEnter) {
    console.log(`[EVAL] No entry signal in last ${scanDepth} candles`)
    return { action: 'NONE', price: currentPrice, reason: 'No entry conditions met in recent candles' }
  }
  
  console.log(`[EVAL] ENTRY SIGNAL DETECTED at candle ${signalIndex}!`)
  const action: 'BUY' | 'SELL' = strategy.direction === 'short' ? 'SELL' : 'BUY'
  
  return buildTradeSignal(action, currentPrice, strategy, indicators, ohlcv, lastIndex)
}

function buildTradeSignal(
  action: 'BUY' | 'SELL',
  currentPrice: number,
  strategy: ParsedStrategy,
  indicators: IndicatorValues,
  ohlcv: OHLCV[],
  lastIndex: number
): TradeSignal {
  let stopLoss: number | undefined
  if (strategy.stopLoss) {
    switch (strategy.stopLoss.type) {
      case 'percent':
        stopLoss = action === 'BUY'
          ? currentPrice * (1 - strategy.stopLoss.value / 100)
          : currentPrice * (1 + strategy.stopLoss.value / 100)
        break
      case 'atr': {
        const atr = getIndicatorValue({ name: 'atr', period: 14 }, indicators, ohlcv, lastIndex)
        if (atr) {
          stopLoss = action === 'BUY'
            ? currentPrice - (atr * strategy.stopLoss.value)
            : currentPrice + (atr * strategy.stopLoss.value)
        }
        break
      }
      case 'fixed':
        stopLoss = action === 'BUY'
          ? currentPrice - strategy.stopLoss.value
          : currentPrice + strategy.stopLoss.value
        break
    }
  }
  
  let takeProfit: number | undefined
  if (strategy.takeProfit) {
    switch (strategy.takeProfit.type) {
      case 'percent':
        takeProfit = action === 'BUY'
          ? currentPrice * (1 + strategy.takeProfit.value / 100)
          : currentPrice * (1 - strategy.takeProfit.value / 100)
        break
      case 'rr':
        if (stopLoss) {
          const riskAmount = Math.abs(currentPrice - stopLoss)
          takeProfit = action === 'BUY'
            ? currentPrice + (riskAmount * strategy.takeProfit.value)
            : currentPrice - (riskAmount * strategy.takeProfit.value)
        }
        break
      case 'atr': {
        const atr = getIndicatorValue({ name: 'atr', period: 14 }, indicators, ohlcv, lastIndex)
        if (atr) {
          takeProfit = action === 'BUY'
            ? currentPrice + (atr * strategy.takeProfit.value)
            : currentPrice - (atr * strategy.takeProfit.value)
        }
        break
      }
      case 'fixed':
        takeProfit = action === 'BUY'
          ? currentPrice + strategy.takeProfit.value
          : currentPrice - strategy.takeProfit.value
        break
    }
  }
  
  return {
    action,
    price: currentPrice,
    stopLoss,
    takeProfit,
    reason: `${action} signal: strategy conditions met`,
  }
}

// ============================================
// TRADE EXECUTION (with comprehensive safety)
// ============================================

// ============================================
// EXCHANGE POSITION SYNC (detect externally closed trades)
// ============================================

async function syncOpenTradeWithExchange(
  supabase: any,
  trade: { id: string; user_id: string; symbol: string; signal_type: string; entry_price: number },
  marketType: string
): Promise<{ stillOpen: boolean }> {
  try {
    // Get API keys
    const { data: walletKeys } = await supabase
      .from('wallets')
      .select('api_key_encrypted, api_secret_encrypted')
      .eq('user_id', trade.user_id)
      .eq('is_active', true)
      .not('api_key_encrypted', 'is', null)
      .not('api_secret_encrypted', 'is', null)
      .limit(1)
      .maybeSingle()

    let apiKeys = walletKeys
    if (!apiKeys) {
      const { data: legacyKeys } = await supabase
        .from('exchange_keys')
        .select('api_key_encrypted, api_secret_encrypted')
        .eq('user_id', trade.user_id)
        .eq('exchange', 'binance')
        .eq('is_active', true)
        .maybeSingle()
      apiKeys = legacyKeys
    }

    if (!apiKeys) {
      console.log(`[SYNC] No API keys for user ${trade.user_id}, cannot verify position`)
      return { stillOpen: true } // assume still open if can't check
    }

    const effectiveType = isFuturesOnlySymbol(trade.symbol) ? 'usdt_futures' : marketType
    const isSpot = effectiveType === 'spot'
    const isCoinM = effectiveType === 'coin_margin'
    let hasPosition = false

    if (isSpot) {
      const baseAsset = trade.symbol.replace('USDT', '').replace('BUSD', '')
      const accountInfo = await binanceRequest('/api/v3/account', apiKeys.api_key_encrypted.trim(), apiKeys.api_secret_encrypted.trim())
      const balance = accountInfo.balances?.find((b: any) => b.asset === baseAsset)
      hasPosition = balance && parseFloat(balance.free) + parseFloat(balance.locked) > 0.0001
    } else if (isCoinM) {
      const positions = await binanceCoinMRequest('/dapi/v1/positionRisk', apiKeys.api_key_encrypted.trim(), apiKeys.api_secret_encrypted.trim())
      // In Hedge Mode, check by positionSide to avoid confusing LONG vs SHORT positions
      const hedgeMode = await isHedgeMode(apiKeys.api_key_encrypted.trim(), apiKeys.api_secret_encrypted.trim(), true)
      if (hedgeMode) {
        const expectedSide = trade.signal_type === 'BUY' ? 'LONG' : 'SHORT'
        const pos = positions.find((p: any) => p.symbol === trade.symbol && p.positionSide === expectedSide && Math.abs(parseFloat(p.positionAmt)) > 0)
        hasPosition = !!pos
        console.log(`[SYNC] CoinM Hedge mode check: symbol=${trade.symbol}, expectedSide=${expectedSide}, hasPosition=${hasPosition}`)
      } else {
        const pos = positions.find((p: any) => p.symbol === trade.symbol && Math.abs(parseFloat(p.positionAmt)) > 0)
        hasPosition = !!pos
      }
    } else {
      // USDT-M Futures
      const positions = await binanceRequest('/fapi/v2/positionRisk', apiKeys.api_key_encrypted.trim(), apiKeys.api_secret_encrypted.trim(), 'GET', { recvWindow: '10000' }, true)
      // CRITICAL FIX: In Hedge Mode, there can be both a LONG and SHORT position open simultaneously.
      // We must check specifically for the side that matches THIS trade (BUY=LONG, SELL=SHORT).
      // Without this, if we have a SELL (SHORT) that closed and a new BUY (LONG) opened,
      // the old SELL would still show as "open" because positionRisk still has positionAmt > 0 (from the LONG).
      const hedgeMode = await isHedgeMode(apiKeys.api_key_encrypted.trim(), apiKeys.api_secret_encrypted.trim(), false)
      if (hedgeMode) {
        const expectedSide = trade.signal_type === 'BUY' ? 'LONG' : 'SHORT'
        const pos = positions.find((p: any) => p.symbol === trade.symbol && p.positionSide === expectedSide && Math.abs(parseFloat(p.positionAmt)) > 0)
        hasPosition = !!pos
        console.log(`[SYNC] Hedge mode check: symbol=${trade.symbol}, expectedSide=${expectedSide}, hasPosition=${hasPosition}, allPositions=${JSON.stringify(positions.filter((p: any) => p.symbol === trade.symbol).map((p: any) => ({ side: p.positionSide, amt: p.positionAmt })))}`)
      } else {
        // ONE-WAY MODE: positionAmt is positive for LONG, negative for SHORT.
        // We must check the SIGN to match this trade's direction.
        // If we only check Math.abs > 0, a new LONG position would falsely keep an old SELL trade "open".
        const positions2 = positions.filter((p: any) => p.symbol === trade.symbol)
        const pos = trade.signal_type === 'BUY'
          ? positions2.find((p: any) => parseFloat(p.positionAmt) > 0)   // LONG = positive
          : positions2.find((p: any) => parseFloat(p.positionAmt) < 0)   // SHORT = negative
        hasPosition = !!pos
        console.log(`[SYNC] One-way mode check: symbol=${trade.symbol}, tradeType=${trade.signal_type}, hasPosition=${hasPosition}, positionAmts=${JSON.stringify(positions2.map((p: any) => p.positionAmt))}`)
      }
    }

    if (!hasPosition) {
      console.log(`[SYNC] Position for ${trade.symbol} no longer exists on exchange! Marking trade ${trade.id} as CLOSED.`)
      
      // Get current price to record as exit price
      let exitPrice = trade.entry_price
      try {
        exitPrice = await getCurrentPrice(trade.symbol)
      } catch (_) {}

      await supabase.from('trades').update({
        status: 'CLOSED',
        exit_price: exitPrice,
        closed_at: new Date().toISOString(),
        error_message: 'Position closed externally (SL/TP hit or manual close on exchange)',
      }).eq('id', trade.id)

      return { stillOpen: false }
    }

    return { stillOpen: true }
  } catch (err) {
    console.log(`[SYNC] Error checking position for trade ${trade.id}:`, err)
    return { stillOpen: true } // assume still open on error
  }
}

// ============================================
// TRADE CLOSING (auto-close based on exit conditions)
// ============================================

async function closeOpenTrade(
  supabase: any,
  trade: { id: string; user_id: string; script_id: string; symbol: string; signal_type: string; entry_price: number },
  currentPrice: number,
  marketType: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[CLOSE] Closing trade ${trade.id}: ${trade.symbol} entry=${trade.entry_price} exit=${currentPrice} reason=${reason}`)

    // Get API keys
    const { data: apiKeys } = await supabase
      .from('wallets')
      .select('api_key_encrypted, api_secret_encrypted')
      .eq('user_id', trade.user_id)
      .eq('is_active', true)
      .not('api_key_encrypted', 'is', null)
      .not('api_secret_encrypted', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!apiKeys) {
      // Try legacy table
      const { data: legacyKeys } = await supabase
        .from('exchange_keys')
        .select('api_key_encrypted, api_secret_encrypted')
        .eq('user_id', trade.user_id)
        .eq('exchange', 'binance')
        .eq('is_active', true)
        .maybeSingle()
      
      if (!legacyKeys) {
        // No API keys — just mark as closed in DB
        await supabase.from('trades').update({
          status: 'CLOSED',
          exit_price: currentPrice,
          closed_at: new Date().toISOString(),
          error_message: 'Closed by exit signal (no API keys to execute on exchange)',
        }).eq('id', trade.id)
        return { success: true }
      }
      Object.assign(apiKeys || {}, legacyKeys)
    }

    const keys = apiKeys!
    const effectiveType = isFuturesOnlySymbol(trade.symbol) ? 'usdt_futures' : marketType
    const isSpot = effectiveType === 'spot'
    const isCoinM = effectiveType === 'coin_margin'
    const closeSide = trade.signal_type === 'BUY' ? 'SELL' : 'BUY'

    // Get current position to determine quantity
    let closeQty: string | undefined
    try {
      if (isSpot) {
        // For spot, get the asset balance
        const baseAsset = trade.symbol.replace('USDT', '').replace('BUSD', '')
        const accountInfo = await binanceRequest('/api/v3/account', keys.api_key_encrypted, keys.api_secret_encrypted)
        const assetBalance = accountInfo.balances?.find((b: any) => b.asset === baseAsset)
        if (assetBalance && parseFloat(assetBalance.free) > 0) {
          closeQty = assetBalance.free
        }
      } else if (isCoinM) {
        const positions = await binanceCoinMRequest('/dapi/v1/positionRisk', keys.api_key_encrypted, keys.api_secret_encrypted)
        const hedgeMode = await isHedgeMode(keys.api_key_encrypted.trim(), keys.api_secret_encrypted.trim(), true)
        let pos: any
        if (hedgeMode) {
          // In hedge mode, find ONLY the matching positionSide to avoid closing the wrong leg
          const expectedSide = trade.signal_type === 'BUY' ? 'LONG' : 'SHORT'
          pos = positions.find((p: any) => p.symbol === trade.symbol && p.positionSide === expectedSide && parseFloat(p.positionAmt) !== 0)
          console.log(`[CLOSE] CoinM Hedge mode: looking for ${expectedSide} position, found=${!!pos}`)
        } else {
          pos = positions.find((p: any) => p.symbol === trade.symbol && parseFloat(p.positionAmt) !== 0)
        }
        if (pos) {
          closeQty = Math.abs(parseFloat(pos.positionAmt)).toString()
        }
      } else {
        // USDT-M futures
        const positions = await binanceRequest('/fapi/v2/positionRisk', keys.api_key_encrypted, keys.api_secret_encrypted, 'GET', {}, true)
        const hedgeMode = await isHedgeMode(keys.api_key_encrypted.trim(), keys.api_secret_encrypted.trim(), false)
        let pos: any
        if (hedgeMode) {
          // In hedge mode, find ONLY the matching positionSide to avoid closing the wrong leg
          const expectedSide = trade.signal_type === 'BUY' ? 'LONG' : 'SHORT'
          pos = positions.find((p: any) => p.symbol === trade.symbol && p.positionSide === expectedSide && parseFloat(p.positionAmt) !== 0)
          console.log(`[CLOSE] Hedge mode: looking for ${expectedSide} position, found=${!!pos}`)
        } else {
          // One-way mode: use sign of positionAmt to match trade direction
          const positions2 = positions.filter((p: any) => p.symbol === trade.symbol)
          pos = trade.signal_type === 'BUY'
            ? positions2.find((p: any) => parseFloat(p.positionAmt) > 0)
            : positions2.find((p: any) => parseFloat(p.positionAmt) < 0)
          console.log(`[CLOSE] One-way mode: tradeType=${trade.signal_type}, found position=${!!pos}, positionAmts=${JSON.stringify(positions2.map((p: any) => p.positionAmt))}`)
        }
        if (pos) {
          closeQty = Math.abs(parseFloat(pos.positionAmt)).toString()
        }
      }
    } catch (posErr) {
      console.log(`[CLOSE] Could not fetch position:`, posErr)
    }

    if (!closeQty || parseFloat(closeQty) === 0) {
      console.log(`[CLOSE] No open position found on exchange for ${trade.symbol}, marking closed in DB`)
      await supabase.from('trades').update({
        status: 'CLOSED',
        exit_price: currentPrice,
        closed_at: new Date().toISOString(),
      }).eq('id', trade.id)
      return { success: true }
    }

    // Place closing order
    let orderEndpoint: string
    if (isSpot) {
      orderEndpoint = '/api/v3/order'
    } else if (isCoinM) {
      orderEndpoint = '/dapi/v1/order'
    } else {
      orderEndpoint = '/fapi/v1/order'
    }

    const orderParams: Record<string, string> = {
      symbol: trade.symbol,
      side: closeSide,
      type: 'MARKET',
      quantity: closeQty,
    }

    // For futures, handle hedge mode vs one-way mode
    if (!isSpot) {
      const hedgeMode = await isHedgeMode(keys.api_key_encrypted.trim(), keys.api_secret_encrypted.trim(), isCoinM)
      if (hedgeMode) {
        // Hedge mode: use positionSide instead of reduceOnly
        // Closing a BUY/LONG position: positionSide=LONG, side=SELL
        // Closing a SELL/SHORT position: positionSide=SHORT, side=BUY
        orderParams.positionSide = trade.signal_type === 'BUY' ? 'LONG' : 'SHORT'
        console.log(`[CLOSE] Hedge mode: positionSide=${orderParams.positionSide}, side=${closeSide}`)
      } else {
        orderParams.reduceOnly = 'true'
      }
    }

    const useFuturesBase = !isSpot && !isCoinM
    const orderResult = isCoinM
      ? await binanceCoinMRequest(orderEndpoint, keys.api_key_encrypted, keys.api_secret_encrypted, 'POST', orderParams)
      : await binanceRequest(orderEndpoint, keys.api_key_encrypted, keys.api_secret_encrypted, 'POST', orderParams, useFuturesBase)

    const exitPrice = isSpot
      ? parseFloat(orderResult.fills?.[0]?.price || currentPrice.toString())
      : parseFloat(orderResult.avgPrice || orderResult.price || currentPrice.toString()) || currentPrice

    console.log(`[CLOSE] Order filled! Exit price: ${exitPrice}`)

    await supabase.from('trades').update({
      status: 'CLOSED',
      exit_price: exitPrice,
      closed_at: new Date().toISOString(),
    }).eq('id', trade.id)

    return { success: true }
  } catch (err) {
    console.error(`[CLOSE] Failed to close trade ${trade.id}:`, err)
    // DO NOT mark as CLOSED — the exchange position is still open!
    // Keep the trade as OPEN so the next cycle retries the close.
    await supabase.from('trades').update({
      error_message: `Auto-close attempt failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }).eq('id', trade.id)
    return { success: false, error: err instanceof Error ? err.message : 'Close failed' }
  }
}

// Get candle interval in milliseconds for duplicate detection
function getIntervalMs(timeframe: string): number {
  const map: Record<string, number> = {
    '1m': 60_000, '3m': 180_000, '5m': 300_000, '15m': 900_000,
    '30m': 1_800_000, '1h': 3_600_000, '2h': 7_200_000, '4h': 14_400_000,
    '6h': 21_600_000, '8h': 28_800_000, '12h': 43_200_000, '1d': 86_400_000,
    '3d': 259_200_000, '1w': 604_800_000,
  }
  return map[timeframe] || 3_600_000
}

async function executeTrade(
  supabase: any,
  userId: string,
  scriptId: string,
  signal: TradeSignal,
  symbol: string,
  timeframe: string,
  marketType: string = 'futures',
  leverage: number = 1
): Promise<{ success: boolean; error?: string; tradeId?: string }> {
  try {
    console.log(`[TRADE] Starting execution: user=${userId}, script=${scriptId}, signal=${signal.action} ${symbol} @ ${signal.price}`)
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins, bot_enabled, free_trades_remaining, subscription_active')
      .eq('user_id', userId)
      .single()
    
    if (profileError || !profile) {
      console.error(`[TRADE] Profile fetch failed:`, profileError)
      return { success: false, error: 'Failed to fetch user profile' }
    }
    
    if (!profile.bot_enabled) {
      console.log(`[TRADE] Bot disabled for user ${userId}`)
      return { success: false, error: 'Bot is disabled — enable Trading Bot in Library' }
    }
    
    // Check credits — currently bypassed: all users get unlimited trades
    // TODO: Re-enable credit/subscription checks once subscription model is finalized
    const freeTradesLeft = profile.free_trades_remaining ?? 0
    const coins = profile.coins ?? 0
    const hasSubscription = profile.subscription_active ?? false
    console.log(`[TRADE] Credits: free=${freeTradesLeft}, coins=${coins}, subscription=${hasSubscription} — unlimited mode active`)
    
    // Duplicate trade check using actual timeframe interval
    const intervalMs = getIntervalMs(timeframe)
    const candleStart = new Date(Math.floor(Date.now() / intervalMs) * intervalMs)
    
    // Check for successful trades on this candle (OPEN/PENDING/CLOSED = already traded)
    const { data: existingSuccessfulTrade } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', userId)
      .eq('script_id', scriptId)
      .eq('symbol', symbol)
      .gte('created_at', candleStart.toISOString())
      .in('status', ['OPEN', 'PENDING', 'CLOSED'])
      .maybeSingle()
    
    if (existingSuccessfulTrade) {
      console.log(`[TRADE] Already have a successful trade on this candle, skipping`)
      return { success: false, error: 'Already traded on this candle' }
    }

    // CRITICAL: Also check if there's ANY open/pending trade on the same symbol
    // This prevents stacking multiple positions when signals repeat across candles
    const { data: existingOpenTrade } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', userId)
      .eq('script_id', scriptId)
      .eq('symbol', symbol)
      .in('status', ['OPEN', 'PENDING'])
      .maybeSingle()
    
    if (existingOpenTrade) {
      console.log(`[TRADE] Already have an open/pending trade for ${symbol}, skipping new entry`)
      return { success: false, error: 'Already have an open position on this symbol' }
    }

    // Check for repeated failures on same candle (max 2 retries to prevent credit drain)
    const { count: failedCount } = await supabase
      .from('trades')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('script_id', scriptId)
      .eq('symbol', symbol)
      .gte('created_at', candleStart.toISOString())
      .eq('status', 'FAILED')
    
    if ((failedCount ?? 0) >= 2) {
      console.log(`[TRADE] Too many failed attempts (${failedCount}) on this candle, skipping`)
      return { success: false, error: 'Too many failed attempts on this candle — check your API keys' }
    }
    
    // Get API keys - check wallets table first (primary), then exchange_keys (legacy)
    let apiKeys: { api_key_encrypted: string; api_secret_encrypted: string } | null = null
    let keysError: any = null
    
    // Primary: wallets table
    const { data: walletKeys, error: walletKeysError } = await supabase
      .from('wallets')
      .select('api_key_encrypted, api_secret_encrypted')
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('api_key_encrypted', 'is', null)
      .not('api_secret_encrypted', 'is', null)
      .limit(1)
      .maybeSingle()
    
    if (walletKeys) {
      apiKeys = walletKeys
      console.log(`[TRADE] Found API keys in wallets table for user ${userId}`)
    } else {
      // Fallback: legacy exchange_keys table
      const { data: legacyKeys, error: legacyError } = await supabase
        .from('exchange_keys')
        .select('api_key_encrypted, api_secret_encrypted')
        .eq('user_id', userId)
        .eq('exchange', 'binance')
        .eq('is_active', true)
        .maybeSingle()
      
      if (legacyKeys) {
        apiKeys = legacyKeys
        console.log(`[TRADE] Found API keys in exchange_keys table for user ${userId}`)
      } else {
        keysError = walletKeysError || legacyError
      }
    }
    
    if (keysError || !apiKeys) {
      console.log(`[TRADE] No API keys for user ${userId} — recording signal only`)
      
      // Still record the signal even if we can't execute
      const { data: signalRecord } = await supabase
        .from('signals')
        .insert({
          script_id: scriptId,
          signal_type: signal.action === 'BUY' ? 'BUY' : 'SELL',
          symbol,
          timeframe,
          price: signal.price,
          stop_loss: signal.stopLoss,
          take_profit: signal.takeProfit,
          candle_timestamp: candleStart.toISOString(),
          processed: false,
        })
        .select('id')
        .maybeSingle()
      
      // Record trade as FAILED with clear error
      await supabase
        .from('trades')
        .insert({
          user_id: userId,
          script_id: scriptId,
          signal_id: signalRecord?.id || null,
          symbol,
          timeframe,
          signal_type: signal.action === 'BUY' ? 'BUY' : 'SELL',
          status: 'FAILED',
          entry_price: signal.price,
          stop_loss: signal.stopLoss,
          take_profit: signal.takeProfit,
          error_message: 'No Binance API keys configured. Please add your API keys in Settings.',
          coin_locked: false,
          coin_consumed: false,
        })
      
      return { success: false, error: 'No Binance API keys configured. Signal was recorded.' }
    }
    
    // Deduct credit (skip if subscription active)
    if (!hasSubscription) {
      if (freeTradesLeft > 0) {
        console.log(`[TRADE] Deducting free trade: ${freeTradesLeft} -> ${freeTradesLeft - 1}`)
        await supabase
          .from('profiles')
          .update({ free_trades_remaining: freeTradesLeft - 1 })
          .eq('user_id', userId)
      } else {
        console.log(`[TRADE] Deducting coin: ${coins} -> ${coins - 1}`)
        await supabase
          .from('profiles')
          .update({ coins: coins - 1 })
          .eq('user_id', userId)
      }
    }
    
    // Record signal
    const { data: signalRecord } = await supabase
      .from('signals')
      .insert({
        script_id: scriptId,
        signal_type: signal.action === 'BUY' ? 'BUY' : 'SELL',
        symbol,
        timeframe,
        price: signal.price,
        stop_loss: signal.stopLoss,
        take_profit: signal.takeProfit,
        candle_timestamp: candleStart.toISOString(),
        processed: true,
      })
      .select('id')
      .maybeSingle()
    
    // Create pending trade record
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: userId,
        script_id: scriptId,
        signal_id: signalRecord?.id || null,
        symbol,
        timeframe,
        signal_type: signal.action === 'BUY' ? 'BUY' : 'SELL',
        status: 'PENDING',
        entry_price: signal.price,
        stop_loss: signal.stopLoss,
        take_profit: signal.takeProfit,
        coin_locked: true,
        coin_consumed: false,
      })
      .select('id')
      .single()
    
    if (tradeError) {
      console.error(`[TRADE] Failed to create trade record:`, tradeError)
      // Refund credit (only if subscription not active)
      if (!hasSubscription) {
        if (freeTradesLeft > 0) {
          await supabase.from('profiles').update({ free_trades_remaining: freeTradesLeft }).eq('user_id', userId)
        } else {
          await supabase.from('profiles').update({ coins: coins }).eq('user_id', userId)
        }
      }
      return { success: false, error: 'Failed to create trade record' }
    }
    
    console.log(`[TRADE] Trade record created: ${trade.id}`)
    
    try {
      // Determine API routing based on market type
      // Force USDT-M futures for futures-only symbols regardless of user config
      const effectiveMarketType = isFuturesOnlySymbol(symbol) ? 'usdt_futures' : marketType
      const isSpot = effectiveMarketType === 'spot'
      const isCoinM = effectiveMarketType === 'coin_margin'
      const isFutures = !isSpot // USDT-M or Coin-M are both futures
      
      console.log(`[TRADE] Market type: ${marketType} -> effective: ${effectiveMarketType}, leverage: ${leverage}, isFutures: ${isFutures}`)
      
      // ===== GET BALANCE =====
      let availableUSDT = 0
      if (isSpot) {
        const accountInfo = await binanceRequest('/api/v3/account', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted)
        const usdtBalance = accountInfo.balances.find((b: any) => b.asset === 'USDT')
        availableUSDT = parseFloat(usdtBalance?.free || '0')
      } else if (isCoinM) {
        const coinMBalances = await binanceRequest('/dapi/v1/balance', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'GET', {}, false)
        // For coin-M, use the base asset balance
        const baseAsset = symbol.replace('USD_PERP', '').replace('USDT', '').replace('BUSD', '')
        const bal = coinMBalances.find((b: any) => b.asset === baseAsset || b.asset === 'USDT')
        availableUSDT = parseFloat(bal?.availableBalance || bal?.balance || '0')
      } else {
        // USDT-M Futures
        const futuresBalances = await binanceRequest('/fapi/v2/balance', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'GET', {}, true)
        const usdtBalance = futuresBalances.find((b: any) => b.asset === 'USDT')
        availableUSDT = parseFloat(usdtBalance?.availableBalance || usdtBalance?.balance || '0')
      }
      
      console.log(`[TRADE] Available balance: ${availableUSDT}`)
      
      // ===== SET LEVERAGE (futures only) =====
      if (isFutures && leverage > 0) {
        try {
          const leverageEndpoint = isCoinM ? '/dapi/v1/leverage' : '/fapi/v1/leverage'
          await binanceRequest(leverageEndpoint, apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
            symbol: symbol,
            leverage: leverage.toString(),
          }, !isCoinM)
          console.log(`[TRADE] Leverage set to ${leverage}x for ${symbol}`)
        } catch (levError) {
          console.log(`[TRADE] Leverage set failed (may already be set):`, levError)
        }
      }
      
      // ===== FETCH EXCHANGE INFO =====
      let stepSize = 0.001
      let minQty = 0.001
      let minNotional = isSpot ? 10 : 5
      try {
        let exchangeInfoUrl: string
        if (isSpot) {
          exchangeInfoUrl = `https://api.binance.com/api/v3/exchangeInfo?symbol=${symbol}`
        } else if (isCoinM) {
          exchangeInfoUrl = `https://dapi.binance.com/dapi/v1/exchangeInfo`
        } else {
          exchangeInfoUrl = `https://fapi.binance.com/fapi/v1/exchangeInfo`
        }
        const eiResp = await fetch(exchangeInfoUrl)
        if (eiResp.ok) {
          const ei = await eiResp.json()
          const symbolInfo = isSpot 
            ? ei.symbols?.[0] 
            : ei.symbols?.find((s: any) => s.symbol === symbol)
          if (symbolInfo) {
            const lotFilter = symbolInfo.filters?.find((f: any) => f.filterType === 'LOT_SIZE')
            if (lotFilter) {
              stepSize = parseFloat(lotFilter.stepSize)
              minQty = parseFloat(lotFilter.minQty)
              console.log(`[TRADE] LOT_SIZE: stepSize=${stepSize}, minQty=${minQty}`)
            }
            const notionalFilter = symbolInfo.filters?.find((f: any) => 
              f.filterType === 'MIN_NOTIONAL' || f.filterType === 'NOTIONAL'
            )
            if (notionalFilter) {
              minNotional = parseFloat(notionalFilter.minNotional || notionalFilter.notional || (isSpot ? '10' : '5'))
            }
          }
        }
      } catch (e) {
        console.log(`[TRADE] Could not fetch exchange info, using defaults`)
      }
      
      // ===== CALCULATE QUANTITY =====
      const minRequired = minNotional * 1.05
      const tradeAmount = Math.max(Math.min(availableUSDT * 0.1, 1000), minRequired)
      
      if (availableUSDT < minRequired) {
        throw new Error(`Insufficient balance (${availableUSDT.toFixed(2)} available, minimum ~${minRequired.toFixed(2)} required)`)
      }
      
      const rawQty = tradeAmount / signal.price
      const precision = stepSize < 1 ? Math.round(-Math.log10(stepSize)) : 0
      let quantity = (Math.ceil(rawQty / stepSize) * stepSize).toFixed(precision)
      
      const notionalValue = parseFloat(quantity) * signal.price
      console.log(`[TRADE] Quantity=${quantity}, notional=$${notionalValue.toFixed(2)}, minNotional=${minNotional}`)
      
      if (parseFloat(quantity) < minQty) {
        throw new Error(`Calculated quantity ${quantity} below minimum ${minQty} for ${symbol}`)
      }
      
      if (notionalValue > availableUSDT) {
        throw new Error(`Order value $${notionalValue.toFixed(2)} exceeds available balance $${availableUSDT.toFixed(2)}`)
      }
      
      console.log(`[TRADE] Placing ${marketType} ${signal.action} order: ${quantity} ${symbol} (~$${tradeAmount.toFixed(2)}, leverage=${leverage}x)`)
      
      // ===== PLACE ORDER =====
      let orderEndpoint: string
      let useFuturesBase: boolean
      if (isSpot) {
        orderEndpoint = '/api/v3/order'
        useFuturesBase = false
      } else if (isCoinM) {
        orderEndpoint = '/dapi/v1/order'
        useFuturesBase = false // coin-M uses dapi base
      } else {
        orderEndpoint = '/fapi/v1/order'
        useFuturesBase = true
      }
      
      // Detect hedge mode for futures
      const hedgeMode = isFutures ? await isHedgeMode(apiKeys.api_key_encrypted.trim(), apiKeys.api_secret_encrypted.trim(), isCoinM) : false
      const positionSide = hedgeMode ? (signal.action === 'BUY' ? 'LONG' : 'SHORT') : undefined

      // Build order params
      const entryOrderParams: Record<string, string> = {
        symbol: symbol,
        side: signal.action,
        type: 'MARKET',
        quantity: quantity,
      }
      if (positionSide) {
        entryOrderParams.positionSide = positionSide
        console.log(`[TRADE] Hedge mode: positionSide=${positionSide}`)
      }

      const orderResult = isCoinM
        ? await binanceCoinMRequest(orderEndpoint, apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', entryOrderParams)
        : await binanceRequest(orderEndpoint, apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', entryOrderParams, useFuturesBase)
      
      console.log(`[TRADE] Order filled! OrderId: ${orderResult.orderId}`)
      
      // Update trade as OPEN
      const fillPrice = isSpot 
        ? parseFloat(orderResult.fills?.[0]?.price || signal.price.toString())
        : parseFloat(orderResult.avgPrice || orderResult.price || signal.price.toString()) || signal.price
      console.log(`[TRADE] Fill price: ${fillPrice} (avgPrice=${orderResult.avgPrice}, price=${orderResult.price})`)
      await supabase
        .from('trades')
        .update({
          status: 'OPEN',
          entry_price: fillPrice,
          opened_at: new Date().toISOString(),
          coin_consumed: true,
        })
        .eq('id', trade.id)
      
      // ===== STOP LOSS =====
      if (signal.stopLoss) {
        try {
          const slSide = signal.action === 'BUY' ? 'SELL' : 'BUY'
          if (isSpot) {
            await binanceRequest('/api/v3/order', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
              symbol: symbol,
              side: slSide,
              type: 'STOP_LOSS_LIMIT',
              quantity: quantity,
              stopPrice: signal.stopLoss.toFixed(2),
              price: (signal.stopLoss * (signal.action === 'BUY' ? 0.995 : 1.005)).toFixed(2),
              timeInForce: 'GTC',
            })
          } else {
            const slEndpoint = isCoinM ? '/dapi/v1/order' : '/fapi/v1/order'
            const slParams: Record<string, string> = {
              symbol: symbol,
              side: slSide,
              type: 'STOP_MARKET',
              quantity: quantity,
              stopPrice: signal.stopLoss.toFixed(2),
              closePosition: 'false',
            }
            if (positionSide) slParams.positionSide = positionSide
            const slFn = isCoinM ? binanceCoinMRequest : (ep: string, ak: string, as2: string, m: string, p: any) => binanceRequest(ep, ak, as2, m, p, true)
            await slFn(slEndpoint, apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', slParams)
          }
          console.log(`[TRADE] Stop loss placed at ${signal.stopLoss.toFixed(2)}`)
        } catch (slError) {
          console.log('[TRADE] Stop loss order failed (non-critical):', slError)
        }
      }
      
      // ===== TAKE PROFIT =====
      if (signal.takeProfit) {
        try {
          const tpSide = signal.action === 'BUY' ? 'SELL' : 'BUY'
          if (isSpot) {
            await binanceRequest('/api/v3/order', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
              symbol: symbol,
              side: tpSide,
              type: 'TAKE_PROFIT_LIMIT',
              quantity: quantity,
              stopPrice: signal.takeProfit.toFixed(2),
              price: (signal.takeProfit * (signal.action === 'BUY' ? 1.005 : 0.995)).toFixed(2),
              timeInForce: 'GTC',
            })
          } else {
            const tpEndpoint = isCoinM ? '/dapi/v1/order' : '/fapi/v1/order'
            const tpParams: Record<string, string> = {
              symbol: symbol,
              side: tpSide,
              type: 'TAKE_PROFIT_MARKET',
              quantity: quantity,
              stopPrice: signal.takeProfit.toFixed(2),
              closePosition: 'false',
            }
            if (positionSide) tpParams.positionSide = positionSide
            const tpFn = isCoinM ? binanceCoinMRequest : (ep: string, ak: string, as2: string, m: string, p: any) => binanceRequest(ep, ak, as2, m, p, true)
            await tpFn(tpEndpoint, apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', tpParams)
          }
          console.log(`[TRADE] Take profit placed at ${signal.takeProfit.toFixed(2)}`)
        } catch (tpError) {
          console.log('[TRADE] Take profit order failed (non-critical):', tpError)
        }
      }
      
      return { success: true, tradeId: trade.id }
      
    } catch (execError) {
      console.error(`[TRADE] Execution failed:`, execError)
      
      // Update trade as FAILED
      await supabase
        .from('trades')
        .update({
          status: 'FAILED',
          error_message: execError instanceof Error ? execError.message : 'Unknown execution error',
        })
        .eq('id', trade.id)
      
      // Refund credit (only if subscription not active)
      if (!hasSubscription) {
        if (freeTradesLeft > 0) {
          await supabase.from('profiles').update({ free_trades_remaining: freeTradesLeft }).eq('user_id', userId)
        } else {
          await supabase.from('profiles').update({ coins: coins }).eq('user_id', userId)
        }
      }
      
      return { success: false, error: execError instanceof Error ? execError.message : 'Trade execution failed' }
    }
    
  } catch (err) {
    console.error(`[TRADE] Unexpected error:`, err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ============================================
// MAIN HANDLER
// ============================================

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
    
    console.log(`[ENGINE] Action: ${action}`)
    
    switch (action) {
      case 'evaluate': {
        const body = await req.json()
        const { scriptContent, symbol, timeframe = '1h' } = body
        
        if (!scriptContent || !symbol) {
          return new Response(
            JSON.stringify({ error: 'Missing scriptContent or symbol' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        const ohlcv = await fetchOHLCV(symbol, timeframe, 200)
        const currentPrice = await getCurrentPrice(symbol)
        const indicators = calculateAllIndicators(ohlcv)
        const strategy = parsePineScript(scriptContent)
        const botStartedAt = (us.settings_json as any)?.bot_started_at || undefined
        if (botStartedAt) {
          console.log(`[ENGINE] bot_started_at for user ${us.user_id}: ${botStartedAt}`)
        }
        const signal = evaluateStrategy(strategy, indicators, ohlcv, currentPrice, botStartedAt)
        
        return new Response(
          JSON.stringify({
            strategy,
            signal,
            currentPrice,
            indicators: {
              ema9: indicators.ema[9]?.slice(-3),
              ema21: indicators.ema[21]?.slice(-3),
              rsi: indicators.rsi[14]?.slice(-3),
              macd: {
                macd: indicators.macd.macd.slice(-3),
                signal: indicators.macd.signal.slice(-3),
              },
              bb: {
                upper: indicators.bb.upper.slice(-3),
                middle: indicators.bb.middle.slice(-3),
                lower: indicators.bb.lower.slice(-3),
              },
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      case 'run': {
        // Optional timeframe filter from cron or manual call
        const targetTimeframe = url.searchParams.get('timeframe') || null
        console.log(`[ENGINE] Starting run${targetTimeframe ? ` for timeframe=${targetTimeframe}` : ' for all active scripts'}...`)
        const results: any[] = []
        
        // Get all active user_scripts (users who clicked "Run")
        const { data: userScripts, error: scriptsError } = await supabase
          .from('user_scripts')
          .select(`
            id,
            script_id,
            user_id,
            is_active,
            settings_json,
            script:pine_scripts (
              id,
              name,
              script_content,
              symbol,
              is_active,
              allowed_timeframes,
              market_type,
              leverage
            )
          `)
          .eq('is_active', true)
        
        if (scriptsError) {
          console.error('[ENGINE] Failed to fetch user_scripts:', scriptsError)
          throw new Error(`Failed to fetch scripts: ${scriptsError.message}`)
        }
        
        console.log(`[ENGINE] Found ${userScripts?.length || 0} active user_scripts`)
        
        // Also get user-created scripts that are active (exclude admin scripts - they're handled via user_scripts)
        const { data: createdScripts, error: createdError } = await supabase
          .from('pine_scripts')
          .select('*')
          .eq('is_active', true)
          .is('admin_tag', null)
          .is('deleted_at', null)
          .not('created_by', 'is', null)
        
        if (createdError) {
          console.log('[ENGINE] Error fetching user-created scripts:', createdError)
        }
        
        console.log(`[ENGINE] Found ${createdScripts?.length || 0} active user-created scripts`)
        
        // Combine all scripts to process
        const allScripts: any[] = [
          ...(userScripts || []).filter((us: any) => us.script != null).map((us: any) => {
            // Apply user-specific overrides from settings_json
            const userSettings = us.settings_json || {}
            const mergedScript = { ...us.script }
            if (userSettings.leverage !== undefined) mergedScript.leverage = userSettings.leverage
            if (userSettings.market_type !== undefined) mergedScript.market_type = userSettings.market_type
            if (userSettings.allowed_timeframes !== undefined) mergedScript.allowed_timeframes = userSettings.allowed_timeframes
            if (userSettings.trading_pairs !== undefined) mergedScript.symbol = userSettings.trading_pairs[0] || mergedScript.symbol
            return {
              script_id: us.script_id,
              user_id: us.user_id,
              script: mergedScript,
              settings_json: us.settings_json || {},
            }
          }),
          ...(createdScripts || []).map((s: any) => ({
            script_id: s.id,
            user_id: s.created_by,
            script: s,
            settings_json: {},
          })),
        ]
        
        // Filter by target timeframe if specified (from cron job)
        const filteredScripts = targetTimeframe
          ? allScripts.filter((s: any) => {
              const scriptTf = s.script.allowed_timeframes?.[0] || '1h'
              return scriptTf === targetTimeframe
            })
          : allScripts
        
        console.log(`[ENGINE] Total scripts: ${allScripts.length}, after timeframe filter: ${filteredScripts.length}`)
        
        if (filteredScripts.length === 0) {
          return new Response(
            JSON.stringify({ 
              processed: 0,
              results: [],
              message: targetTimeframe 
                ? `No active scripts found for timeframe ${targetTimeframe}.`
                : 'No active scripts found. Make sure you clicked "Run" on a script and the Trading Bot is enabled.',
              timestamp: new Date().toISOString(),
              timeframeFilter: targetTimeframe,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Group by symbol+timeframe
        const bySymbolTimeframe: Record<string, any[]> = {}
        for (const us of filteredScripts) {
          const sym = us.script.symbol
          const tf = us.script.allowed_timeframes?.[0] || '1h'
          const key = `${sym}:${tf}`
          if (!bySymbolTimeframe[key]) {
            bySymbolTimeframe[key] = []
          }
          bySymbolTimeframe[key].push(us)
        }
        
        // Process each symbol+timeframe combination
        for (const key of Object.keys(bySymbolTimeframe)) {
          const groupedScripts = bySymbolTimeframe[key]
          const [symbol, timeframe] = key.split(':')
          console.log(`[ENGINE] Processing ${key}: ${groupedScripts.length} scripts`)
          
          try {
            const ohlcv = await fetchOHLCV(symbol, timeframe, 200)
            const currentPrice = await getCurrentPrice(symbol)
            const indicators = calculateAllIndicators(ohlcv)
            
            for (const us of groupedScripts) {
              try {
                console.log(`[ENGINE] Evaluating script "${us.script.name}" for user ${us.user_id}`)
                const strategy = parsePineScript(us.script.script_content)
                // Force USDT-M futures for futures-only symbols (XAU, XAG)
                const rawMarketType = us.script.market_type || 'futures'
                const scriptMarketType = isFuturesOnlySymbol(symbol) ? 'usdt_futures' : rawMarketType
                const scriptLeverage = us.script.leverage || 1

                // ===== ORPHANED POSITION DETECTOR =====
                // If there's a live Binance position but NO open DB trade, auto-close it
                if (scriptMarketType !== 'spot') {
                  try {
                    const { data: anyOpenTrade } = await supabase
                      .from('trades')
                      .select('id')
                      .eq('user_id', us.user_id)
                      .eq('symbol', symbol)
                      .in('status', ['OPEN', 'PENDING'])
                      .maybeSingle()

                    if (!anyOpenTrade) {
                      // No open trade in DB — check if there's a live position on exchange
                      const { data: walletKeys } = await supabase
                        .from('wallets')
                        .select('api_key_encrypted, api_secret_encrypted')
                        .eq('user_id', us.user_id)
                        .eq('is_active', true)
                        .not('api_key_encrypted', 'is', null)
                        .limit(1)
                        .maybeSingle()

                      if (walletKeys) {
                        const isCoinM = scriptMarketType === 'coin_margin'
                        const positions = isCoinM
                          ? await binanceCoinMRequest('/dapi/v1/positionRisk', walletKeys.api_key_encrypted.trim(), walletKeys.api_secret_encrypted.trim())
                          : await binanceRequest('/fapi/v2/positionRisk', walletKeys.api_key_encrypted.trim(), walletKeys.api_secret_encrypted.trim(), 'GET', { recvWindow: '10000' }, true)

                        const orphaned = positions.find((p: any) => p.symbol === symbol && Math.abs(parseFloat(p.positionAmt)) > 0.001)
                        if (orphaned) {
                          console.log(`[ORPHAN] Found orphaned position for ${symbol}: amt=${orphaned.positionAmt}. Auto-closing...`)
                          const orphanedSide = parseFloat(orphaned.positionAmt) > 0 ? 'BUY' : 'SELL'
                          const closeSide = orphanedSide === 'BUY' ? 'SELL' : 'BUY'
                          const closeQty = Math.abs(parseFloat(orphaned.positionAmt)).toString()
                          const closeEndpoint = isCoinM ? '/dapi/v1/order' : '/fapi/v1/order'
                          const closeParams: Record<string, string> = {
                            symbol,
                            side: closeSide,
                            type: 'MARKET',
                            quantity: closeQty,
                            reduceOnly: 'true',
                          }
                          try {
                            if (isCoinM) {
                              await binanceCoinMRequest(closeEndpoint, walletKeys.api_key_encrypted.trim(), walletKeys.api_secret_encrypted.trim(), 'POST', closeParams)
                            } else {
                              await binanceRequest(closeEndpoint, walletKeys.api_key_encrypted.trim(), walletKeys.api_secret_encrypted.trim(), 'POST', closeParams, true)
                            }
                            console.log(`[ORPHAN] Successfully closed orphaned ${symbol} position (${orphaned.positionAmt})`)
                            results.push({
                              scriptId: us.script_id,
                              scriptName: us.script.name,
                              userId: us.user_id,
                              symbol,
                              timeframe,
                              action: 'ORPHAN_CLOSE',
                              executed: true,
                              reason: `Closed orphaned position: ${orphaned.positionAmt} ${symbol}`,
                            })
                          } catch (orphanCloseErr) {
                            console.log(`[ORPHAN] Failed to close orphaned position:`, orphanCloseErr)
                          }
                        }
                      }
                    }
                  } catch (orphanErr) {
                    console.log(`[ORPHAN] Error in orphan detector:`, orphanErr)
                  }
                }

                // ===== CHECK FOR OPEN TRADES TO CLOSE =====
                const { data: openTrades } = await supabase
                  .from('trades')
                  .select('id, user_id, script_id, symbol, signal_type, entry_price')
                  .eq('user_id', us.user_id)
                  .eq('script_id', us.script_id)
                  .eq('symbol', symbol)
                  .eq('status', 'OPEN')

                if (openTrades && openTrades.length > 0) {
                  console.log(`[ENGINE] Found ${openTrades.length} open trade(s) for user ${us.user_id}, syncing with exchange...`)
                  
                  // STEP 1: Verify positions still exist on exchange (detect SL/TP hits, manual closes)
                  let allSynced = true
                  let anyClosedExternally = false
                  for (const openTrade of openTrades) {
                    const syncResult = await syncOpenTradeWithExchange(supabase, openTrade, scriptMarketType)
                    if (!syncResult.stillOpen) {
                      anyClosedExternally = true
                      results.push({
                        scriptId: us.script_id,
                        scriptName: us.script.name,
                        userId: us.user_id,
                        symbol,
                        timeframe,
                        action: 'SYNC_CLOSE',
                        tradeId: openTrade.id,
                        executed: true,
                        reason: 'Position closed externally on exchange (SL/TP or manual)',
                      })
                    }
                  }

                  // If all trades were closed externally, allow new entry evaluation below
                  if (anyClosedExternally) {
                    // Re-check if any trades are still actually open after sync
                    const { data: stillOpenTrades } = await supabase
                      .from('trades')
                      .select('id')
                      .eq('user_id', us.user_id)
                      .eq('script_id', us.script_id)
                      .eq('symbol', symbol)
                      .eq('status', 'OPEN')
                    
                    if (!stillOpenTrades || stillOpenTrades.length === 0) {
                      console.log(`[ENGINE] All positions synced/closed. Proceeding to evaluate new entry.`)
                      // Fall through to entry evaluation below
                    } else {
                      console.log(`[ENGINE] Some positions still open after sync, checking exit conditions`)
                      // Continue with exit condition check on remaining open trades
                    }
                  }

                  // Re-fetch open trades after sync
                  const { data: remainingOpenTrades } = await supabase
                    .from('trades')
                    .select('id, user_id, script_id, symbol, signal_type, entry_price')
                    .eq('user_id', us.user_id)
                    .eq('script_id', us.script_id)
                    .eq('symbol', symbol)
                    .eq('status', 'OPEN')

                  if (remainingOpenTrades && remainingOpenTrades.length > 0) {
                    console.log(`[ENGINE] ${remainingOpenTrades.length} trade(s) still open, checking exit conditions`)
                    
                    const exitResult = evaluateExitConditions(strategy, indicators, ohlcv, currentPrice)
                    
                    if (exitResult.shouldExit) {
                      console.log(`[ENGINE] EXIT signal detected: ${exitResult.reason}`)
                      for (const openTrade of remainingOpenTrades) {
                        const closeResult = await closeOpenTrade(
                          supabase,
                          openTrade,
                          currentPrice,
                          scriptMarketType,
                          exitResult.reason
                        )
                        results.push({
                          scriptId: us.script_id,
                          scriptName: us.script.name,
                          userId: us.user_id,
                          symbol,
                          timeframe,
                          action: 'CLOSE',
                          tradeId: openTrade.id,
                          executed: closeResult.success,
                          error: closeResult.error,
                          reason: exitResult.reason,
                        })
                      }
                      // After closing, allow new entry evaluation for bidirectional strategies
                      if (strategy.direction === 'both') {
                        console.log(`[ENGINE] Bidirectional strategy: evaluating new entry after close`)
                        // Fall through to entry evaluation below
                      } else {
                        continue
                      }
                    } else {
                      console.log(`[ENGINE] Open trade exists, exit conditions not met — skipping entry`)
                      results.push({
                        scriptId: us.script_id,
                        scriptName: us.script.name,
                        userId: us.user_id,
                        symbol,
                        timeframe,
                        executed: false,
                        reason: 'Open trade exists, exit conditions not yet met',
                      })
                      continue // Don't open another trade while one is already open
                    }
                  }
                  // If no remaining open trades, fall through to entry evaluation
                }

                // ===== CHECK FOR REPEATED FAILURES (circuit breaker - per user) =====
                // Only check failures from the last 2 hours to avoid stale errors from old API keys
                const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                const { data: recentFails } = await supabase
                  .from('trades')
                  .select('id, error_message, created_at')
                  .eq('user_id', us.user_id)
                  .eq('status', 'FAILED')
                  .gte('created_at', twoHoursAgo)
                  .order('created_at', { ascending: false })
                  .limit(3)
                
                const apiPermissionErrors = (recentFails || []).filter(
                  (t: any) => t.error_message?.includes('Invalid API-key') || t.error_message?.includes('permissions for action')
                )
                
                if (apiPermissionErrors.length >= 3) {
                  // Check if the user updated their wallet AFTER the most recent failure
                  // If so, they've likely fixed the issue — skip the circuit breaker
                  const lastFailTime = apiPermissionErrors[0]?.created_at
                  const { data: userWallet } = await supabase
                    .from('wallets')
                    .select('updated_at, created_at')
                    .eq('user_id', us.user_id)
                    .eq('is_active', true)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                  
                  const walletUpdatedAt = userWallet?.updated_at || userWallet?.created_at
                  const walletUpdatedAfterFail = walletUpdatedAt && lastFailTime && new Date(walletUpdatedAt) > new Date(lastFailTime)
                  
                  if (!walletUpdatedAfterFail) {
                    console.log(`[ENGINE] Circuit breaker for user ${us.user_id}: 3+ API failures in last 2h, wallet not updated since. Skipping.`)
                    results.push({
                      scriptId: us.script_id,
                      scriptName: us.script.name,
                      userId: us.user_id,
                      symbol,
                      timeframe,
                      executed: false,
                      error: 'Trading paused: Binance API key has issues (invalid key, IP, or permissions). Please go to Binance → API Management → Edit and ensure: 1) Enable Futures, 2) Enable Spot & Margin Trading, 3) Enable Reading, 4) Set IP Access to "Unrestricted (Less Secure)".',
                    })
                    continue
                  } else {
                    console.log(`[ENGINE] Circuit breaker reset for user ${us.user_id}: wallet updated after last failure. Allowing retry.`)
                  }
                }

                // ===== EVALUATE ENTRY =====
                // Pass bot_started_at so the engine ignores signals from candles before bot was enabled
                const botStartedAt = (us.settings_json?.bot_started_at as string | undefined) || undefined
                if (botStartedAt) {
                  console.log(`[ENGINE] bot_started_at for user ${us.user_id}: ${botStartedAt}`)
                }
                const signal = evaluateStrategy(strategy, indicators, ohlcv, currentPrice, botStartedAt)
                
                if (signal.action !== 'NONE') {
                  console.log(`[ENGINE] Signal: ${signal.action} ${symbol} @ ${signal.price}`)
                  const execResult = await executeTrade(
                    supabase,
                    us.user_id,
                    us.script_id,
                    signal,
                    symbol,
                    timeframe,
                    scriptMarketType,
                    scriptLeverage
                  )
                  
                  results.push({
                    scriptId: us.script_id,
                    scriptName: us.script.name,
                    userId: us.user_id,
                    symbol,
                    timeframe,
                    signal,
                    executed: execResult.success,
                    error: execResult.error,
                    tradeId: execResult.tradeId,
                  })
                } else {
                  results.push({
                    scriptId: us.script_id,
                    scriptName: us.script.name,
                    userId: us.user_id,
                    symbol,
                    timeframe,
                    signal,
                    executed: false,
                    reason: signal.reason,
                  })
                }
              } catch (scriptErr) {
                console.error(`[ENGINE] Script error:`, scriptErr)
                results.push({
                  scriptId: us.script_id,
                  scriptName: us.script.name,
                  userId: us.user_id,
                  symbol,
                  error: scriptErr instanceof Error ? scriptErr.message : 'Script evaluation failed',
                })
              }
            }
          } catch (symbolErr) {
            console.error(`[ENGINE] Symbol error for ${symbol}:`, symbolErr)
            results.push({
              symbol,
              error: symbolErr instanceof Error ? symbolErr.message : 'Symbol processing failed',
            })
          }
        }
        
        console.log(`[ENGINE] Run complete. Processed ${results.length} results.`)
        
        return new Response(
          JSON.stringify({ 
            processed: results.length,
            results,
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      case 'close-all': {
        // Close all OPEN/PENDING trades for a user (optionally filtered by script_id)
        // Also closes positions on Binance
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Get user from JWT
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !authUser) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const closeBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
        const scriptIdFilter = closeBody.script_id || null
        const userId = authUser.id

        console.log(`[CLOSE-ALL] User ${userId}, scriptFilter=${scriptIdFilter}`)

        // Get open trades
        let tradesQuery = supabase
          .from('trades')
          .select('id, user_id, script_id, symbol, signal_type, entry_price, timeframe')
          .eq('user_id', userId)
          .in('status', ['OPEN', 'PENDING'])

        if (scriptIdFilter) {
          tradesQuery = tradesQuery.eq('script_id', scriptIdFilter)
        }

        const { data: openTrades, error: tradesErr } = await tradesQuery

        if (tradesErr) {
          return new Response(JSON.stringify({ error: tradesErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (!openTrades || openTrades.length === 0) {
          return new Response(JSON.stringify({ closed: 0, message: 'No open trades to close' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        console.log(`[CLOSE-ALL] Found ${openTrades.length} open trade(s) to close`)

        // Get the script's market_type for each trade
        const scriptIds = [...new Set(openTrades.map(t => t.script_id).filter(Boolean))]
        const { data: scripts } = await supabase
          .from('pine_scripts')
          .select('id, market_type')
          .in('id', scriptIds)

        const scriptMap: Record<string, string> = {}
        for (const s of (scripts || [])) {
          scriptMap[s.id] = s.market_type || 'futures'
        }

        const closeResults: any[] = []
        for (const trade of openTrades) {
          const marketType = trade.script_id ? (scriptMap[trade.script_id] || 'futures') : 'futures'
          const currentPrice = await getCurrentPrice(trade.symbol).catch(() => 0)
          const result = await closeOpenTrade(supabase, trade as any, currentPrice, marketType, 'Manual close by user')
          closeResults.push({ tradeId: trade.id, symbol: trade.symbol, ...result })
        }

        const successCount = closeResults.filter(r => r.success).length
        console.log(`[CLOSE-ALL] Closed ${successCount}/${openTrades.length} trades`)

        return new Response(
          JSON.stringify({ closed: successCount, total: openTrades.length, results: closeResults }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'parse': {
        const body = await req.json()
        const { scriptContent } = body
        
        if (!scriptContent) {
          return new Response(
            JSON.stringify({ error: 'Missing scriptContent' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        const strategy = parsePineScript(scriptContent)
        
        return new Response(
          JSON.stringify({ strategy }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      case 'indicators': {
        const symbol = url.searchParams.get('symbol') || 'BTCUSDT'
        const timeframe = url.searchParams.get('timeframe') || '1h'
        
        const ohlcv = await fetchOHLCV(symbol, timeframe, 200)
        const indicators = calculateAllIndicators(ohlcv)
        const currentPrice = await getCurrentPrice(symbol)
        
        return new Response(
          JSON.stringify({
            symbol,
            timeframe,
            currentPrice,
            lastCandle: ohlcv[ohlcv.length - 1],
            indicators: {
              ema: {
                9: indicators.ema[9]?.slice(-5),
                21: indicators.ema[21]?.slice(-5),
                50: indicators.ema[50]?.slice(-5),
              },
              sma: {
                20: indicators.sma[20]?.slice(-5),
                50: indicators.sma[50]?.slice(-5),
              },
              rsi: indicators.rsi[14]?.slice(-5),
              macd: {
                macd: indicators.macd.macd.slice(-5),
                signal: indicators.macd.signal.slice(-5),
                histogram: indicators.macd.histogram.slice(-5),
              },
              bb: {
                upper: indicators.bb.upper.slice(-5),
                middle: indicators.bb.middle.slice(-5),
                lower: indicators.bb.lower.slice(-5),
              },
              atr: indicators.atr[14]?.slice(-5),
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
    
  } catch (err) {
    console.error('[ENGINE] Fatal error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
