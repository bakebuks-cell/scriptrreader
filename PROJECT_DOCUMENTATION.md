# 📘 ScriptReader — Full Project Documentation

> **Live URL**: https://scriptrreader.lovable.app  
> **Platform**: https://www.lovewithtrade.com  
> **Tech Stack**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Supabase (Lovable Cloud)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Authentication & Session Management](#3-authentication--session-management)
4. [Role System](#4-role-system)
5. [Database Schema](#5-database-schema)
6. [Frontend Pages & Routing](#6-frontend-pages--routing)
7. [User Dashboard](#7-user-dashboard)
8. [Admin Dashboard](#8-admin-dashboard)
9. [Pine Script Engine (Core Trading Engine)](#9-pine-script-engine-core-trading-engine)
10. [Binance API Integration](#10-binance-api-integration)
11. [Trade Lifecycle](#11-trade-lifecycle)
12. [Signal System](#12-signal-system)
13. [Market Maker Bot Module](#13-market-maker-bot-module)
14. [Wallet Management](#14-wallet-management)
15. [Subscription & Payment System](#15-subscription--payment-system)
16. [Coin Credit System](#16-coin-credit-system)
17. [Feature Flags](#17-feature-flags)
18. [Telegram Bot Integration](#18-telegram-bot-integration)
19. [Session Management](#19-session-management)
20. [Edge Functions](#20-edge-functions)
21. [Security & RLS Policies](#21-security--rls-policies)
22. [UI Components Library](#22-ui-components-library)
23. [Hooks Reference](#23-hooks-reference)
24. [Constants & Configuration](#24-constants--configuration)
25. [Market Data & Charts](#25-market-data--charts)
26. [Deployment & DevOps](#26-deployment--devops)

---

## 1. Project Overview

ScriptReader is a **multi-user SaaS platform for automated cryptocurrency trading** on Binance (Spot & USDT-M/COIN-M Futures). It supports four bot categories:

| Bot Type | Description |
|----------|-------------|
| **Trading Bot** | Driven by Pine Script indicators, auto-executes buy/sell on Binance |
| **Copy Bot** | Social trading & strategy marketplace (planned) |
| **Market Maker** | Dual-side quoting, dynamic spreads, inventory balancing |
| **Portfolio Bot** | DCA and asset rebalancing (planned) |

### Key Capabilities
- Admin-created and user-created Pine Scripts with real-time indicator evaluation
- Automated trading on Binance Futures via HMAC-signed API calls
- 3-second continuous polling across all timeframes (1m → 1M)
- Coin-based credit system for trade execution
- Subscription/payment management with crypto payments
- Multi-device session control with automatic revocation
- Telegram bot for channel membership verification
- Real-time trade updates via Supabase Realtime (postgres_changes)

---

## 2. Architecture

### Frontend
```
src/
├── pages/           # Route-level components (Index, Auth, UserDashboard, AdminDashboard, etc.)
├── components/      # Reusable UI components
│   ├── ui/          # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── admin/       # Admin-only panels
│   ├── bot/         # Bot configuration forms
│   ├── market-maker/# Market maker sub-panels
│   ├── analytics/   # Script performance analytics
│   ├── layouts/     # DashboardLayout, AdminLayout
│   ├── library/     # Common script library view
│   ├── onboarding/  # New user onboarding wizard
│   └── profile/     # User/Admin profile components
├── hooks/           # Custom React hooks (data fetching, auth, state)
├── lib/             # Utilities and constants
├── types/           # TypeScript type definitions
├── integrations/    # Auto-generated Supabase client & types
└── assets/          # Static images (logo, hero)
```

### Backend (Supabase Edge Functions)
```
supabase/functions/
├── pine-script-engine/   # Core trading engine (~4265 lines)
├── binance-api/          # Binance REST proxy (~609 lines)
├── binance-websocket-proxy/ # WebSocket proxy for real-time data
├── delete-user/          # Admin user deletion (cascading)
├── telegram-bot/         # Telegram channel verification bot
└── auto-stop-bots/       # Cron job to auto-stop market maker bots
```

### Data Layer
- **Database**: PostgreSQL via Supabase (Lovable Cloud)
- **Auth**: Supabase Auth (email/password, email verification required)
- **Real-time**: Supabase Realtime channels for trade updates
- **Caching**: `market_data_cache` table for shared candle data

---

## 3. Authentication & Session Management

### Auth Flow
1. User signs up at `/auth` with email + password
2. Email verification is **required** (auto-confirm disabled)
3. On login, `handle_new_user()` trigger creates:
   - `profiles` row with default coins (5), bot_enabled=false
   - `user_roles` row with role='user' (or 'admin' if in whitelist)
   - `user_trading_settings` row with defaults
4. Custom session created via `create_user_session()` RPC
5. Session stored in `localStorage` as `lwt_session_id`
6. Validated every 60 seconds via `validate_session()` RPC

### Session Error Codes
| Code | Meaning |
|------|---------|
| `SESSION_NOT_FOUND` | Session ID not in database |
| `SESSION_REVOKED` | Another login replaced this session |
| `SESSION_EXPIRED` | Session timeout exceeded |

### Session Configuration (`session_config` table)
| Setting | Default |
|---------|---------|
| `multi_device_enabled` | true |
| `max_sessions_per_user` | 5 |
| `session_timeout_hours` | 168 (7 days) |

---

## 4. Role System

### Roles (Enum: `app_role`)
- **`admin`** — Full platform control, hard-locked to whitelisted emails
- **`user`** — Standard user, manages own scripts/bots/wallets

### Admin Whitelist
Admin emails are stored in the `admin_whitelist` database table AND hardcoded in `src/lib/constants.ts`:
```
piyushjunghare635@gmail.com
bakebuks@gmail.com
```

### Role Checking Functions
| Function | Purpose |
|----------|---------|
| `has_role(_user_id, _role)` | Check if user has specific role (SECURITY DEFINER) |
| `is_admin(_user_id)` | Shorthand for `has_role(uid, 'admin')` |
| `is_admin_email(email)` | Check against `admin_whitelist` table |
| `get_user_role(_user_id)` | Returns the user's role |

---

## 5. Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profile & settings | user_id, coins, bot_enabled, trade_mode, strategy_opposite_policy, subscription_active, login_access, feature_access |
| `user_roles` | Role assignments | user_id, role (enum: admin/user) |
| `pine_scripts` | Trading scripts/strategies | name, script_content, symbol, allowed_timeframes, leverage, candle_type, market_type, validation_status |
| `user_scripts` | Per-user script activation | user_id, script_id, is_active, settings_json |
| `signals` | Generated trade signals | script_id, signal_type (BUY/SELL), symbol, timeframe, price, candle_timestamp, processed |
| `trades` | Executed trades | user_id, script_id, signal_type, entry_price, exit_price, status, leverage, margin_amount, pnl, trade_amount_used |
| `strategy_state` | Engine state tracking | user_id, script_id, symbol, timeframe, last_checked_time, next_check_time, signal_lock_status, last_execution_candle_time |
| `market_data_cache` | Shared candle cache | symbol, timeframe, data_payload (OHLCV JSON), fetched_at, cache_expiry_time |
| `wallets` | User/Admin exchange wallets | user_id, role (ADMIN/USER), api_key_encrypted, api_secret_encrypted, total_balance_usdt |
| `exchange_keys` | Separate API key storage | user_id, exchange, api_key_encrypted, api_secret_encrypted |

### Configuration Tables

| Table | Purpose |
|-------|---------|
| `session_config` | Session timeout, multi-device settings |
| `subscription_settings` | Crypto payment config, monthly amount, trial days |
| `feature_flags` | Toggle platform features (paid_mode, trading_enabled, new_registrations) |
| `admin_whitelist` | Permanent admin email list |
| `lifetime_free_emails` | Users exempt from subscription |

### Financial Tables

| Table | Purpose |
|-------|---------|
| `payment_requests` | Crypto payment submissions (tx_hash, amount, status) |
| `coin_requests` | User requests for additional coins |
| `coin_audit_log` | Audit trail for coin balance changes |

### Bot Tables

| Table | Purpose |
|-------|---------|
| `market_maker_bots` | Market maker bot instances |
| `bot_configurations` | Bot module settings (JSON) |
| `script_reports` | User-reported scripts (SPAM, SCAM, etc.) |
| `user_sessions` | Active session tracking |
| `user_trading_settings` | Default margin, leverage, stop-loss, take-profit |

### Enums

| Enum | Values |
|------|--------|
| `app_role` | admin, user |
| `signal_type` | BUY, SELL |
| `trade_status` | PENDING, OPEN, CLOSED, FAILED, CANCELLED |
| `wallet_role` | ADMIN, USER |
| `report_reason` | SPAM, SCAM, FAKE_STRATEGY, OFFENSIVE, OTHER |
| `report_status` | PENDING, REVIEWED, RESOLVED |

---

## 6. Frontend Pages & Routing

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/` | `Index` | Public | Landing page with hero, features, exchange list |
| `/auth` | `Auth` | Public | Login/signup with email verification |
| `/dashboard` | `UserDashboard` | User only | Main user interface (tabs: overview, scripts, trades, etc.) |
| `/dashboard/*` | `UserDashboard` | User only | Sub-routes within dashboard |
| `/admin` | `AdminDashboard` | Admin only | Full admin control panel |
| `/admin/*` | `AdminDashboard` | Admin only | Admin sub-routes |
| `/market-maker` | `MarketMakerPage` | Public | Market maker configuration interface |
| `/payment` | `PaymentPage` | Auth | Subscription payment flow |
| `/suspended` | `SuspendedPage` | Auth | Shown when user account is suspended |
| `*` | `NotFound` | Public | 404 page |

### AuthGuard Logic
- If `loading` or role is null → show spinner
- If `sessionError` or no user → redirect to `/auth`
- If `adminOnly` and role ≠ admin → redirect to `/dashboard`
- If not `adminOnly` and role = admin → redirect to `/admin`

---

## 7. User Dashboard

The `UserDashboard` (857 lines) is a tabbed interface with these sections:

### Tabs
| Tab | Features |
|-----|----------|
| **Overview** | Bot status toggle, wallet balance, active trades, live positions, API key status |
| **Scripts** | Pine Script editor, script list (own + admin library), per-script activation |
| **Trades** | Trade history with per-trade leverage/margin/PnL, manual close button |
| **Wallet** | Binance wallet connection, balance sync, API key management |
| **Chart** | TradingView-style candlestick chart with lightweight-charts |
| **Library** | Common script marketplace (admin-published scripts) |
| **Profile** | User settings, display name, trade mode selection |

### Key Features
- **Trade Mode**: `plain` (2-signal BUY/SELL), `strategy` (4-signal BUY_OPEN/BUY_EXIT/SELL_OPEN/SELL_EXIT), `auto` (engine detects)
- **Strategy Opposite Policy**: `reject` (ignore opposite signals) or `flip` (close & reverse position)
- **Daily Profit Target**: Auto-pause bot after reaching target PnL
- **Onboarding Wizard**: Shown for new users without scripts/API keys
- **Subscription Access Check**: Redirects to payment or suspended page based on access level

---

## 8. Admin Dashboard

The `AdminDashboard` (450 lines) provides full platform management:

### Sections
| Section | Features |
|---------|----------|
| **Users** | View all users, manage coins, toggle bot/subscription/access, delete users |
| **Scripts** | Create/edit admin scripts (tagged for common library), manage all user scripts |
| **Trades** | View all trades across users, close all active trades |
| **Wallets** | Manage admin and user wallets |
| **Feature Flags** | Toggle paid_mode, trading_enabled, new_registrations |
| **Subscription** | Configure crypto payment settings, monthly amount, trial days |
| **Payments** | Review/approve/reject crypto payment requests |
| **Lifetime Free** | Manage emails exempt from subscription |
| **Market Maker** | View/control all market maker bots across users |
| **Reports** | Review user-submitted script reports |
| **User Access** | Toggle login_access and feature_access per user |

### Admin-Only Components
- `CoinManagement` — Add/remove coins with audit log
- `DeleteUserButton` — Cascade delete via edge function (uses service_role)
- `AdminPineScriptEditor` — Extended editor with admin_tag support
- `SubscriptionSettingsPanel` — Configure payment crypto and wallet address
- `PaymentRequestsPanel` — Approve/reject payment submissions
- `LifetimeFreeEmailsPanel` — Manage perpetual free accounts
- `UserAccessControls` — Suspend/block individual users
- `AdminUserBotsOverview` — View all active bots across users
- `AdminMarketMakerControl` — Manage market maker instances
- `AdminReportsSection` — Handle script reports
- `AdminWalletManagement` — View and manage all wallets

---

## 9. Pine Script Engine (Core Trading Engine)

The `pine-script-engine` edge function (~4265 lines) is the heart of the platform. It replicates TradingView indicator logic using raw Binance market data.

### Polling Architecture
- **Unified 3-second polling** across ALL timeframes (1m to 1M)
- Continuous execution — never stops checking even without signals
- Shared market data cache reduces API calls for same symbol+timeframe

### Supported Indicators
| Indicator | Implementation |
|-----------|---------------|
| **EMA** | Exponential Moving Average (any period) |
| **SMA** | Simple Moving Average (any period) |
| **RSI** | Relative Strength Index (Wilder's smoothing) |
| **MACD** | Moving Average Convergence Divergence (macd, signal, histogram) |
| **Bollinger Bands** | Upper, middle, lower bands |
| **ATR** | Average True Range |
| **SuperTrend** | Direction-based trend indicator |
| **UT Bot** | Trailing stop with direction detection |

### Signal Types & Conditions
| Condition Type | Description |
|----------------|-------------|
| `crossover` | Indicator A crosses above Indicator B |
| `crossunder` | Indicator A crosses below Indicator B |
| `above` / `below` | Comparative conditions |
| `direction_change_up` | SuperTrend/UT Bot direction changes to bullish |
| `direction_change_down` | SuperTrend/UT Bot direction changes to bearish |

### Trade Modes
| Mode | Signal Types | Behavior |
|------|-------------|----------|
| **Plain** | BUY, SELL | Simple 2-signal: BUY opens long, SELL opens short |
| **Strategy** | BUY_OPEN, BUY_EXIT, SELL_OPEN, SELL_EXIT | 4-signal with explicit open/close |
| **Auto** | Detected automatically | Engine inspects script content to determine mode |

### Execution Flow
1. Fetch all active `user_scripts` with their associated `pine_scripts`
2. Group by symbol+timeframe for efficient data fetching
3. Fetch 200 candles from Binance Futures API (`fapi.binance.com`)
4. Convert to Heikin Ashi if configured
5. Calculate all indicators
6. Evaluate entry/exit conditions across last 2 candles (scanDepth=2)
7. Check duplicate prevention (signal_lock_status, last_execution_candle_time)
8. Execute trade via Binance API if signal passes all guards
9. Update strategy_state timestamps

### Safety Guards
- **Candle deduplication**: Won't re-trigger on same candle_timestamp
- **Signal lock**: `signal_lock_status` prevents race conditions
- **Max trades per day**: Configurable limit per script
- **Error tracking**: consecutive_errors, error_count with backoff
- **Candle freshness**: Validates data recency before evaluation

### Strategy State Tracking (`strategy_state` table)
| Field | Purpose |
|-------|---------|
| `last_checked_time` | When engine last evaluated this strategy |
| `next_check_time` | When to check next (always now + 3s) |
| `last_processed_candle_time` | Timestamp of last evaluated candle |
| `last_execution_candle_time` | Candle time of last trade execution |
| `signal_lock_status` | UNLOCKED / LOCKED — prevents double execution |
| `last_signal_side` | NONE / BUY / SELL — tracks current position |
| `consecutive_errors` | Error counter for backoff logic |

---

## 10. Binance API Integration

The `binance-api` edge function (~609 lines) proxies all Binance REST API calls.

### Supported Actions
| Action | Method | Description |
|--------|--------|-------------|
| `balance` | GET | Fetch account balances (spot or futures) |
| `positions` | GET | Get open futures positions |
| `trade` | POST | Execute market/limit order |
| `close` | POST | Close a specific position (reduceOnly) |
| `close_all` | POST | Close all open positions |
| `leverage` | POST | Set leverage for a symbol |
| `margin_type` | POST | Set margin type (ISOLATED/CROSSED) |
| `exchange_info` | GET | Get trading pair info |

### Security
- Authenticated via Supabase JWT (Authorization header)
- API keys fetched from `wallets` table (encrypted storage)
- HMAC-SHA256 signature generation for every Binance request
- Supports both Binance Global and Binance US
- Futures API: `fapi.binance.com` (USDT-M), `dapi.binance.com` (COIN-M)

### Request Signing
```typescript
async function createSignature(queryString: string, apiSecret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encode(apiSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encode(queryString));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

## 11. Trade Lifecycle

### States (Enum: `trade_status`)
```
PENDING → OPEN → CLOSED
                → FAILED
                → CANCELLED
```

### Flow
1. **Signal Generated**: Engine detects indicator condition
2. **Trade Created** (`PENDING`): Record inserted with signal_type, symbol, timeframe
3. **Coin Locked**: `coin_locked=true` — reserves 1 coin from user balance
4. **Order Placed** (`OPEN`): Binance market order executed, entry_price recorded
5. **Position Monitored**: Live via `useOpenPositions` hook
6. **Trade Closed** (`CLOSED`): Exit signal or manual close, exit_price + pnl recorded
7. **Coin Consumed**: `coin_consumed=true` — coin permanently deducted

### Immutable Trade Data
Each trade record stores its own snapshot values:
- `leverage` — leverage at time of trade
- `margin_amount` — margin used at time of trade
- `trade_amount_used` — actual position size (margin × leverage)
- `pnl` — calculated profit/loss at closure
- These do NOT change when script settings are later modified

### Manual Trade Controls
- **Manual Close Single Trade**: `closeSingleTrade()` — sends reduceOnly order to Binance
- **Manual Close All Trades**: Admin can close all active trades across users
- Both require UI confirmation dialog before execution

---

## 12. Signal System

### Signal Table (`signals`)
| Column | Type | Description |
|--------|------|-------------|
| script_id | uuid | Which script generated it |
| signal_type | enum | BUY or SELL |
| symbol | text | Trading pair (e.g., BTCUSDT) |
| timeframe | text | Chart timeframe (e.g., 15m) |
| price | numeric | Price at signal generation |
| candle_timestamp | timestamptz | Which candle triggered the signal |
| processed | boolean | Whether trade was executed for this signal |

### Signal Deduplication
- Engine checks `last_execution_candle_time` against current candle
- Same candle = skip (prevents duplicate trades)
- `signal_lock_status` = LOCKED during execution, UNLOCKED after

### Signal Hooks
- `useSignals()` — User's signals for assigned scripts
- `useAllSignals()` — Admin view of all signals (limited to 100)

---

## 13. Market Maker Bot Module

### Overview
Professional-grade market making with configurable panels:

### Configuration Panels
| Panel | Features |
|-------|----------|
| **Basic Settings** | Bot name, symbol, status toggle |
| **Market & Pricing** | Dynamic spread calculation, mid-price source |
| **Order Layers** | Multiple order layers at different price levels |
| **Exchange Settings** | Exchange-specific configurations |
| **Autocancel** | Auto-cancel stale orders after timeout |
| **Stop-Loss** | Position-based stop-loss triggers |
| **Revert & Backlog** | Order reversion and backlog management |
| **Risk Control** | Max position, exposure limits, inventory caps |
| **Notifications** | Alert settings for trades and errors |
| **Performance Dashboard** | Real-time PnL, exposure, fees, slippage |
| **Execution Audit** | Duplicate order prevention, rate limiting |
| **Profit Optimization** | Daily/weekly targets, drawdown recovery |
| **Market Regime** | Auto-detect Ranging/Trending/High Vol/Low Liq |
| **Backtesting** | Historical replay, stress testing, parameter optimizer |

### Auto-Stop Timer
- Configurable 1–365 days
- `auto_stop_at` timestamp stored in `market_maker_bots`
- Hourly cron job (`auto-stop-bots` edge function) deactivates expired bots

### Bot Configuration Storage
Settings stored as JSON in `bot_configurations` table with `module_type` discriminator.

---

## 14. Wallet Management

### Wallet Types
| Role | Description |
|------|-------------|
| `ADMIN` | Admin-managed wallets (visible to admin only) |
| `USER` | User-owned wallets (scoped by user_id) |

### Features
- Encrypted API key storage (`api_key_encrypted`, `api_secret_encrypted`)
- Balance sync via Binance API
- Multiple wallets per user (multi-exchange support planned)
- Active wallet selection for trading
- Real-time balance display with USD equivalent

### Hooks
- `useUserWallets()` — Current user's wallets
- `useAdminWallets()` — All wallets (admin only)
- `useOpenPositions()` — Live Binance futures positions
- `useBinanceWallet()` — Wallet connection state

---

## 15. Subscription & Payment System

### Access Levels (via `useSubscriptionAccess`)
| Access | Condition |
|--------|-----------|
| `allowed` | Full access to features |
| `suspended` | `login_access=false` on profile |
| `feature_blocked` | `feature_access=false` on profile |
| `payment_required` | Subscription mode ON, no active payment |

### Access Check Priority
1. `login_access=false` → **suspended** (redirected to `/suspended`)
2. Subscription mode OFF → check `feature_access` only
3. `feature_access=false` → **feature_blocked**
4. Lifetime free email → **allowed** (bypass all checks)
5. Active subscription → **allowed**
6. None of above → **payment_required** (redirected to `/payment`)

### Payment Flow
1. Admin configures crypto payment (symbol, amount, wallet address) in `subscription_settings`
2. User views payment page with QR code for admin wallet
3. User submits payment proof (tx_hash, amount, wallet_address)
4. Payment request created with status `PENDING`
5. Admin reviews and approves/rejects in `PaymentRequestsPanel`
6. On approval: `subscription_starts_at` and `subscription_ends_at` set

### Subscription Settings
| Setting | Default |
|---------|---------|
| `subscription_mode_enabled` | false |
| `crypto_symbol` | USDT |
| `monthly_amount` | 30 |
| `trial_days` | 7 |
| `receiver_wallet_address` | (admin configures) |

---

## 16. Coin Credit System

### How It Works
- Each user starts with **5 coins** (configurable via `DEFAULT_USER_COINS`)
- Each trade execution **consumes 1 coin**
- Coins are first **locked** (reserved), then **consumed** (permanently deducted)
- Users can request more coins via `coin_requests`
- Admins approve/reject requests and can manually adjust balances

### Coin Audit Log
Every coin change is tracked in `coin_audit_log`:
- `action` — what happened (e.g., "trade_consumed", "admin_added")
- `coins_before` / `coins_after` — balance snapshot
- `performed_by` — admin user_id if manually changed
- `reason` — free-text explanation

---

## 17. Feature Flags

Managed via `feature_flags` table. Admin can toggle in dashboard.

| Flag | Purpose |
|------|---------|
| `paid_mode` | Enable/disable subscription requirement |
| `trading_enabled` | Global kill switch for all trading |
| `new_registrations` | Allow/block new user signups |

### Hook: `useFeatureFlags()`
```typescript
const { isPaidModeEnabled, isTradingEnabled, areNewRegistrationsEnabled } = useFeatureFlags();
```

---

## 18. Telegram Bot Integration

### Edge Function: `telegram-bot`
- Verifies user membership in `@lovewithtrade_channel`
- Commands: `/start`, membership check callbacks
- Sends join/rejoin buttons with inline keyboard
- Uses `TELEGRAM_BOT_TOKEN` secret

### Flow
1. User sends `/start` to bot
2. Bot checks membership via `getChatMember` API
3. If member → success message
4. If not → sends join channel button
5. User can re-verify with callback button

---

## 19. Session Management

### Architecture
- Custom session layer on top of Supabase Auth
- Session ID stored in `localStorage` (`lwt_session_id`)
- Validated every 60 seconds via RPC

### Session Control
- **Single-device mode**: New login revokes all existing sessions
- **Multi-device mode**: Up to `max_sessions_per_user` concurrent sessions
- Oldest session revoked when limit exceeded

### Database Functions
| Function | Purpose |
|----------|---------|
| `create_user_session()` | Creates session, enforces limits, returns session_id |
| `validate_session()` | Checks session validity, updates last_activity_time |

### Hook: `useSessionManager()`
Provides `createSession()`, `validateSession()`, `getSessionId()` methods.

---

## 20. Edge Functions

| Function | JWT Verify | Purpose |
|----------|-----------|---------|
| `pine-script-engine` | No | Core trading engine — evaluates scripts, executes trades |
| `binance-api` | No | Proxies authenticated Binance API calls |
| `binance-websocket-proxy` | No | WebSocket proxy for real-time market data |
| `delete-user` | No | Admin-only cascade user deletion (verifies admin role internally) |
| `telegram-bot` | No | Telegram bot webhook handler |
| `auto-stop-bots` | No | Cron job to deactivate expired market maker bots |

> **Note**: JWT verification is disabled at the gateway level (`verify_jwt = false` in config.toml). Authentication is handled internally within each function.

### Secrets Required
| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Database connection |
| `SUPABASE_ANON_KEY` | Client-level access |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-level database access |
| `SUPABASE_DB_URL` | Direct database URL |
| `SUPABASE_PUBLISHABLE_KEY` | Public key |
| `TELEGRAM_BOT_TOKEN` | Telegram bot authentication |
| `LOVABLE_API_KEY` | Lovable AI integration |

---

## 21. Security & RLS Policies

### General Principles
- All tables have Row-Level Security (RLS) enabled
- Admin access via `is_admin(auth.uid())` security definer function
- Users can only access their own data (`user_id = auth.uid()`)
- Roles stored in separate `user_roles` table (not on profiles)
- No anonymous signups — email verification required

### Key RLS Patterns

#### User-scoped read/write
```sql
-- Users can view own records
USING (user_id = auth.uid())
-- Users can insert own records
WITH CHECK (user_id = auth.uid())
```

#### Admin full access
```sql
-- Admins can manage all records
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()))
```

#### Shared read (admin scripts)
```sql
-- Users see own scripts + admin-tagged scripts
USING ((created_by = auth.uid()) OR (admin_tag IS NOT NULL))
```

#### Signal access (relationship-based)
```sql
-- Users see signals for scripts they're assigned to
USING (EXISTS (
  SELECT 1 FROM user_scripts us
  WHERE us.script_id = signals.script_id AND us.user_id = auth.uid()
))
```

### Tables Without Insert Access (trigger-managed)
- `profiles` — Created by `handle_new_user()` trigger
- `coin_audit_log` — Insert only by admins

---

## 22. UI Components Library

### shadcn/ui Components (src/components/ui/)
Full suite of ~40 Radix-based primitives:
Accordion, Alert, AlertDialog, AspectRatio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Form, HoverCard, Input, InputOTP, Label, Menubar, NavigationMenu, Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toast, Toggle, ToggleGroup, Tooltip

### Custom Components
| Component | Purpose |
|-----------|---------|
| `ThemeToggle` | Dark/light mode switch |
| `TradingChart` | Candlestick chart using lightweight-charts |
| `CandlestickChart` | Alternative chart component |
| `PineScriptEditor` | Script content editor |
| `SignalPreview` | Visual signal indicator |
| `WalletCard` | Wallet balance display |
| `BinanceApiKeyForm` | API key input form |
| `PreciousMetalsRates` | Gold/Silver price display |
| `SymbolMultiSelect` | Multi-select for trading pairs |
| `PaidModeIndicator` | Shows subscription status |
| `ManualCloseTradesButton` | Close trades with confirmation |
| `ScriptExportButton` | Export script to file |
| `ReportScriptModal` | Report script dialog |
| `HeroVideoPlayer` | HLS video player for landing page |
| `Web3MediaHero` | Hero section component |
| `NavLink` | Navigation link with active state |
| `UserOnboarding` | Step-by-step new user setup |

---

## 23. Hooks Reference

### Authentication & Session
| Hook | Purpose |
|------|---------|
| `useAuth()` | Auth state, sign in/up/out, role, session error |
| `useSessionManager()` | Create/validate custom sessions |
| `useProfile()` | User profile CRUD |
| `useSubscriptionAccess()` | Access level determination |

### Data Fetching
| Hook | Purpose |
|------|---------|
| `usePineScripts()` | User's scripts + admin scripts |
| `useAdminPineScripts()` | All scripts (admin) |
| `useTrades()` | User's trades with realtime updates |
| `useAllTrades()` | All trades (admin) |
| `useSignals()` | User's signals |
| `useAllSignals()` | All signals (admin) |
| `useUserScripts()` | Per-user script assignments |
| `useWallets()` / `useUserWallets()` | Wallet management |
| `useOpenPositions()` | Live Binance positions |
| `useMarketData()` | Chart candlestick data |

### Admin
| Hook | Purpose |
|------|---------|
| `useAdminUsers()` | All user profiles |
| `useFeatureFlags()` | Feature flag management |
| `useCoinRequests()` | Coin request management |
| `usePaymentRequests()` | Payment request management |
| `useLifetimeFreeEmails()` | Free email management |
| `useSubscriptionSettings()` | Subscription config |
| `useScriptReports()` | Script report management |
| `useMarketMakerBots()` | Market maker bot management |

### Utilities
| Hook | Purpose |
|------|---------|
| `useTheme()` | Dark/light mode |
| `useMobile()` | Responsive breakpoint detection |
| `useApiKeyStatus()` | Check if user has valid API keys |
| `useScriptAnalytics()` | Script performance metrics |
| `useBinanceWebSocket()` | Real-time price feeds |
| `usePineScriptEngine()` | Client-side engine interaction |

---

## 24. Constants & Configuration

### File: `src/lib/constants.ts`

#### Feature Flags
```typescript
PAID_MODE, TRADING_ENABLED, NEW_REGISTRATIONS
```

#### Trading Pairs (32 pairs)
```
BTC, ETH, BNB, XRP, SOL, ADA, DOGE, DOT, MATIC, AVAX, LINK, LTC,
ATOM, UNI, APT, ARB, OP, NEAR, FIL, INJ, SUI, SEI, TIA, JUP, WIF,
PEPE, SHIB, FET, RENDER, AAVE, PAXG (Gold), XAU (Gold Futures), XAG (Silver)
```

#### Timeframes (15 options)
```
1m, 2m, 3m, 5m, 10m, 15m, 30m, 45m, 1h, 2h, 3h, 4h, 1d, 1w, 1M
```

#### Other Constants
| Constant | Value |
|----------|-------|
| `DEFAULT_USER_COINS` | 5 |
| `MAX_SELECTED_TIMEFRAMES` | 3 |
| `MAX_SYMBOLS_PER_SCRIPT` | 10 |
| Leverage range | 1x–125x |
| Candle types | Regular OHLC, Heikin Ashi |
| Market types | Spot, USDT-M Futures, COIN-M Futures |
| Position size types | Fixed (USDT), Percentage of Wallet |

---

## 25. Market Data & Charts

### Data Source
- **Binance Futures API**: `fapi.binance.com/fapi/v1/klines`
- Fetches last **200 candles** per symbol/timeframe
- Cached in `market_data_cache` table with expiry

### Chart Library
- **lightweight-charts** (v4.2.3) — TradingView's open-source charting
- Supports candlestick, area, and line series
- Real-time updates via `useBinanceWebSocket()`

### Heikin Ashi Conversion
Engine converts standard OHLCV to Heikin Ashi on-the-fly when `candle_type='heikin_ashi'` is configured on the script.

### Precious Metals
Special support for gold (PAXG, XAU) and silver (XAG) pairs with dedicated `PreciousMetalsRates` component.

---

## 26. Deployment & DevOps

### Frontend
- **Build**: `vite build` (production) or `vite build --mode development`
- **Preview**: `vite preview`
- **Deployed via**: Lovable publish system
- **Custom domain**: Supported via Lovable settings
- **Vercel config**: `vercel.json` present for SPA routing

### Backend
- **Edge Functions**: Auto-deployed on save (Lovable Cloud)
- **Database Migrations**: Managed via Supabase migration tool
- **No manual deployment needed** for backend changes

### Testing
- **Framework**: Vitest + @testing-library/react + jsdom
- **Run**: `npm test` or `npm run test:watch`
- **Config**: `vitest.config.ts`

### Dependencies (Key)
| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Database, auth, realtime |
| `@tanstack/react-query` | Server state management |
| `react-router-dom` | Client-side routing |
| `lightweight-charts` | Candlestick charts |
| `framer-motion` | Animations |
| `recharts` | Data visualization |
| `hls.js` | Video streaming |
| `qrcode.react` | QR code for payment wallet |
| `zod` | Schema validation |
| `react-hook-form` | Form management |
| `sonner` | Toast notifications |
| `date-fns` | Date utilities |

### Environment Variables
| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Auto-configured |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auto-configured |
| `VITE_SUPABASE_PROJECT_ID` | Auto-configured |

---

## Appendix: File Size Reference

| File | Lines | Purpose |
|------|-------|---------|
| `pine-script-engine/index.ts` | ~4,265 | Core trading engine |
| `UserDashboard.tsx` | ~857 | Main user interface |
| `usePineScripts.tsx` | ~731 | Script management hook |
| `binance-api/index.ts` | ~609 | Binance API proxy |
| `useWallets.tsx` | ~486 | Wallet management hook |
| `AdminDashboard.tsx` | ~450 | Admin interface |
| `useAuth.tsx` | ~362 | Authentication hook |
| `Index.tsx` | ~372 | Landing page |
| `telegram-bot/index.ts` | ~188 | Telegram integration |
| `useTrades.tsx` | ~187 | Trade management hook |
| `delete-user/index.ts` | ~157 | User deletion function |
| `useSessionManager.tsx` | ~147 | Session management |
| `constants.ts` | ~128 | App-wide constants |

---

*Last updated: March 11, 2026*
