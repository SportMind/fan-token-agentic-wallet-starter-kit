/**
 * SportMind Signal Parser
 *
 * Translates a consolidated SportMindSignal into a WalletDecision.
 * This is the reasoning layer — it applies SportMind's intelligence
 * to determine what the wallet agent should do.
 *
 * The parser enforces the macro gate: if macro override is active,
 * no action is taken regardless of other signal strength.
 *
 * This logic is intentionally transparent — developers should be able
 * to read this file and understand exactly why the wallet made each decision.
 */

import type { SportMindSignal, WalletDecision, WalletActionType } from './types.js';

// ── SIGNAL THRESHOLDS ─────────────────────────────────────────────────────────
//
// These thresholds are derived from SportMind's calibration records.
// Modify with care — changes here affect all wallet decisions.

const THRESHOLDS = {
  chi: {
    structural: 70,       // Above this = structural demand, consider buy
    weak: 40,             // Below this = speculative churn, consider reduce
  },
  sms: {
    strong: 65,           // Above this = meaningful directional signal
    weak: 40,             // Below this = no signal — wait
  },
  ftpConfidence: {
    act: 60,              // Above this = act on FTP PATH_2 signal
  },
  portfolio: {
    rebalanceThreshold: 15, // CHI divergence above this = rebalance
  },
} as const;

// ── MAIN PARSER ───────────────────────────────────────────────────────────────

/**
 * parseSignalToDecision
 *
 * Takes a SportMindSignal and returns a WalletDecision.
 * The decision type is inferred from which signals are strongest.
 *
 * Priority order:
 *   1. Macro gate — blocks everything if active
 *   2. FTP PATH_2 supply event — highest priority action signal
 *   3. Match-day SMS — directional signal for entry/exit
 *   4. Governance — active proposal + high TAI = vote
 *   5. Portfolio CHI — rebalance if structural divergence detected
 *   6. Hold — no clear signal
 */
