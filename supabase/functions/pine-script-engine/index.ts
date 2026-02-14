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

async function fetchOHLCV(symbol: string, interval: string, limit: number = 100): Promise<OHLCV[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  console.log(`[ENGINE] Fetching OHLCV: ${symbol} ${interval} limit=${limit}`)
  
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
  const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
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
  
  return calculateSMA(trueRanges, period)
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
      } else if (prevDir === 1 && close < upper[i]) {
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
  
  return {
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
    
    if (!strategy.stopLoss) {
      strategy.stopLoss = { type: 'percent', value: 2 }
    }
    if (!strategy.takeProfit) {
      strategy.takeProfit = { type: 'percent', value: 4 }
    }
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
    return Math.min(index, arr.length - 1)
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
  currentPrice: number
): TradeSignal {
  const lastIndex = ohlcv.length - 1
  
  console.log(`[EVAL] Evaluating ${strategy.entryConditions.length} entry conditions at price ${currentPrice}`)
  
  // Scan last 5 candles to catch signals (critical for 1m timeframe)
  const scanDepth = Math.min(5, lastIndex)
  let shouldEnter = false
  let signalIndex = lastIndex
  
  for (let checkIdx = lastIndex; checkIdx > lastIndex - scanDepth; checkIdx--) {
    if (checkIdx < 1) break
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
  
  // Determine direction
  const action: 'BUY' | 'SELL' = strategy.direction === 'short' ? 'SELL' : 'BUY'
  
  // Calculate stop loss
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
  
  // Calculate take profit
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
    reason: `Entry conditions met: ${strategy.entryConditions.map(c => 
      `${typeof c.indicator1 === 'object' ? c.indicator1.name + (c.indicator1.period ? `(${c.indicator1.period})` : '') : c.indicator1} ${c.type} ${typeof c.indicator2 === 'object' ? c.indicator2.name + (c.indicator2.period ? `(${c.indicator2.period})` : '') : c.indicator2}`
    ).join(', ')}`,
  }
}

// ============================================
// TRADE EXECUTION (with comprehensive safety)
// ============================================

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
    const isSpot = marketType === 'spot'
    const isCoinM = marketType === 'coin_margin'
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
        const pos = positions.find((p: any) => p.symbol === trade.symbol && parseFloat(p.positionAmt) !== 0)
        if (pos) {
          closeQty = Math.abs(parseFloat(pos.positionAmt)).toString()
        }
      } else {
        // USDT-M futures
        const positions = await binanceRequest('/fapi/v2/positionRisk', keys.api_key_encrypted, keys.api_secret_encrypted, 'GET', {}, true)
        const pos = positions.find((p: any) => p.symbol === trade.symbol && parseFloat(p.positionAmt) !== 0)
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

    // For futures, add reduceOnly
    if (!isSpot) {
      orderParams.reduceOnly = 'true'
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
    // Still mark as closed in DB to prevent stuck trades
    await supabase.from('trades').update({
      status: 'CLOSED',
      exit_price: currentPrice,
      closed_at: new Date().toISOString(),
      error_message: `Auto-close failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
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
      .select('coins, bot_enabled, free_trades_remaining')
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
    
    // Check credits
    const freeTradesLeft = profile.free_trades_remaining ?? 0
    const coins = profile.coins ?? 0
    
    if (freeTradesLeft <= 0 && coins <= 0) {
      console.log(`[TRADE] No credits: free=${freeTradesLeft}, coins=${coins}`)
      return { success: false, error: 'No free trades or coins remaining' }
    }
    
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
    
    // Deduct credit
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
      // Refund credit
      if (freeTradesLeft > 0) {
        await supabase.from('profiles').update({ free_trades_remaining: freeTradesLeft }).eq('user_id', userId)
      } else {
        await supabase.from('profiles').update({ coins: coins }).eq('user_id', userId)
      }
      return { success: false, error: 'Failed to create trade record' }
    }
    
    console.log(`[TRADE] Trade record created: ${trade.id}`)
    
    try {
      // Determine API routing based on market type
      const isSpot = marketType === 'spot'
      const isCoinM = marketType === 'coin_margin'
      const isFutures = !isSpot // USDT-M or Coin-M are both futures
      
      console.log(`[TRADE] Market type: ${marketType}, leverage: ${leverage}, isFutures: ${isFutures}`)
      
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
      
      // For coin-M, we need special handling of the base URL
      const orderResult = isCoinM
        ? await binanceCoinMRequest(orderEndpoint, apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
            symbol: symbol,
            side: signal.action,
            type: 'MARKET',
            quantity: quantity,
          })
        : await binanceRequest(orderEndpoint, apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
            symbol: symbol,
            side: signal.action,
            type: 'MARKET',
            quantity: quantity,
          }, useFuturesBase)
      
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
          if (isSpot) {
            await binanceRequest('/api/v3/order', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
              symbol: symbol,
              side: signal.action === 'BUY' ? 'SELL' : 'BUY',
              type: 'STOP_LOSS_LIMIT',
              quantity: quantity,
              stopPrice: signal.stopLoss.toFixed(2),
              price: (signal.stopLoss * (signal.action === 'BUY' ? 0.995 : 1.005)).toFixed(2),
              timeInForce: 'GTC',
            })
          } else {
            const slEndpoint = isCoinM ? '/dapi/v1/order' : '/fapi/v1/order'
            const slFn = isCoinM ? binanceCoinMRequest : (ep: string, ak: string, as2: string, m: string, p: any) => binanceRequest(ep, ak, as2, m, p, true)
            await slFn(slEndpoint, apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
              symbol: symbol,
              side: signal.action === 'BUY' ? 'SELL' : 'BUY',
              type: 'STOP_MARKET',
              quantity: quantity,
              stopPrice: signal.stopLoss.toFixed(2),
              closePosition: 'false',
            })
          }
          console.log(`[TRADE] Stop loss placed at ${signal.stopLoss.toFixed(2)}`)
        } catch (slError) {
          console.log('[TRADE] Stop loss order failed (non-critical):', slError)
        }
      }
      
      // ===== TAKE PROFIT =====
      if (signal.takeProfit) {
        try {
          if (isSpot) {
            await binanceRequest('/api/v3/order', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
              symbol: symbol,
              side: signal.action === 'BUY' ? 'SELL' : 'BUY',
              type: 'TAKE_PROFIT_LIMIT',
              quantity: quantity,
              stopPrice: signal.takeProfit.toFixed(2),
              price: (signal.takeProfit * (signal.action === 'BUY' ? 1.005 : 0.995)).toFixed(2),
              timeInForce: 'GTC',
            })
          } else {
            const tpEndpoint = isCoinM ? '/dapi/v1/order' : '/fapi/v1/order'
            const tpFn = isCoinM ? binanceCoinMRequest : (ep: string, ak: string, as2: string, m: string, p: any) => binanceRequest(ep, ak, as2, m, p, true)
            await tpFn(tpEndpoint, apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
              symbol: symbol,
              side: signal.action === 'BUY' ? 'SELL' : 'BUY',
              type: 'TAKE_PROFIT_MARKET',
              quantity: quantity,
              stopPrice: signal.takeProfit.toFixed(2),
              closePosition: 'false',
            })
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
      
      // Refund credit
      if (freeTradesLeft > 0) {
        await supabase.from('profiles').update({ free_trades_remaining: freeTradesLeft }).eq('user_id', userId)
      } else {
        await supabase.from('profiles').update({ coins: coins }).eq('user_id', userId)
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
        const signal = evaluateStrategy(strategy, indicators, ohlcv, currentPrice)
        
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
            }
          }),
          ...(createdScripts || []).map((s: any) => ({
            script_id: s.id,
            user_id: s.created_by,
            script: s,
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
                const scriptMarketType = us.script.market_type || 'futures'
                const scriptLeverage = us.script.leverage || 1

                // ===== CHECK FOR OPEN TRADES TO CLOSE =====
                const { data: openTrades } = await supabase
                  .from('trades')
                  .select('id, user_id, script_id, symbol, signal_type, entry_price')
                  .eq('user_id', us.user_id)
                  .eq('script_id', us.script_id)
                  .eq('symbol', symbol)
                  .eq('status', 'OPEN')

                if (openTrades && openTrades.length > 0) {
                  console.log(`[ENGINE] Found ${openTrades.length} open trade(s) for user ${us.user_id}, checking exit conditions`)
                  
                  const exitResult = evaluateExitConditions(strategy, indicators, ohlcv, currentPrice)
                  
                  if (exitResult.shouldExit) {
                    console.log(`[ENGINE] EXIT signal detected: ${exitResult.reason}`)
                    for (const openTrade of openTrades) {
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
                    continue // Don't open new trade on same candle as close
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

                // ===== EVALUATE ENTRY =====
                const signal = evaluateStrategy(strategy, indicators, ohlcv, currentPrice)
                
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
