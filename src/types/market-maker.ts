// Market Maker Types - Comprehensive type definitions for the Market Maker module

// ============= Order Layer Types =============
export interface OrderLayer {
  id: string;
  enabled: boolean;
  buyAmount: number;
  sellAmount: number;
  percentageHigherAsk: number;
  percentageLowerBid: number;
  priceGap: number;
  spreadMultiplier: number;
}

// ============= Market & Pricing Types =============
export interface SpreadSettings {
  baseSpread: number;
  minSpread: number;
  maxSpread: number;
  spreadMode: 'fixed' | 'dynamic' | 'volatility_based';
  volatilityMultiplier: number;
  trendAdjustmentPercent: number;
}

export interface InventorySettings {
  targetRatio: number; // Target base/quote ratio (0.5 = 50/50)
  maxSkew: number; // Maximum allowed deviation from target
  rebalanceThreshold: number; // Trigger rebalance when skew exceeds this
  adjustSpreadOnSkew: boolean;
  skewSpreadMultiplier: number;
}

export interface DualSideQuotingSettings {
  enabled: boolean;
  symmetricQuoting: boolean;
  buyBias: number; // -100 to 100 (negative = more sells)
  sellBias: number;
  minQuoteSize: number;
  maxQuoteSize: number;
}

export interface MarketPricingSettings {
  market: string;
  strategy: string;
  marketTrend: 'neutral' | 'uptrend' | 'downtrend';
  orderSequence: string;
  orderPositioning: string;
  orderLayers: OrderLayer[];
  // Enhanced settings
  dualSideQuoting: DualSideQuotingSettings;
  spread: SpreadSettings;
  inventory: InventorySettings;
  volatilityWindow: number; // Minutes to calculate volatility
  priceSource: 'mid' | 'last' | 'weighted';
}

// ============= Order Layers Types =============
export interface OrderLayerConfig {
  id: string;
  enabled: boolean;
  layerIndex: number;
  side: 'buy' | 'sell' | 'both';
  quantity: number;
  quantityType: 'fixed' | 'percentage';
  priceOffset: number;
  priceOffsetType: 'percentage' | 'absolute';
  refreshInterval: number;
  maxOrdersPerLayer: number;
}

export interface OrderLayersSettings {
  enabled: boolean;
  maxLayers: number;
  layers: OrderLayerConfig[];
  ladderSpacing: number;
  ladderSpacingType: 'geometric' | 'arithmetic';
  autoAdjustLayers: boolean;
  minPriceDistance: number;
}

// ============= Autocancel Types =============
export interface PartialFillSettings {
  action: 'keep' | 'cancel' | 'adjust';
  minFillPercent: number;
  adjustStrategy: 'market' | 'limit_chase' | 'wait';
  waitTimeSeconds: number;
}

export interface SmartReplacementSettings {
  enabled: boolean;
  replacementMode: 'immediate' | 'delayed' | 'smart';
  delaySeconds: number;
  priceAdjustment: number;
  maxReplacements: number;
  cooldownSeconds: number;
}

export interface TrendCancelAction {
  fromNeutralToDowntrend: string;
  fromNeutralToUptrend: string;
  fromDowntrendToNeutral: string;
  fromDowntrendToUptrend: string;
  fromUptrendToNeutral: string;
  fromUptrendToDowntrend: string;
}

export interface AutocancelSettings {
  onlyCancelUnfilledOrders: boolean;
  doNotCancelPartiallyFilled: boolean;
  cancelAfterPeriod: boolean;
  neutralPeriod: number;
  neutralUnit: 'seconds' | 'minutes';
  uptrendPeriod: number;
  uptrendUnit: 'seconds' | 'minutes';
  downtrendPeriod: number;
  downtrendUnit: 'seconds' | 'minutes';
  cancelOnTrendChange: boolean;
  trendCancelActions: TrendCancelAction;
  cancelOnPercentChange: boolean;
  percentChange: number;
  percentChangePeriod: number;
  percentChangePeriodUnit: 'seconds' | 'minutes';
  // Enhanced settings
  partialFill: PartialFillSettings;
  smartReplacement: SmartReplacementSettings;
  staleOrderThreshold: number; // Seconds before order is considered stale
  priceDeviationCancel: number; // Cancel if price deviates more than X%
}