export function parseSignalToDecision(signal: SportMindSignal): WalletDecision {
  // ── MACRO GATE ──────────────────────────────────────────────────────────────
  // The macro layer is always checked first. This is non-negotiable.
  // A hostile regulatory posture or active macro override blocks all execution.
  if (signal.macro.macroOverrideActive) {
    return {
      action: 'NO_ACTION',
      token: signal.fanToken.token,
      rationale: `Macro override active. Regulatory posture: ${signal.macro.regulatoryPosture}. All wallet execution blocked by SportMind macro layer.`,
      sportmindSignalsUsed: ['macro.macroOverrideActive', 'macro.regulatoryPosture'],
      confidenceScore: 100,
      macroGated: true,
      requiresApproval: false,
    };
  }

  if (signal.macro.regulatoryPosture === 'HOSTILE') {
    return {
      action: 'NO_ACTION',
      token: signal.fanToken.token,
      rationale: `Regulatory posture is HOSTILE. SportMind macro layer advises no fan token activity until posture normalises.`,
      sportmindSignalsUsed: ['macro.regulatoryPosture'],
      confidenceScore: 95,
      macroGated: true,
      requiresApproval: false,
    };
  }

  // Apply macro modifier to all downstream confidence scores
  const macroModifier = signal.macro.macroModifier;

  // ── FTP PATH_2 SUPPLY EVENT ─────────────────────────────────────────────────
  // This is the signal most agents miss. A WIN prediction on a gamified fan
  // token is a SUPPLY REDUCTION event. SportMind FTP PATH_2 makes this visible.
  const ftp = signal.fanToken.ftpPath2;
  if (
    ftp.active &&
    ftp.matchScheduled &&
    ftp.supplyEvent === 'CHZ_BURN' &&
    (ftp.ftpConfidence ?? 0) >= THRESHOLDS.ftpConfidence.act
  ) {
    const confidence = Math.round(((ftp.ftpConfidence ?? 60) / 100) * macroModifier * 100);
    return {
      action: 'ANTICIPATE_SUPPLY_EVENT',
      token: signal.fanToken.token,
      rationale: buildFTPRationale(signal),
      sportmindSignalsUsed: [
        'fanToken.ftpPath2.supplyEvent',
        'fanToken.ftpPath2.ftpConfidence',
        'fanToken.ftpPath2.burnMagnitude',
        'fanToken.chi',
        'macro.macroModifier',
      ],
      confidenceScore: confidence,
      macroGated: false,
      requiresApproval: true,
      estimatedChzAmount: estimatePositionSize(signal, 'ftp'),
    };
  }

  // ── MATCH-DAY SMS SIGNAL ────────────────────────────────────────────────────
  // When a match is imminent and SMS is strong, the wallet can act on the
  // directional signal. Entry/exit decisions are gated by CHI — we don't
  // act on match signals for tokens with speculative churn patterns.
  if (signal.match && signal.match.sms >= THRESHOLDS.sms.strong) {
    const chi = signal.fanToken.chi;
    if (chi >= THRESHOLDS.chi.structural) {
      const athleteModifier = resolveAthleteModifier(signal);
      const confidence = Math.round(
        (signal.match.sms / 100) * athleteModifier * macroModifier * 100
      );
      const action: WalletActionType =
        signal.match.recommendedAction === 'ENTER' ? 'BUY_FAN_TOKEN' :
        signal.match.recommendedAction === 'EXIT' ? 'SELL_FAN_TOKEN' : 'HOLD';

      return {
        action,
        token: signal.fanToken.token,
        rationale: buildMatchDayRationale(signal, athleteModifier),
        sportmindSignalsUsed: [
          'match.sms',
          'match.direction',
          'match.recommendedAction',
          'fanToken.chi',
          'athlete.formModifier',
          'macro.macroModifier',
        ],
        confidenceScore: confidence,
        macroGated: false,
        requiresApproval: true,
        estimatedChzAmount: estimatePositionSize(signal, 'match'),
      };
    }
  }

  // ── GOVERNANCE SIGNAL ───────────────────────────────────────────────────────
  // Active governance proposal + high TAI (on-chain activity) + high AFS
  // (engaged fan base) = governance vote is meaningful, not performative.
  if (
    signal.fanToken.governanceProposalActive &&
    signal.fanToken.tai >= 60 &&
    signal.fanToken.afs >= 55
  ) {
    return {
      action: 'SUBMIT_GOVERNANCE_VOTE',
      token: signal.fanToken.token,
      rationale: buildGovernanceRationale(signal),
      sportmindSignalsUsed: [
        'fanToken.governanceProposalActive',
        'fanToken.tai',
        'fanToken.afs',
        'macro.regulatoryPosture',
      ],
      confidenceScore: Math.round(
        (signal.fanToken.afs / 100) * macroModifier * 100
      ),
      macroGated: false,
      requiresApproval: true,
    };
  }

  // ── PORTFOLIO REBALANCE ─────────────────────────────────────────────────────
  // If CHI is strong and the token is in structural demand phase,
  // a portfolio rebalance toward this token is warranted.
  if (signal.fanToken.chi >= THRESHOLDS.chi.structural) {
    return {
      action: 'REBALANCE_PORTFOLIO',
      token: signal.fanToken.token,
      rationale: buildPortfolioRationale(signal),
      sportmindSignalsUsed: ['fanToken.chi', 'fanToken.afs', 'fanToken.lifecyclePhase'],
      confidenceScore: Math.round((signal.fanToken.chi / 100) * macroModifier * 100),
      macroGated: false,
      requiresApproval: true,
      estimatedChzAmount: estimatePositionSize(signal, 'portfolio'),
    };
  }

  // ── HOLD ───────────────────────────────────────────────────────────────────
  return {
    action: 'HOLD',
    token: signal.fanToken.token,
    rationale: `No clear SportMind signal. CHI: ${signal.fanToken.chi}, SMS: ${signal.match?.sms ?? 'N/A'}, FTP PATH_2: ${ftp.active ? 'active but below confidence threshold' : 'inactive'}. Holding current position.`,
    sportmindSignalsUsed: ['fanToken.chi', 'fanToken.ftpPath2.active'],
    confidenceScore: 50,
    macroGated: false,
    requiresApproval: false,
  };
}

// ── RATIONALE BUILDERS ────────────────────────────────────────────────────────

