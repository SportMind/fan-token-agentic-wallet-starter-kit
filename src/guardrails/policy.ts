/**
 * Guardrails Policy Engine
 *
 * Spend limits and execution rules enforced at the execution layer.
 * The LLM cannot bypass these — they are checked before any transaction executes.
 *
 * Two additional SportMind-specific guardrails beyond standard spend limits:
 *   - Macro override gate: blocks all execution when SportMind macro layer is hostile
 *   - Signal confidence gate: blocks execution below minimum confidence threshold
 */

import type { WalletDecision } from '../sportmind/types.js';

export interface GuardrailConfig {
  dailySpendCapChz: number;        // Default: 100 CHZ
  approvalThresholdChz: number;    // Default: 20 CHZ — above this requires confirm
  executionMode: 'confirm' | 'auto';
  macroOverrideBlocks: boolean;    // Default: true — macro hostile = no execution
  minConfidenceScore: number;      // Default: 55 — below this = no auto execution
}

export interface GuardrailResult {
  allowed: boolean;
  requiresApproval: boolean;
  blockedReason?: string;
  modifiedAmountChz?: number;
}

export class PolicyEngine {
  private config: GuardrailConfig;
  private dailySpentChz = 0;
  private dailyResetAt: Date;

  constructor(config?: Partial<GuardrailConfig>) {
    this.config = {
      dailySpendCapChz: Number(process.env.DAILY_SPEND_CAP_CHZ ?? 100),
      approvalThresholdChz: Number(process.env.APPROVAL_THRESHOLD_CHZ ?? 20),
      executionMode: (process.env.EXECUTION_MODE as 'confirm' | 'auto') ?? 'confirm',
      macroOverrideBlocks: process.env.MACRO_OVERRIDE_BLOCKS !== 'false',
      minConfidenceScore: 55,
      ...config,
    };
    this.dailyResetAt = new Date();
    this.dailyResetAt.setHours(0, 0, 0, 0);
    this.dailyResetAt.setDate(this.dailyResetAt.getDate() + 1);
  }

  evaluate(decision: WalletDecision): GuardrailResult {
    // Reset daily counter if needed
    this.maybeResetDailyCounter();

    // ── MACRO GATE ────────────────────────────────────────────────────────────
    if (decision.macroGated && this.config.macroOverrideBlocks) {
      return {
        allowed: false,
        requiresApproval: false,
        blockedReason: 'SportMind macro override active. Execution blocked.',
      };
    }

    // ── NO_ACTION / HOLD passthrough ─────────────────────────────────────────
    if (decision.action === 'NO_ACTION' || decision.action === 'HOLD') {
      return { allowed: true, requiresApproval: false };
    }

    // ── GOVERNANCE passthrough ────────────────────────────────────────────────
    // Governance votes don't spend CHZ — only require approval in confirm mode
    if (decision.action === 'SUBMIT_GOVERNANCE_VOTE') {
      return {
        allowed: true,
        requiresApproval: this.config.executionMode === 'confirm',
      };
    }

    // ── CONFIDENCE GATE ───────────────────────────────────────────────────────
    if (decision.confidenceScore < this.config.minConfidenceScore) {
      return {
        allowed: false,
        requiresApproval: false,
        blockedReason: `Confidence score ${decision.confidenceScore} is below minimum threshold ${this.config.minConfidenceScore}. Signal too weak to execute.`,
      };
    }

    // ── DAILY SPEND CAP ───────────────────────────────────────────────────────
    const amount = decision.estimatedChzAmount ?? 0;
    const projectedTotal = this.dailySpentChz + amount;

    if (projectedTotal > this.config.dailySpendCapChz) {
      const remaining = this.config.dailySpendCapChz - this.dailySpentChz;
      if (remaining <= 0) {
        return {
          allowed: false,
          requiresApproval: false,
          blockedReason: `Daily spend cap of ${this.config.dailySpendCapChz} CHZ reached. Resets at midnight UTC.`,
        };
      }
      // Allow but cap at remaining
      return {
        allowed: true,
        requiresApproval: true,
        modifiedAmountChz: remaining,
        blockedReason: undefined,
      };
    }

    // ── APPROVAL THRESHOLD ────────────────────────────────────────────────────
    const requiresApproval =
      this.config.executionMode === 'confirm' ||
      amount >= this.config.approvalThresholdChz;

    return { allowed: true, requiresApproval };
  }

  recordSpend(amountChz: number): void {
    this.maybeResetDailyCounter();
    this.dailySpentChz += amountChz;
  }

  getDailyRemaining(): number {
    return Math.max(0, this.config.dailySpendCapChz - this.dailySpentChz);
  }

  private maybeResetDailyCounter(): void {
    if (new Date() >= this.dailyResetAt) {
      this.dailySpentChz = 0;
      this.dailyResetAt = new Date();
      this.dailyResetAt.setDate(this.dailyResetAt.getDate() + 1);
    }
  }
}