// ============= Stop-Loss Types =============
export interface DrawdownSettings {
  enabled: boolean;
  maxDrawdownPercent: number;
  windowMinutes: number;
  action: 'pause' | 'stop' | 'reduce_size';
  reductionPercent: number;
  cooldownMinutes: number;
}

export interface EmergencySettings {
  enabled: boolean;
  triggerPrice: number;
  triggerType: 'above' | 'below';
  action: 'liquidate_all' | 'cancel_all' | 'hedge';
  hedgeRatio: number;
  notifyOnTrigger: boolean;
}

export interface StopLossSettings {
  enabled: boolean;
  upperLimitPrice: number;
  lowerLimitPrice: number;
  cancelMarketMakers: boolean;
  allowRevertRetry: boolean;
  // Enhanced settings
  drawdown: DrawdownSettings;
  emergency: EmergencySettings;
  trailingStop: boolean;
  trailingStopPercent: number;
  breakEvenTrigger: number;
  partialExitLevels: { percent: number; exitSize: number }[];
}

// ============= Revert & Backlog Types =============
export interface RetrySettings {
  maxRetries: number;
  retryDelaySeconds: number;
  backoffMultiplier: number;
  maxBackoffSeconds: number;
  retryOnErrors: string[];
}

export interface FallbackPricingSettings {
  enabled: boolean;
  method: 'market' | 'limit_aggressive' | 'twap' | 'vwap';
  slippageTolerance: number;
  timeWindowMinutes: number;
  maxPriceDeviation: number;
}

export interface LossAwareReversionSettings {
  enabled: boolean;
  maxLossPerRevert: number;
  dailyLossLimit: number;
  pauseOnLimitReach: boolean;
  recoverBeforeNew: boolean;
}

export interface RevertBacklogSettings {
  moveFailedToBacklog: boolean;
  automaticMatchBacklog: boolean;
  revertCancelledOrders: string;
  orderType: string;
  enableTakeProfit: boolean;
  takeProfitAt: number;
  enableMaxLoss: boolean;
  maxLoss: number;
  trendBasedRevert: boolean;
  // Enhanced settings
  retry: RetrySettings;
  fallbackPricing: FallbackPricingSettings;
  lossAwareReversion: LossAwareReversionSettings;
  maxBacklogSize: number;
  backlogExpireHours: number;
  priorityQueue: boolean;
}

// ============= Risk Control Types =============
export interface ExposureLimits {
  enabled: boolean;
  maxPositionSize: number;
  maxPositionValue: number;
  maxOrderSize: number;
  maxDailyVolume: number;
  maxOpenOrders: number;
}

export interface InventoryCaps {
  enabled: boolean;
  maxBaseHolding: number;
  maxQuoteHolding: number;
  minBaseReserve: number;
  minQuoteReserve: number;
  alertThreshold: number;
}

export interface SessionLimits {
  enabled: boolean;
  maxLossPerSession: number;
  maxProfitTakePerSession: number;
  sessionDurationHours: number;
  resetTime: string; // HH:MM format
  pauseOnLimitReach: boolean;
}

export interface AutoPauseTriggers {
  enabled: boolean;
  onHighVolatility: boolean;
  volatilityThreshold: number;
  onLowLiquidity: boolean;
  liquidityThreshold: number;
  onApiError: boolean;
  apiErrorCount: number;
  onPriceGap: boolean;
  priceGapPercent: number;
  cooldownMinutes: number;
}

export interface RiskControlSettings {
  enabled: boolean;
  exposure: ExposureLimits;
  inventory: InventoryCaps;
  session: SessionLimits;
  autoPause: AutoPauseTriggers;
  emergencyStopEnabled: boolean;
  emergencyStopHotkey: string;
}

// ============= Module Type Union =============
export type ModuleType = 
  | 'basic_settings' 
  | 'exchange' 
  | 'notifications' 
  | 'market_pricing' 
  | 'order_layers'
  | 'autocancel' 
  | 'stop_loss' 
  | 'revert_backlog'
  | 'risk_control';

