/**
 * SportMind Type Definitions
 *
 * These types mirror the structured output SportMind produces.
 * Every type here maps directly to a documented SportMind metric or signal.
 *
 * Reference: SportMind v3.63+ / fan-token/ + sports/ + athlete/ + macro/ layers
 */

// ── LAYER DECLARATIONS ────────────────────────────────────────────────────────

export type SportMindLayer = 'macro' | 'fan-token' | 'sports' | 'athlete';

export interface LayerDeclaration {
  version: string;           // SportMind version this kit is built against
  layers: SportMindLayer[];  // Layers loaded, in order
  loadedAt: Date;
}

// ── MACRO LAYER ───────────────────────────────────────────────────────────────

export type CryptoMarketPhase =
  | 'ACCUMULATION'
  | 'EARLY_BULL'
  | 'MID_BULL'
  | 'LATE_BULL'
  | 'DISTRIBUTION'
  | 'EARLY_BEAR'
  | 'LATE_BEAR';

export type RegulatoryPosture =
  | 'PERMISSIVE'     // Favourable — low friction for fan token activity
  | 'NEUTRAL'        // Stable — no active enforcement risk
  | 'CAUTIOUS'       // Elevated scrutiny — reduce exposure
  | 'HOSTILE';       // Active enforcement risk — block execution

export interface MacroSignal {
  cryptoMarketPhase: CryptoMarketPhase;
  regulatoryPosture: RegulatoryPosture;
  micaPhase: 'PRE' | 'TRANSITION' | 'FULL_COMPLIANCE';
  secCftcPosture: 'PERMISSIVE' | 'NEUTRAL' | 'CAUTIOUS' | 'HOSTILE';
  geopoliticalRisk: number;         // 0–100
  macroOverrideActive: boolean;     // true = block all execution
  macroModifier: number;            // 0.50–1.00 applied to all signals
}

// ── FAN TOKEN LAYER ───────────────────────────────────────────────────────────

/**
 * CHI — Club Holder Index
 * Measures sustained holder conviction vs speculative activity.
 * Range: 0–100. Above 70 = structural demand. Below 40 = speculative churn.
 */
export type CHI = number;

/**
 * AFS — Active Fan Score
 * Engagement depth across governance, rewards, and social signals.
 * Range: 0–100.
 */
export type AFS = number;

/**
 * TAI — Token Activity Index
 * On-chain activity density. High TAI + low CHI = speculation signal.
 * Range: 0–100.
 */
export type TAI = number;

/**
 * FTP PATH_2 — Fan Token Play Performance-Linked Supply
 * The mechanism that links on-pitch results to token supply.
 * A WIN triggers CHZ_BURN (supply reduction). A LOSS triggers CHZ_MINT (supply increase).
 * This is a SportMind-specific signal not visible to standard market models.
 */
export interface FTPPath2Signal {
  active: boolean;
  matchScheduled: boolean;
  matchkickoffUtc?: string;
  opponent?: string;
  competition?: string;
  anticipatedResult?: 'WIN' | 'DRAW' | 'LOSS' | 'UNKNOWN';
  supplyEvent?: 'CHZ_BURN' | 'CHZ_MINT' | 'NEUTRAL' | 'PENDING';
  burnMagnitude?: number;           // CHZ equivalent, if calculable
  mintMagnitude?: number;
  ftpConfidence?: number;           // 0–100
}

export type FanTokenLifecyclePhase =
  | 'PHASE_1_LAUNCH'
  | 'PHASE_2_GROWTH'
  | 'PHASE_3_MATURITY'
  | 'PHASE_4_EXPANSION'
  | 'PHASE_5E_DEFI';

export interface FanTokenSignal {
  token: string;                    // e.g. 'AFC', 'BAR', 'PSG'
  club: string;
  chi: CHI;
  afs: AFS;
  tai: TAI;
  lifecyclePhase: FanTokenLifecyclePhase;
  ftpPath2: FTPPath2Signal;
  holderSentiment: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  governanceProposalActive: boolean;
  rewardClaimAvailable: boolean;
  fanTokenModifier: number;         // Composite modifier applied to signal
}

// ── SPORTS LAYER ──────────────────────────────────────────────────────────────

/**
 * SMS — Sentiment Momentum Score
 * Pre-match aggregate signal. Range: 0–100.
 * Above 65 = meaningful directional signal.
 */
export type SMS = number;

export type MatchDirection = 'HOME' | 'AWAY' | 'DRAW' | 'NO_SIGNAL';

export interface MatchSignal {
  direction: MatchDirection;
  sms: SMS;
  adjustedScore: number;            // 0–100 composite
  recommendedAction: 'ENTER' | 'HOLD' | 'EXIT' | 'WAIT';
  compositeModifier: number;        // Product of all applied modifiers
  lineupUnconfirmed: boolean;
  macroOverrideActive: boolean;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  venue: string;
  kickoffUtc: string;
}

// ── ATHLETE LAYER ─────────────────────────────────────────────────────────────

export interface AthleteSignal {
  playerId: string;
  name: string;
  team: string;
  formModifier: number;             // 0.55–1.25× applied to match signal
  availability: 'CONFIRMED' | 'DOUBT' | 'OUT' | 'UNKNOWN';
  injuryFlag: boolean;
  transferRumourActive: boolean;    // Affects fan token sentiment
  starDepartureRisk: number;        // 0–100 — significant for CHI
}

// ── CONSOLIDATED SPORTMIND SIGNAL ─────────────────────────────────────────────

/**
 * SportMindSignal — the consolidated output of all four loaded layers.
 * This is what the agent reasons from. Every wallet decision maps to a field here.
 */
export interface SportMindSignal {
  layerDeclaration: LayerDeclaration;
  macro: MacroSignal;
  fanToken: FanTokenSignal;
  match?: MatchSignal;              // Optional — only present when match is imminent
  athlete?: AthleteSignal[];        // Optional — key players for this signal
  generatedAt: Date;
  signalVersion: string;            // SportMind version that produced this signal
}

// ── WALLET ACTION TYPES ───────────────────────────────────────────────────────

export type WalletActionType =
  | 'HOLD'
  | 'BUY_FAN_TOKEN'
  | 'SELL_FAN_TOKEN'
  | 'REBALANCE_PORTFOLIO'
  | 'SUBMIT_GOVERNANCE_VOTE'
  | 'ANTICIPATE_SUPPLY_EVENT'
  | 'CLAIM_REWARD'
  | 'NO_ACTION';

export interface WalletDecision {
  action: WalletActionType;
  token: string;
  rationale: string;                // Human-readable SportMind reasoning
  sportmindSignalsUsed: string[];   // Which signals drove this decision
  confidenceScore: number;          // 0–100
  macroGated: boolean;              // Was this blocked or modified by macro layer?
  requiresApproval: boolean;
  estimatedChzAmount?: number;
}
