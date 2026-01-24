// Feature flags
export const FEATURE_FLAGS = {
  PAID_MODE: 'paid_mode',
  TRADING_ENABLED: 'trading_enabled',
  NEW_REGISTRATIONS: 'new_registrations',
} as const;

// Default user settings
export const DEFAULT_USER_COINS = 5;
export const MAX_SELECTED_TIMEFRAMES = 3;

// Available timeframes
export const AVAILABLE_TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
] as const;

// Candle types
export const CANDLE_TYPES = [
  { value: 'regular', label: 'Regular OHLC' },
  { value: 'heikin_ashi', label: 'Heikin Ashi' },
] as const;

// Market types
export const MARKET_TYPES = [
  { value: 'spot', label: 'Spot' },
  { value: 'usdt_futures', label: 'USDT-M Futures' },
  { value: 'coin_futures', label: 'COIN-M Futures' },
] as const;

// Position size types
export const POSITION_SIZE_TYPES = [
  { value: 'fixed', label: 'Fixed Amount (USDT)' },
  { value: 'percentage', label: 'Percentage of Wallet' },
] as const;

// Leverage options
export const LEVERAGE_OPTIONS = [
  1, 2, 3, 5, 10, 20, 25, 50, 75, 100, 125
] as const;

// Popular trading pairs
export const POPULAR_TRADING_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'SOLUSDT',
  'ADAUSDT',
  'DOGEUSDT',
  'DOTUSDT',
  'MATICUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'LTCUSDT',
  'ATOMUSDT',
  'UNIUSDT',
  'APTUSDT',
  'ARBUSDT',
  'OPUSDT',
  'NEARUSDT',
  'FILUSDT',
  'INJUSDT',
  'SUIUSDT',
  'SEIUSDT',
  'TIAUSDT',
  'JUPUSDT',
  'WIFUSDT',
  'PEPEUSDT',
  'SHIBUSDT',
  'FETUSDT',
  'RENDERUSDT',
  'AAVEUSDT',
] as const;

// Maximum symbols per script
export const MAX_SYMBOLS_PER_SCRIPT = 10;

// Trade statuses
export const TRADE_STATUS = {
  PENDING: 'PENDING',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

// Signal types
export const SIGNAL_TYPE = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;

// Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

// Admin whitelist emails (permanent admins) - ONLY these emails can be admins
export const ADMIN_WHITELIST_EMAILS = [
  'piyushjunghare635@gmail.com',
  'bakebuks@gmail.com',
] as const;

// Check if email is in admin whitelist (case-insensitive)
export const isAdminEmail = (email: string): boolean => {
  const normalizedEmail = email.toLowerCase().trim();
  return ADMIN_WHITELIST_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail);
};
