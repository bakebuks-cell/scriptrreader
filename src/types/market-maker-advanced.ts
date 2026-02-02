// Advanced Market Maker Types - Professional-grade trading features

// ============= Execution Audit Types =============
export interface DuplicateOrderGuard {
  enabled: boolean;
  timeWindowMs: number;
  priceThresholdPercent: number;
  sizeThresholdPercent: number;
  action: 'reject' | 'merge' | 'queue';
}

export interface CancelReplaceLoopGuard {
  enabled: boolean;
  maxCancelsPerMinute: number;
  maxReplacesPerMinute: number;
  cooldownSeconds: number;
  action: 'pause' | 'alert' | 'reduce_frequency';
}

export interface InventoryLockGuard {
  enabled: boolean;
  maxLockedPercentage: number;
  lockTimeoutSeconds: number;
  autoReleaseEnabled: boolean;
  forceReleaseAfterSeconds: number;
}

export interface RateLimitProtection {
  enabled: boolean;
  requestsPerSecond: number;
  requestsPerMinute: number;
  burstLimit: number;
  backoffStrategy: 'linear' | 'exponential' | 'adaptive';
  initialBackoffMs: number;
  maxBackoffMs: number;
}

export interface RaceConditionGuard {
  enabled: boolean;
  orderQueueEnabled: boolean;
  maxConcurrentOrders: number;
  sequenceValidation: boolean;
  stateReconciliationInterval: number;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  eventType: 'order_placed' | 'order_filled' | 'order_cancelled' | 'order_rejected' | 'error' | 'warning' | 'info';
  orderId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  price?: number;
  quantity?: number;
  status: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface SafetyGuard {
  enabled: boolean;
  maxConsecutiveFailures: number;
  failureWindowSeconds: number;
  actionOnFailure: 'pause' | 'stop' | 'alert_only';
  requireManualResume: boolean;
  notifyOnTrigger: boolean;
}

export interface ExecutionAuditSettings {
  enabled: boolean;
  duplicateOrderGuard: DuplicateOrderGuard;
  cancelReplaceLoopGuard: CancelReplaceLoopGuard;
  inventoryLockGuard: InventoryLockGuard;
  rateLimitProtection: RateLimitProtection;
  raceConditionGuard: RaceConditionGuard;
  safetyGuard: SafetyGuard;
  logRetentionHours: number;
  logLevel: 'error' | 'warning' | 'info' | 'debug';
}

// ============= Performance Dashboard Types =============
export interface PairExposure {
  symbol: string;
  baseBalance: number;
  quoteBalance: number;
  netExposure: number;
  exposurePercent: number;
  direction: 'long' | 'short' | 'neutral';
}

export interface PnLMetrics {
  floatingPnL: number;
  realizedPnL: number;
  totalPnL: number;
  totalFees: number;
  netPnL: number;
  slippageImpact: number;
  avgSlippagePercent: number;
}

export interface InventoryMetrics {
  currentRatio: number;
  targetRatio: number;
  imbalance: number;
  imbalancePercent: number;
  baseValue: number;
  quoteValue: number;
  totalValue: number;
}

export interface SessionPerformance {
  sessionId: string;
  startTime: string;
  endTime?: string;
  tradesCount: number;
  winRate: number;
  pnl: number;
  fees: number;
  volume: number;
  avgTradeSize: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface PairPerformance {
  symbol: string;
  tradesCount: number;
  buyVolume: number;
  sellVolume: number;
  pnl: number;
  fees: number;
  avgSpread: number;
  winRate: number;
  profitFactor: number;
}

export interface PerformanceDashboardData {
  exposures: PairExposure[];
  pnl: PnLMetrics;
  inventory: InventoryMetrics;
  sessions: SessionPerformance[];
  pairPerformance: PairPerformance[];
  lastUpdated: string;
}

// ============= Profit Optimization Types =============
export interface ProfitTarget {
  enabled: boolean;
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  targetType: 'absolute' | 'percentage';
  actionOnReach: 'widen_spread' | 'reduce_size' | 'pause' | 'continue';
  spreadMultiplierOnReach: number;
  sizeReductionPercent: number;
}

export interface SpreadOptimization {
  autoWideningEnabled: boolean;
  wideningTriggerProfit: number;
  wideningMultiplier: number;
  autoNarrowingEnabled: boolean;
  narrowingInactivityMinutes: number;
  narrowingMultiplier: number;
  minSpreadFloor: number;
  maxSpreadCeiling: number;
}

export interface CapitalRotation {
  enabled: boolean;
  rotationMode: 'performance' | 'volatility' | 'balanced';
  rebalanceIntervalMinutes: number;
  minAllocationPercent: number;
  maxAllocationPercent: number;
  performanceWindow: 'hourly' | 'daily' | 'weekly';
  underperformPenalty: number;
}

export interface LowActivityBoost {
  enabled: boolean;
  inactivityThresholdMinutes: number;
  boostSpreadReduction: number;
  boostSizeIncrease: number;
  maxBoostDurationMinutes: number;
  cooldownMinutes: number;
}

export interface DrawdownRecovery {
  enabled: boolean;
  triggerDrawdownPercent: number;
  recoveryMode: 'conservative' | 'normal' | 'aggressive';
  spreadMultiplier: number;
  sizeMultiplier: number;
  recoveryTargetPercent: number;
  maxRecoveryDurationHours: number;
}

export interface AdaptiveSpread {
  enabled: boolean;
  profitabilityWindow: 'hourly' | 'daily' | 'weekly';
  profitableSpreadMultiplier: number;
  unprofitableSpreadMultiplier: number;
  neutralThresholdPercent: number;
  adjustmentIntervalMinutes: number;
}

export interface LossPrevention {
  enabled: boolean;
  consecutiveLossLimit: number;
  lossPeriodMinutes: number;
  actionOnLimit: 'pause' | 'widen_spread' | 'reduce_size';
  pauseDurationMinutes: number;
  spreadWideningPercent: number;
  sizeReductionPercent: number;
}

export interface ProfitOptimizationSettings {
  enabled: boolean;
  profitTarget: ProfitTarget;
  spreadOptimization: SpreadOptimization;
  capitalRotation: CapitalRotation;
  lowActivityBoost: LowActivityBoost;
  drawdownRecovery: DrawdownRecovery;
  adaptiveSpread: AdaptiveSpread;
  lossPrevention: LossPrevention;
}

// ============= Market Regime Types =============
export type MarketRegime = 'ranging' | 'trending_up' | 'trending_down' | 'high_volatility' | 'low_liquidity' | 'dead_market';

export interface RegimeIndicator {
  id: string;
  type: 'atr' | 'adx' | 'bollinger_width' | 'volume_profile' | 'spread_analysis' | 'trade_frequency';
  weight: number;
  enabled: boolean;
  parameters: Record<string, number>;
}

export interface RegimeThresholds {
  trendStrengthMin: number;
  volatilityHighThreshold: number;
  volatilityLowThreshold: number;
  liquidityMinVolume: number;
  deadMarketMinutesSinceLastTrade: number;
  rangeWidthPercent: number;
}

export interface RegimePreset {
  regime: MarketRegime;
  spreadMultiplier: number;
  orderSizeMultiplier: number;
  layerCountMultiplier: number;
  cancelTimeMultiplier: number;
  riskLimitMultiplier: number;
  enabled: boolean;
}

export interface RegimeDetectionSettings {
  enabled: boolean;
  detectionIntervalSeconds: number;
  indicators: RegimeIndicator[];
  thresholds: RegimeThresholds;
  lookbackPeriodMinutes: number;
  confirmationPeriodSeconds: number;
  hysteresisPercent: number;
}

export interface RegimeAutoAdjustment {
  adjustSpread: boolean;
  adjustOrderSize: boolean;
  adjustOrderLayers: boolean;
  adjustCancelTiming: boolean;
  adjustRiskLimits: boolean;
  smoothTransition: boolean;
  transitionPeriodSeconds: number;
}

export interface MarketRegimeSettings {
  enabled: boolean;
  detection: RegimeDetectionSettings;
  autoAdjustment: RegimeAutoAdjustment;
  presets: RegimePreset[];
  currentRegime?: MarketRegime;
  lastRegimeChange?: string;
}

// ============= Default Settings =============
export const defaultDuplicateOrderGuard: DuplicateOrderGuard = {
  enabled: true,
  timeWindowMs: 1000,
  priceThresholdPercent: 0.1,
  sizeThresholdPercent: 5,
  action: 'reject',
};

export const defaultCancelReplaceLoopGuard: CancelReplaceLoopGuard = {
  enabled: true,
  maxCancelsPerMinute: 30,
  maxReplacesPerMinute: 20,
  cooldownSeconds: 60,
  action: 'reduce_frequency',
};

export const defaultInventoryLockGuard: InventoryLockGuard = {
  enabled: true,
  maxLockedPercentage: 50,
  lockTimeoutSeconds: 30,
  autoReleaseEnabled: true,
  forceReleaseAfterSeconds: 120,
};

export const defaultRateLimitProtection: RateLimitProtection = {
  enabled: true,
  requestsPerSecond: 10,
  requestsPerMinute: 300,
  burstLimit: 20,
  backoffStrategy: 'exponential',
  initialBackoffMs: 100,
  maxBackoffMs: 30000,
};

export const defaultRaceConditionGuard: RaceConditionGuard = {
  enabled: true,
  orderQueueEnabled: true,
  maxConcurrentOrders: 5,
  sequenceValidation: true,
  stateReconciliationInterval: 5000,
};

export const defaultSafetyGuard: SafetyGuard = {
  enabled: true,
  maxConsecutiveFailures: 5,
  failureWindowSeconds: 300,
  actionOnFailure: 'pause',
  requireManualResume: false,
  notifyOnTrigger: true,
};

export const defaultExecutionAuditSettings: ExecutionAuditSettings = {
  enabled: true,
  duplicateOrderGuard: defaultDuplicateOrderGuard,
  cancelReplaceLoopGuard: defaultCancelReplaceLoopGuard,
  inventoryLockGuard: defaultInventoryLockGuard,
  rateLimitProtection: defaultRateLimitProtection,
  raceConditionGuard: defaultRaceConditionGuard,
  safetyGuard: defaultSafetyGuard,
  logRetentionHours: 72,
  logLevel: 'info',
};

export const defaultProfitTarget: ProfitTarget = {
  enabled: false,
  dailyTarget: 100,
  weeklyTarget: 500,
  monthlyTarget: 2000,
  targetType: 'absolute',
  actionOnReach: 'widen_spread',
  spreadMultiplierOnReach: 1.5,
  sizeReductionPercent: 30,
};

export const defaultSpreadOptimization: SpreadOptimization = {
  autoWideningEnabled: true,
  wideningTriggerProfit: 50,
  wideningMultiplier: 1.3,
  autoNarrowingEnabled: true,
  narrowingInactivityMinutes: 15,
  narrowingMultiplier: 0.8,
  minSpreadFloor: 0.03,
  maxSpreadCeiling: 2.0,
};

export const defaultCapitalRotation: CapitalRotation = {
  enabled: false,
  rotationMode: 'balanced',
  rebalanceIntervalMinutes: 60,
  minAllocationPercent: 10,
  maxAllocationPercent: 50,
  performanceWindow: 'daily',
  underperformPenalty: 10,
};

export const defaultLowActivityBoost: LowActivityBoost = {
  enabled: true,
  inactivityThresholdMinutes: 30,
  boostSpreadReduction: 20,
  boostSizeIncrease: 15,
  maxBoostDurationMinutes: 60,
  cooldownMinutes: 30,
};

export const defaultDrawdownRecovery: DrawdownRecovery = {
  enabled: true,
  triggerDrawdownPercent: 3,
  recoveryMode: 'conservative',
  spreadMultiplier: 1.5,
  sizeMultiplier: 0.5,
  recoveryTargetPercent: 50,
  maxRecoveryDurationHours: 24,
};

export const defaultAdaptiveSpread: AdaptiveSpread = {
  enabled: true,
  profitabilityWindow: 'hourly',
  profitableSpreadMultiplier: 0.9,
  unprofitableSpreadMultiplier: 1.3,
  neutralThresholdPercent: 0.5,
  adjustmentIntervalMinutes: 15,
};

export const defaultLossPrevention: LossPrevention = {
  enabled: true,
  consecutiveLossLimit: 5,
  lossPeriodMinutes: 30,
  actionOnLimit: 'pause',
  pauseDurationMinutes: 15,
  spreadWideningPercent: 50,
  sizeReductionPercent: 50,
};

export const defaultProfitOptimizationSettings: ProfitOptimizationSettings = {
  enabled: true,
  profitTarget: defaultProfitTarget,
  spreadOptimization: defaultSpreadOptimization,
  capitalRotation: defaultCapitalRotation,
  lowActivityBoost: defaultLowActivityBoost,
  drawdownRecovery: defaultDrawdownRecovery,
  adaptiveSpread: defaultAdaptiveSpread,
  lossPrevention: defaultLossPrevention,
};

export const defaultRegimeThresholds: RegimeThresholds = {
  trendStrengthMin: 25,
  volatilityHighThreshold: 3,
  volatilityLowThreshold: 0.5,
  liquidityMinVolume: 10000,
  deadMarketMinutesSinceLastTrade: 10,
  rangeWidthPercent: 2,
};

export const defaultRegimeIndicators: RegimeIndicator[] = [
  { id: 'atr', type: 'atr', weight: 30, enabled: true, parameters: { period: 14 } },
  { id: 'adx', type: 'adx', weight: 25, enabled: true, parameters: { period: 14 } },
  { id: 'bbwidth', type: 'bollinger_width', weight: 20, enabled: true, parameters: { period: 20, stdDev: 2 } },
  { id: 'volume', type: 'volume_profile', weight: 15, enabled: true, parameters: { period: 24 } },
  { id: 'spread', type: 'spread_analysis', weight: 10, enabled: true, parameters: { samples: 100 } },
];

export const defaultRegimePresets: RegimePreset[] = [
  { regime: 'ranging', spreadMultiplier: 0.8, orderSizeMultiplier: 1.2, layerCountMultiplier: 1.5, cancelTimeMultiplier: 0.8, riskLimitMultiplier: 1.0, enabled: true },
  { regime: 'trending_up', spreadMultiplier: 1.2, orderSizeMultiplier: 0.8, layerCountMultiplier: 0.7, cancelTimeMultiplier: 0.5, riskLimitMultiplier: 0.8, enabled: true },
  { regime: 'trending_down', spreadMultiplier: 1.3, orderSizeMultiplier: 0.7, layerCountMultiplier: 0.6, cancelTimeMultiplier: 0.5, riskLimitMultiplier: 0.7, enabled: true },
  { regime: 'high_volatility', spreadMultiplier: 2.0, orderSizeMultiplier: 0.5, layerCountMultiplier: 0.5, cancelTimeMultiplier: 0.3, riskLimitMultiplier: 0.5, enabled: true },
  { regime: 'low_liquidity', spreadMultiplier: 1.5, orderSizeMultiplier: 0.6, layerCountMultiplier: 0.8, cancelTimeMultiplier: 1.5, riskLimitMultiplier: 0.6, enabled: true },
  { regime: 'dead_market', spreadMultiplier: 0.5, orderSizeMultiplier: 1.5, layerCountMultiplier: 2.0, cancelTimeMultiplier: 3.0, riskLimitMultiplier: 0.4, enabled: true },
];

export const defaultRegimeDetectionSettings: RegimeDetectionSettings = {
  enabled: true,
  detectionIntervalSeconds: 30,
  indicators: defaultRegimeIndicators,
  thresholds: defaultRegimeThresholds,
  lookbackPeriodMinutes: 60,
  confirmationPeriodSeconds: 60,
  hysteresisPercent: 10,
};

export const defaultRegimeAutoAdjustment: RegimeAutoAdjustment = {
  adjustSpread: true,
  adjustOrderSize: true,
  adjustOrderLayers: true,
  adjustCancelTiming: true,
  adjustRiskLimits: true,
  smoothTransition: true,
  transitionPeriodSeconds: 30,
};

export const defaultMarketRegimeSettings: MarketRegimeSettings = {
  enabled: true,
  detection: defaultRegimeDetectionSettings,
  autoAdjustment: defaultRegimeAutoAdjustment,
  presets: defaultRegimePresets,
};

// ============= Extended Module Types =============
export type AdvancedModuleType = 
  | 'execution_audit'
  | 'performance_dashboard'
  | 'profit_optimization'
  | 'market_regime';
