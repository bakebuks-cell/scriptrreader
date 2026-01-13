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

// Admin whitelist emails (permanent admins)
export const ADMIN_WHITELIST_EMAILS = [
  'piyushjunghare635@gmail.com',
  'bakebuks@gmail.com',
] as const;

// Check if email is in admin whitelist
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_WHITELIST_EMAILS.includes(email.toLowerCase() as typeof ADMIN_WHITELIST_EMAILS[number]);
};
