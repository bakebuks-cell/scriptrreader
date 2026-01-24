/**
 * @deprecated This file is deprecated. Use useWallets.tsx instead.
 * Re-exports are provided for backward compatibility.
 */

// Re-export everything from the new wallet hooks for backward compatibility
export {
  useUserWallets,
  useWalletBalance,
  useOpenPositions,
  usePlaceTrade,
  useAdminWallets,
  callBinanceApi,
  type Wallet,
  type WalletBalance,
  type OpenPosition,
  type WalletRole,
} from './useWallets';

// Legacy alias - maps to new hook
export { useUserWallets as useExchangeKeys } from './useWallets';