function buildFTPRationale(signal: SportMindSignal): string {
  const ftp = signal.fanToken.ftpPath2;
  const match = signal.match;
  return [
    `FTP PATH_2 supply event detected for ${signal.fanToken.token} (${signal.fanToken.club}).`,
    `Anticipated result: ${ftp.anticipatedResult} vs ${ftp.opponent} (${ftp.competition}).`,
    `Supply event: ${ftp.supplyEvent} — ${ftp.burnMagnitude?.toLocaleString() ?? 'unknown'} CHZ burn anticipated.`,
    `FTP confidence: ${ftp.ftpConfidence}%. CHI: ${signal.fanToken.chi} (${signal.fanToken.chi >= 70 ? 'structural demand — holders are likely to respond to supply reduction' : 'moderate'}).`,
    match ? `Match SMS: ${match.sms} — directional signal supports position.` : '',
    `Macro modifier applied: ${signal.macro.macroModifier}×.`,
    `This signal is not visible to models without SportMind FTP PATH_2 intelligence.`,
  ].filter(Boolean).join(' ');
}

function buildMatchDayRationale(signal: SportMindSignal, athleteModifier: number): string {
  const match = signal.match!;
  const athletes = signal.athlete ?? [];
  const keyPlayers = athletes.map(a =>
    `${a.name} (${a.formModifier}× form, ${a.availability})`
  ).join(', ');

  return [
    `Match-day signal: ${match.homeTeam} vs ${match.awayTeam} (${match.competition}).`,
    `Direction: ${match.direction}. SMS: ${match.sms}/100.`,
    `CHI: ${signal.fanToken.chi} — structural holder conviction confirmed.`,
    keyPlayers ? `Key athletes: ${keyPlayers}. Composite athlete modifier: ${athleteModifier}×.` : '',
    `Macro modifier: ${signal.macro.macroModifier}×. Composite: ${match.compositeModifier}×.`,
    `Venue: ${match.venue}. Kickoff: ${new Date(match.kickoffUtc).toUTCString()}.`,
  ].filter(Boolean).join(' ');
}

function buildGovernanceRationale(signal: SportMindSignal): string {
  return [
    `Active governance proposal detected for ${signal.fanToken.token} (${signal.fanToken.club}).`,
    `TAI: ${signal.fanToken.tai}/100 — high on-chain activity confirms proposal is attracting engagement.`,
    `AFS: ${signal.fanToken.afs}/100 — fan base is engaged, vote is meaningful.`,
    `Regulatory posture: ${signal.macro.regulatoryPosture} — governance participation is appropriate.`,
    `Lifecycle phase: ${signal.fanToken.lifecyclePhase}.`,
  ].join(' ');
}

function buildPortfolioRationale(signal: SportMindSignal): string {
  return [
    `Portfolio rebalance signal: ${signal.fanToken.token} (${signal.fanToken.club}).`,
    `CHI: ${signal.fanToken.chi}/100 — above structural demand threshold (70).`,
    `AFS: ${signal.fanToken.afs}/100. Lifecycle phase: ${signal.fanToken.lifecyclePhase}.`,
    `Holder sentiment: ${signal.fanToken.holderSentiment}.`,
    `Macro phase: ${signal.macro.cryptoMarketPhase}. Modifier: ${signal.macro.macroModifier}×.`,
  ].join(' ');
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function resolveAthleteModifier(signal: SportMindSignal): number {
  const athletes = signal.athlete ?? [];
  if (athletes.length === 0) return 1.0;
  const avg = athletes.reduce((sum, a) => {
    // Unavailable player reduces modifier
    const availabilityPenalty = a.availability === 'OUT' ? 0.85
      : a.availability === 'DOUBT' ? 0.93
      : 1.0;
    return sum + (a.formModifier * availabilityPenalty);
  }, 0) / athletes.length;
  return Math.round(avg * 100) / 100;
}

function estimatePositionSize(
  signal: SportMindSignal,
  context: 'ftp' | 'match' | 'portfolio'
): number {
  // NOTE (production): Replace with real position sizing logic based on
  // wallet balance, risk parameters, and SportMind confidence score.
  // This is a simple placeholder that scales with signal confidence.
  const base = 50; // CHZ
  const chiMultiplier = signal.fanToken.chi / 100;
  const macroMultiplier = signal.macro.macroModifier;

  const contextMultiplier = context === 'ftp' ? 1.5
    : context === 'match' ? 1.2
    : 1.0;

  return Math.round(base * chiMultiplier * macroMultiplier * contextMultiplier);
}