// ============= Default Settings =============
export const defaultDualSideQuoting: DualSideQuotingSettings = {
  enabled: true,
  symmetricQuoting: true,
  buyBias: 0,
  sellBias: 0,
  minQuoteSize: 0.001,
  maxQuoteSize: 1,
};

export const defaultSpreadSettings: SpreadSettings = {
  baseSpread: 0.1,
  minSpread: 0.05,
  maxSpread: 0.5,
  spreadMode: 'dynamic',
  volatilityMultiplier: 1.5,
  trendAdjustmentPercent: 20,
};

export const defaultInventorySettings: InventorySettings = {
  targetRatio: 0.5,
  maxSkew: 0.3,
  rebalanceThreshold: 0.2,
  adjustSpreadOnSkew: true,
  skewSpreadMultiplier: 1.2,
};

export const defaultPartialFillSettings: PartialFillSettings = {
  action: 'keep',
  minFillPercent: 10,
  adjustStrategy: 'wait',
  waitTimeSeconds: 30,
};

export const defaultSmartReplacementSettings: SmartReplacementSettings = {
  enabled: false,
  replacementMode: 'smart',
  delaySeconds: 5,
  priceAdjustment: 0.1,
  maxReplacements: 3,
  cooldownSeconds: 60,
};

export const defaultDrawdownSettings: DrawdownSettings = {
  enabled: false,
  maxDrawdownPercent: 5,
  windowMinutes: 60,
  action: 'pause',
  reductionPercent: 50,
  cooldownMinutes: 30,
};

export const defaultEmergencySettings: EmergencySettings = {
  enabled: false,
  triggerPrice: 0,
  triggerType: 'below',
  action: 'cancel_all',
  hedgeRatio: 1,
  notifyOnTrigger: true,
};

export const defaultRetrySettings: RetrySettings = {
  maxRetries: 3,
  retryDelaySeconds: 5,
  backoffMultiplier: 2,
  maxBackoffSeconds: 60,
  retryOnErrors: ['TIMEOUT', 'RATE_LIMIT'],
};

export const defaultFallbackPricingSettings: FallbackPricingSettings = {
  enabled: false,
  method: 'limit_aggressive',
  slippageTolerance: 0.5,
  timeWindowMinutes: 5,
  maxPriceDeviation: 2,
};

export const defaultLossAwareReversionSettings: LossAwareReversionSettings = {
  enabled: false,
  maxLossPerRevert: 1,
  dailyLossLimit: 5,
  pauseOnLimitReach: true,
  recoverBeforeNew: false,
};

export const defaultExposureLimits: ExposureLimits = {
  enabled: true,
  maxPositionSize: 1,
  maxPositionValue: 10000,
  maxOrderSize: 0.1,
  maxDailyVolume: 50000,
  maxOpenOrders: 10,
};

export const defaultInventoryCaps: InventoryCaps = {
  enabled: false,
  maxBaseHolding: 10,
  maxQuoteHolding: 100000,
  minBaseReserve: 0.1,
  minQuoteReserve: 1000,
  alertThreshold: 80,
};

export const defaultSessionLimits: SessionLimits = {
  enabled: false,
  maxLossPerSession: 500,
  maxProfitTakePerSession: 0,
  sessionDurationHours: 24,
  resetTime: '00:00',
  pauseOnLimitReach: true,
};

export const defaultAutoPauseTriggers: AutoPauseTriggers = {
  enabled: true,
  onHighVolatility: true,
  volatilityThreshold: 5,
  onLowLiquidity: true,
  liquidityThreshold: 1000,
  onApiError: true,
  apiErrorCount: 5,
  onPriceGap: true,
  priceGapPercent: 3,
  cooldownMinutes: 15,
};

export const defaultRiskControlSettings: RiskControlSettings = {
  enabled: true,
  exposure: defaultExposureLimits,
  inventory: defaultInventoryCaps,
  session: defaultSessionLimits,
  autoPause: defaultAutoPauseTriggers,
  emergencyStopEnabled: true,
  emergencyStopHotkey: 'Escape',
};
