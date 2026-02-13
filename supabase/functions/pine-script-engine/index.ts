import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  type: 'crossover' | 'crossunder' | 'above' | 'below' | 'equals'
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
  name: 'ema' | 'sma' | 'rsi' | 'macd' | 'macd_signal' | 'macd_histogram' | 'bb_upper' | 'bb_lower' | 'bb_middle' | 'close' | 'open' | 'high' | 'low' | 'atr'
  period?: number
}

interface StopLossConfig {
  type: 'percent' | 'atr' | 'fixed'
  value: number
}

interface TakeProfitConfig {
  type: 'percent' | 'atr' | 'fixed' | 'rr'  // rr = risk-reward ratio
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

function createSignature(queryString: string, apiSecret: string): string {
  const hmac = createHmac('sha256', apiSecret)
  hmac.update(queryString)
  return hmac.digest('hex')
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

// Fetch public kline data (no auth needed)
async function fetchOHLCV(symbol: string, interval: string, limit: number = 100): Promise<OHLCV[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch OHLCV data: ${response.status}`)
  }
  
  const data = await response.json()
  
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

// Fetch current price
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
  const ema: number[] = []
  const multiplier = 2 / (period + 1)
  
  // First EMA is SMA
  let sum = 0
  for (let i = 0; i < period && i < prices.length; i++) {
    sum += prices[i]
  }
  ema.push(sum / Math.min(period, prices.length))
  
  for (let i = period; i < prices.length; i++) {
    const value = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]
    ema.push(value)
  }
  
  return ema
}

function calculateSMA(prices: number[], period: number): number[] {
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
  
  const macdLine: number[] = []
  const offset = slowPeriod - fastPeriod
  
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i])
  }
  
  const signalLine = calculateEMA(macdLine, signalPeriod)
  const histogram: number[] = []
  
  const signalOffset = signalPeriod - 1
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + signalOffset] - signalLine[i])
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
  }
}

// ============================================
// PINE SCRIPT PARSER
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
  
  const lines = scriptContent.split('\n').map(l => l.trim().toLowerCase())
  
  // Parse direction
  if (scriptContent.toLowerCase().includes('strategy.long') || scriptContent.toLowerCase().includes('direction.long')) {
    strategy.direction = 'long'
  } else if (scriptContent.toLowerCase().includes('strategy.short') || scriptContent.toLowerCase().includes('direction.short')) {
    strategy.direction = 'short'
  }
  
  // Parse entry conditions
  const entryPatterns = [
    // EMA crossovers
    { pattern: /ta\.crossover\s*\(\s*ema\s*\(\s*close\s*,\s*(\d+)\s*\)\s*,\s*ema\s*\(\s*close\s*,\s*(\d+)\s*\)\s*\)/gi, type: 'crossover' as const },
    { pattern: /crossover\s*\(\s*ema(\d+)\s*,\s*ema(\d+)\s*\)/gi, type: 'crossover' as const },
    { pattern: /ema\s*\(\s*close\s*,\s*(\d+)\s*\)\s*>\s*ema\s*\(\s*close\s*,\s*(\d+)\s*\)/gi, type: 'above' as const },
    // SMA crossovers
    { pattern: /ta\.crossover\s*\(\s*sma\s*\(\s*close\s*,\s*(\d+)\s*\)\s*,\s*sma\s*\(\s*close\s*,\s*(\d+)\s*\)\s*\)/gi, type: 'crossover' as const },
    // RSI conditions
    { pattern: /rsi\s*<\s*(\d+)/gi, type: 'rsi_below' as const },
    { pattern: /rsi\s*>\s*(\d+)/gi, type: 'rsi_above' as const },
    // MACD crossovers
    { pattern: /ta\.crossover\s*\(\s*macd\s*,\s*signal\s*\)/gi, type: 'macd_cross_up' as const },
    { pattern: /ta\.crossunder\s*\(\s*macd\s*,\s*signal\s*\)/gi, type: 'macd_cross_down' as const },
    { pattern: /macd\s*>\s*signal/gi, type: 'macd_above_signal' as const },
    { pattern: /macd\s*<\s*signal/gi, type: 'macd_below_signal' as const },
    // Price vs indicators
    { pattern: /close\s*>\s*ema\s*\(\s*close\s*,\s*(\d+)\s*\)/gi, type: 'price_above_ema' as const },
    { pattern: /close\s*<\s*ema\s*\(\s*close\s*,\s*(\d+)\s*\)/gi, type: 'price_below_ema' as const },
    // Bollinger Bands
    { pattern: /close\s*<\s*bb\.lower/gi, type: 'bb_lower_touch' as const },
    { pattern: /close\s*>\s*bb\.upper/gi, type: 'bb_upper_touch' as const },
  ]
  
  for (const { pattern, type } of entryPatterns) {
    let match
    while ((match = pattern.exec(scriptContent)) !== null) {
      switch (type) {
        case 'crossover':
          strategy.entryConditions.push({
            type: 'crossover',
            indicator1: { name: 'ema', period: parseInt(match[1]) },
            indicator2: { name: 'ema', period: parseInt(match[2]) },
            logic: 'and',
          })
          break
        case 'above':
          strategy.entryConditions.push({
            type: 'above',
            indicator1: { name: 'ema', period: parseInt(match[1]) },
            indicator2: { name: 'ema', period: parseInt(match[2]) },
            logic: 'and',
          })
          break
        case 'rsi_below':
          strategy.entryConditions.push({
            type: 'below',
            indicator1: { name: 'rsi', period: 14 },
            indicator2: parseInt(match[1]),
            logic: 'and',
          })
          break
        case 'rsi_above':
          strategy.entryConditions.push({
            type: 'above',
            indicator1: { name: 'rsi', period: 14 },
            indicator2: parseInt(match[1]),
            logic: 'and',
          })
          break
        case 'macd_cross_up':
        case 'macd_above_signal':
          strategy.entryConditions.push({
            type: type === 'macd_cross_up' ? 'crossover' : 'above',
            indicator1: { name: 'macd' },
            indicator2: { name: 'macd_signal' },
            logic: 'and',
          })
          break
        case 'macd_cross_down':
        case 'macd_below_signal':
          strategy.entryConditions.push({
            type: type === 'macd_cross_down' ? 'crossunder' : 'below',
            indicator1: { name: 'macd' },
            indicator2: { name: 'macd_signal' },
            logic: 'and',
          })
          break
        case 'price_above_ema':
          strategy.entryConditions.push({
            type: 'above',
            indicator1: { name: 'close' },
            indicator2: { name: 'ema', period: parseInt(match[1]) },
            logic: 'and',
          })
          break
        case 'price_below_ema':
          strategy.entryConditions.push({
            type: 'below',
            indicator1: { name: 'close' },
            indicator2: { name: 'ema', period: parseInt(match[1]) },
            logic: 'and',
          })
          break
        case 'bb_lower_touch':
          strategy.entryConditions.push({
            type: 'below',
            indicator1: { name: 'close' },
            indicator2: { name: 'bb_lower' },
            logic: 'and',
          })
          break
        case 'bb_upper_touch':
          strategy.entryConditions.push({
            type: 'above',
            indicator1: { name: 'close' },
            indicator2: { name: 'bb_upper' },
            logic: 'and',
          })
          break
      }
    }
  }
  
  // Parse stop loss
  const slMatch = scriptContent.match(/stop_?loss\s*[=:]\s*([\d.]+)\s*%?/i) || 
                  scriptContent.match(/sl\s*[=:]\s*([\d.]+)\s*%?/i) ||
                  scriptContent.match(/strategy\.exit.*stop\s*=\s*close\s*\*\s*\(1\s*-\s*([\d.]+)\)/i)
  if (slMatch) {
    const value = parseFloat(slMatch[1])
    strategy.stopLoss = {
      type: 'percent',
      value: value > 1 ? value : value * 100, // Convert to percentage if decimal
    }
  }
  
  // ATR-based stop loss
  const atrSlMatch = scriptContent.match(/stop_?loss\s*=.*atr\s*\*\s*([\d.]+)/i)
  if (atrSlMatch) {
    strategy.stopLoss = {
      type: 'atr',
      value: parseFloat(atrSlMatch[1]),
    }
  }
  
  // Parse take profit
  const tpMatch = scriptContent.match(/take_?profit\s*[=:]\s*([\d.]+)\s*%?/i) ||
                  scriptContent.match(/tp\s*[=:]\s*([\d.]+)\s*%?/i) ||
                  scriptContent.match(/strategy\.exit.*limit\s*=\s*close\s*\*\s*\(1\s*\+\s*([\d.]+)\)/i)
  if (tpMatch) {
    const value = parseFloat(tpMatch[1])
    strategy.takeProfit = {
      type: 'percent',
      value: value > 1 ? value : value * 100,
    }
  }
  
  // Risk-reward ratio
  const rrMatch = scriptContent.match(/risk_?reward\s*[=:]\s*([\d.]+)/i) ||
                  scriptContent.match(/rr\s*[=:]\s*([\d.]+)/i)
  if (rrMatch && strategy.stopLoss) {
    strategy.takeProfit = {
      type: 'rr',
      value: parseFloat(rrMatch[1]),
    }
  }
  
  // If no conditions parsed, add default EMA crossover strategy
  if (strategy.entryConditions.length === 0) {
    // Default: EMA 9 crosses above EMA 21
    strategy.entryConditions.push({
      type: 'crossover',
      indicator1: { name: 'ema', period: 9 },
      indicator2: { name: 'ema', period: 21 },
      logic: 'and',
    })
    
    // Default stop loss: 2%
    if (!strategy.stopLoss) {
      strategy.stopLoss = { type: 'percent', value: 2 }
    }
    
    // Default take profit: 4%
    if (!strategy.takeProfit) {
      strategy.takeProfit = { type: 'percent', value: 4 }
    }
  }
  
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
  
  const adjustedIndex = (arr: number[]) => Math.min(index, arr.length - 1)
  
  switch (ref.name) {
    case 'close':
      return ohlcv[index]?.close ?? null
    case 'open':
      return ohlcv[index]?.open ?? null
    case 'high':
      return ohlcv[index]?.high ?? null
    case 'low':
      return ohlcv[index]?.low ?? null
    case 'ema':
      const emaPeriod = ref.period || 21
      const emaArr = indicators.ema[emaPeriod]
      if (!emaArr || emaArr.length === 0) return null
      return emaArr[adjustedIndex(emaArr)]
    case 'sma':
      const smaPeriod = ref.period || 20
      const smaArr = indicators.sma[smaPeriod]
      if (!smaArr || smaArr.length === 0) return null
      return smaArr[adjustedIndex(smaArr)]
    case 'rsi':
      const rsiArr = indicators.rsi[14]
      if (!rsiArr || rsiArr.length === 0) return null
      return rsiArr[adjustedIndex(rsiArr)]
    case 'macd':
      if (indicators.macd.macd.length === 0) return null
      return indicators.macd.macd[adjustedIndex(indicators.macd.macd)]
    case 'macd_signal':
      if (indicators.macd.signal.length === 0) return null
      return indicators.macd.signal[adjustedIndex(indicators.macd.signal)]
    case 'macd_histogram':
      if (indicators.macd.histogram.length === 0) return null
      return indicators.macd.histogram[adjustedIndex(indicators.macd.histogram)]
    case 'bb_upper':
      if (indicators.bb.upper.length === 0) return null
      return indicators.bb.upper[adjustedIndex(indicators.bb.upper)]
    case 'bb_lower':
      if (indicators.bb.lower.length === 0) return null
      return indicators.bb.lower[adjustedIndex(indicators.bb.lower)]
    case 'bb_middle':
      if (indicators.bb.middle.length === 0) return null
      return indicators.bb.middle[adjustedIndex(indicators.bb.middle)]
    case 'atr':
      const atrArr = indicators.atr[14]
      if (!atrArr || atrArr.length === 0) return null
      return atrArr[adjustedIndex(atrArr)]
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
  
  if (val1Current === null || val2Current === null) return false
  
  switch (condition.type) {
    case 'crossover': {
      const val1Prev = getIndicatorValue(condition.indicator1, indicators, ohlcv, currentIndex - 1)
      const val2Prev = getIndicatorValue(condition.indicator2, indicators, ohlcv, currentIndex - 1)
      if (val1Prev === null || val2Prev === null) return false
      return val1Prev <= val2Prev && val1Current > val2Current
    }
    case 'crossunder': {
      const val1Prev = getIndicatorValue(condition.indicator1, indicators, ohlcv, currentIndex - 1)
      const val2Prev = getIndicatorValue(condition.indicator2, indicators, ohlcv, currentIndex - 1)
      if (val1Prev === null || val2Prev === null) return false
      return val1Prev >= val2Prev && val1Current < val2Current
    }
    case 'above':
      return val1Current > val2Current
    case 'below':
      return val1Current < val2Current
    case 'equals':
      return Math.abs(val1Current - val2Current) < 0.0001
    default:
      return false
  }
}

function evaluateStrategy(
  strategy: ParsedStrategy,
  indicators: IndicatorValues,
  ohlcv: OHLCV[],
  currentPrice: number
): TradeSignal {
  const lastIndex = ohlcv.length - 1
  
  // Check entry conditions
  let shouldEnter = strategy.entryConditions.length > 0
  
  for (const condition of strategy.entryConditions) {
    const result = evaluateCondition(condition, indicators, ohlcv, lastIndex)
    if (condition.logic === 'and') {
      shouldEnter = shouldEnter && result
    } else {
      shouldEnter = shouldEnter || result
    }
  }
  
  if (!shouldEnter) {
    return { action: 'NONE', price: currentPrice, reason: 'No entry conditions met' }
  }
  
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
      case 'atr':
        const atr = getIndicatorValue({ name: 'atr', period: 14 }, indicators, ohlcv, lastIndex)
        if (atr) {
          stopLoss = action === 'BUY'
            ? currentPrice - (atr * strategy.stopLoss.value)
            : currentPrice + (atr * strategy.stopLoss.value)
        }
        break
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
      case 'atr':
        const atr = getIndicatorValue({ name: 'atr', period: 14 }, indicators, ohlcv, lastIndex)
        if (atr) {
          takeProfit = action === 'BUY'
            ? currentPrice + (atr * strategy.takeProfit.value)
            : currentPrice - (atr * strategy.takeProfit.value)
        }
        break
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
      `${typeof c.indicator1 === 'object' ? c.indicator1.name : c.indicator1} ${c.type} ${typeof c.indicator2 === 'object' ? c.indicator2.name : c.indicator2}`
    ).join(', ')}`,
  }
}

// ============================================
// TRADE EXECUTION
// ============================================

async function executeTrade(
  supabase: any,
  userId: string,
  scriptId: string,
  signal: TradeSignal,
  symbol: string,
  timeframe: string
): Promise<{ success: boolean; error?: string; tradeId?: string }> {
  try {
    // Get user profile to check coins and free trades
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins, bot_enabled, free_trades_remaining')
      .eq('user_id', userId)
      .single()
    
    if (profileError || !profile) {
      return { success: false, error: 'Failed to fetch user profile' }
    }
    
    if (!profile.bot_enabled) {
      return { success: false, error: 'Bot is disabled' }
    }
    
    // Check if user has free trades OR coins available
    const hasFreeTradesLeft = (profile.free_trades_remaining ?? 0) > 0
    const hasCoins = profile.coins > 0
    
    if (!hasFreeTradesLeft && !hasCoins) {
      return { success: false, error: 'No free trades or coins remaining' }
    }
    
    // Check for duplicate trade on same candle
    const candleTimestamp = new Date()
    candleTimestamp.setMinutes(0, 0, 0)
    
    const { data: existingTrade } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', userId)
      .eq('script_id', scriptId)
      .eq('symbol', symbol)
      .gte('created_at', candleTimestamp.toISOString())
      .maybeSingle()
    
    if (existingTrade) {
      return { success: false, error: 'Duplicate trade on same candle' }
    }
    
    // Get user's API keys
    const { data: apiKeys, error: keysError } = await supabase
      .from('exchange_keys')
      .select('api_key_encrypted, api_secret_encrypted')
      .eq('user_id', userId)
      .eq('exchange', 'binance')
      .eq('is_active', true)
      .maybeSingle()
    
    if (keysError || !apiKeys) {
      return { success: false, error: 'No Binance API keys configured' }
    }
    
    // Deduct free trade first, then coins
    if (hasFreeTradesLeft) {
      await supabase
        .from('profiles')
        .update({ free_trades_remaining: (profile.free_trades_remaining ?? 0) - 1 })
        .eq('user_id', userId)
    } else {
      await supabase
        .from('profiles')
        .update({ coins: profile.coins - 1 })
        .eq('user_id', userId)
    }
    
    // Create pending trade record
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: userId,
        script_id: scriptId,
        symbol,
        timeframe,
        signal_type: signal.action,
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
      // Refund: free trade or coin
      if (hasFreeTradesLeft) {
        await supabase
          .from('profiles')
          .update({ free_trades_remaining: (profile.free_trades_remaining ?? 0) })
          .eq('user_id', userId)
      } else {
        await supabase
          .from('profiles')
          .update({ coins: profile.coins })
          .eq('user_id', userId)
      }
      return { success: false, error: 'Failed to create trade record' }
    }
    
    try {
      // Calculate quantity (using USDT balance)
      const accountInfo = await binanceRequest('/api/v3/account', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted)
      const usdtBalance = accountInfo.balances.find((b: any) => b.asset === 'USDT')
      const availableUSDT = parseFloat(usdtBalance?.free || '0')
      
      // Use 10% of available balance per trade
      const tradeAmount = availableUSDT * 0.1
      const quantity = (tradeAmount / signal.price).toFixed(6)
      
      if (parseFloat(quantity) <= 0) {
        throw new Error('Insufficient USDT balance')
      }
      
      // Place the order
      const orderParams: Record<string, string> = {
        symbol: symbol,
        side: signal.action,
        type: 'MARKET',
        quantity: quantity,
      }
      
      const orderResult = await binanceRequest('/api/v3/order', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', orderParams)
      
      // Update trade with execution details
      await supabase
        .from('trades')
        .update({
          status: 'OPEN',
          entry_price: parseFloat(orderResult.fills?.[0]?.price || signal.price),
          opened_at: new Date().toISOString(),
          coin_consumed: true,
        })
        .eq('id', trade.id)
      
      // Place stop loss order if specified
      if (signal.stopLoss) {
        try {
          await binanceRequest('/api/v3/order', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
            symbol: symbol,
            side: signal.action === 'BUY' ? 'SELL' : 'BUY',
            type: 'STOP_LOSS_LIMIT',
            quantity: quantity,
            stopPrice: signal.stopLoss.toFixed(2),
            price: (signal.stopLoss * 0.995).toFixed(2),
            timeInForce: 'GTC',
          })
        } catch (slError) {
          console.log('Stop loss order failed:', slError)
        }
      }
      
      // Place take profit order if specified
      if (signal.takeProfit) {
        try {
          await binanceRequest('/api/v3/order', apiKeys.api_key_encrypted, apiKeys.api_secret_encrypted, 'POST', {
            symbol: symbol,
            side: signal.action === 'BUY' ? 'SELL' : 'BUY',
            type: 'TAKE_PROFIT_LIMIT',
            quantity: quantity,
            stopPrice: signal.takeProfit.toFixed(2),
            price: (signal.takeProfit * 1.005).toFixed(2),
            timeInForce: 'GTC',
          })
        } catch (tpError) {
          console.log('Take profit order failed:', tpError)
        }
      }
      
      return { success: true, tradeId: trade.id }
      
    } catch (execError) {
      // Update trade as failed
      await supabase
        .from('trades')
        .update({
          status: 'FAILED',
          error_message: execError instanceof Error ? execError.message : 'Unknown error',
        })
        .eq('id', trade.id)
      
      // Refund: free trade or coin
      if (hasFreeTradesLeft) {
        await supabase
          .from('profiles')
          .update({ free_trades_remaining: (profile.free_trades_remaining ?? 0) })
          .eq('user_id', userId)
      } else {
        await supabase
          .from('profiles')
          .update({ coins: profile.coins })
          .eq('user_id', userId)
      }
      
      return { success: false, error: execError instanceof Error ? execError.message : 'Trade execution failed' }
    }
    
  } catch (err) {
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
    
    // Handle different actions
    switch (action) {
      // Evaluate a single script (for testing)
      case 'evaluate': {
        const body = await req.json()
        const { scriptContent, symbol, timeframe = '1h' } = body
        
        if (!scriptContent || !symbol) {
          return new Response(
            JSON.stringify({ error: 'Missing scriptContent or symbol' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Fetch market data
        const ohlcv = await fetchOHLCV(symbol, timeframe, 200)
        const currentPrice = await getCurrentPrice(symbol)
        
        // Calculate indicators
        const indicators = calculateAllIndicators(ohlcv)
        
        // Parse and evaluate strategy
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
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Run engine for all active scripts (scheduled job)
      case 'run': {
        const results: any[] = []
        
        // Get all active scripts with subscribed users
        const { data: userScripts, error: scriptsError } = await supabase
          .from('user_scripts')
          .select(`
            script_id,
            user_id,
            script:pine_scripts (
              id,
              name,
              script_content,
              symbol,
              is_active,
              allowed_timeframes
            )
          `)
          .eq('is_active', true)
        
        if (scriptsError) {
          throw new Error(`Failed to fetch scripts: ${scriptsError.message}`)
        }
        
        // Also get user-created scripts
        const { data: createdScripts, error: createdError } = await supabase
          .from('pine_scripts')
          .select('*')
          .eq('is_active', true)
          .not('created_by', 'is', null)
        
        if (createdError) {
          console.log('Error fetching created scripts:', createdError)
        }
        
        // Combine and process
        // For user_scripts (admin/common library scripts): user opted in, don't require global is_active
        // For user-created scripts: require their own is_active
        const allScripts: UserScript[] = [
          ...(userScripts || []).filter((us: any) => us.script != null),
          ...(createdScripts || []).map((s: any) => ({
            script_id: s.id,
            user_id: s.created_by,
            script: s,
          })),
        ]
        
        // Group by symbol+timeframe to reduce API calls
        const bySymbolTimeframe = new Map<string, UserScript[]>()
        for (const us of allScripts) {
          const symbol = us.script.symbol
          const timeframe = us.script.allowed_timeframes?.[0] || '1h'
          const key = `${symbol}:${timeframe}`
          if (!bySymbolTimeframe.has(key)) {
            bySymbolTimeframe.set(key, [])
          }
          bySymbolTimeframe.get(key)!.push(us)
        }
        
        // Process each symbol+timeframe combination
        for (const [key, scripts] of bySymbolTimeframe) {
          const [symbol, timeframe] = key.split(':')
          try {
            // Fetch market data with the correct timeframe
            const ohlcv = await fetchOHLCV(symbol, timeframe, 200)
            const currentPrice = await getCurrentPrice(symbol)
            const indicators = calculateAllIndicators(ohlcv)
            
            // Evaluate each script
            for (const us of scripts) {
              try {
                const strategy = parsePineScript(us.script.script_content)
                const signal = evaluateStrategy(strategy, indicators, ohlcv, currentPrice)
                
                if (signal.action !== 'NONE') {
                  const execResult = await executeTrade(
                    supabase,
                    us.user_id,
                    us.script_id,
                    signal,
                    symbol,
                    timeframe
                  )
                  
                  results.push({
                    scriptId: us.script_id,
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
                    userId: us.user_id,
                    symbol,
                    timeframe,
                    signal,
                    executed: false,
                    reason: signal.reason,
                  })
                }
              } catch (scriptErr) {
                results.push({
                  scriptId: us.script_id,
                  userId: us.user_id,
                  symbol,
                  error: scriptErr instanceof Error ? scriptErr.message : 'Script evaluation failed',
                })
              }
            }
          } catch (symbolErr) {
            console.log(`Error processing symbol ${symbol}:`, symbolErr)
            results.push({
              symbol,
              error: symbolErr instanceof Error ? symbolErr.message : 'Symbol processing failed',
            })
          }
        }
        
        return new Response(
          JSON.stringify({ 
            processed: results.length,
            results,
            timestamp: new Date().toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Parse a script (for debugging)
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
      
      // Get indicators for a symbol (for debugging)
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
    console.error('Pine Script Engine error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
